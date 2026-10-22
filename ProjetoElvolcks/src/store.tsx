import { EmailAuthProvider, onAuthStateChanged, reauthenticateWithCredential, signInWithEmailAndPassword, signOut, updatePassword } from 'firebase/auth'
import {
  addDoc, collection, deleteField, doc, increment, limit, onSnapshot, orderBy, query, runTransaction, updateDoc, writeBatch,
  type DocumentReference, type QuerySnapshot,
} from 'firebase/firestore'
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { auth, criarConta, db, emailDoUsuario, mensagemErro } from './firebase'
import type { Alteracao, Cliente, Colaborador, Funcao, Lancamento, MovEstoque, Produto, TipoMov } from './types'
import { formatarTelefone, telefoneValido } from './util'

export const AVISO_ADMIN = 'Apenas administradores podem ver/fazer isso'

export type NovoLancamento = Omit<Lancamento, 'id' | 'numero' | 'situacao' | 'criadoPor'>

export interface DadosPessoa {
  nome: string
  funcoes: Funcao[]
  /** Vazio = sem acesso ao sistema */
  usuario: string
  /** Só é usada ao criar (ou recriar) o acesso */
  senha: string
}

interface Store {
  estado: 'carregando' | 'saiu' | 'logado'
  logado: boolean
  /** Só use nas telas internas (depois do login) */
  usuario: Colaborador
  /** Motivo de ter sido desconectado (ex.: conta desativada), mostrado na tela de login */
  avisoLogin: string
  entrar: (usuario: string, senha: string) => Promise<string | null>
  sair: () => void
  trocarSenha: (atual: string, nova: string) => Promise<string | null>
  salvarPessoa: (id: string | null, dados: DadosPessoa) => Promise<string | null>
  alternarAtivo: (id: string) => Promise<void>
  isAdmin: boolean
  colaboradores: Colaborador[]
  clientes: Cliente[]
  salvarCliente: (id: string | null, dados: Omit<Cliente, 'id'>) => Promise<string | null>
  produtos: Produto[]
  lancamentos: Lancamento[]
  movimentacoes: MovEstoque[]
  alteracoes: Alteracao[]
  toast: { texto: string; tipo: 'ok' | 'erro' } | null
  avisar: (texto: string, tipo?: 'ok' | 'erro') => void
  avisoAdmin: () => void
  /** Grava e devolve o lançamento com o número definitivo; lança erro se falhar */
  lancar: (dados: NovoLancamento) => Promise<Lancamento>
  cancelar: (id: string) => Promise<void>
  editar: (id: string, mudancas: Partial<Lancamento>, descricao: string) => Promise<void>
  movimentarEstoque: (produtoId: string, tipo: TipoMov, quantidade: number) => Promise<void>
  novoProduto: (nome: string, marca: string, preco: number, quantidade: number) => Promise<void>
  produto: (id: string) => Produto | undefined
  colaborador: (id?: string) => Colaborador | undefined
}

const Ctx = createContext<Store | null>(null)

const lista = <T,>(s: QuerySnapshot) => s.docs.map((d) => ({ ...d.data(), id: d.id }) as T)

/** set/update em comum entre WriteBatch e Transaction */
interface Escritor {
  set(ref: DocumentReference, dados: object): unknown
  update(ref: DocumentReference, dados: object): unknown
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [uid, setUid] = useState<string | null | undefined>(undefined) // undefined = ainda verificando
  const [colaboradores, setColaboradores] = useState<Colaborador[] | null>(null)
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([])
  const [movimentacoes, setMovs] = useState<MovEstoque[]>([])
  const [alteracoes, setAlteracoes] = useState<Alteracao[]>([])
  const [toast, setToast] = useState<Store['toast']>(null)
  const [avisoLogin, setAvisoLogin] = useState('')

  const usuario = colaboradores?.find((c) => c.uid && c.uid === uid)
  const logado = !!usuario?.ativo
  const isAdmin = logado && usuario.funcoes.includes('admin')
  const estado: Store['estado'] = uid === undefined || (uid && colaboradores === null) ? 'carregando' : logado ? 'logado' : 'saiu'

  const timer = useRef<number>(undefined)
  const avisar = useCallback((texto: string, tipo: 'ok' | 'erro' = 'ok') => {
    setToast({ texto, tipo })
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setToast(null), 3200)
  }, [])
  const falhou = (e: unknown) => avisar(mensagemErro(e), 'erro')

  const desconectar = useCallback((motivo: string) => {
    setAvisoLogin(motivo)
    signOut(auth)
  }, [])

  useEffect(() => onAuthStateChanged(auth, (u) => setUid(u?.uid ?? null)), [])

  // A equipe é lida assim que alguém entra: é ela que diz quem é o usuário e se ainda está ativo
  useEffect(() => {
    if (!uid) return setColaboradores(null)
    return onSnapshot(
      collection(db, 'colaboradores'),
      (s) => setColaboradores(lista<Colaborador>(s).sort((a, b) => a.nome.localeCompare(b.nome))),
      () => desconectar('Sua conta está desativada ou sem acesso. Fale com um administrador.'),
    )
  }, [uid, desconectar])

  useEffect(() => {
    if (colaboradores && uid && !logado) desconectar('Sua conta está desativada ou sem acesso. Fale com um administrador.')
  }, [colaboradores, uid, logado, desconectar])

  // Demais dados: só depois de confirmado o acesso, e atualizados ao vivo entre os aparelhos
  useEffect(() => {
    if (!logado) return
    const erro = (e: unknown) => console.error(e)
    const parar = [
      onSnapshot(collection(db, 'clientes'), (s) => setClientes(lista(s)), erro),
      onSnapshot(collection(db, 'produtos'), (s) => setProdutos(lista(s)), erro),
      onSnapshot(query(collection(db, 'lancamentos'), orderBy('criadoEm', 'desc')), (s) => setLancamentos(lista(s)), erro),
      onSnapshot(query(collection(db, 'movimentacoes'), orderBy('data', 'desc'), limit(300)), (s) => setMovs(lista(s)), erro),
      onSnapshot(query(collection(db, 'alteracoes'), orderBy('data', 'desc')), (s) => setAlteracoes(lista(s)), erro),
    ]
    return () => parar.forEach((p) => p())
  }, [logado])

  const escreverEstoque = (w: Escritor, itens: { produtoId: string; quantidade: number }[], tipo: TipoMov, sinal: 1 | -1, ref?: string) => {
    const data = new Date().toISOString()
    for (const i of itens) {
      w.update(doc(db, 'produtos', i.produtoId), { quantidade: increment(sinal * i.quantidade) })
      const mov: Omit<MovEstoque, 'id'> = { produtoId: i.produtoId, tipo, quantidade: sinal * i.quantidade, colaboradorId: usuario!.id, data, lancamentoNumero: ref }
      w.set(doc(collection(db, 'movimentacoes')), mov)
    }
  }

  const registrar = (w: Escritor, lancamentoId: string, descricao: string) => {
    const alt: Omit<Alteracao, 'id'> = { lancamentoId, colaboradorId: usuario!.id, data: new Date().toISOString(), descricao }
    w.set(doc(collection(db, 'alteracoes')), alt)
  }

  const lancar = async (dados: NovoLancamento): Promise<Lancamento> => {
    const ref = doc(collection(db, 'lancamentos'))
    // Transação: o número (V-1, V-2…) nunca se repete, mesmo com duas pessoas lançando ao mesmo tempo
    return runTransaction(db, async (t) => {
      const contRef = doc(db, 'contadores', 'numeros')
      const cont = await t.get(contRef)
      const numero = ((cont.data()?.[dados.tipo] as number | undefined) ?? 0) + 1
      t.set(contRef, { [dados.tipo]: numero }, { merge: true })
      const novo: Omit<Lancamento, 'id'> = { ...dados, numero, situacao: 'ativo', criadoPor: usuario!.id }
      t.set(ref, novo)
      if (dados.origemId) t.update(doc(db, 'lancamentos', dados.origemId), { situacao: 'convertido', convertidoEmId: ref.id })
      if (dados.tipo !== 'orcamento') escreverEstoque(t, dados.itens, dados.tipo, -1, codigo(novo))
      return { ...novo, id: ref.id }
    })
  }

  const cancelar = async (id: string) => {
    if (!isAdmin) return avisar(AVISO_ADMIN, 'erro')
    const l = lancamentos.find((x) => x.id === id)
    if (!l || l.situacao === 'cancelado') return
    const b = writeBatch(db)
    b.update(doc(db, 'lancamentos', id), { situacao: 'cancelado' })
    if (l.tipo !== 'orcamento') escreverEstoque(b, l.itens, 'cancelamento', 1, codigo(l))
    registrar(b, id, l.tipo === 'orcamento' ? 'Orçamento cancelado' : 'Lançamento cancelado: peças devolvidas ao estoque e valor retirado do caixa')
    try {
      await b.commit()
      avisar(`${codigo(l)} cancelado`)
    } catch (e) {
      falhou(e)
    }
  }

  const editar = async (id: string, mudancas: Partial<Lancamento>, descricao: string) => {
    if (!isAdmin) return avisar(AVISO_ADMIN, 'erro')
    // Campo apagado na edição (ex.: telefone em branco) precisa ser removido do documento
    const dados = Object.fromEntries(Object.entries(mudancas).map(([k, v]) => [k, v === undefined ? deleteField() : v]))
    const b = writeBatch(db)
    b.update(doc(db, 'lancamentos', id), dados)
    registrar(b, id, descricao)
    try {
      await b.commit()
      avisar('Alteração salva e registrada no histórico')
    } catch (e) {
      falhou(e)
    }
  }

  const movimentarEstoque = async (produtoId: string, tipo: TipoMov, quantidade: number) => {
    const b = writeBatch(db)
    escreverEstoque(b, [{ produtoId, quantidade: Math.abs(quantidade) }], tipo, quantidade < 0 ? -1 : 1)
    try {
      await b.commit()
    } catch (e) {
      falhou(e)
    }
  }

  const novoProduto = async (nome: string, marca: string, preco: number, quantidade: number) => {
    const ref = doc(collection(db, 'produtos'))
    try {
      // Transação: o código do produto (1, 2, 3…) nunca se repete
      const num = await runTransaction(db, async (t) => {
        const contRef = doc(db, 'contadores', 'numeros')
        const cont = await t.get(contRef)
        const n = ((cont.data()?.produto as number | undefined) ?? 0) + 1
        t.set(contRef, { produto: n }, { merge: true })
        const novo: Omit<Produto, 'id'> = { codigo: n, nome, ...(marca && { marca }), preco, quantidade: 0 }
        t.set(ref, novo)
        if (quantidade) escreverEstoque(t, [{ produtoId: ref.id, quantidade }], 'entrada', 1)
        return n
      })
      avisar(`${nome} cadastrado com o código ${num}`)
    } catch (e) {
      falhou(e)
    }
  }

  const entrar = async (login: string, senha: string) => {
    setAvisoLogin('')
    try {
      await signInWithEmailAndPassword(auth, emailDoUsuario(login), senha)
      return null
    } catch (e) {
      return mensagemErro(e)
    }
  }

  const trocarSenha = async (atual: string, nova: string) => {
    const u = auth.currentUser
    if (!u?.email) return 'Entre de novo e tente outra vez.'
    if (nova.length < 6) return 'A nova senha precisa ter pelo menos 6 caracteres.'
    try {
      await reauthenticateWithCredential(u, EmailAuthProvider.credential(u.email, atual))
    } catch (e) {
      const m = mensagemErro(e)
      return m === 'Usuário ou senha incorretos.' ? 'A senha atual está incorreta.' : m
    }
    try {
      await updatePassword(u, nova)
      avisar('Senha alterada')
      return null
    } catch (e) {
      return mensagemErro(e)
    }
  }

  const salvarPessoa = async (id: string | null, d: DadosPessoa) => {
    if (!isAdmin || !colaboradores) return AVISO_ADMIN
    const nome = d.nome.trim()
    const login = d.usuario.trim().toLowerCase()
    const atual = colaboradores.find((c) => c.id === id)
    if (nome.length < 2) return 'Informe o nome.'
    if (!d.funcoes.length) return 'Escolha pelo menos uma função.'
    if (atual && atual.id === usuario!.id && !d.funcoes.includes('admin')) return 'Você não pode tirar o seu próprio acesso de administrador.'
    if (atual && atual.id === usuario!.id && login !== atual.usuario) return 'Você não pode mudar ou tirar o seu próprio acesso.'
    // Conta nova no Firebase: pessoa nova com acesso, troca de usuário, ou senha redefinida pelo administrador
    const novaConta = !!login && (!atual?.uid || login !== atual.usuario || !!d.senha)
    if (login) {
      if (!/^[a-z0-9._-]{3,20}$/.test(login)) return 'Usuário: de 3 a 20 letras minúsculas, números, ponto, hífen ou _ (sem espaço nem acento).'
      if (colaboradores.some((c) => c.id !== id && c.usuario === login)) return 'Esse usuário já existe. Escolha outro.'
      if (novaConta && !d.senha) return 'Defina uma senha para o acesso.'
      if (novaConta && d.senha.length < 6) return 'A senha precisa ter pelo menos 6 caracteres.'
    }

    let uidNovo: string | undefined
    if (novaConta) {
      try {
        uidNovo = await criarConta(login, d.senha)
      } catch (e) {
        if ((e as { code?: string }).code === 'auth/email-already-in-use' && atual?.usuario === login)
          return `Para redefinir a senha mantendo o usuário "${login}", primeiro exclua esse usuário no console do Firebase (Authentication → Usuários). Ou escolha outro nome de usuário.`
        return mensagemErro(e)
      }
    }

    const ref = atual ? doc(db, 'colaboradores', atual.id) : doc(collection(db, 'colaboradores'))
    const b = writeBatch(db)
    const acesso = login
      ? { usuario: login, temLogin: true, ...(uidNovo && { uid: uidNovo }) }
      : { usuario: deleteField(), uid: deleteField(), temLogin: false }
    if (atual) b.update(ref, { nome, funcoes: d.funcoes, ...acesso })
    else b.set(ref, { nome, funcoes: d.funcoes, ativo: true, comissaoPadrao: 0, temLogin: !!login, ...(login && { usuario: login, uid: uidNovo }) })
    if (uidNovo) b.set(doc(db, 'acessos', uidNovo), { colaboradorId: ref.id })
    // Acesso antigo deixa de valer quando é trocado ou retirado
    if (atual?.uid && (uidNovo || !login)) b.delete(doc(db, 'acessos', atual.uid))
    try {
      await b.commit()
    } catch (e) {
      return mensagemErro(e)
    }
    avisar(atual ? 'Dados salvos' : `${nome} cadastrado${login ? ` — já pode entrar como "${login}"` : ''}`)
    return null
  }

  const salvarCliente = async (id: string | null, d: Omit<Cliente, 'id'>) => {
    const nome = d.nome.trim()
    const telefone = formatarTelefone(d.telefone)
    if (nome.length < 2) return 'Informe o nome do cliente.'
    if (!telefoneValido(telefone)) return 'Informe o telefone com DDD, ex.: (66) 99956-0726.'
    const mesmo = clientes.find((c) => c.id !== id && c.telefone === telefone)
    if (mesmo) return `Esse telefone já está cadastrado para ${mesmo.nome}.`
    try {
      if (id === null) await addDoc(collection(db, 'clientes'), { nome, telefone })
      else await updateDoc(doc(db, 'clientes', id), { nome, telefone })
    } catch (e) {
      return mensagemErro(e)
    }
    avisar(id === null ? `${nome} cadastrado` : 'Dados do cliente salvos')
    return null
  }

  const alternarAtivo = async (id: string) => {
    if (!isAdmin) return avisar(AVISO_ADMIN, 'erro')
    if (id === usuario!.id) return avisar('Você não pode desativar a sua própria conta.', 'erro')
    const c = colaboradores?.find((x) => x.id === id)
    if (!c) return
    try {
      await updateDoc(doc(db, 'colaboradores', id), { ativo: !c.ativo })
      avisar(`${c.nome} ${c.ativo ? 'desativado — não consegue mais entrar' : 'reativado'}`)
    } catch (e) {
      falhou(e)
    }
  }

  const value: Store = {
    estado, logado, usuario: usuario!, avisoLogin, isAdmin, entrar, sair: () => signOut(auth), trocarSenha, salvarPessoa, alternarAtivo,
    colaboradores: colaboradores ?? [], clientes, salvarCliente, produtos, lancamentos, movimentacoes, alteracoes, toast, avisar,
    avisoAdmin: () => avisar(AVISO_ADMIN, 'erro'),
    lancar, cancelar, editar, movimentarEstoque, novoProduto,
    produto: (id) => produtos.find((p) => p.id === id),
    colaborador: (id) => colaboradores?.find((c) => c.id === id),
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useStore() {
  const s = useContext(Ctx)
  if (!s) throw new Error('useStore fora do StoreProvider')
  return s
}

export const codigo = (l: Pick<Lancamento, 'tipo' | 'numero'>) =>
  `${l.tipo === 'orcamento' ? 'O' : l.tipo === 'venda' ? 'V' : 'S'}-${l.numero}`

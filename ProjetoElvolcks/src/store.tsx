import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import { colaboradores as colaboradoresIniciais, dadosIniciais, produtosIniciais } from './mock'
import type { Alteracao, Colaborador, Funcao, Lancamento, MovEstoque, Produto, TipoMov } from './types'

export const AVISO_ADMIN = 'Apenas administradores podem ver/fazer isso'

export type NovoLancamento = Omit<Lancamento, 'id' | 'numero' | 'situacao' | 'criadoPor' | 'criadoEm'>

export interface DadosPessoa {
  nome: string
  funcoes: Funcao[]
  usuario: string
  /** Vazio ao editar = mantém a senha atual */
  senha: string
}

interface Store {
  logado: boolean
  /** Só use nas telas internas (depois do login) */
  usuario: Colaborador
  entrar: (usuario: string, senha: string) => string | null
  sair: () => void
  salvarPessoa: (id: number | null, dados: DadosPessoa) => string | null
  alternarAtivo: (id: number) => void
  isAdmin: boolean
  colaboradores: Colaborador[]
  produtos: Produto[]
  lancamentos: Lancamento[]
  movimentacoes: MovEstoque[]
  alteracoes: Alteracao[]
  toast: { texto: string; tipo: 'ok' | 'erro' } | null
  avisar: (texto: string, tipo?: 'ok' | 'erro') => void
  avisoAdmin: () => void
  lancar: (dados: NovoLancamento) => Lancamento
  cancelar: (id: number) => void
  editar: (id: number, mudancas: Partial<Lancamento>, descricao: string) => void
  movimentarEstoque: (produtoId: number, tipo: TipoMov, quantidade: number) => void
  novoProduto: (nome: string, preco: number, quantidade: number) => void
  produto: (id: number) => Produto | undefined
  colaborador: (id?: number) => Colaborador | undefined
}

const Ctx = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [usuarioId, setUsuarioId] = useState<number | null>(null)
  const [colaboradores, setColaboradores] = useState(colaboradoresIniciais)
  const [produtos, setProdutos] = useState(produtosIniciais)
  const [lancamentos, setLancamentos] = useState(dadosIniciais.lancs)
  const [movimentacoes, setMovs] = useState(dadosIniciais.movs)
  const [alteracoes, setAlteracoes] = useState(dadosIniciais.alteracoes)
  const [numeros, setNumeros] = useState(dadosIniciais.numeros)
  const [toast, setToast] = useState<Store['toast']>(null)

  const usuario = colaboradores.find((c) => c.id === usuarioId)!
  const logado = !!usuario?.ativo
  const isAdmin = logado && usuario.funcoes.includes('admin')

  const timer = useRef<number>(undefined)
  const avisar = useCallback((texto: string, tipo: 'ok' | 'erro' = 'ok') => {
    setToast({ texto, tipo })
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setToast(null), 3200)
  }, [])

  const mexerEstoque = (itens: { produtoId: number; quantidade: number }[], tipo: TipoMov, sinal: 1 | -1, ref?: string) => {
    const agora = new Date().toISOString()
    setProdutos((ps) =>
      ps.map((p) => {
        const q = itens.filter((i) => i.produtoId === p.id).reduce((s, i) => s + i.quantidade, 0)
        return q ? { ...p, quantidade: +(p.quantidade + sinal * q).toFixed(2) } : p
      }),
    )
    setMovs((ms) => [
      ...itens.map((i, k) => ({
        id: Date.now() + k, produtoId: i.produtoId, tipo, quantidade: sinal * i.quantidade,
        colaboradorId: usuario.id, data: agora, lancamentoNumero: ref,
      })),
      ...ms,
    ])
  }

  const lancar = (dados: NovoLancamento): Lancamento => {
    const numero = numeros[dados.tipo] + 1
    setNumeros((n) => ({ ...n, [dados.tipo]: numero }))
    const novo: Lancamento = {
      ...dados, id: Date.now(), numero, situacao: 'ativo', criadoPor: usuario.id, criadoEm: new Date().toISOString(),
    }
    setLancamentos((ls) => {
      const lista = [novo, ...ls]
      return dados.origemId
        ? lista.map((l) => (l.id === dados.origemId ? { ...l, situacao: 'convertido' as const, convertidoEmId: novo.id } : l))
        : lista
    })
    if (dados.tipo !== 'orcamento') mexerEstoque(dados.itens, dados.tipo, -1, codigo(novo))
    return novo
  }

  const registrar = (lancamentoId: number, descricao: string) =>
    setAlteracoes((as) => [
      { id: Date.now(), lancamentoId, colaboradorId: usuario.id, data: new Date().toISOString(), descricao },
      ...as,
    ])

  const cancelar = (id: number) => {
    if (!isAdmin) return avisar(AVISO_ADMIN, 'erro')
    const l = lancamentos.find((x) => x.id === id)
    if (!l || l.situacao === 'cancelado') return
    setLancamentos((ls) => ls.map((x) => (x.id === id ? { ...x, situacao: 'cancelado' } : x)))
    if (l.tipo !== 'orcamento') mexerEstoque(l.itens, 'cancelamento', 1, codigo(l))
    registrar(id, l.tipo === 'orcamento' ? 'Orçamento cancelado' : 'Lançamento cancelado: peças devolvidas ao estoque e valor retirado do caixa')
    avisar(`${codigo(l)} cancelado`)
  }

  const editar = (id: number, mudancas: Partial<Lancamento>, descricao: string) => {
    if (!isAdmin) return avisar(AVISO_ADMIN, 'erro')
    setLancamentos((ls) => ls.map((x) => (x.id === id ? { ...x, ...mudancas } : x)))
    registrar(id, descricao)
    avisar('Alteração salva e registrada no histórico')
  }

  const movimentarEstoque = (produtoId: number, tipo: TipoMov, quantidade: number) => {
    mexerEstoque([{ produtoId, quantidade: Math.abs(quantidade) }], tipo, quantidade < 0 ? -1 : 1)
  }

  const novoProduto = (nome: string, preco: number, quantidade: number) => {
    const id = Math.max(...produtos.map((p) => p.id)) + 1
    setProdutos((ps) => [...ps, { id, nome, preco, quantidade: 0 }])
    if (quantidade) mexerEstoque([{ produtoId: id, quantidade }], 'entrada', 1)
  }

  // Login do protótipo: confere usuário e senha na lista em memória (sem segurança real)
  const entrar = (login: string, senha: string) => {
    const c = colaboradores.find((x) => x.usuario === login.trim().toLowerCase())
    if (!c || c.senha !== senha) return 'Usuário ou senha incorretos.'
    if (!c.ativo) return 'Sua conta está desativada. Fale com um administrador.'
    setUsuarioId(c.id)
    return null
  }

  const salvarPessoa = (id: number | null, d: DadosPessoa) => {
    if (!isAdmin) return AVISO_ADMIN
    const nome = d.nome.trim()
    const login = d.usuario.trim().toLowerCase()
    if (nome.length < 2) return 'Informe o nome.'
    if (!d.funcoes.length) return 'Escolha pelo menos uma função.'
    if (id === usuarioId && !d.funcoes.includes('admin')) return 'Você não pode tirar o seu próprio acesso de administrador.'
    if (login) {
      if (!/^[a-z0-9._-]{3,20}$/.test(login)) return 'Usuário: de 3 a 20 letras minúsculas, números, ponto, hífen ou _ (sem espaço nem acento).'
      if (colaboradores.some((c) => c.id !== id && c.usuario === login)) return 'Esse usuário já existe. Escolha outro.'
      const atual = colaboradores.find((c) => c.id === id)
      if (!d.senha && !atual?.senha) return 'Defina uma senha para o acesso.'
    }
    if (d.senha && d.senha.length < 4) return 'A senha precisa ter pelo menos 4 caracteres.'
    const acesso = login ? { usuario: login, temLogin: true } : { usuario: undefined, senha: undefined, temLogin: false }
    if (id === null) {
      const novoId = Math.max(0, ...colaboradores.map((c) => c.id)) + 1
      setColaboradores((cs) => [...cs, { id: novoId, nome, funcoes: d.funcoes, ativo: true, comissaoPadrao: 50, ...acesso, ...(login && { senha: d.senha }) }])
      avisar(`${nome} cadastrado${login ? ` — já pode entrar como "${login}"` : ''}`)
    } else {
      setColaboradores((cs) => cs.map((c) => (c.id === id ? { ...c, nome, funcoes: d.funcoes, ...acesso, ...(login && d.senha && { senha: d.senha }) } : c)))
      avisar('Dados salvos')
    }
    return null
  }

  const alternarAtivo = (id: number) => {
    if (!isAdmin) return avisar(AVISO_ADMIN, 'erro')
    if (id === usuarioId) return avisar('Você não pode desativar a sua própria conta.', 'erro')
    const c = colaboradores.find((x) => x.id === id)
    if (!c) return
    setColaboradores((cs) => cs.map((x) => (x.id === id ? { ...x, ativo: !x.ativo } : x)))
    avisar(`${c.nome} ${c.ativo ? 'desativado — não consegue mais entrar' : 'reativado'}`)
  }

  const value: Store = {
    logado, usuario, isAdmin, entrar, sair: () => setUsuarioId(null), salvarPessoa, alternarAtivo, colaboradores, produtos, lancamentos, movimentacoes, alteracoes, toast, avisar,
    avisoAdmin: () => avisar(AVISO_ADMIN, 'erro'),
    lancar, cancelar, editar, movimentarEstoque, novoProduto,
    produto: (id) => produtos.find((p) => p.id === id),
    colaborador: (id) => colaboradores.find((c) => c.id === id),
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

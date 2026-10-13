import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import { colaboradores, dadosIniciais, produtosIniciais } from './mock'
import type { Alteracao, Colaborador, Lancamento, MovEstoque, Produto, TipoMov } from './types'

export const AVISO_ADMIN = 'Apenas administradores podem ver/fazer isso'

export type NovoLancamento = Omit<Lancamento, 'id' | 'numero' | 'situacao' | 'criadoPor' | 'criadoEm'>

interface Store {
  usuario: Colaborador
  setUsuarioId: (id: number) => void
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
  const [usuarioId, setUsuarioId] = useState(1)
  const [produtos, setProdutos] = useState(produtosIniciais)
  const [lancamentos, setLancamentos] = useState(dadosIniciais.lancs)
  const [movimentacoes, setMovs] = useState(dadosIniciais.movs)
  const [alteracoes, setAlteracoes] = useState(dadosIniciais.alteracoes)
  const [numeros, setNumeros] = useState(dadosIniciais.numeros)
  const [toast, setToast] = useState<Store['toast']>(null)

  const usuario = colaboradores.find((c) => c.id === usuarioId)!
  const isAdmin = usuario.funcoes.includes('admin')

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
        colaboradorId: usuarioId, data: agora, lancamentoNumero: ref,
      })),
      ...ms,
    ])
  }

  const lancar = (dados: NovoLancamento): Lancamento => {
    const numero = numeros[dados.tipo] + 1
    setNumeros((n) => ({ ...n, [dados.tipo]: numero }))
    const novo: Lancamento = {
      ...dados, id: Date.now(), numero, situacao: 'ativo', criadoPor: usuarioId, criadoEm: new Date().toISOString(),
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
      { id: Date.now(), lancamentoId, colaboradorId: usuarioId, data: new Date().toISOString(), descricao },
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

  const value: Store = {
    usuario, setUsuarioId, isAdmin, colaboradores, produtos, lancamentos, movimentacoes, alteracoes, toast, avisar,
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

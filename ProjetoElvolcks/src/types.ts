export type Funcao = 'vende' | 'instala' | 'admin'

export interface Colaborador {
  id: string
  nome: string
  funcoes: Funcao[]
  temLogin: boolean
  ativo: boolean
  comissaoPadrao: number
  /** Nome de usuário para entrar no sistema */
  usuario?: string
  /** Conta do Firebase Authentication ligada a esta pessoa */
  uid?: string
}

export interface Cliente {
  id: string
  nome: string
  telefone: string
}

export interface Produto {
  id: string
  nome: string
  preco: number
  quantidade: number
}

export type TipoMov = 'entrada' | 'ajuste' | 'venda' | 'servico' | 'cancelamento'

export interface MovEstoque {
  id: string
  produtoId: string
  tipo: TipoMov
  quantidade: number
  colaboradorId: string
  data: string
  lancamentoNumero?: string
}

export type TipoLanc = 'orcamento' | 'venda' | 'servico'

export type Forma = 'PIX' | 'Dinheiro' | 'Débito' | 'Crédito à vista' | 'Crédito parcelado'

export const FORMAS: Forma[] = ['PIX', 'Dinheiro', 'Débito', 'Crédito à vista', 'Crédito parcelado']

export interface Item {
  produtoId: string
  quantidade: number
  preco: number
}

export interface Pagamento {
  forma: Forma
  valor: number
  parcelas?: number
}

export type Situacao = 'ativo' | 'cancelado' | 'convertido'

export interface Lancamento {
  id: string
  tipo: TipoLanc
  numero: number
  cliente: string
  telefone?: string
  veiculo: string
  /** Serviço realizado: o que foi feito (ex.: montagem de peça trazida pelo cliente) */
  descricao?: string
  itens: Item[]
  maoDeObra: number
  instaladorId?: string
  comissaoPct: number
  desconto: number
  pagamentos: Pagamento[]
  nfEmitida: boolean
  nfNumero?: string
  situacao: Situacao
  origemId?: string
  convertidoEmId?: string
  criadoPor: string
  criadoEm: string
}

export interface Alteracao {
  id: string
  lancamentoId: string
  colaboradorId: string
  data: string
  descricao: string
}

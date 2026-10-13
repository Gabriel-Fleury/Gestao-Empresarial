export type Funcao = 'vende' | 'instala' | 'admin'

export interface Colaborador {
  id: number
  nome: string
  funcoes: Funcao[]
  temLogin: boolean
  ativo: boolean
  comissaoPadrao: number
}

export interface Produto {
  id: number
  nome: string
  preco: number
  quantidade: number
}

export type TipoMov = 'entrada' | 'ajuste' | 'venda' | 'servico' | 'cancelamento'

export interface MovEstoque {
  id: number
  produtoId: number
  tipo: TipoMov
  quantidade: number
  colaboradorId: number
  data: string
  lancamentoNumero?: string
}

export type TipoLanc = 'orcamento' | 'venda' | 'servico'

export type Forma = 'PIX' | 'Dinheiro' | 'Débito' | 'Crédito à vista' | 'Crédito parcelado'

export const FORMAS: Forma[] = ['PIX', 'Dinheiro', 'Débito', 'Crédito à vista', 'Crédito parcelado']

export interface Item {
  produtoId: number
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
  id: number
  tipo: TipoLanc
  numero: number
  cliente: string
  veiculo: string
  itens: Item[]
  maoDeObra: number
  instaladorId?: number
  comissaoPct: number
  desconto: number
  pagamentos: Pagamento[]
  nfEmitida: boolean
  nfNumero?: string
  situacao: Situacao
  origemId?: number
  convertidoEmId?: number
  criadoPor: number
  criadoEm: string
}

export interface Alteracao {
  id: number
  lancamentoId: number
  colaboradorId: number
  data: string
  descricao: string
}

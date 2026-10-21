import { totalLanc } from './mock'
import type { Lancamento } from './types'

export { totalLanc }

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
export const dinheiro = (v: number) => brl.format(v)

export const qtd = (v: number) => v.toLocaleString('pt-BR', { maximumFractionDigits: 2 })

export const dataHora = (iso: string) =>
  new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })

export const dataCurta = (d: Date | string) =>
  new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })

export const hora = (iso: string) => new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

/** Formata enquanto digita: (66) 99956-0726 ou (66) 3401-1234 */
export const formatarTelefone = (s: string) => {
  const d = s.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 2) return d.length ? `(${d}` : ''
  const meio = d.length === 11 ? 7 : 6
  return `(${d.slice(0, 2)}) ${d.slice(2, meio)}${d.length > meio ? `-${d.slice(meio)}` : ''}`
}
export const telefoneValido = (s: string) => /^\d{10,11}$/.test(s.replace(/\D/g, ''))

/** Para buscar sem diferenciar maiúscula nem acento */
export const normalizar = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()

export const chaveDia = (d: Date | string) => {
  const x = new Date(d)
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`
}
export const chaveMes = (d: Date | string) => chaveDia(d).slice(0, 7)

export const ehHoje = (iso: string) => chaveDia(iso) === chaveDia(new Date())

export const nomeMes = (chave: string) => {
  const [a, m] = chave.split('-').map(Number)
  const s = new Date(a, m - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/** Segunda-feira da semana atual (AAAA-MM-DD). */
export const inicioSemana = () => {
  const d = new Date()
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return chaveDia(d)
}

/** Período dos filtros: 'hoje', 'semana', 'tudo' ou um mês ('AAAA-MM'). */
export const noPeriodo = (iso: string, periodo: string) =>
  periodo === 'tudo' ? true : periodo === 'hoje' ? ehHoje(iso) : periodo === 'semana' ? chaveDia(iso) >= inicioSemana() : chaveMes(iso) === periodo

export const ultimosMeses = (n: number) =>
  Array.from({ length: n }, (_, i) => {
    const d = new Date()
    return chaveMes(new Date(d.getFullYear(), d.getMonth() - i, 1))
  })

/** Lançamentos que entram no caixa: vendas e serviços não cancelados. */
export const entraNoCaixa = (l: Lancamento) => l.tipo !== 'orcamento' && l.situacao !== 'cancelado'

export const subtotalPecas = (l: Pick<Lancamento, 'itens'>) => l.itens.reduce((s, i) => s + i.quantidade * i.preco, 0)

export const comissao = (l: Lancamento) => (l.maoDeObra * l.comissaoPct) / 100

export const validadeOrcamento = (l: Lancamento) => new Date(new Date(l.criadoEm).getTime() + 7 * 864e5)

export const orcamentoVencido = (l: Lancamento) => l.tipo === 'orcamento' && l.situacao === 'ativo' && validadeOrcamento(l) < new Date()

export const NOME_TIPO = { orcamento: 'Orçamento', venda: 'Venda', servico: 'Serviço realizado' } as const

export const LOJA = {
  nome: 'Elvolcks Auto Som',
  endereco: 'Rua J, nº 165, Setor Bela Vista, Barra do Garças – MT',
  whatsapp: '(66) 99956-0726',
  cnpj: 'CNPJ 18.980.124/0001-46',
}

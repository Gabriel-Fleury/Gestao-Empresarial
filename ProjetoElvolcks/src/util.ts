import type { Lancamento, Produto } from './types'

export const totalLanc = (l: Pick<Lancamento, 'itens' | 'maoDeObra' | 'desconto'>) =>
  +(l.itens.reduce((s, i) => s + i.quantidade * i.preco, 0) + l.maoDeObra - l.desconto).toFixed(2)

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

/** Formata enquanto digita: CPF (000.000.000-00) até 11 dígitos, CNPJ (00.000.000/0000-00) acima disso */
export const formatarCpfCnpj = (s: string) => {
  const d = s.replace(/\D/g, '').slice(0, 14)
  if (d.length <= 11) return d.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2')
  return d.replace(/^(\d{2})(\d)/, '$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d)/, '.$1/$2').replace(/(\d{4})(\d)/, '$1-$2')
}

/** Confere os dígitos verificadores do CPF ou CNPJ */
export const cpfCnpjValido = (s: string) => {
  const d = s.replace(/\D/g, '')
  if (d.length !== 11 && d.length !== 14) return false
  if (/^(\d)\1+$/.test(d)) return false
  const digito = (base: string, pesos: number[]) => {
    const r = base.split('').reduce((t, n, i) => t + Number(n) * pesos[i], 0) % 11
    return r < 2 ? 0 : 11 - r
  }
  if (d.length === 11) {
    const p = [11, 10, 9, 8, 7, 6, 5, 4, 3, 2]
    const d1 = digito(d.slice(0, 9), p.slice(1))
    const d2 = digito(d.slice(0, 10), p)
    return d.endsWith(`${d1}${d2}`)
  }
  const p = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  const d1 = digito(d.slice(0, 12), p.slice(1))
  const d2 = digito(d.slice(0, 13), p)
  return d.endsWith(`${d1}${d2}`)
}

/** Formata enquanto digita: 78000-000 */
export const formatarCep = (s: string) => {
  const d = s.replace(/\D/g, '').slice(0, 8)
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d
}

export const emailValido = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)

/** Para buscar sem diferenciar maiúscula nem acento */
export const normalizar = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()

/** Busca por c\u00f3digo, nome ou marca ("12", "modulo bosch"\u2026); o produto com o c\u00f3digo exato vem primeiro */
export const buscarProdutos = (produtos: Produto[], busca: string) => {
  const termos = normalizar(busca).split(/\s+/).filter(Boolean)
  const exato = (p: Produto) => Number(termos.length === 1 && String(p.codigo) === termos[0])
  return produtos
    .filter((p) => termos.every((t) => normalizar(`${p.codigo ?? ''} ${p.nome} ${p.marca ?? ''}`).includes(t)))
    .sort((a, b) => exato(b) - exato(a) || a.nome.localeCompare(b.nome))
}

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

/** Lançamentos que entram no caixa: vendas e serviço não cancelados. */
export const entraNoCaixa = (l: Lancamento) => l.tipo !== 'orcamento' && l.situacao !== 'cancelado'

/** Pagamento "A prazo" do lançamento, se houver */
export const pagamentoPrazo = (l: Pick<Lancamento, 'pagamentos'>) => l.pagamentos.find((p) => p.forma === 'A prazo')

/** Venda/serviço a prazo que o cliente ainda não pagou */
export const pagamentoPendente = (l: Lancamento) => l.situacao !== 'cancelado' && !!pagamentoPrazo(l) && !pagamentoPrazo(l)!.pagoEm

/** Pendente e já passou do dia combinado */
export const pagamentoAtrasado = (l: Lancamento) => pagamentoPendente(l) && (pagamentoPrazo(l)!.vencimento ?? '') < chaveDia(new Date())

/** Data AAAA-MM-DD → dd/mm/aaaa, sem passar pelo fuso */
export const dataDia = (chave: string) => chave.split('-').reverse().join('/')

/**
 * O que entrou no caixa num dia: à vista no dia do lançamento;
 * a prazo só no dia em que o pagamento foi confirmado, pela forma recebida.
 */
export const recebidoNoDia = (l: Lancamento, dia: string) =>
  !entraNoCaixa(l)
    ? []
    : l.pagamentos.flatMap((p) =>
        p.forma === 'A prazo'
          ? p.pagoEm && chaveDia(p.pagoEm) === dia ? [{ forma: p.recebidoCom ?? 'Dinheiro', valor: p.valor }] : []
          : chaveDia(l.criadoEm) === dia ? [{ forma: p.forma, valor: p.valor }] : [],
      )

export const subtotalPecas =(l: Pick<Lancamento, 'itens'>) => l.itens.reduce((s, i) => s + i.quantidade * i.preco, 0)

export const comissao = (l: Lancamento) => (l.maoDeObra * l.comissaoPct) / 100

export const validadeOrcamento = (l: Lancamento) => new Date(new Date(l.criadoEm).getTime() + 7 * 864e5)

export const orcamentoVencido = (l: Lancamento) => l.tipo === 'orcamento' && l.situacao === 'ativo' && validadeOrcamento(l) < new Date()

export const NOME_TIPO = { orcamento: 'Orçamento', venda: 'Venda', servico: 'Serviço realizado' } as const

export const LOJA = {
  nome: 'Elvolcks Auto Som',
  razaoSocial: 'M.F Martins LTDA',
  endereco: 'Rua J, nº 165, Setor Bela Vista, Barra do Garças – MT',
  cep: 'CEP 78603-222',
  whatsapp: '(66) 99956-0726',
  cnpj: 'CNPJ 18.980.124/0001-46',
}

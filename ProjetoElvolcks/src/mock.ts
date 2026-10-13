// Dados fictícios para o protótipo. Gerados com semente fixa, relativos à data de hoje,
// para que os números fiquem iguais a cada recarga e sempre "atuais".
import type { Alteracao, Colaborador, Forma, Item, Lancamento, MovEstoque, Pagamento, Produto } from './types'

function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rnd = mulberry32(165)
const int = (min: number, max: number) => Math.floor(rnd() * (max - min + 1)) + min
const pick = <T,>(arr: T[]) => arr[Math.floor(rnd() * arr.length)]
const chance = (p: number) => rnd() < p

export const colaboradores: Colaborador[] = [
  { id: 1, nome: 'Elvis Volcks', funcoes: ['admin', 'vende', 'instala'], temLogin: true, ativo: true, comissaoPadrao: 0 },
  { id: 2, nome: 'Carla Volcks', funcoes: ['admin', 'vende'], temLogin: true, ativo: true, comissaoPadrao: 0 },
  { id: 3, nome: 'Rafael Souza', funcoes: ['vende', 'instala'], temLogin: true, ativo: true, comissaoPadrao: 10 },
  { id: 4, nome: 'Marcos Lima', funcoes: ['vende'], temLogin: true, ativo: true, comissaoPadrao: 0 },
  { id: 5, nome: 'Diego Ferreira', funcoes: ['instala'], temLogin: false, ativo: true, comissaoPadrao: 15 },
]

export const produtosIniciais: Produto[] = [
  { id: 1, nome: 'Alto-falante Pioneer 6" TS-1360BR', preco: 189.9, quantidade: 14 },
  { id: 2, nome: 'Alto-falante Bravox 6x9" B3X69', preco: 249.9, quantidade: 6 },
  { id: 3, nome: 'Tweeter JBL ST200', preco: 89.9, quantidade: 22 },
  { id: 4, nome: 'Módulo Taramps DS 800x4', preco: 649, quantidade: 3 },
  { id: 5, nome: 'Módulo Taramps TS 400x4', preco: 389, quantidade: 1 },
  { id: 6, nome: 'Módulo SounDigital SD1200.1', preco: 899, quantidade: 2 },
  { id: 7, nome: 'Subwoofer Pioneer 12" TS-W3090', preco: 459, quantidade: 4 },
  { id: 8, nome: 'Caixa dutada 12" carpete preto', preco: 220, quantidade: 0 },
  { id: 9, nome: 'Central multimídia 7" Android 2 DIN', preco: 1290, quantidade: 5 },
  { id: 10, nome: 'Central multimídia 9" Android', preco: 1590, quantidade: 1 },
  { id: 11, nome: 'Rádio Pioneer MVH-S218BT', preco: 389, quantidade: 7 },
  { id: 12, nome: 'Câmera de ré universal', preco: 89.9, quantidade: 12 },
  { id: 13, nome: 'Sensor de estacionamento 4 pontos', preco: 149.9, quantidade: 8 },
  { id: 14, nome: 'Alarme Pósitron Cyber EX 360', preco: 299.9, quantidade: 6 },
  { id: 15, nome: 'Trava elétrica 4 portas', preco: 189.9, quantidade: 5 },
  { id: 16, nome: 'Antena interna amplificada', preco: 59.9, quantidade: 9 },
  { id: 17, nome: 'Fio paralelo 2x1,5 mm (metro)', preco: 4.5, quantidade: 86.5 },
  { id: 18, nome: 'Cabo de força 10 mm vermelho (metro)', preco: 18.9, quantidade: 23.5 },
  { id: 19, nome: 'Cabo RCA 5 m', preco: 39.9, quantidade: 15 },
  { id: 20, nome: 'Chicote universal ISO', preco: 34.9, quantidade: 18 },
  { id: 21, nome: 'Moldura 2 DIN', preco: 79.9, quantidade: 4 },
  { id: 22, nome: 'Capacitor 1 Farad', preco: 349, quantidade: -1 },
  { id: 23, nome: 'Fusível ANL 100A', preco: 24.9, quantidade: 30 },
  { id: 24, nome: 'Kit 2 vias Pioneer 6"', preco: 549, quantidade: 3 },
  { id: 25, nome: 'Corneta + driver Selenium', preco: 279, quantidade: 2 },
  { id: 26, nome: 'Lâmpada LED H4 (par)', preco: 129.9, quantidade: 11 },
  { id: 27, nome: 'Interface de volante', preco: 189, quantidade: 1 },
  { id: 28, nome: 'Terminal de bateria (par)', preco: 29.9, quantidade: 40 },
  { id: 29, nome: 'Controle longa distância', preco: 59.9, quantidade: 10 },
  { id: 30, nome: 'Fita isolante 3M 20 m', preco: 12.9, quantidade: 25 },
]

const CLIENTES = [
  'João Batista', 'Maria Aparecida', 'Lucas Oliveira', 'Fernanda Rocha', 'Pedro Henrique', 'Ana Paula',
  'Carlos Eduardo', 'Juliana Martins', 'Thiago Alves', 'Patrícia Gomes', 'Rodrigo Nunes', 'Gabriela Costa',
  'Felipe Barros', 'Larissa Ribeiro', 'André Moreira', 'Bruna Carvalho', 'Vinícius Pereira', 'Camila Duarte',
  'Wesley Santos', 'Renata Freitas', 'Leandro Dias', 'Jéssica Moura', 'Mateus Cardoso', 'Simone Teixeira',
]
const VEICULOS = [
  'Gol G5 2012 prata', 'Onix 2019 branco', 'Hilux 2021 preta', 'Strada 2018 vermelha', 'HB20 2020 cinza',
  'S10 2016 branca', 'Saveiro 2015 prata', 'Corolla 2017 preto', 'Ranger 2022 azul', 'Uno 2010 branco',
  'Fiesta 2014 preto', 'Toro 2020 cinza', 'Hilux SW4 2019', 'Amarok 2018 branca', 'Celta 2011 prata',
]
const SERVICOS: { itens: [number, number][]; mao: number }[] = [
  { itens: [[9, 1], [21, 1], [20, 1]], mao: 150 },
  { itens: [[1, 2], [17, 6]], mao: 80 },
  { itens: [[4, 1], [18, 5], [23, 1], [28, 1]], mao: 250 },
  { itens: [[7, 1], [8, 1], [6, 1], [18, 6]], mao: 350 },
  { itens: [[12, 1]], mao: 120 },
  { itens: [[13, 1]], mao: 150 },
  { itens: [[14, 1]], mao: 200 },
  { itens: [[15, 1]], mao: 180 },
  { itens: [[24, 1], [5, 1], [17, 10], [19, 1]], mao: 300 },
  { itens: [[25, 2], [6, 1], [18, 8], [22, 1]], mao: 450 },
  { itens: [[11, 1], [20, 1]], mao: 80 },
  { itens: [[26, 1]], mao: 50 },
  { itens: [[10, 1], [27, 1], [12, 1]], mao: 250 },
]
const VENDAS_ITENS = [1, 2, 3, 11, 12, 16, 17, 18, 19, 20, 23, 26, 28, 29, 30, 3, 17, 26]

function pagar(total: number): Pagamento[] {
  const formas: Forma[] = ['PIX', 'PIX', 'PIX', 'Dinheiro', 'Débito', 'Crédito à vista', 'Crédito parcelado']
  const f1 = pick(formas)
  const parc = (f: Forma) => (f === 'Crédito parcelado' ? int(2, 10) : undefined)
  if (total > 200 && chance(0.25)) {
    const v1 = Math.round(total * pick([0.3, 0.4, 0.5]))
    const f2 = pick(formas.filter((f) => f !== f1))
    return [
      { forma: f1, valor: v1, parcelas: parc(f1) },
      { forma: f2, valor: +(total - v1).toFixed(2), parcelas: parc(f2) },
    ]
  }
  return [{ forma: f1, valor: total, parcelas: parc(f1) }]
}

const preco = (id: number) => produtosIniciais.find((p) => p.id === id)!.preco
export const totalLanc = (l: Pick<Lancamento, 'itens' | 'maoDeObra' | 'desconto'>) =>
  +(l.itens.reduce((s, i) => s + i.quantidade * i.preco, 0) + l.maoDeObra - l.desconto).toFixed(2)

function gerar() {
  const lancs: Lancamento[] = []
  const movs: MovEstoque[] = []
  const numeros = { orcamento: 300, venda: 1200, servico: 640 }
  let id = 1
  let movId = 1
  const hoje = new Date()
  const vendedores = [1, 2, 3, 4, 4, 3, 2]
  const instaladores = [3, 5, 5, 3, 1]

  for (let d = 75; d >= 0; d--) {
    const dia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - d)
    if (dia.getDay() === 0) continue
    const sabado = dia.getDay() === 6
    const horaMax = d === 0 ? Math.min(Math.max(hoje.getHours(), 10), 17) : sabado ? 12 : 17
    const quando = () => {
      const t = new Date(dia)
      t.setHours(int(8, horaMax), int(0, 59))
      return t.toISOString()
    }
    const qtdV = d === 0 ? 3 : int(2, sabado ? 4 : 6)
    const qtdS = d === 0 ? 2 : int(1, sabado ? 2 : 4)
    const qtdO = d === 0 ? 3 : int(1, 3)

    for (let k = 0; k < qtdO; k++) {
      const s = pick(SERVICOS)
      const itens: Item[] = s.itens.map(([p, q]) => ({ produtoId: p, quantidade: q, preco: preco(p) }))
      lancs.push({
        id: id++, tipo: 'orcamento', numero: ++numeros.orcamento, cliente: pick(CLIENTES), veiculo: pick(VEICULOS),
        itens, maoDeObra: s.mao, comissaoPct: 0, desconto: chance(0.3) ? pick([20, 30, 50]) : 0, pagamentos: [],
        nfEmitida: false, situacao: 'ativo', criadoPor: pick(vendedores), criadoEm: quando(),
      })
    }
    for (let k = 0; k < qtdV; k++) {
      const n = int(1, 3)
      const ids = new Set<number>()
      while (ids.size < n) ids.add(pick(VENDAS_ITENS))
      const itens: Item[] = [...ids].map((p) => ({
        produtoId: p,
        quantidade: p === 17 || p === 18 ? int(2, 12) : chance(0.2) ? 2 : 1,
        preco: preco(p),
      }))
      const base = { itens, maoDeObra: 0, desconto: chance(0.15) ? pick([5, 10, 15]) : 0 }
      const total = totalLanc(base)
      lancs.push({
        id: id++, tipo: 'venda', numero: ++numeros.venda, cliente: pick(CLIENTES), veiculo: chance(0.4) ? pick(VEICULOS) : '',
        ...base, comissaoPct: 0, pagamentos: pagar(total), nfEmitida: chance(0.35), situacao: 'ativo',
        criadoPor: pick(vendedores), criadoEm: quando(),
      })
    }
    for (let k = 0; k < qtdS; k++) {
      // Às vezes o serviço nasce de um orçamento aberto dos últimos 7 dias
      const aberto = lancs.find(
        (l) => l.tipo === 'orcamento' && l.situacao === 'ativo' && dia.getTime() - new Date(l.criadoEm).getTime() < 6 * 864e5,
      )
      const usarOrc = aberto && chance(0.35)
      const s = pick(SERVICOS)
      const itens: Item[] = usarOrc
        ? aberto.itens.map((i) => ({ ...i }))
        : s.itens.map(([p, q]) => ({ produtoId: p, quantidade: q, preco: preco(p) }))
      const inst = pick(instaladores)
      const base = { itens, maoDeObra: usarOrc ? aberto.maoDeObra : s.mao, desconto: usarOrc ? aberto.desconto : chance(0.25) ? pick([20, 30, 50]) : 0 }
      const total = totalLanc(base)
      const novo: Lancamento = {
        id: id++, tipo: 'servico', numero: ++numeros.servico,
        cliente: usarOrc ? aberto.cliente : pick(CLIENTES), veiculo: usarOrc ? aberto.veiculo : pick(VEICULOS),
        ...base, instaladorId: inst, comissaoPct: colaboradores.find((c) => c.id === inst)!.comissaoPadrao,
        pagamentos: pagar(total), nfEmitida: chance(0.4), situacao: 'ativo', origemId: usarOrc ? aberto.id : undefined,
        criadoPor: pick(vendedores), criadoEm: quando(),
      }
      if (usarOrc) {
        aberto.situacao = 'convertido'
        aberto.convertidoEmId = novo.id
      }
      lancs.push(novo)
    }
  }

  lancs.sort((a, b) => a.criadoEm.localeCompare(b.criadoEm))
  let nf = 4810
  for (const l of lancs) {
    if (l.nfEmitida) l.nfNumero = String(++nf)
    if (l.tipo !== 'orcamento' && chance(0.02) && l.criadoEm < new Date(hoje.getTime() - 864e5).toISOString()) l.situacao = 'cancelado'
    if (l.tipo === 'orcamento') continue
    for (const i of l.itens) {
      movs.push({
        id: movId++, produtoId: i.produtoId, tipo: l.tipo, quantidade: -i.quantidade, colaboradorId: l.criadoPor,
        data: l.criadoEm, lancamentoNumero: `${l.tipo === 'venda' ? 'V' : 'S'}-${l.numero}`,
      })
      if (l.situacao === 'cancelado') {
        movs.push({
          id: movId++, produtoId: i.produtoId, tipo: 'cancelamento', quantidade: i.quantidade, colaboradorId: 1,
          data: new Date(new Date(l.criadoEm).getTime() + 3600e3).toISOString(), lancamentoNumero: `${l.tipo === 'venda' ? 'V' : 'S'}-${l.numero}`,
        })
      }
    }
  }
  // Algumas entradas de mercadoria e correções de estoque
  for (let k = 0; k < 14; k++) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - int(1, 60), int(8, 11), int(0, 59))
    const p = pick(produtosIniciais)
    const ajuste = chance(0.25)
    movs.push({
      id: movId++, produtoId: p.id, tipo: ajuste ? 'ajuste' : 'entrada',
      quantidade: ajuste ? pick([-1, 1, -2]) : p.id === 17 || p.id === 18 ? 100 : int(4, 12),
      colaboradorId: pick([1, 2, 3, 4]), data: d.toISOString(),
    })
  }
  movs.sort((a, b) => b.data.localeCompare(a.data))

  const alteracoes: Alteracao[] = []
  const editaveis = lancs.filter((l) => l.tipo !== 'orcamento' && l.situacao === 'ativo').slice(-40)
  for (let k = 0; k < 4; k++) {
    const l = pick(editaveis)
    alteracoes.push({
      id: k + 1, lancamentoId: l.id, colaboradorId: pick([1, 2]),
      data: new Date(new Date(l.criadoEm).getTime() + 2 * 3600e3).toISOString(),
      descricao: pick(['Cliente: corrigido o nome', 'NF: marcada como emitida', 'Veículo: corrigido o ano']),
    })
  }
  for (const l of lancs) if (l.situacao === 'cancelado') {
    alteracoes.push({ id: alteracoes.length + 1, lancamentoId: l.id, colaboradorId: 1, data: new Date(new Date(l.criadoEm).getTime() + 3600e3).toISOString(), descricao: 'Lançamento cancelado: peças devolvidas ao estoque e valor retirado do caixa' })
  }

  return { lancs: lancs.reverse(), movs, alteracoes, numeros }
}

export const dadosIniciais = gerar()

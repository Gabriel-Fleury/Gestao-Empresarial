import { useState } from 'react'
import { Detalhe } from '../components/Detalhe'
import { Painel, Selo, SeloSituacao, Vazio } from '../components/ui'
import { codigo, useStore } from '../store'
import type { Lancamento, TipoLanc } from '../types'
import { SeletorPeriodo } from '../components/SeletorPeriodo'
import { comissao, dataHora, dinheiro, noPeriodo, totalLanc } from '../util'

const ABAS: { tipo: TipoLanc; nome: string }[] = [
  { tipo: 'servico', nome: 'Serviços' },
  { tipo: 'venda', nome: 'Vendas' },
  { tipo: 'orcamento', nome: 'Orçamentos' },
]
const NOME_FUNCAO = { vende: 'Vende', instala: 'Instala', admin: 'Administrador' }

export function HistoricoColaborador({ id, periodoInicial = 'tudo', aoVoltar }: { id: number; periodoInicial?: string; aoVoltar: () => void }) {
  const { colaboradores, lancamentos } = useStore()
  const c = colaboradores.find((x) => x.id === id)
  const [periodo, setPeriodo] = useState(periodoInicial)
  const [aba, setAba] = useState<TipoLanc>(c?.funcoes.includes('instala') ? 'servico' : 'venda')
  const [aberto, setAberto] = useState<number | null>(null)
  if (!c) return null

  // Serviços: os que ele instalou ou lançou. Vendas e orçamentos: os que ele lançou.
  const dele = (l: Lancamento) => l.criadoPor === id || (l.tipo === 'servico' && l.instaladorId === id)
  const doPeriodo = lancamentos.filter((l) => dele(l) && noPeriodo(l.criadoEm, periodo))
  const porTipo = (t: TipoLanc) => doPeriodo.filter((l) => l.tipo === t)
  const lista = porTipo(aba)
  const validos = lista.filter((l) => l.situacao !== 'cancelado')
  const comissaoTotal = validos.filter((l) => l.instaladorId === id).reduce((s, l) => s + comissao(l), 0)

  const papel = (l: Lancamento) => {
    const instalou = l.instaladorId === id
    const lancou = l.criadoPor === id
    return instalou && lancou ? 'Instalou e lançou' : instalou ? 'Instalou' : 'Lançou'
  }

  return (
    <>
      <button onClick={aoVoltar} className="group mb-3 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-50 hover:text-blue-900">
        <span className="transition-transform group-hover:-translate-x-0.5">←</span> Colaboradores
      </button>

      <div className="mb-5 flex flex-wrap items-center gap-4">
        <div className="grid size-14 shrink-0 place-items-center rounded-full bg-blue-700 font-display text-xl font-bold text-white">
          {c.nome.split(' ').map((p) => p[0]).slice(0, 2).join('')}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-3xl font-bold tracking-wide text-slate-900 uppercase">{c.nome}</h1>
          <div className="mt-1 flex flex-wrap gap-1">
            {c.funcoes.map((f) => <Selo key={f} cor={f === 'admin' ? 'azul' : 'cinza'}>{NOME_FUNCAO[f]}</Selo>)}
            {!c.ativo && <Selo cor="vermelho">Inativo</Selo>}
          </div>
        </div>
        <SeletorPeriodo valor={periodo} aoMudar={setPeriodo} comTudo />
      </div>

      <div className="mb-3 grid grid-cols-3 gap-1 rounded-xl bg-slate-200/70 p-1 sm:inline-grid" role="tablist">
        {ABAS.map((a) => (
          <button
            key={a.tipo}
            role="tab"
            aria-selected={aba === a.tipo}
            onClick={() => setAba(a.tipo)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${aba === a.tipo ? 'bg-white text-blue-800 shadow' : 'text-slate-600 hover:text-slate-900'}`}
          >
            {a.nome} <span className="ml-1 text-xs tabular-nums opacity-70">{porTipo(a.tipo).length}</span>
          </button>
        ))}
      </div>

      <Painel>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs tracking-wide text-slate-500 uppercase">
              <tr>
                <th className="px-4 py-2.5">Nº</th>
                <th className="px-3 py-2.5">Data</th>
                <th className="px-3 py-2.5">Cliente</th>
                <th className="px-3 py-2.5">Veículo</th>
                {aba === 'servico' && <th className="px-3 py-2.5">Participação</th>}
                {aba === 'servico' && <th className="px-3 py-2.5 text-right">Comissão</th>}
                <th className="px-3 py-2.5">Situação</th>
                <th className="px-4 py-2.5 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((l) => (
                <tr key={l.id} onClick={() => setAberto(l.id)} className="cursor-pointer border-b border-slate-100 hover:bg-blue-50/40">
                  <td className="px-4 py-2.5 font-mono text-xs font-semibold text-blue-800">{codigo(l)}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap text-slate-600">{dataHora(l.criadoEm)}</td>
                  <td className="px-3 py-2.5 font-medium">{l.cliente}</td>
                  <td className="px-3 py-2.5 text-slate-600">{l.veiculo || '—'}</td>
                  {aba === 'servico' && <td className="px-3 py-2.5 text-slate-600">{papel(l)}</td>}
                  {aba === 'servico' && (
                    <td className="px-3 py-2.5 text-right text-slate-600 tabular-nums">{l.instaladorId === id && l.situacao !== 'cancelado' ? dinheiro(comissao(l)) : '—'}</td>
                  )}
                  <td className="px-3 py-2.5"><SeloSituacao l={l} /></td>
                  <td className={`px-4 py-2.5 text-right tabular-nums ${l.situacao === 'cancelado' ? 'text-slate-400 line-through' : 'text-emerald-700'}`}>{dinheiro(totalLanc(l))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {lista.length === 0 ? (
          <Vazio>Nenhum {aba === 'servico' ? 'serviço' : aba === 'venda' ? 'venda' : 'orçamento'} neste período.</Vazio>
        ) : (
          <div className="flex flex-wrap justify-between gap-2 border-t border-slate-200 px-4 py-3 text-sm">
            <span className="text-slate-500">{lista.length} {lista.length === 1 ? 'lançamento' : 'lançamentos'}</span>
            <span className="flex flex-wrap gap-x-5">
              {aba === 'servico' && <span>Comissão: <b className="text-slate-800 tabular-nums">{dinheiro(comissaoTotal)}</b></span>}
              <span>Soma (sem cancelados): <b className="text-emerald-700 tabular-nums">{dinheiro(validos.reduce((s, l) => s + totalLanc(l), 0))}</b></span>
            </span>
          </div>
        )}
      </Painel>
      {aberto && <Detalhe id={aberto} aoFechar={() => setAberto(null)} />}
    </>
  )
}

import { useMemo, useState } from 'react'
import { Detalhe } from '../components/Detalhe'
import { Botao, inputCls, Painel, SeloSituacao, Titulo, Vazio } from '../components/ui'
import { codigo, useStore } from '../store'
import type { TipoLanc } from '../types'
import { chaveDia, chaveMes, dataHora, dinheiro, ehHoje, orcamentoVencido, totalLanc } from '../util'

const TITULOS: Record<TipoLanc, string> = { venda: 'Vendas', orcamento: 'Orçamentos', servico: 'Serviços realizados' }
type Periodo = 'hoje' | '7' | 'mes' | 'tudo'

export function Lancamentos({ tipo, novoLancamento }: { tipo: TipoLanc; novoLancamento: (t: TipoLanc) => void }) {
  const { lancamentos, colaborador } = useStore()
  const [busca, setBusca] = useState('')
  const [periodo, setPeriodo] = useState<Periodo>('7')
  const [situacao, setSituacao] = useState('todas')
  const [aberto, setAberto] = useState<number | null>(null)

  const lista = useMemo(() => {
    const b = busca.trim().toLowerCase()
    const seteDias = chaveDia(new Date(Date.now() - 6 * 864e5))
    return lancamentos.filter((l) => {
      if (l.tipo !== tipo) return false
      if (periodo === 'hoje' && !ehHoje(l.criadoEm)) return false
      if (periodo === '7' && chaveDia(l.criadoEm) < seteDias) return false
      if (periodo === 'mes' && chaveMes(l.criadoEm) !== chaveMes(new Date())) return false
      if (situacao === 'aberto' && !(l.situacao === 'ativo' && !orcamentoVencido(l))) return false
      if (situacao !== 'todas' && situacao !== 'aberto' && situacao !== 'vencido' && l.situacao !== situacao) return false
      if (situacao === 'vencido' && !orcamentoVencido(l)) return false
      if (b && !`${l.cliente} ${l.veiculo} ${codigo(l)}`.toLowerCase().includes(b)) return false
      return true
    })
  }, [lancamentos, tipo, busca, periodo, situacao])

  const soma = lista.filter((l) => l.situacao !== 'cancelado').reduce((s, l) => s + totalLanc(l), 0)

  return (
    <>
      <Titulo acao={<Botao onClick={() => novoLancamento(tipo)}>+ {tipo === 'orcamento' ? 'Novo orçamento' : tipo === 'venda' ? 'Nova venda' : 'Novo serviço'}</Botao>}>{TITULOS[tipo]}</Titulo>

      <div className="mb-3 flex flex-wrap gap-2">
        <input className={`${inputCls} max-w-xs`} placeholder="Buscar cliente, veículo ou número…" value={busca} onChange={(e) => setBusca(e.target.value)} />
        <select className={`${inputCls} w-auto`} value={periodo} onChange={(e) => setPeriodo(e.target.value as Periodo)}>
          <option value="hoje">Hoje</option>
          <option value="7">Últimos 7 dias</option>
          <option value="mes">Este mês</option>
          <option value="tudo">Tudo</option>
        </select>
        <select className={`${inputCls} w-auto`} value={situacao} onChange={(e) => setSituacao(e.target.value)}>
          <option value="todas">Todas as situações</option>
          {tipo === 'orcamento' ? (
            <>
              <option value="aberto">Abertos</option>
              <option value="convertido">Convertidos</option>
              <option value="vencido">Vencidos</option>
            </>
          ) : <option value="ativo">Concluídos</option>}
          <option value="cancelado">Cancelados</option>
        </select>
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
                {tipo === 'servico' && <th className="px-3 py-2.5">Instalador</th>}
                <th className="px-3 py-2.5">Lançado por</th>
                <th className="px-3 py-2.5">Situação</th>
                <th className="px-4 py-2.5 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {lista.slice(0, 200).map((l) => (
                <tr key={l.id} onClick={() => setAberto(l.id)} className="cursor-pointer border-b border-slate-100 hover:bg-blue-50/40">
                  <td className="px-4 py-2.5 font-mono text-xs font-semibold text-blue-800">{codigo(l)}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap text-slate-600">{dataHora(l.criadoEm)}</td>
                  <td className="px-3 py-2.5 font-medium">{l.cliente}</td>
                  <td className="px-3 py-2.5 text-slate-600">{l.veiculo || '—'}</td>
                  {tipo === 'servico' && <td className="px-3 py-2.5">{colaborador(l.instaladorId)?.nome.split(' ')[0]}</td>}
                  <td className="px-3 py-2.5 text-slate-600">{colaborador(l.criadoPor)?.nome.split(' ')[0]}</td>
                  <td className="px-3 py-2.5"><SeloSituacao l={l} /></td>
                  <td className={`px-4 py-2.5 text-right tabular-nums ${l.situacao === 'cancelado' ? 'text-slate-400 line-through' : 'text-emerald-700'}`}>{dinheiro(totalLanc(l))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {lista.length === 0 ? <Vazio>Nada encontrado com esses filtros.</Vazio> : (
          <div className="flex justify-between border-t border-slate-200 px-4 py-3 text-sm">
            <span className="text-slate-500">{lista.length} {lista.length === 1 ? 'lançamento' : 'lançamentos'}</span>
            <span>Soma (sem cancelados): <b className="text-emerald-700 tabular-nums">{dinheiro(soma)}</b></span>
          </div>
        )}
      </Painel>
      {aberto && <Detalhe id={aberto} aoFechar={() => setAberto(null)} />}
    </>
  )
}

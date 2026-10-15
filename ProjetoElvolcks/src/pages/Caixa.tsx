import { useState } from 'react'
import { inputCls, Painel, Selo, Titulo, Vazio } from '../components/ui'
import { Detalhe } from '../components/Detalhe'
import { codigo, useStore } from '../store'
import { FORMAS } from '../types'
import { chaveDia, dinheiro, hora, NOME_TIPO, totalLanc } from '../util'

export function Caixa() {
  const { lancamentos, colaborador } = useStore()
  const hoje = chaveDia(new Date())
  const [dia, setDia] = useState(hoje)
  const [aberto, setAberto] = useState<number | null>(null)
  const doDia = lancamentos.filter((l) => l.tipo !== 'orcamento' && chaveDia(l.criadoEm) === dia)
  const validos = doDia.filter((l) => l.situacao !== 'cancelado')
  const total = validos.reduce((s, l) => s + totalLanc(l), 0)
  const porForma = FORMAS.map((f) => ({ f, v: validos.flatMap((l) => l.pagamentos).filter((p) => p.forma === f).reduce((s, p) => s + p.valor, 0) }))

  return (
    <>
      <Titulo acao={<input type="date" className={`${inputCls} w-auto!`} value={dia} max={hoje} onChange={(e) => setDia(e.target.value || hoje)} />}>
        Caixa
      </Titulo>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_2fr]">
        <Painel>
          <div className="p-5">
            <div className="text-xs font-semibold tracking-wide text-slate-500 uppercase">{dia === hoje ? 'Entrou hoje' : `Entrou em ${new Date(dia + 'T12:00').toLocaleDateString('pt-BR')}`}</div>
            <div className="mt-1 font-display text-5xl font-bold text-emerald-700 tabular-nums">{dinheiro(total)}</div>
            <div className="text-sm text-slate-500">{validos.length} entradas · zera à meia-noite</div>
          </div>
          <ul className="divide-y divide-slate-100 border-t border-slate-100">
            {porForma.map(({ f, v }) => (
              <li key={f} className="flex items-center gap-3 px-5 py-2.5 text-sm">
                <span className="flex-1">{f}</span>
                <span className="h-2 w-24 overflow-hidden rounded-full bg-slate-100">
                  <span className="block h-full rounded-full bg-blue-600" style={{ width: `${total ? (v / total) * 100 : 0}%` }} />
                </span>
                <span className="w-24 text-right text-emerald-700 tabular-nums">{dinheiro(v)}</span>
              </li>
            ))}
          </ul>
        </Painel>
        <Painel titulo="Entradas do dia">
          {doDia.length ? (
            <ul className="divide-y divide-slate-100">
              {doDia.map((l) => (
                <li key={l.id}>
                  <button onClick={() => setAberto(l.id)} className="flex w-full flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5 text-left text-sm hover:bg-slate-50">
                    <span className="w-12 text-slate-500 tabular-nums">{hora(l.criadoEm)}</span>
                    <span className="w-16 font-mono text-xs font-semibold text-blue-800">{codigo(l)}</span>
                    <span className="min-w-0 flex-1 truncate">{l.cliente} <span className="text-slate-500">· {NOME_TIPO[l.tipo]} · {colaborador(l.criadoPor)?.nome.split(' ')[0]}</span></span>
                    <span className="text-xs text-slate-500">{l.pagamentos.map((p) => p.forma + (p.parcelas ? ` ${p.parcelas}x` : '')).join(' + ')}</span>
                    {l.situacao === 'cancelado' && <Selo cor="vermelho">Cancelado</Selo>}
                    <span className={`w-24 text-right tabular-nums ${l.situacao === 'cancelado' ? 'text-slate-400 line-through' : 'text-emerald-700'}`}>{dinheiro(totalLanc(l))}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : <Vazio>Nenhuma entrada neste dia.</Vazio>}
        </Painel>
      </div>
      {aberto && <Detalhe id={aberto} aoFechar={() => setAberto(null)} />}
    </>
  )
}

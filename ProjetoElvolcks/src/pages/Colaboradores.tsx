import { useState } from 'react'
import { inputCls, Painel, Selo, Titulo } from '../components/ui'
import { useStore } from '../store'
import { chaveMes, comissao, dinheiro, nomeMes, totalLanc, ultimosMeses } from '../util'

const NOME_FUNCAO = { vende: 'Vende', instala: 'Instala', admin: 'Administrador' }

export function Colaboradores() {
  const { colaboradores, lancamentos } = useStore()
  const meses = ultimosMeses(3)
  const [mes, setMes] = useState(meses[0])
  const doMes = lancamentos.filter((l) => l.situacao !== 'cancelado' && chaveMes(l.criadoEm) === mes)

  return (
    <>
      <Titulo
        acao={
          <select className={`${inputCls} w-auto`} value={mes} onChange={(e) => setMes(e.target.value)}>
            {meses.map((m) => <option key={m} value={m}>{nomeMes(m)}</option>)}
          </select>
        }
      >
        Colaboradores
      </Titulo>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {colaboradores.map((c) => {
          const servicos = doMes.filter((l) => l.tipo === 'servico' && l.instaladorId === c.id)
          const vendas = doMes.filter((l) => l.tipo === 'venda' && l.criadoPor === c.id)
          const instala = c.funcoes.includes('instala')
          const vende = c.funcoes.includes('vende')
          return (
            <Painel key={c.id}>
              <div className="flex items-center gap-3 border-b border-slate-100 p-4">
                <div className="grid size-12 shrink-0 place-items-center rounded-full bg-blue-700 font-display text-lg font-bold text-white">
                  {c.nome.split(' ').map((p) => p[0]).slice(0, 2).join('')}
                </div>
                <div className="min-w-0">
                  <div className="font-display text-xl font-semibold tracking-wide">{c.nome}</div>
                  <div className="mt-0.5 flex flex-wrap gap-1">
                    {c.funcoes.map((f) => <Selo key={f} cor={f === 'admin' ? 'azul' : 'cinza'}>{NOME_FUNCAO[f]}</Selo>)}
                    {!c.temLogin && <Selo cor="ambar">Sem login</Selo>}
                  </div>
                </div>
              </div>
              <dl className="grid grid-cols-3 divide-x divide-slate-100 text-center">
                <Numero rotulo="Serviços" valor={instala ? String(servicos.length) : '—'} />
                <Numero rotulo="Comissão" valor={instala ? dinheiro(servicos.reduce((s, l) => s + comissao(l), 0)) : '—'} dinheiro={instala} />
                <Numero rotulo="Vendas" valor={vende ? dinheiro(vendas.reduce((s, l) => s + totalLanc(l), 0)) : '—'} dinheiro={vende} sub={vende ? `${vendas.length} vendas` : undefined} />
              </dl>
            </Painel>
          )
        })}
      </div>
      <p className="mt-4 text-sm text-slate-500">
        Serviços contam para o instalador escolhido no serviço. Comissão = % sobre a mão de obra. Vendas contam para quem lançou (sem comissão).
      </p>
    </>
  )
}

function Numero({ rotulo, valor, dinheiro, sub }: { rotulo: string; valor: string; dinheiro?: boolean; sub?: string }) {
  return (
    <div className="px-2 py-3">
      <dt className="text-xs font-semibold tracking-wide text-slate-500 uppercase">{rotulo}</dt>
      <dd className={`mt-1 font-display text-xl font-bold tabular-nums ${dinheiro ? 'text-emerald-700' : 'text-slate-900'}`}>{valor}</dd>
      {sub && <dd className="text-xs text-slate-500">{sub}</dd>}
    </div>
  )
}

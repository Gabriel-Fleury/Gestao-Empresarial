import { useState, type ReactNode } from 'react'
import { Cadeado, inputCls, Painel, Titulo } from '../components/ui'
import { useStore } from '../store'
import { chaveDia, chaveMes, dinheiro, entraNoCaixa, nomeMes, qtd, totalLanc, ultimosMeses } from '../util'

export function Relatorios() {
  const { lancamentos, produto, isAdmin, avisoAdmin } = useStore()
  const meses = ultimosMeses(3)
  const [mes, setMes] = useState(meses[0])
  const doMes = lancamentos.filter((l) => entraNoCaixa(l) && chaveMes(l.criadoEm) === mes)

  const pecas = new Map<number, { q: number; v: number }>()
  for (const l of doMes) for (const i of l.itens) {
    const a = pecas.get(i.produtoId) ?? { q: 0, v: 0 }
    pecas.set(i.produtoId, { q: a.q + i.quantidade, v: a.v + i.quantidade * i.preco })
  }
  // "Mais vendida" por unidades; peças vendidas por metro ficam de fora do ranking de unidades
  const ranking = [...pecas.entries()]
    .filter(([id]) => !produto(id)?.nome.includes('(metro)'))
    .sort((a, b) => b[1].q - a[1].q)
    .slice(0, 8)
  const maxQ = ranking[0]?.[1].q ?? 1

  const porDia = new Map<string, number>()
  for (const l of doMes) porDia.set(chaveDia(l.criadoEm), (porDia.get(chaveDia(l.criadoEm)) ?? 0) + totalLanc(l))
  const dias = [...porDia.entries()].sort()
  const melhor = dias.reduce<[string, number] | null>((m, d) => (!m || d[1] > m[1] ? d : m), null)
  const maxDia = melhor?.[1] ?? 1
  const faturamento = doMes.reduce((s, l) => s + totalLanc(l), 0)
  const servicos = doMes.filter((l) => l.tipo === 'servico').length
  const vendas = doMes.filter((l) => l.tipo === 'venda').length
  const fmtDia = (k: string) => new Date(k + 'T12:00').toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })
  const oculto = <button onClick={avisoAdmin} className="inline-flex items-center gap-1 text-slate-300">R$ •••• <Cadeado /></button>

  return (
    <>
      <Titulo acao={<select className={`${inputCls} w-auto!`} value={mes} onChange={(e) => setMes(e.target.value)}>{meses.map((m) => <option key={m} value={m}>{nomeMes(m)}</option>)}</select>}>
        Relatórios
      </Titulo>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi rotulo="Peça mais vendida" valor={ranking[0] ? produto(ranking[0][0])!.nome : '—'} sub={ranking[0] ? `${qtd(ranking[0][1].q)} unidades` : ''} texto />
        <Kpi rotulo="Dia com maior faturamento" valor={melhor ? fmtDia(melhor[0]) : '—'} sub={melhor ? (isAdmin ? dinheiro(melhor[1]) : oculto) : ''} texto />
        <Kpi rotulo="Serviços realizados" valor={String(servicos)} sub={`${vendas} vendas no mês`} />
        <Kpi rotulo="Faturamento do mês" valor={isAdmin ? dinheiro(faturamento) : oculto} sub={`${doMes.length} lançamentos`} dinheiro />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Painel titulo="Peças mais vendidas">
          <ol className="space-y-2.5 p-4">
            {ranking.map(([id, { q, v }], k) => (
              <li key={id} className="text-sm">
                <div className="mb-1 flex justify-between gap-3">
                  <span className="truncate"><span className="mr-1.5 font-semibold text-slate-400">{k + 1}.</span>{produto(id)?.nome}</span>
                  <span className="shrink-0 tabular-nums"><b>{qtd(q)}</b> <span className="text-slate-500">un.</span>{isAdmin && <span className="ml-2 text-emerald-700">{dinheiro(v)}</span>}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-600" style={{ width: `${(q / maxQ) * 100}%` }} /></div>
              </li>
            ))}
          </ol>
        </Painel>
        <Painel titulo="Faturamento por dia">
          {isAdmin ? (
            <div className="p-4">
              <div className="flex h-48 items-end gap-[3px]">
                {dias.map(([d, v]) => (
                  <div key={d} className="group relative flex-1" style={{ height: `${(v / maxDia) * 100}%` }}>
                    <div className={`h-full rounded-t ${d === melhor?.[0] ? 'bg-blue-800' : 'bg-blue-400/70 group-hover:bg-blue-600'}`} />
                    <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 rounded bg-slate-900 px-2 py-1 text-xs whitespace-nowrap text-white group-hover:block">
                      {fmtDia(d)} · {dinheiro(v)}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-1 flex justify-between text-xs text-slate-500">
                <span>{dias[0] && fmtDia(dias[0][0])}</span>
                <span>{dias.length > 1 && fmtDia(dias[dias.length - 1][0])}</span>
              </div>
              <p className="mt-3 text-xs text-slate-500">Barra escura = dia com maior faturamento. Passe o mouse para ver o valor.</p>
            </div>
          ) : (
            <button onClick={avisoAdmin} className="flex h-56 w-full flex-col items-center justify-center gap-2 text-slate-400">
              <Cadeado /> Apenas administradores
            </button>
          )}
        </Painel>
      </div>
    </>
  )
}

function Kpi({ rotulo, valor, sub, texto, dinheiro }: { rotulo: string; valor: ReactNode; sub: ReactNode; texto?: boolean; dinheiro?: boolean }) {
  return (
    <Painel className="p-4">
      <div className="text-xs font-semibold tracking-wide text-slate-500 uppercase">{rotulo}</div>
      <div className={`mt-2 font-display font-bold ${texto ? 'text-xl leading-tight' : 'text-3xl'} ${dinheiro ? 'text-emerald-700' : 'text-slate-900'} tabular-nums`}>{valor}</div>
      <div className="mt-1 text-sm text-slate-500">{sub}</div>
    </Painel>
  )
}

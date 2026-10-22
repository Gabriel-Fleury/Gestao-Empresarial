import { useMemo, useState } from 'react'
import { useStore } from '../store'
import { buscarProdutos, dinheiro, qtd } from '../util'
import { inputCls } from './ui'

/** Só consulta: mostra preço e quantidade em estoque das peças. Busca por código, nome ou marca. */
export function BuscaPecas() {
  const { produtos } = useStore()
  const [busca, setBusca] = useState('')

  const achados = useMemo(() => (busca.trim() ? buscarProdutos(produtos, busca) : []), [busca, produtos])

  return (
    <div className="relative mb-5">
      <svg className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-slate-400" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
        <circle cx="11" cy="11" r="7" />
        <path d="M20 20l-3.5-3.5" />
      </svg>
      <input
        type="search"
        className={`${inputCls} py-2.5 pl-10 text-base shadow-sm`}
        placeholder="Consultar peça por código, nome ou marca…"
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        onKeyDown={(e) => e.key === 'Escape' && setBusca('')}
        aria-label="Consultar peça"
      />
      {busca.trim() && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
          {achados.length ? (
            <ul className="max-h-80 divide-y divide-slate-100 overflow-y-auto">
              {achados.map((p) => (
                <li key={p.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                  {p.codigo && <span className="w-12 shrink-0 text-xs font-semibold text-slate-400 tabular-nums">#{p.codigo}</span>}
                  <span className="min-w-0 flex-1">{p.nome}{p.marca && <span className="text-slate-500"> · {p.marca}</span>}</span>
                  <span className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-semibold tabular-nums ${p.quantidade <= 0 ? 'bg-red-600 text-white' : p.quantidade <= 1 ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-700'}`}>
                    {qtd(p.quantidade)} em estoque
                  </span>
                  <span className="w-24 shrink-0 text-right font-semibold text-emerald-700 tabular-nums">{dinheiro(p.preco)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-4 py-3 text-sm text-slate-500">Nenhuma peça encontrada.</p>
          )}
        </div>
      )}
    </div>
  )
}

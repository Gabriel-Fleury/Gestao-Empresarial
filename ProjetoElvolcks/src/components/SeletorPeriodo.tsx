import { nomeMes, ultimosMeses } from '../util'
import { inputCls } from './ui'

/** Hoje, esta semana e os últimos meses (e, se pedir, todo o período). */
export function SeletorPeriodo({ valor, aoMudar, comTudo }: { valor: string; aoMudar: (p: string) => void; comTudo?: boolean }) {
  return (
    <select className={`${inputCls} w-auto!`} value={valor} onChange={(e) => aoMudar(e.target.value)} aria-label="Período">
      {comTudo && <option value="tudo">Todo o período</option>}
      <option value="hoje">Hoje</option>
      <option value="semana">Esta semana</option>
      <optgroup label="Por mês">
        {ultimosMeses(12).map((m) => <option key={m} value={m}>{nomeMes(m)}</option>)}
      </optgroup>
    </select>
  )
}

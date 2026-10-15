import { useEffect, useState, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { orcamentoVencido } from '../util'
import type { Lancamento } from '../types'

export function Logo({ size = 64 }: { size?: number }) {
  const [falhou, setFalhou] = useState(false)
  if (!falhou)
    return (
      <img
        src="/elvolcks-logo-circulo.png"
        alt="Elvolcks Auto Som"
        width={size}
        height={size}
        className="rounded-full"
        onError={() => setFalhou(true)}
      />
    )
  // Substituto enquanto o arquivo da logo não está em public/
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-label="Elvolcks Auto Som">
      <circle cx="50" cy="50" r="49" fill="#0b0b0b" stroke="#2a2a2a" strokeWidth="2" />
      <text x="50" y="52" textAnchor="middle" fontFamily="Barlow Condensed, sans-serif" fontWeight="700" fontSize="24" fill="#fff" fontStyle="italic">
        E<tspan fill="#dc2626">L</tspan>Volcks
      </text>
      <text x="50" y="68" textAnchor="middle" fontFamily="Barlow Condensed, sans-serif" fontWeight="600" fontSize="11" letterSpacing="2" fill="#cbd5e1">
        AUTO SOM
      </text>
    </svg>
  )
}

type Variante = 'primario' | 'secundario' | 'perigo' | 'fantasma'
const VARIANTES: Record<Variante, string> = {
  primario: 'bg-blue-700 text-white hover:bg-blue-800 shadow-sm',
  secundario: 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50',
  perigo: 'bg-white text-red-700 border border-red-300 hover:bg-red-50',
  fantasma: 'text-slate-600 hover:bg-slate-100',
}
export function Botao({ variante = 'primario', className = '', ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variante?: Variante }) {
  return (
    <button
      {...p}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed ${VARIANTES[variante]} ${className}`}
    />
  )
}

export function Painel({ titulo, acao, children, className = '' }: { titulo?: ReactNode; acao?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}>
      {titulo && (
        <header className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
          <h2 className="font-display text-lg font-semibold tracking-wide text-slate-800 uppercase">{titulo}</h2>
          {acao}
        </header>
      )}
      {children}
    </section>
  )
}

export function Titulo({ children, acao }: { children: ReactNode; acao?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <h1 className="font-display text-3xl font-bold tracking-wide text-slate-900 uppercase">{children}</h1>
      {acao}
    </div>
  )
}

const CORES_SELO = {
  azul: 'bg-blue-50 text-blue-800 ring-blue-200',
  verde: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  vermelho: 'bg-red-50 text-red-700 ring-red-200',
  cinza: 'bg-slate-100 text-slate-600 ring-slate-200',
  ambar: 'bg-amber-50 text-amber-800 ring-amber-200',
}
export function Selo({ cor = 'cinza', children }: { cor?: keyof typeof CORES_SELO; children: ReactNode }) {
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset whitespace-nowrap ${CORES_SELO[cor]}`}>{children}</span>
}

export function SeloSituacao({ l }: { l: Lancamento }) {
  if (l.situacao === 'cancelado') return <Selo cor="vermelho">Cancelado</Selo>
  if (l.situacao === 'convertido') return <Selo cor="azul">Convertido</Selo>
  if (orcamentoVencido(l)) return <Selo cor="cinza">Vencido</Selo>
  if (l.tipo === 'orcamento') return <Selo cor="ambar">Aberto</Selo>
  return <Selo cor="verde">Concluído</Selo>
}

export function Modal({ aberto, aoFechar, titulo, children, largura = 'max-w-2xl' }: { aberto: boolean; aoFechar: () => void; titulo: ReactNode; children: ReactNode; largura?: string }) {
  useEffect(() => {
    if (!aberto) return
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && aoFechar()
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [aberto, aoFechar])
  if (!aberto) return null
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-slate-900/50 p-0 sm:items-center sm:p-4 print:hidden" onMouseDown={aoFechar}>
      <div
        className={`flex max-h-[94vh] w-full ${largura} flex-col rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <h2 className="font-display text-xl font-semibold tracking-wide uppercase">{titulo}</h2>
          <button onClick={aoFechar} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100" aria-label="Fechar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </header>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  )
}

export function Campo({ rotulo, children, className = '' }: { rotulo: string; children: ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-xs font-semibold tracking-wide text-slate-500 uppercase">{rotulo}</span>
      {children}
    </label>
  )
}

export const inputCls =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100'

/** Limite de caracteres para nome do cliente e veículo. */
export const MAX_TEXTO = 30
/** Limite da descrição do serviço. */
export const MAX_DESCRICAO = 300

const fmtValor = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const lerValor = (s: string) => {
  const limpo = s.replace(/[^\d,.]/g, '')
  const n = limpo.includes(',') ? +limpo.replace(/\./g, '').replace(',', '.') : +limpo
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0
}

/** Campo de valor em reais: mostra 389,00 e aceita digitar com vírgula ou ponto. */
export function InputDinheiro({ valor, aoMudar, vazioSeZero, className = '', readOnly }: { valor: number; aoMudar?: (v: number) => void; vazioSeZero?: boolean; className?: string; readOnly?: boolean }) {
  const [texto, setTexto] = useState<string | null>(null)
  const exibido = texto ?? (vazioSeZero && !valor ? '' : fmtValor(valor))
  return (
    <input
      type="text"
      inputMode="decimal"
      className={`${inputCls} tabular-nums ${className}`}
      placeholder="0,00"
      readOnly={readOnly}
      value={exibido}
      onFocus={(e) => {
        if (readOnly) return
        setTexto(vazioSeZero && !valor ? '' : fmtValor(valor))
        e.target.select()
      }}
      onChange={(e) => {
        setTexto(e.target.value)
        aoMudar?.(lerValor(e.target.value))
      }}
      onBlur={() => setTexto(null)}
    />
  )
}

export function Cadeado() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 018 0v4" />
    </svg>
  )
}

export function Vazio({ children }: { children: ReactNode }) {
  return <p className="px-4 py-8 text-center text-sm text-slate-500">{children}</p>
}

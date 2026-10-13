import { useState, type ReactNode } from 'react'
import { NovoLancamento } from './components/NovoLancamento'
import { Cadeado, Logo } from './components/ui'
import { Caixa } from './pages/Caixa'
import { Colaboradores } from './pages/Colaboradores'
import { Estoque } from './pages/Estoque'
import { Inicio } from './pages/Inicio'
import { Lancamentos } from './pages/Lancamentos'
import { Relatorios } from './pages/Relatorios'
import { StoreProvider, useStore } from './store'
import type { TipoLanc } from './types'

export type Pagina = 'inicio' | 'vendas' | 'orcamentos' | 'servicos' | 'colaboradores' | 'estoque' | 'caixa' | 'relatorios'

const ICONES: Record<Pagina, ReactNode> = {
  inicio: <path d="M3 11l9-7 9 7v9a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1z" />,
  vendas: <path d="M6 7h12l-1 13H7L6 7zm3 0a3 3 0 016 0" />,
  orcamentos: <path d="M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h6" />,
  servicos: <path d="M14.7 6.3a4 4 0 00-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 005.4-5.4l-2.6 2.6-2.4-.6-.6-2.4z" />,
  colaboradores: <path d="M16 19v-1a4 4 0 00-4-4H7a4 4 0 00-4 4v1M9.5 10a3 3 0 100-6 3 3 0 000 6zM21 19v-1a4 4 0 00-3-3.9M16 4.1a3 3 0 010 5.8" />,
  estoque: <path d="M21 8l-9-5-9 5 9 5 9-5zM3 8v8l9 5 9-5V8M12 13v8" />,
  caixa: <path d="M3 7h18v12H3zM3 11h18M7 15h3" />,
  relatorios: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />,
}

const MENU: { id: Pagina; nome: string; admin?: boolean }[] = [
  { id: 'inicio', nome: 'Início' },
  { id: 'vendas', nome: 'Vendas' },
  { id: 'orcamentos', nome: 'Orçamentos' },
  { id: 'servicos', nome: 'Serviços realizados' },
  { id: 'colaboradores', nome: 'Colaboradores' },
  { id: 'estoque', nome: 'Estoque' },
  { id: 'caixa', nome: 'Caixa', admin: true },
  { id: 'relatorios', nome: 'Relatórios' },
]

function Shell() {
  const { usuario, isAdmin, avisoAdmin, colaboradores, setUsuarioId, toast } = useStore()
  const [pagina, setPagina] = useState<Pagina>('inicio')
  const [menuAberto, setMenuAberto] = useState(false)
  const [novo, setNovo] = useState<{ tipo: TipoLanc } | null>(null)

  const ir = (p: Pagina) => {
    if (MENU.find((m) => m.id === p)?.admin && !isAdmin) return avisoAdmin()
    setPagina(p)
    setMenuAberto(false)
    window.scrollTo(0, 0)
  }
  const comLogin = colaboradores.filter((c) => c.temLogin)

  return (
    <div className="min-h-screen lg:pl-64">
      <div className="print:hidden">
        <aside className={`fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-slate-950 text-slate-300 transition-transform lg:translate-x-0 ${menuAberto ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex items-center gap-3 px-5 py-5">
            <Logo size={52} />
            <div>
              <div className="font-display text-xl leading-none font-bold tracking-wide text-white">ELVOLCKS</div>
              <div className="text-xs tracking-[0.2em] text-slate-400">AUTO SOM</div>
            </div>
          </div>
          <nav className="flex-1 space-y-0.5 overflow-y-auto px-3">
            {MENU.map((m) => (
              <button
                key={m.id}
                onClick={() => ir(m.id)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[15px] font-medium transition ${pagina === m.id ? 'bg-blue-700 text-white' : 'hover:bg-white/5 hover:text-white'}`}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  {ICONES[m.id]}
                </svg>
                <span className="flex-1">{m.nome}</span>
                {m.admin && !isAdmin && <Cadeado />}
              </button>
            ))}
          </nav>
          <div className="border-t border-white/10 p-4">
            <label className="mb-1 block text-[11px] font-semibold tracking-wider text-slate-500 uppercase">Testar como (protótipo)</label>
            <select value={usuario.id} onChange={(e) => { setUsuarioId(+e.target.value); if (pagina === 'caixa') setPagina('inicio') }} className="w-full rounded-lg border border-white/10 bg-slate-900 px-2 py-2 text-sm text-white">
              {comLogin.map((c) => (
                <option key={c.id} value={c.id}>{c.nome} — {c.funcoes.includes('admin') ? 'Administrador' : 'Funcionário'}</option>
              ))}
            </select>
          </div>
        </aside>
        {menuAberto && <div className="fixed inset-0 z-20 bg-slate-900/50 lg:hidden" onClick={() => setMenuAberto(false)} />}

        <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-slate-200 bg-white/90 px-4 py-2.5 backdrop-blur lg:hidden">
          <button onClick={() => setMenuAberto(true)} className="rounded-lg p-2 hover:bg-slate-100" aria-label="Abrir menu">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <span className="font-display text-xl font-bold tracking-wide">ELVOLCKS</span>
          <span className="ml-auto text-sm text-slate-500">{usuario.nome.split(' ')[0]}</span>
        </header>

        <div className="hidden items-center justify-end gap-3 px-8 pt-5 text-sm text-slate-500 lg:flex">
          Conectado como <b className="text-slate-800">{usuario.nome}</b>
          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${isAdmin ? 'bg-blue-100 text-blue-800' : 'bg-slate-200 text-slate-700'}`}>{isAdmin ? 'Administrador' : 'Funcionário'}</span>
        </div>

        <main className="mx-auto max-w-7xl px-4 py-5 sm:px-8">
          {pagina === 'inicio' && <Inicio novoLancamento={() => setNovo({ tipo: 'venda' })} ir={ir} />}
          {pagina === 'vendas' && <Lancamentos key="v" tipo="venda" novoLancamento={(tipo) => setNovo({ tipo })} />}
          {pagina === 'orcamentos' && <Lancamentos key="o" tipo="orcamento" novoLancamento={(tipo) => setNovo({ tipo })} />}
          {pagina === 'servicos' && <Lancamentos key="s" tipo="servico" novoLancamento={(tipo) => setNovo({ tipo })} />}
          {pagina === 'colaboradores' && <Colaboradores />}
          {pagina === 'estoque' && <Estoque />}
          {pagina === 'caixa' && isAdmin && <Caixa />}
          {pagina === 'relatorios' && <Relatorios />}
          <p className="mt-10 text-center text-xs text-slate-400">Protótipo com dados fictícios · nada é salvo ao recarregar a página</p>
        </main>
      </div>

      {novo && <NovoLancamento tipoInicial={novo.tipo} aoFechar={() => setNovo(null)} />}

      {toast && (
        <div role="status" className={`fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-xl px-4 py-3 text-sm font-semibold shadow-xl print:hidden ${toast.tipo === 'erro' ? 'bg-red-600 text-white' : 'bg-slate-900 text-white'}`}>
          {toast.tipo === 'erro' && '🔒 '}{toast.texto}
        </div>
      )}
    </div>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  )
}

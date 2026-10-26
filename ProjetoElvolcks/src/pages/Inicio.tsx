import { useState } from 'react'
import { BuscaPecas } from '../components/BuscaPecas'
import { Detalhe } from '../components/Detalhe'
import { Cadeado, Painel, Selo, SeloSituacao, Titulo, Vazio } from '../components/ui'
import { codigo, useStore } from '../store'
import { chaveDia, dinheiro, ehHoje, entraNoCaixa, hora, NOME_TIPO, qtd, recebidoNoDia, totalLanc } from '../util'
import type { Pagina } from '../App'

export function Inicio({ novoLancamento, ir }: { novoLancamento: () => void; ir: (p: Pagina) => void }) {
  const { lancamentos, produtos, isAdmin, avisoAdmin, usuario, colaborador } = useStore()
  const [aberto, setAberto] = useState<string | null>(null)
  const deHoje = lancamentos.filter((l) => ehHoje(l.criadoEm))
  // À vista lançado hoje + a prazo pago hoje
  const caixaHoje = lancamentos.flatMap((l) => recebidoNoDia(l, chaveDia(new Date()))).reduce((s, p) => s + p.valor, 0)
  const servicosHoje = deHoje.filter((l) => l.tipo === 'servico' && l.situacao !== 'cancelado').length
  const orcHoje = deHoje.filter((l) => l.tipo === 'orcamento').length
  const baixo = produtos.filter((p) => p.quantidade <= 1).sort((a, b) => a.quantidade - b.quantidade)

  const saudacao = new Date().getHours() < 12 ? 'Bom dia' : new Date().getHours() < 18 ? 'Boa tarde' : 'Boa noite'
  const hoje = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <>
      <Titulo>
        {saudacao}, {usuario.nome.split(' ')[0]}
        <span className="mt-1 block font-sans text-sm font-normal tracking-normal text-slate-500 normal-case">{hoje}</span>
      </Titulo>

      <BuscaPecas />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <button onClick={novoLancamento} className="group flex flex-col justify-between rounded-xl bg-blue-700 p-4 text-left text-white shadow-sm transition duration-200 ease-out hover:-translate-y-0.5 hover:bg-blue-900 hover:shadow-lg active:translate-y-0 active:shadow-sm">
          <span className="grid size-10 place-items-center rounded-full bg-white/15 text-2xl leading-none transition duration-200 group-hover:scale-110 group-hover:rotate-90 group-hover:bg-white/25">+</span>
          <span className="mt-4 font-display text-xl font-semibold tracking-wide uppercase">Novo lançamento</span>
          <span className="text-sm text-blue-100">Orçamento, venda ou serviço</span>
        </button>
        <button onClick={isAdmin ? () => ir('caixa') : avisoAdmin} className="rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-blue-300">
          <span className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-slate-500 uppercase">Entrou no caixa hoje {!isAdmin && <Cadeado />}</span>
          <span className={`mt-3 block font-display text-3xl font-bold tabular-nums ${isAdmin ? 'text-emerald-700' : 'text-slate-300'}`}>
            {isAdmin ? dinheiro(caixaHoje) : 'R$ ••••••'}
          </span>
          <span className="text-sm text-slate-500">{isAdmin ? `${deHoje.filter(entraNoCaixa).length} entradas` : 'Só administradores'}</span>
        </button>
        <Indicador rotulo="Serviços realizados hoje" valor={servicosHoje} onClick={() => ir('servicos')} />
        <Indicador rotulo="Orçamentos hoje" valor={orcHoje} onClick={() => ir('orcamentos')} />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[1fr_1.6fr]">
        <Painel titulo={<span className="flex items-center gap-2">Estoque baixo <Selo cor="vermelho">{baixo.length}</Selo></span>} acao={<button onClick={() => ir('estoque')} className="group inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-50 hover:text-blue-900">Ver estoque <span className="transition-transform group-hover:translate-x-0.5">→</span></button>}>
          {baixo.length ? (
            <ul className="divide-y divide-slate-100">
              {baixo.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                  <span>{p.nome}</span>
                  <span className={`shrink-0 rounded-md px-2 py-0.5 font-semibold tabular-nums ${p.quantidade < 0 ? 'bg-red-600 text-white' : 'bg-red-50 text-red-700'}`}>{qtd(p.quantidade)}</span>
                </li>
              ))}
            </ul>
          ) : <Vazio>Nenhuma peça com estoque baixo.</Vazio>}
        </Painel>

        <Painel titulo="Últimos lançamentos">
          <ul className="divide-y divide-slate-100">
            {lancamentos.slice(0, 9).map((l) => (
              <li key={l.id}>
                <button onClick={() => setAberto(l.id)} className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-slate-50">
                  <span className={`w-16 shrink-0 font-mono text-xs font-semibold ${l.tipo === 'venda' ? 'text-blue-700' : l.tipo === 'servico' ? 'text-indigo-700' : 'text-amber-700'}`}>{codigo(l)}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{l.cliente}</span>
                    <span className="block truncate text-xs text-slate-500">
                      {NOME_TIPO[l.tipo]} · {ehHoje(l.criadoEm) ? `hoje ${hora(l.criadoEm)}` : new Date(l.criadoEm).toLocaleDateString('pt-BR')} · {colaborador(l.criadoPor)?.nome.split(' ')[0]}
                    </span>
                  </span>
                  <span className="hidden sm:block"><SeloSituacao l={l} /></span>
                  <span className={`w-24 shrink-0 text-right tabular-nums ${l.situacao === 'cancelado' ? 'text-slate-400 line-through' : 'text-emerald-700'}`}>{dinheiro(totalLanc(l))}</span>
                </button>
              </li>
            ))}
          </ul>
        </Painel>
      </div>
      {aberto && <Detalhe id={aberto} aoFechar={() => setAberto(null)} />}
    </>
  )
}

function Indicador({ rotulo, valor, onClick }: { rotulo: string; valor: number; onClick: () => void }) {
  return (
    <button onClick={onClick} className="group rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-blue-300">
      <span className="text-xs font-semibold tracking-wide text-slate-500 uppercase">{rotulo}</span>
      <span className="mt-3 block font-display text-4xl font-bold text-slate-900 tabular-nums">{valor}</span>
      <span className="-mx-1.5 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-sm font-semibold text-blue-700 transition group-hover:bg-blue-50 group-hover:text-blue-900">
        Ver lista <span className="transition-transform group-hover:translate-x-0.5">→</span>
      </span>
    </button>
  )
}

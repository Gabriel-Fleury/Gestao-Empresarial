import { useState } from 'react'
import { Botao, Campo, inputCls, Modal, Painel, Selo, Titulo } from '../components/ui'
import { useStore, type DadosPessoa } from '../store'
import { HistoricoColaborador } from './HistoricoColaborador'
import type { Colaborador, Funcao } from '../types'
import { SeletorPeriodo } from '../components/SeletorPeriodo'
import { chaveMes, comissao, dinheiro, noPeriodo, totalLanc } from '../util'

const NOME_FUNCAO = { vende: 'Vende', instala: 'Instala', admin: 'Administrador' }

export function Colaboradores() {
  const { colaboradores, lancamentos, isAdmin, usuario, alternarAtivo } = useStore()
  const [editando, setEditando] = useState<Colaborador | 'nova' | null>(null)
  const [vendo, setVendo] = useState<number | null>(null)
  const [periodo, setPeriodo] = useState(() => chaveMes(new Date()))
  const doMes = lancamentos.filter((l) => l.situacao !== 'cancelado' && noPeriodo(l.criadoEm, periodo))

  const abrir = (id: number | null) => {
    setVendo(id)
    window.scrollTo(0, 0)
  }
  if (vendo !== null) return <HistoricoColaborador id={vendo} periodoInicial={periodo} aoVoltar={() => abrir(null)} />

  return (
    <>
      <Titulo
        acao={
          <div className="flex items-center gap-2">
            <SeletorPeriodo valor={periodo} aoMudar={setPeriodo} />
            {isAdmin && <Botao className="shrink-0" onClick={() => setEditando('nova')}>+ Nova pessoa</Botao>}
          </div>
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
            <Painel key={c.id} className={`group/card transition hover:border-blue-300 hover:shadow-md ${c.ativo ? '' : 'opacity-60'}`}>
              <button onClick={() => abrir(c.id)} className="block w-full rounded-t-xl text-left" title={`Ver histórico de ${c.nome.split(' ')[0]}`}>
              <div className="flex items-center gap-3 border-b border-slate-100 p-4">
                <div className="grid size-12 shrink-0 place-items-center rounded-full bg-blue-700 font-display text-lg font-bold text-white">
                  {c.nome.split(' ').map((p) => p[0]).slice(0, 2).join('')}
                </div>
                <div className="min-w-0">
                  <div className="font-display text-xl font-semibold tracking-wide">{c.nome}</div>
                  <div className="mt-0.5 flex flex-wrap gap-1">
                    {c.funcoes.map((f) => <Selo key={f} cor={f === 'admin' ? 'azul' : 'cinza'}>{NOME_FUNCAO[f]}</Selo>)}
                    {!c.temLogin && <Selo cor="ambar">Sem login</Selo>}
                    {!c.ativo && <Selo cor="vermelho">Inativo</Selo>}
                  </div>
                  {isAdmin && c.usuario && <div className="mt-1 text-xs text-slate-500">Usuário: <b>{c.usuario}</b></div>}
                </div>
                <span className="ml-auto self-start text-sm font-semibold whitespace-nowrap text-blue-700 opacity-0 transition group-hover/card:opacity-100">Histórico →</span>
              </div>
              <dl className="grid grid-cols-3 divide-x divide-slate-100 text-center">
                <Numero rotulo="Serviços" valor={instala ? String(servicos.length) : '—'} />
                <Numero rotulo="Comissão" valor={instala ? dinheiro(servicos.reduce((s, l) => s + comissao(l), 0)) : '—'} dinheiro={instala} />
                <Numero rotulo="Vendas" valor={vende ? dinheiro(vendas.reduce((s, l) => s + totalLanc(l), 0)) : '—'} dinheiro={vende} sub={vende ? `${vendas.length} ${vendas.length === 1 ? "venda" : "vendas"}` : undefined} />
              </dl>
              </button>
              {isAdmin && (
                <div className="flex justify-end gap-2 border-t border-slate-100 px-4 py-2.5">
                  <Botao variante="fantasma" className="px-2.5 py-1.5" onClick={() => setEditando(c)}>Editar{c.temLogin ? ' / senha' : ''}</Botao>
                  {c.id !== usuario.id && (
                    <Botao variante={c.ativo ? 'perigo' : 'secundario'} className="px-2.5 py-1.5" onClick={() => alternarAtivo(c.id)}>{c.ativo ? 'Desativar' : 'Reativar'}</Botao>
                  )}
                </div>
              )}
            </Painel>
          )
        })}
      </div>
      <p className="mt-4 text-sm text-slate-500">
        Serviços contam para o instalador escolhido no serviço. Comissão = % sobre a mão de obra. Vendas contam para quem lançou (sem comissão). Clique num colaborador para ver o histórico.
      </p>
      {editando && <FormPessoa pessoa={editando === 'nova' ? null : editando} aoFechar={() => setEditando(null)} />}
    </>
  )
}

const FUNCOES: Funcao[] = ['admin', 'vende', 'instala']

function FormPessoa({ pessoa, aoFechar }: { pessoa: Colaborador | null; aoFechar: () => void }) {
  const { salvarPessoa } = useStore()
  const [d, setD] = useState<DadosPessoa>({ nome: pessoa?.nome ?? '', funcoes: pessoa?.funcoes ?? ['vende'], usuario: pessoa?.usuario ?? '', senha: '' })
  const [comAcesso, setComAcesso] = useState(pessoa ? !!pessoa.usuario : true)
  const [erro, setErro] = useState('')
  const jaTinhaAcesso = !!pessoa?.usuario

  const salvar = () => {
    if (comAcesso && !d.usuario.trim()) return setErro('Informe o usuário para entrar no sistema.')
    const falha = salvarPessoa(pessoa?.id ?? null, comAcesso ? d : { ...d, usuario: '', senha: '' })
    if (falha) return setErro(falha)
    aoFechar()
  }
  const marcar = (f: Funcao) => setD({ ...d, funcoes: d.funcoes.includes(f) ? d.funcoes.filter((x) => x !== f) : [...d.funcoes, f] })

  return (
    <Modal aberto aoFechar={aoFechar} titulo={pessoa ? `Editar ${pessoa.nome.split(' ')[0]}` : 'Nova pessoa'} largura="max-w-md">
      <div className="space-y-4 text-sm">
        <Campo rotulo="Nome">
          <input className={inputCls} maxLength={60} value={d.nome} onChange={(e) => setD({ ...d, nome: e.target.value })} placeholder="Nome e sobrenome" autoFocus />
        </Campo>
        <div>
          <span className="mb-1 block text-xs font-semibold tracking-wide text-slate-500 uppercase">Funções</span>
          <div className="flex flex-wrap gap-4">
            {FUNCOES.map((f) => (
              <label key={f} className="flex items-center gap-2">
                <input type="checkbox" className="size-4 accent-blue-700" checked={d.funcoes.includes(f)} onChange={() => marcar(f)} />
                {NOME_FUNCAO[f]}
              </label>
            ))}
          </div>
          <p className="mt-1 text-xs text-slate-500">Administrador vê o caixa, cancela/edita lançamentos e gerencia as contas.</p>
        </div>

        <div className="rounded-xl border border-slate-200 p-3">
          <label className="flex items-center gap-2 font-semibold">
            <input type="checkbox" className="size-4 accent-blue-700" checked={comAcesso} onChange={(e) => setComAcesso(e.target.checked)} />
            Pode entrar no sistema
          </label>
          {comAcesso && (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Campo rotulo="Usuário">
                <input className={inputCls} maxLength={20} autoCapitalize="none" spellCheck={false} value={d.usuario} onChange={(e) => setD({ ...d, usuario: e.target.value.toLowerCase() })} placeholder="Ex.: joao" />
              </Campo>
              <Campo rotulo={jaTinhaAcesso ? 'Nova senha' : 'Senha'}>
                <input className={inputCls} type="text" autoComplete="new-password" value={d.senha} onChange={(e) => setD({ ...d, senha: e.target.value })} placeholder={jaTinhaAcesso ? 'Deixe vazio para manter' : 'Mín. 4 caracteres'} />
              </Campo>
            </div>
          )}
          {!comAcesso && <p className="mt-1 text-xs text-slate-500">Ex.: instalador que só aparece nos serviços, sem entrar no sistema.</p>}
        </div>

        {erro && <p className="rounded-lg bg-red-50 px-3 py-2 text-red-700">{erro}</p>}
        <div className="flex justify-end gap-2">
          <Botao variante="secundario" onClick={aoFechar}>Cancelar</Botao>
          <Botao onClick={salvar}>{pessoa ? 'Salvar' : 'Cadastrar'}</Botao>
        </div>
      </div>
    </Modal>
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

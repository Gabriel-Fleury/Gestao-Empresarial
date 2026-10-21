import { useState } from 'react'
import { Botao, Campo, inputCls, MAX_TEXTO, Modal, Painel, Titulo, Vazio } from '../components/ui'
import { useStore } from '../store'
import type { Cliente } from '../types'
import { dataCurta, formatarTelefone, normalizar } from '../util'

export function Clientes() {
  const { clientes, lancamentos } = useStore()
  const [busca, setBusca] = useState('')
  const [editando, setEditando] = useState<Cliente | 'novo' | null>(null)

  const b = normalizar(busca)
  const digitos = busca.replace(/\D/g, '')
  const lista = clientes
    .filter((c) => !b || normalizar(c.nome).includes(b) || (digitos && c.telefone.replace(/\D/g, '').includes(digitos)))
    .sort((x, y) => x.nome.localeCompare(y.nome))

  // Lançamentos do cliente: pelo telefone, ou pelo nome quando o lançamento não tem telefone
  const doCliente = (c: Cliente) =>
    lancamentos.filter((l) => (l.telefone ? l.telefone === c.telefone : normalizar(l.cliente) === normalizar(c.nome)))

  return (
    <>
      <Titulo acao={<Botao onClick={() => setEditando('novo')}>+ Novo cliente</Botao>}>Clientes</Titulo>
      <div className="mb-3">
        <input className={`${inputCls} max-w-xs`} placeholder="Buscar por nome ou telefone…" value={busca} onChange={(e) => setBusca(e.target.value)} />
      </div>
      <Painel>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs tracking-wide text-slate-500 uppercase">
              <tr><th className="px-4 py-2.5">Nome</th><th className="px-3 py-2.5">Telefone</th><th className="px-3 py-2.5 text-right">Lançamentos</th><th className="px-3 py-2.5">Último</th><th className="px-4 py-2.5 text-right">Ações</th></tr>
            </thead>
            <tbody>
              {lista.map((c) => {
                const ls = doCliente(c)
                return (
                  <tr key={c.id} className="border-b border-slate-100">
                    <td className="px-4 py-2.5 font-medium">{c.nome}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap tabular-nums">{c.telefone}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{ls.length}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-slate-600">{ls[0] ? dataCurta(ls[0].criadoEm) : '—'}</td>
                    <td className="px-4 py-2 text-right">
                      <button onClick={() => setEditando(c)} className="rounded-md px-2 py-1 text-sm font-semibold text-blue-700 hover:bg-blue-50">Editar</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {lista.length === 0 && <Vazio>{clientes.length ? 'Nenhum cliente encontrado.' : 'Nenhum cliente cadastrado ainda.'}</Vazio>}
        <p className="border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
          Cadastrar o cliente é opcional: no lançamento, comece a digitar o nome e escolha na lista para preencher o telefone.
        </p>
      </Painel>
      {editando && <FormCliente cliente={editando === 'novo' ? undefined : editando} aoFechar={() => setEditando(null)} />}
    </>
  )
}

function FormCliente({ cliente, aoFechar }: { cliente?: Cliente; aoFechar: () => void }) {
  const { salvarCliente } = useStore()
  const [nome, setNome] = useState(cliente?.nome ?? '')
  const [telefone, setTelefone] = useState(cliente?.telefone ?? '')
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)
  const salvar = async () => {
    setSalvando(true)
    const e = await salvarCliente(cliente?.id ?? null, { nome, telefone })
    setSalvando(false)
    if (e) return setErro(e)
    aoFechar()
  }
  return (
    <Modal aberto aoFechar={aoFechar} titulo={cliente ? 'Editar cliente' : 'Novo cliente'} largura="max-w-md">
      <div className="space-y-3">
        <Campo rotulo="Nome *">
          <input autoFocus className={inputCls} maxLength={MAX_TEXTO} value={nome} onChange={(e) => { setNome(e.target.value); setErro('') }} placeholder="Nome do cliente" />
        </Campo>
        <Campo rotulo="Telefone *">
          <input type="tel" inputMode="numeric" className={inputCls} value={telefone} onChange={(e) => { setTelefone(formatarTelefone(e.target.value)); setErro('') }} placeholder="(66) 99999-9999" />
        </Campo>
        {erro && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</p>}
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Botao variante="secundario" onClick={aoFechar}>Cancelar</Botao>
        <Botao onClick={salvar} disabled={salvando}>{salvando ? 'Salvando…' : cliente ? 'Salvar' : 'Cadastrar'}</Botao>
      </div>
    </Modal>
  )
}

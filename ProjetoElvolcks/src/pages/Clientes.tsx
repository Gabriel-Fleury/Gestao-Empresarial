import { useState } from 'react'
import { Botao, Campo, inputCls, MAX_TEXTO, Modal, Painel, Titulo, Vazio } from '../components/ui'
import { useStore } from '../store'
import type { Cliente } from '../types'
import { dataCurta, formatarCep, formatarCpfCnpj, formatarTelefone, normalizar } from '../util'

export function Clientes() {
  const { clientes, lancamentos } = useStore()
  const [busca, setBusca] = useState('')
  const [editando, setEditando] = useState<Cliente | 'novo' | null>(null)

  const b = normalizar(busca)
  const digitos = busca.replace(/\D/g, '')
  const lista = clientes
    .filter((c) => !b || normalizar(c.nome).includes(b) || (digitos && (c.telefone.replace(/\D/g, '').includes(digitos) || c.cpfCnpj?.replace(/\D/g, '').includes(digitos))))
    .sort((x, y) => x.nome.localeCompare(y.nome))

  // Lançamentos do cliente: pelo telefone, ou pelo nome quando o lançamento não tem telefone
  const doCliente = (c: Cliente) =>
    lancamentos.filter((l) => (l.telefone ? l.telefone === c.telefone : normalizar(l.cliente) === normalizar(c.nome)))

  return (
    <>
      <Titulo acao={<Botao onClick={() => setEditando('novo')}>+ Novo cliente</Botao>}>Clientes</Titulo>
      <div className="mb-3">
        <input className={`${inputCls} max-w-xs`} placeholder="Buscar por nome, telefone ou CPF/CNPJ…" value={busca} onChange={(e) => setBusca(e.target.value)} />
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
                    <td className="px-4 py-2.5">
                      <div className="font-medium">{c.nome}</div>
                      {(c.cpfCnpj || c.email) && <div className="text-xs text-slate-500">{[c.cpfCnpj, c.email].filter(Boolean).join(' · ')}</div>}
                    </td>
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
  const [cpfCnpj, setCpfCnpj] = useState(cliente?.cpfCnpj ?? '')
  const [cep, setCep] = useState(cliente?.cep ?? '')
  const [endereco, setEndereco] = useState(cliente?.endereco ?? '')
  const [email, setEmail] = useState(cliente?.email ?? '')
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)

  // Com o CEP completo e o endereço vazio, busca rua/bairro/cidade no ViaCEP
  const mudarCep = async (valor: string) => {
    const f = formatarCep(valor)
    setCep(f)
    setErro('')
    if (f.length !== 9 || endereco.trim()) return
    try {
      const r = await fetch(`https://viacep.com.br/ws/${f.replace('-', '')}/json/`)
      const j = await r.json()
      if (j.erro) return
      setEndereco([j.logradouro, j.bairro, j.localidade && `${j.localidade}/${j.uf}`].filter(Boolean).join(', '))
    } catch {
      // Sem internet ou serviço fora: preenche à mão
    }
  }

  const salvar = async () => {
    setSalvando(true)
    const e = await salvarCliente(cliente?.id ?? null, { nome, telefone, cpfCnpj, cep, endereco, email })
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
        <Campo rotulo="CPF/CNPJ">
          <input inputMode="numeric" className={inputCls} value={cpfCnpj} onChange={(e) => { setCpfCnpj(formatarCpfCnpj(e.target.value)); setErro('') }} placeholder="000.000.000-00" />
        </Campo>
        <Campo rotulo="E-mail">
          <input type="email" className={inputCls} maxLength={MAX_TEXTO} value={email} onChange={(e) => { setEmail(e.target.value); setErro('') }} placeholder="cliente@email.com" />
        </Campo>
        <Campo rotulo="CEP">
          <input inputMode="numeric" className={`${inputCls} max-w-[10rem]`} value={cep} onChange={(e) => mudarCep(e.target.value)} placeholder="78000-000" />
        </Campo>
        <Campo rotulo="Endereço">
          <input className={inputCls} maxLength={MAX_TEXTO} value={endereco} onChange={(e) => { setEndereco(e.target.value); setErro('') }} placeholder="Rua, número, bairro, cidade/UF" />
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

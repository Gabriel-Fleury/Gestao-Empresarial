import { useMemo, useState } from 'react'
import { codigo, useStore } from '../store'
import { FORMAS, type Forma, type Item, type Lancamento, type TipoLanc } from '../types'
import { chaveDia, dinheiro, NOME_TIPO, qtd, totalLanc } from '../util'
import { Botao, Campo, InputDinheiro, inputCls, MAX_DESCRICAO, MAX_TEXTO, Modal } from './ui'

const LIMITE_PARCELAS = 12 // limite ainda a definir com o dono

interface Pag {
  forma: Forma
  valor: number
  parcelas: number
}

export function NovoLancamento({ aoFechar, tipoInicial = 'venda', origem }: { aoFechar: () => void; tipoInicial?: TipoLanc; origem?: Lancamento }) {
  const [tipo, setTipo] = useState<TipoLanc>(origem ? 'servico' : tipoInicial)
  const tipos: TipoLanc[] = origem ? ['venda', 'servico'] : ['orcamento', 'venda', 'servico']

  return (
    <Modal aberto aoFechar={aoFechar} titulo={origem ? `Converter orçamento ${codigo(origem)}` : 'Novo lançamento'} largura="max-w-3xl">
      <div className="space-y-5">
        <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1" role="tablist">
          {tipos.map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tipo === t}
              onClick={() => setTipo(t)}
              className={`rounded-lg px-2 py-2 text-sm font-semibold transition ${tipo === t ? 'bg-white text-blue-800 shadow' : 'text-slate-600 hover:text-slate-900'}`}
            >
              {NOME_TIPO[t]}
            </button>
          ))}
        </div>
        <p className="-mt-2 text-xs text-slate-500">
          {tipo === 'orcamento' && 'Não mexe no estoque nem no caixa. Validade de 7 dias, sem reserva de peças.'}
          {tipo === 'venda' && 'Só peças. Baixa o estoque e lança no caixa na hora.'}
          {tipo === 'servico' && 'Peças + mão de obra. Baixa o estoque e lança no caixa ao salvar.'}
        </p>
        {/* Cada aba tem o seu próprio formulário: o que se digita numa não aparece nas outras */}
        {tipos.map((t) => (
          <div key={t} hidden={t !== tipo}>
            <Formulario tipo={t} origem={origem} aoFechar={aoFechar} />
          </div>
        ))}
      </div>
    </Modal>
  )
}

function Formulario({ tipo, origem, aoFechar }: { tipo: TipoLanc; origem?: Lancamento; aoFechar: () => void }) {
  const { produtos, colaboradores, lancar, avisar, produto } = useStore()
  const [cliente, setCliente] = useState(origem?.cliente ?? '')
  const [veiculo, setVeiculo] = useState(origem?.veiculo ?? '')
  const [data, setData] = useState(() => chaveDia(new Date()))
  const [descricao, setDescricao] = useState(origem?.descricao ?? '')
  const [itens, setItens] = useState<Item[]>(origem?.itens.map((i) => ({ ...i })) ?? [])
  const [maoDeObra, setMaoDeObra] = useState(origem?.maoDeObra ?? 0)
  const instaladores = colaboradores.filter((c) => c.ativo && c.funcoes.includes('instala'))
  const [instaladorId, setInstaladorId] = useState<number | ''>('')
  const [comissaoPct, setComissaoPct] = useState(50)
  const [desconto, setDesconto] = useState(origem?.desconto ?? 0)
  const [pags, setPags] = useState<Pag[]>([{ forma: 'PIX', valor: 0, parcelas: 2 }])
  const [nfEmitida, setNfEmitida] = useState(false)
  const [nfNumero, setNfNumero] = useState('')
  const [busca, setBusca] = useState('')
  const [erro, setErro] = useState('')

  const mao = tipo === 'venda' ? 0 : maoDeObra
  const total = totalLanc({ itens, maoDeObra: mao, desconto })
  const pecas = itens.reduce((s, i) => s + i.quantidade * i.preco, 0)
  // Com uma forma, ela recebe o total; com duas, a segunda recebe o que faltar
  const pagamentos = pags.length === 1 ? [{ ...pags[0], valor: total }] : [pags[0], { ...pags[1], valor: +(total - pags[0].valor).toFixed(2) }]

  const sugestoes = useMemo(() => {
    const b = busca.trim().toLowerCase()
    if (!b) return []
    return produtos.filter((p) => p.nome.toLowerCase().includes(b)).slice(0, 6)
  }, [busca, produtos])

  const addItem = (id: number) => {
    const p = produto(id)!
    setItens((is) => (is.some((i) => i.produtoId === id) ? is.map((i) => (i.produtoId === id ? { ...i, quantidade: i.quantidade + 1 } : i)) : [...is, { produtoId: id, quantidade: 1, preco: p.preco }]))
    setBusca('')
  }
  const mudarItem = (id: number, campo: 'quantidade' | 'preco', v: number) => setItens((is) => is.map((i) => (i.produtoId === id ? { ...i, [campo]: v } : i)))

  const salvar = () => {
    if (!cliente.trim()) return setErro('Informe o nome do cliente.')
    if (!itens.length && !mao) return setErro('Adicione pelo menos uma peça ou a mão de obra.')
    if (tipo === 'servico' && !instaladorId) return setErro('Escolha o instalador.')
    if (desconto > pecas + mao) return setErro('O desconto é maior que o total.')
    if (tipo !== 'orcamento' && pagamentos.some((p) => p.valor <= 0)) return setErro('Confira os valores do pagamento.')
    const hoje = chaveDia(new Date())
    if (!data || data > hoje) return setErro('A data não pode ser depois de hoje.')
    // Dia escolhido no formulário com a hora de agora (lançar no dia seguinte o serviço feito ontem)
    const agora = new Date()
    const [a, m, d] = data.split('-').map(Number)
    const criadoEm = new Date(a, m - 1, d, agora.getHours(), agora.getMinutes(), agora.getSeconds()).toISOString()
    const novo = lancar({
      criadoEm,
      tipo,
      cliente: cliente.trim(),
      veiculo: veiculo.trim(),
      descricao: tipo !== 'venda' ? descricao.trim() || undefined : undefined,
      itens: itens.filter((i) => i.quantidade > 0),
      maoDeObra: mao,
      instaladorId: tipo === 'servico' ? Number(instaladorId) : undefined,
      comissaoPct: tipo === 'servico' ? comissaoPct : 0,
      desconto,
      pagamentos: tipo === 'orcamento' ? [] : pagamentos.map((p) => ({ forma: p.forma, valor: p.valor, parcelas: p.forma === 'Crédito parcelado' ? p.parcelas : undefined })),
      nfEmitida: tipo !== 'orcamento' && nfEmitida,
      nfNumero: nfEmitida ? nfNumero : undefined,
      origemId: origem?.id,
    })
    avisar(`${NOME_TIPO[tipo]} ${codigo(novo)} lançado${tipo === 'orcamento' ? '' : ' — estoque e caixa atualizados'}`)
    aoFechar()
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_10rem]">
        <Campo rotulo="Cliente *">
          <input className={inputCls} required maxLength={MAX_TEXTO} value={cliente} onChange={(e) => { setCliente(e.target.value); setErro('') }} placeholder="Nome do cliente" />
        </Campo>
        <Campo rotulo="Veículo">
          <input className={inputCls} maxLength={MAX_TEXTO} value={veiculo} onChange={(e) => setVeiculo(e.target.value)} placeholder="Ex.: Gol G5 2012 prata" />
        </Campo>
        <Campo rotulo="Data">
          <input type="date" className={inputCls} max={chaveDia(new Date())} value={data} onChange={(e) => { setData(e.target.value); setErro('') }} />
        </Campo>
      </div>

      <div>
        <Campo rotulo="Peças">
          <div className="relative">
            <input className={inputCls} value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar peça pelo nome…" />
            {sugestoes.length > 0 && (
              <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
                {sugestoes.map((p) => (
                  <li key={p.id}>
                    <button type="button" onClick={() => addItem(p.id)} className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-blue-50">
                      <span>{p.nome}</span>
                      <span className="shrink-0 text-xs text-slate-500">
                        <span className={p.quantidade <= 1 ? 'font-semibold text-red-600' : ''}>{qtd(p.quantidade)} em estoque</span> · <span className="text-emerald-700">{dinheiro(p.preco)}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Campo>
        {itens.length > 0 && (
          <div className="mt-2 overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs text-slate-500 uppercase">
                <tr>
                  <th className="px-3 py-2">Peça</th>
                  <th className="w-24 px-2 py-2">Qtd.</th>
                  <th className="w-32 px-2 py-2">Preço un.</th>
                  <th className="px-3 py-2 text-right">Subtotal</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {itens.map((i) => {
                  const p = produto(i.produtoId)!
                  const fica = p.quantidade - i.quantidade
                  return (
                    <tr key={i.produtoId} className="border-t border-slate-100">
                      <td className="px-3 py-1.5">
                        {p.nome}
                        {tipo !== 'orcamento' && fica < 0 && <div className="text-xs text-red-600">Estoque vai ficar em {qtd(fica)}</div>}
                      </td>
                      <td className="px-2 py-1.5">
                        <input type="number" min={0} step="any" className={`${inputCls} py-1`} value={i.quantidade} onChange={(e) => mudarItem(i.produtoId, 'quantidade', +e.target.value)} />
                      </td>
                      <td className="px-2 py-1.5">
                        <InputDinheiro className="py-1" valor={i.preco} aoMudar={(v) => mudarItem(i.produtoId, 'preco', v)} />
                      </td>
                      <td className="px-3 py-1.5 text-right text-emerald-700 tabular-nums">{dinheiro(i.quantidade * i.preco)}</td>
                      <td className="pr-2">
                        <button onClick={() => setItens((is) => is.filter((x) => x.produtoId !== i.produtoId))} className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label="Remover">✕</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {tipo !== 'venda' && (
        <Campo rotulo="Descrição do serviço">
          <textarea
            className={`${inputCls} min-h-[72px] resize-y`}
            maxLength={MAX_DESCRICAO}
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Ex.: Instalação de módulo trazido pelo cliente, passagem de cabo e regulagem"
          />
          <span className="mt-0.5 block text-right text-xs text-slate-400 tabular-nums">{descricao.length}/{MAX_DESCRICAO}</span>
        </Campo>
      )}

      {tipo !== 'venda' && (
        <div className="grid gap-3 sm:grid-cols-3">
          <Campo rotulo="Mão de obra (R$)">
            <InputDinheiro vazioSeZero valor={maoDeObra} aoMudar={setMaoDeObra} />
          </Campo>
          {tipo === 'servico' && (
            <>
              <Campo rotulo="Instalador">
                <select
                  className={inputCls}
                  value={instaladorId}
                  onChange={(e) => {
                    setInstaladorId(e.target.value ? +e.target.value : '')
                  }}
                >
                  <option value="">Escolha…</option>
                  {instaladores.map((c) => (
                    <option key={c.id} value={c.id}>{c.nome}{!c.temLogin ? ' (sem login)' : ''}</option>
                  ))}
                </select>
              </Campo>
              <Campo rotulo="Comissão sobre mão de obra (%)">
                <input type="number" min={0} max={100} className={inputCls} value={comissaoPct} onChange={(e) => setComissaoPct(+e.target.value)} />
              </Campo>
            </>
          )}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <Campo rotulo="Desconto (R$)">
          <InputDinheiro vazioSeZero valor={desconto} aoMudar={setDesconto} />
        </Campo>
        {tipo !== 'orcamento' && (
          <>
            <Campo rotulo="Nota fiscal">
              <label className="flex h-[38px] items-center gap-2 text-sm">
                <input type="checkbox" checked={nfEmitida} onChange={(e) => setNfEmitida(e.target.checked)} className="size-4 accent-blue-700" />
                Emitida (fora do sistema)
              </label>
            </Campo>
            {nfEmitida && (
              <Campo rotulo="Número da NF">
                <input className={inputCls} value={nfNumero} onChange={(e) => setNfNumero(e.target.value)} placeholder="Ex.: 4832" />
              </Campo>
            )}
          </>
        )}
      </div>

      {tipo !== 'orcamento' && (
        <div className="rounded-xl border border-slate-200 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Pagamento</span>
            {pags.length === 1 ? (
              <button className="text-sm font-semibold text-blue-700 hover:underline" onClick={() => setPags((p) => [{ ...p[0], valor: Math.round(total / 2) }, { forma: p[0].forma === 'PIX' ? 'Dinheiro' : 'PIX', valor: 0, parcelas: 2 }])}>
                + Segunda forma
              </button>
            ) : (
              <button className="text-sm font-semibold text-slate-500 hover:underline" onClick={() => setPags((p) => [p[0]])}>Usar só uma forma</button>
            )}
          </div>
          <div className="space-y-3">
            {pagamentos.map((p, k) => (
              <div key={k} className="grid gap-2 sm:grid-cols-[1fr_9rem_8rem]">
                <select className={inputCls} value={p.forma} onChange={(e) => setPags((ps) => ps.map((x, j) => (j === k ? { ...x, forma: e.target.value as Forma } : x)))}>
                  {FORMAS.map((f) => <option key={f}>{f}</option>)}
                </select>
                <InputDinheiro
                  className={k === 0 && pags.length === 2 ? '' : 'bg-slate-50 text-slate-500'}
                  readOnly={!(k === 0 && pags.length === 2)}
                  valor={p.valor}
                  aoMudar={(v) => setPags((ps) => ps.map((x, j) => (j === 0 ? { ...x, valor: v } : x)))}
                />
                {p.forma === 'Crédito parcelado' ? (
                  <select className={inputCls} value={p.parcelas} onChange={(e) => setPags((ps) => ps.map((x, j) => (j === k ? { ...x, parcelas: +e.target.value } : x)))}>
                    {Array.from({ length: LIMITE_PARCELAS - 1 }, (_, i) => i + 2).map((n) => (
                      <option key={n} value={n}>{n}x de {dinheiro(p.valor / n)}</option>
                    ))}
                  </select>
                ) : <span />}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl bg-slate-50 p-4 text-sm">
        <Linha rotulo="Peças" valor={dinheiro(pecas)} />
        {tipo !== 'venda' && <Linha rotulo="Mão de obra" valor={dinheiro(mao)} />}
        {desconto > 0 && <Linha rotulo="Desconto" valor={`− ${dinheiro(desconto)}`} />}
        {tipo === 'servico' && mao > 0 && <Linha rotulo={`Comissão do instalador (${comissaoPct}%)`} valor={dinheiro((mao * comissaoPct) / 100)} fraco />}
        <div className="mt-2 flex items-baseline justify-between border-t border-slate-200 pt-2">
          <span className="font-display text-lg font-semibold uppercase">Total</span>
          <span className="font-display text-3xl font-bold text-emerald-700 tabular-nums">{dinheiro(total)}</span>
        </div>
      </div>

      {erro && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</p>}

      <div className="flex justify-end gap-2 pb-1">
        <Botao variante="secundario" onClick={aoFechar}>Cancelar</Botao>
        <Botao onClick={salvar}>Salvar {NOME_TIPO[tipo].toLowerCase()}</Botao>
      </div>
    </div>
  )
}

function Linha({ rotulo, valor, fraco }: { rotulo: string; valor: string; fraco?: boolean }) {
  return (
    <div className={`flex justify-between py-0.5 ${fraco ? 'text-slate-500' : ''}`}>
      <span>{rotulo}</span>
      <span className="tabular-nums">{valor}</span>
    </div>
  )
}

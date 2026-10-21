import { useRef, useState, type Ref } from 'react'
import { createPortal } from 'react-dom'
import { codigo, useStore } from '../store'
import type { Lancamento } from '../types'
import { baixarPdf } from '../pdf'
import { comissao, dataCurta, dataHora, dinheiro, formatarTelefone, LOJA, NOME_TIPO, orcamentoVencido, qtd, subtotalPecas, telefoneValido, totalLanc, validadeOrcamento } from '../util'
import { NovoLancamento } from './NovoLancamento'
import { Botao, Cadeado, Campo, InputDinheiro, inputCls, Logo, MAX_DESCRICAO, MAX_TEXTO, Modal, SeloSituacao } from './ui'

export function Detalhe({ id, aoFechar }: { id: string; aoFechar: () => void }) {
  const { lancamentos, alteracoes, colaborador, produto, isAdmin, avisoAdmin, cancelar, editar, avisar } = useStore()
  const l = lancamentos.find((x) => x.id === id)
  const [modo, setModo] = useState<'ver' | 'editar' | 'cancelar' | 'converter'>('ver')
  const [ed, setEd] = useState(() => ({ cliente: l?.cliente ?? '', telefone: l?.telefone ?? '', veiculo: l?.veiculo ?? '', descricao: l?.descricao ?? '', desconto: l?.desconto ?? 0, nfEmitida: l?.nfEmitida ?? false, nfNumero: l?.nfNumero ?? '' }))
  const [erroEd, setErroEd] = useState('')
  const [gerando, setGerando] = useState(false)
  const impresso = useRef<HTMLDivElement>(null)
  if (!l) return null

  const historico = alteracoes.filter((a) => a.lancamentoId === l.id)
  const origem = l.origemId ? lancamentos.find((x) => x.id === l.origemId) : undefined
  const destino = l.convertidoEmId ? lancamentos.find((x) => x.id === l.convertidoEmId) : undefined
  const ativo = l.situacao === 'ativo'

  if (modo === 'converter') return <NovoLancamento origem={l} aoFechar={aoFechar} />

  const salvarEdicao = () => {
    if (!ed.cliente.trim()) return setErroEd('Informe o nome do cliente.')
    const mudou: string[] = []
    if (ed.cliente !== l.cliente) mudou.push(`Cliente: "${l.cliente}" → "${ed.cliente}"`)
    if (ed.telefone && !telefoneValido(ed.telefone)) return setErroEd('Confira o telefone (com DDD) ou deixe em branco.')
    if (ed.telefone !== (l.telefone ?? '')) mudou.push(`Telefone: "${l.telefone || '—'}" → "${ed.telefone || '—'}"`)
    if (ed.veiculo !== l.veiculo) mudou.push(`Veículo: "${l.veiculo || '—'}" → "${ed.veiculo || '—'}"`)
    if (ed.descricao.trim() !== (l.descricao ?? '')) mudou.push(`Descrição do serviço: "${l.descricao || '—'}" → "${ed.descricao.trim() || '—'}"`)
    if (ed.desconto !== l.desconto) mudou.push(`Desconto: ${dinheiro(l.desconto)} → ${dinheiro(ed.desconto)}`)
    if (ed.nfEmitida !== l.nfEmitida || (ed.nfNumero || '') !== (l.nfNumero || '')) mudou.push(`NF: ${l.nfEmitida ? `nº ${l.nfNumero}` : 'não emitida'} → ${ed.nfEmitida ? `nº ${ed.nfNumero}` : 'não emitida'}`)
    if (!mudou.length) return setModo('ver')
    editar(l.id, { ...ed, telefone: ed.telefone || undefined, descricao: ed.descricao.trim() || undefined, nfNumero: ed.nfEmitida ? ed.nfNumero : undefined }, mudou.join('; '))
    setModo('ver')
  }

  const baixar = async () => {
    if (!impresso.current) return
    const nome = `${codigo(l)} - ${l.cliente}.pdf`.replace(/[\\/:*?"<>|]/g, '-')
    setGerando(true)
    try {
      await baixarPdf(impresso.current, nome)
    } catch {
      avisar('Não foi possível gerar o PDF. Tente imprimir e salvar como PDF.', 'erro')
    } finally {
      setGerando(false)
    }
  }

  const restrito = (acao: () => void) => () => (isAdmin ? acao() : avisoAdmin())

  return (
    <>
      <Modal aberto aoFechar={aoFechar} titulo={<span className="flex items-center gap-3">{NOME_TIPO[l.tipo]} {codigo(l)} <SeloSituacao l={l} /></span>}>
        <div className="space-y-4 text-sm">
          {modo === 'editar' ? (
            <div className="grid gap-3 rounded-xl border border-blue-200 bg-blue-50/40 p-3 sm:grid-cols-2">
              <Campo rotulo="Cliente"><input className={inputCls} maxLength={MAX_TEXTO} value={ed.cliente} onChange={(e) => { setEd({ ...ed, cliente: e.target.value }); setErroEd('') }} /></Campo>
              <Campo rotulo="Telefone"><input type="tel" inputMode="numeric" className={inputCls} value={ed.telefone} onChange={(e) => setEd({ ...ed, telefone: formatarTelefone(e.target.value) })} placeholder="(66) 99999-9999" /></Campo>
              <Campo rotulo="Veículo"><input className={inputCls} maxLength={MAX_TEXTO} value={ed.veiculo} onChange={(e) => setEd({ ...ed, veiculo: e.target.value })} /></Campo>
              {l.tipo !== 'venda' && (
                <Campo rotulo="Descrição do serviço" className="sm:col-span-2">
                  <textarea className={`${inputCls} min-h-[72px] resize-y`} maxLength={MAX_DESCRICAO} value={ed.descricao} onChange={(e) => setEd({ ...ed, descricao: e.target.value })} />
                </Campo>
              )}
              <Campo rotulo="Desconto (R$)"><InputDinheiro valor={ed.desconto} aoMudar={(v) => setEd({ ...ed, desconto: v })} /></Campo>
              {l.tipo !== 'orcamento' && (
                <Campo rotulo="Nota fiscal">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" className="size-4 accent-blue-700" checked={ed.nfEmitida} onChange={(e) => setEd({ ...ed, nfEmitida: e.target.checked })} />
                    <input className={inputCls} disabled={!ed.nfEmitida} value={ed.nfNumero} onChange={(e) => setEd({ ...ed, nfNumero: e.target.value })} placeholder="Número" />
                  </div>
                </Campo>
              )}
              {erroEd && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 sm:col-span-2">{erroEd}</p>}
              <div className="flex justify-end gap-2 sm:col-span-2">
                <Botao variante="secundario" onClick={() => setModo('ver')}>Voltar</Botao>
                <Botao onClick={salvarEdicao}>Salvar alteração</Botao>
              </div>
            </div>
          ) : (
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
              <Info rotulo="Cliente" valor={l.cliente} />
              <Info rotulo="Telefone" valor={l.telefone || '—'} />
              <Info rotulo="Veículo" valor={l.veiculo || '—'} />
              <Info rotulo="Lançado em" valor={dataHora(l.criadoEm)} />
              <Info rotulo="Lançado por" valor={colaborador(l.criadoPor)?.nome ?? '—'} />
              {l.tipo === 'servico' && <Info rotulo="Instalador" valor={colaborador(l.instaladorId)?.nome ?? '—'} />}
              {l.tipo === 'orcamento' && <Info rotulo="Válido até" valor={dataCurta(validadeOrcamento(l))} destaque={orcamentoVencido(l)} />}
              {l.tipo !== 'orcamento' && <Info rotulo="Nota fiscal" valor={l.nfEmitida ? `Emitida · nº ${l.nfNumero}` : 'Não emitida'} />}
              {origem && <Info rotulo="Origem" valor={`Orçamento ${codigo(origem)}`} />}
              {destino && <Info rotulo="Convertido em" valor={`${NOME_TIPO[destino.tipo]} ${codigo(destino)}`} />}
              {l.descricao && (
                <div className="col-span-2 sm:col-span-3">
                  <dt className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Descrição do serviço</dt>
                  <dd className="whitespace-pre-line text-slate-800">{l.descricao}</dd>
                </div>
              )}
            </dl>
          )}

          <ItensTabela l={l} />

          {l.pagamentos.length > 0 && (
            <div>
              <h3 className="mb-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">Pagamento</h3>
              <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
                {l.pagamentos.map((p, k) => (
                  <li key={k} className="flex justify-between px-3 py-2">
                    <span>{p.forma}{p.parcelas ? ` · ${p.parcelas}x de ${dinheiro(p.valor / p.parcelas)}` : ''}</span>
                    <span className="text-emerald-700 tabular-nums">{dinheiro(p.valor)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {historico.length > 0 && (
            <div>
              <h3 className="mb-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">Histórico de alterações</h3>
              <ul className="space-y-1.5">
                {historico.map((a) => (
                  <li key={a.id} className="rounded-lg bg-amber-50 px-3 py-2 text-amber-900">
                    <span className="font-semibold">{colaborador(a.colaboradorId)?.nome}</span> · {dataHora(a.data)}
                    <div>{a.descricao}</div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {modo === 'cancelar' ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3">
              <p className="font-semibold text-red-800">Cancelar {codigo(l)}?</p>
              <p className="text-red-700">{l.tipo === 'orcamento' ? 'O orçamento fica marcado como cancelado.' : `As peças voltam ao estoque e ${dinheiro(totalLanc(l))} sai do caixa.`}</p>
              <div className="mt-3 flex justify-end gap-2">
                <Botao variante="secundario" onClick={() => setModo('ver')}>Voltar</Botao>
                <Botao className="bg-red-700 hover:bg-red-800" onClick={() => { cancelar(l.id); setModo('ver') }}>Confirmar cancelamento</Botao>
              </div>
            </div>
          ) : modo === 'ver' && (
            <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">
              <Botao variante="secundario" onClick={() => window.print()}>Imprimir (A4)</Botao>
              <Botao variante="secundario" onClick={baixar} disabled={gerando}>{gerando ? 'Gerando PDF…' : 'Baixar PDF'}</Botao>
              {ativo && <Botao variante="perigo" onClick={restrito(() => setModo('cancelar'))}>{!isAdmin && <Cadeado />} Cancelar</Botao>}
              {l.situacao !== 'cancelado' && <Botao variante="secundario" onClick={restrito(() => setModo('editar'))}>{!isAdmin && <Cadeado />} Editar</Botao>}
              {l.tipo === 'orcamento' && ativo && <Botao onClick={() => setModo('converter')}>Converter em venda/serviço</Botao>}
            </div>
          )}
        </div>
      </Modal>
      {createPortal(
        <DocumentoImpresso
          ref={impresso}
          l={l}
          produtoNome={(id) => produto(id)?.nome ?? ''}
          vendedor={colaborador(l.criadoPor)?.nome ?? ''}
          instalador={colaborador(l.instaladorId)?.nome ?? ''}
        />,
        document.body,
      )}
    </>
  )
}

function Info({ rotulo, valor, destaque }: { rotulo: string; valor: string; destaque?: boolean }) {
  return (
    <div>
      <dt className="text-xs font-semibold tracking-wide text-slate-500 uppercase">{rotulo}</dt>
      <dd className={destaque ? 'font-semibold text-red-600' : 'text-slate-800'}>{valor}</dd>
    </div>
  )
}

function ItensTabela({ l }: { l: Lancamento }) {
  const { produto, colaborador } = useStore()
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-xs text-slate-500 uppercase">
          <tr><th className="px-3 py-2">Peça</th><th className="px-3 py-2 text-right">Qtd.</th><th className="px-3 py-2 text-right">Preço</th><th className="px-3 py-2 text-right">Subtotal</th></tr>
        </thead>
        <tbody>
          {l.itens.map((i) => (
            <tr key={i.produtoId} className="border-t border-slate-100">
              <td className="px-3 py-1.5">{produto(i.produtoId)?.nome}</td>
              <td className="px-3 py-1.5 text-right tabular-nums">{qtd(i.quantidade)}</td>
              <td className="px-3 py-1.5 text-right tabular-nums">{dinheiro(i.preco)}</td>
              <td className="px-3 py-1.5 text-right tabular-nums">{dinheiro(i.quantidade * i.preco)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot className="border-t border-slate-200 bg-slate-50/60">
          <Rodape rotulo="Peças" valor={dinheiro(subtotalPecas(l))} />
          {l.maoDeObra > 0 && <Rodape rotulo="Mão de obra" valor={dinheiro(l.maoDeObra)} />}
          {l.tipo === 'servico' && l.maoDeObra > 0 && (
            <Rodape rotulo={`Comissão de ${colaborador(l.instaladorId)?.nome.split(' ')[0]} (${l.comissaoPct}%)`} valor={dinheiro(comissao(l))} fraco />
          )}
          {l.desconto > 0 && <Rodape rotulo="Desconto" valor={`− ${dinheiro(l.desconto)}`} />}
          <tr>
            <td colSpan={3} className="px-3 py-2 text-right font-display text-base font-semibold uppercase">Total</td>
            <td className="px-3 py-2 text-right font-display text-xl font-bold text-emerald-700 tabular-nums">{dinheiro(totalLanc(l))}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

function Rodape({ rotulo, valor, fraco }: { rotulo: string; valor: string; fraco?: boolean }) {
  return (
    <tr className={fraco ? 'text-slate-500' : ''}>
      <td colSpan={3} className="px-3 py-1 text-right">{rotulo}</td>
      <td className="px-3 py-1 text-right tabular-nums">{valor}</td>
    </tr>
  )
}

function DocumentoImpresso({ l, produtoNome, vendedor, instalador, ref }: { l: Lancamento; produtoNome: (id: string) => string; vendedor: string; instalador: string; ref?: Ref<HTMLDivElement> }) {
  const orc = l.tipo === 'orcamento'
  return (
    <div ref={ref} className="documento-impresso hidden bg-white text-[11pt] text-black print:block">
      <header className="flex items-center gap-5 border-b-2 border-black pb-4">
        <Logo size={96} />
        <div className="flex-1">
          <div className="font-marca text-3xl font-bold uppercase">{LOJA.nome}</div>
          <div>{LOJA.endereco}</div>
          <div>WhatsApp {LOJA.whatsapp} · {LOJA.cnpj}</div>
        </div>
        <div className="text-right">
          <div className="font-display text-2xl font-bold uppercase">{NOME_TIPO[l.tipo]}</div>
          <div className="text-lg">{codigo(l)}</div>
          {l.situacao === 'cancelado' && <div className="font-bold text-red-700 uppercase">Cancelado</div>}
        </div>
      </header>
      <div className="my-4 grid grid-cols-2 gap-1">
        <div><b>Cliente:</b> {l.cliente}</div>
        <div><b>Data:</b> {dataCurta(l.criadoEm)}</div>
        {l.telefone && <div><b>Telefone:</b> {l.telefone}</div>}
        <div><b>Veículo:</b> {l.veiculo || '—'}</div>
        {orc && <div><b>Válido até:</b> {dataCurta(validadeOrcamento(l))} (7 dias)</div>}
        <div><b>Atendente:</b> {vendedor}</div>
        {l.tipo === 'servico' && instalador && <div><b>Instalador:</b> {instalador}</div>}
        {!orc && l.nfEmitida && <div><b>Nota fiscal:</b> nº {l.nfNumero}</div>}
      </div>
      {l.descricao && (
        <div className="mb-4 rounded border border-slate-300 px-3 py-2">
          <b>Descrição do serviço:</b>
          <div className="whitespace-pre-line">{l.descricao}</div>
        </div>
      )}
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-y border-black text-left">
            <th className="py-1.5">Descrição</th><th className="py-1.5 text-right">Qtd.</th><th className="py-1.5 text-right">Valor un.</th><th className="py-1.5 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {l.itens.map((i) => (
            <tr key={i.produtoId} className="border-b border-slate-300">
              <td className="py-1.5">{produtoNome(i.produtoId)}</td>
              <td className="py-1.5 text-right">{qtd(i.quantidade)}</td>
              <td className="py-1.5 text-right">{dinheiro(i.preco)}</td>
              <td className="py-1.5 text-right">{dinheiro(i.quantidade * i.preco)}</td>
            </tr>
          ))}
          {l.maoDeObra > 0 && (
            <tr className="border-b border-slate-300"><td className="py-1.5">Mão de obra / instalação</td><td /><td /><td className="py-1.5 text-right">{dinheiro(l.maoDeObra)}</td></tr>
          )}
        </tbody>
      </table>
      <div className="mt-3 ml-auto w-64 space-y-1">
        {l.desconto > 0 && <div className="flex justify-between"><span>Desconto</span><span>− {dinheiro(l.desconto)}</span></div>}
        <div className="flex justify-between border-t-2 border-black pt-1 text-lg font-bold"><span>TOTAL</span><span>{dinheiro(totalLanc(l))}</span></div>
      </div>
      {l.pagamentos.length > 0 && (
        <div className="mt-4 w-80">
          <b>Pagamento</b>
          {l.pagamentos.map((p, k) => (
            <div key={k} className="flex justify-between border-b border-slate-300 py-1">
              <span>{p.forma}{p.parcelas ? ` · ${p.parcelas}x de ${dinheiro(p.valor / p.parcelas)}` : ''}</span>
              <span>{dinheiro(p.valor)}</span>
            </div>
          ))}
        </div>
      )}
      <p className="mt-10 text-sm">
        {orc ? 'Orçamento sem reserva de peças. Valores sujeitos à disponibilidade em estoque.' : 'Obrigado pela preferência! Este documento não substitui a nota fiscal.'}
      </p>
      <div className="mt-16 grid break-inside-avoid grid-cols-2 gap-12 text-center">
        <div className="border-t border-black pt-1">Assinatura do vendedor</div>
        <div className="border-t border-black pt-1">Assinatura do cliente</div>
      </div>
    </div>
  )
}

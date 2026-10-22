import { useState } from 'react'
import { Botao, Campo, inputCls, Modal, Painel, Selo, Titulo, Vazio } from '../components/ui'
import { useStore } from '../store'
import type { Produto, TipoMov } from '../types'
import { buscarProdutos, dataHora, dinheiro, qtd } from '../util'

const NOME_MOV: Record<TipoMov, { t: string; cor: 'verde' | 'azul' | 'cinza' | 'ambar' | 'vermelho' }> = {
  entrada: { t: 'Entrada', cor: 'verde' },
  ajuste: { t: 'Correção', cor: 'ambar' },
  venda: { t: 'Venda', cor: 'azul' },
  servico: { t: 'Serviço', cor: 'azul' },
  cancelamento: { t: 'Cancelamento', cor: 'vermelho' },
}

export function Estoque() {
  const { produtos, movimentacoes, produto, colaborador } = useStore()
  const [aba, setAba] = useState<'produtos' | 'historico'>('produtos')
  const [busca, setBusca] = useState('')
  const [soBaixo, setSoBaixo] = useState(false)
  const [mexendo, setMexendo] = useState<{ p: Produto; tipo: 'entrada' | 'ajuste' } | null>(null)
  const [novo, setNovo] = useState(false)

  const lista = buscarProdutos(produtos, busca).filter((p) => !soBaixo || p.quantidade <= 1)

  return (
    <>
      <Titulo acao={<Botao onClick={() => setNovo(true)}>+ Novo produto</Botao>}>Estoque</Titulo>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="flex rounded-lg bg-slate-200/70 p-1">
          {(['produtos', 'historico'] as const).map((a) => (
            <button key={a} onClick={() => setAba(a)} className={`rounded-md px-3 py-1.5 text-sm font-semibold ${aba === a ? 'bg-white text-blue-800 shadow' : 'text-slate-600'}`}>
              {a === 'produtos' ? `Produtos (${produtos.length})` : 'Histórico'}
            </button>
          ))}
        </div>
        {aba === 'produtos' && (
          <>
            <input className={`${inputCls} max-w-xs`} placeholder="Buscar por código, nome ou marca…" value={busca} onChange={(e) => setBusca(e.target.value)} />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="size-4 accent-red-600" checked={soBaixo} onChange={(e) => setSoBaixo(e.target.checked)} /> Só estoque baixo
            </label>
          </>
        )}
      </div>

      {aba === 'produtos' ? (
        <Painel>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs tracking-wide text-slate-500 uppercase">
                <tr><th className="w-16 py-2.5 pl-4">Cód.</th><th className="px-3 py-2.5">Produto</th><th className="px-3 py-2.5">Marca</th><th className="px-3 py-2.5 text-right">Preço de venda</th><th className="px-3 py-2.5 text-right">Quantidade</th><th className="px-4 py-2.5 text-right">Ações</th></tr>
              </thead>
              <tbody>
                {lista.map((p) => (
                  <tr key={p.id} className="border-b border-slate-100">
                    <td className="py-2.5 pl-4 text-slate-500 tabular-nums">{p.codigo ?? '—'}</td>
                    <td className="px-3 py-2.5 font-medium">{p.nome}</td>
                    <td className="px-3 py-2.5 text-slate-600">{p.marca || '—'}</td>
                    <td className="px-3 py-2.5 text-right text-emerald-700 tabular-nums">{dinheiro(p.preco)}</td>
                    <td className="px-3 py-2.5 text-right">
                      <span className={`rounded-md px-2 py-0.5 font-semibold tabular-nums ${p.quantidade < 0 ? 'bg-red-600 text-white' : p.quantidade <= 1 ? 'bg-red-50 text-red-700' : ''}`}>{qtd(p.quantidade)}</span>
                    </td>
                    <td className="px-4 py-2 text-right whitespace-nowrap">
                      <button onClick={() => setMexendo({ p, tipo: 'entrada' })} className="rounded-md px-2 py-1 text-sm font-semibold text-blue-700 hover:bg-blue-50">Entrada</button>
                      <button onClick={() => setMexendo({ p, tipo: 'ajuste' })} className="rounded-md px-2 py-1 text-sm font-semibold text-slate-600 hover:bg-slate-100">Corrigir</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {lista.length === 0 && <Vazio>Nenhum produto encontrado.</Vazio>}
          <p className="border-t border-slate-100 px-4 py-3 text-xs text-slate-500">Alerta de estoque baixo com 1 unidade ou menos. Pode vender com estoque zerado (fica negativo).</p>
        </Painel>
      ) : (
        <Painel>
          <ul className="divide-y divide-slate-100">
            {movimentacoes.slice(0, 120).map((m) => (
              <li key={m.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5 text-sm">
                <span className="w-28 shrink-0 text-slate-500 tabular-nums">{dataHora(m.data)}</span>
                <Selo cor={NOME_MOV[m.tipo].cor}>{NOME_MOV[m.tipo].t}</Selo>
                <span className="min-w-0 flex-1 truncate">{produto(m.produtoId)?.nome}</span>
                <span className="text-xs text-slate-500">{colaborador(m.colaboradorId)?.nome.split(' ')[0]}{m.lancamentoNumero ? ` · ${m.lancamentoNumero}` : ''}</span>
                <span className={`w-16 text-right font-semibold tabular-nums ${m.quantidade < 0 ? 'text-slate-700' : 'text-emerald-700'}`}>{m.quantidade > 0 ? '+' : ''}{qtd(m.quantidade)}</span>
              </li>
            ))}
          </ul>
        </Painel>
      )}

      {mexendo && <MexerEstoque {...mexendo} aoFechar={() => setMexendo(null)} />}
      {novo && <NovoProduto aoFechar={() => setNovo(false)} />}
    </>
  )
}

function MexerEstoque({ p, tipo, aoFechar }: { p: Produto; tipo: 'entrada' | 'ajuste'; aoFechar: () => void }) {
  const { movimentarEstoque, avisar } = useStore()
  const [valor, setValor] = useState(tipo === 'ajuste' ? p.quantidade : 1)
  const salvar = () => {
    const delta = tipo === 'entrada' ? valor : +(valor - p.quantidade).toFixed(2)
    if (!delta) return aoFechar()
    movimentarEstoque(p.id, tipo, delta)
    avisar(`${p.nome}: ${tipo === 'entrada' ? `+${qtd(delta)} no estoque` : `corrigido para ${qtd(valor)}`}`)
    aoFechar()
  }
  return (
    <Modal aberto aoFechar={aoFechar} titulo={tipo === 'entrada' ? 'Entrada de mercadoria' : 'Corrigir estoque'} largura="max-w-md">
      <p className="mb-3 text-sm"><b>{p.nome}</b><br /><span className="text-slate-500">Hoje: {qtd(p.quantidade)}</span></p>
      <Campo rotulo={tipo === 'entrada' ? 'Quantidade que chegou' : 'Quantidade correta na prateleira'}>
        <input type="number" step="any" autoFocus className={inputCls} value={valor} onChange={(e) => setValor(+e.target.value)} />
      </Campo>
      <p className="mt-2 text-xs text-slate-500">Fica registrado no histórico com seu nome, data e hora.</p>
      <div className="mt-4 flex justify-end gap-2">
        <Botao variante="secundario" onClick={aoFechar}>Cancelar</Botao>
        <Botao onClick={salvar}>Salvar</Botao>
      </div>
    </Modal>
  )
}

function NovoProduto({ aoFechar }: { aoFechar: () => void }) {
  const { novoProduto } = useStore()
  const [nome, setNome] = useState('')
  const [marca, setMarca] = useState('')
  const [preco, setPreco] = useState(0)
  const [quantidade, setQuantidade] = useState(0)
  return (
    <Modal aberto aoFechar={aoFechar} titulo="Novo produto" largura="max-w-md">
      <div className="space-y-3">
        <Campo rotulo="Nome"><input autoFocus className={inputCls} value={nome} onChange={(e) => setNome(e.target.value)} /></Campo>
        <Campo rotulo="Marca"><input className={inputCls} value={marca} onChange={(e) => setMarca(e.target.value)} /></Campo>
        <div className="grid grid-cols-2 gap-3">
          <Campo rotulo="Preço de venda (R$)"><input type="number" step="0.01" className={inputCls} value={preco || ''} onChange={(e) => setPreco(+e.target.value)} /></Campo>
          <Campo rotulo="Quantidade"><input type="number" step="any" className={inputCls} value={quantidade || ''} onChange={(e) => setQuantidade(+e.target.value)} /></Campo>
        </div>
      </div>
      <p className="mt-2 text-xs text-slate-500">O código do produto é gerado automaticamente ao cadastrar.</p>
      <div className="mt-4 flex justify-end gap-2">
        <Botao variante="secundario" onClick={aoFechar}>Cancelar</Botao>
        <Botao disabled={!nome.trim() || preco <= 0} onClick={() => { novoProduto(nome.trim(), marca.trim(), preco, quantidade); aoFechar() }}>Cadastrar</Botao>
      </div>
    </Modal>
  )
}

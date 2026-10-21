// Testa as regras do Firestore no emulador local (não toca no banco real).
// Uso: npx firebase-tools emulators:exec --only auth,firestore --project demo-elvolcks "node scripts/testar-regras.mjs"
import { deleteApp, initializeApp } from 'firebase/app'
import { connectAuthEmulator, createUserWithEmailAndPassword, getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import {
  collection, connectFirestoreEmulator, doc, getDoc, getDocs, increment, runTransaction, setDoc, updateDoc, writeBatch, initializeFirestore,
} from 'firebase/firestore'

if (!process.env.FIRESTORE_EMULATOR_HOST) throw new Error('Rode pelo emulators:exec (nunca contra o banco real)')

let n = 0
function conectar() {
  const app = initializeApp({ apiKey: 'demo', projectId: 'elvolcks-auto-som' }, `t${n++}`)
  const auth = getAuth(app)
  const db = initializeFirestore(app, { ignoreUndefinedProperties: true })
  connectAuthEmulator(auth, `http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}`, { disableWarnings: true })
  const [h, p] = process.env.FIRESTORE_EMULATOR_HOST.split(':')
  connectFirestoreEmulator(db, h, +p)
  return { app, auth, db }
}
const email = (u) => `${u}@elvolcks-auto-som.firebaseapp.com`

let falhas = 0
async function espera(nome, permitido, fn) {
  try {
    await fn()
    if (!permitido) { falhas++; console.log(`FALHOU  ${nome}: deveria ser NEGADO`) } else console.log(`ok      ${nome}`)
  } catch (e) {
    if (permitido || e.code !== 'permission-denied') { falhas++; console.log(`FALHOU  ${nome}: ${e.code ?? e.message}`) } else console.log(`ok      ${nome} (negado)`)
  }
}

// Instalação (como o scripts/instalar.mjs)
const inst = conectar()
const uids = {}
for (const u of ['gabriel', 'cleomar']) uids[u] = (await createUserWithEmailAndPassword(inst.auth, email(u), 'senha123')).user.uid
await espera('instalação inicial', true, async () => {
  const b = writeBatch(inst.db)
  b.set(doc(inst.db, 'colaboradores', 'gabriel'), { nome: 'Gabriel', funcoes: ['admin', 'vende'], ativo: true, temLogin: true, usuario: 'gabriel', uid: uids.gabriel })
  b.set(doc(inst.db, 'colaboradores', 'cleomar'), { nome: 'Cleomar', funcoes: ['vende', 'instala'], ativo: true, temLogin: true, usuario: 'cleomar', uid: uids.cleomar })
  b.set(doc(inst.db, 'acessos', uids.gabriel), { colaboradorId: 'gabriel' })
  b.set(doc(inst.db, 'acessos', uids.cleomar), { colaboradorId: 'cleomar' })
  b.set(doc(inst.db, 'config', 'instalacao'), { em: 'x' })
  await b.commit()
})
await espera('instalar de novo', false, () => setDoc(doc(inst.db, 'colaboradores', 'intruso'), { nome: 'x', funcoes: ['admin'], ativo: true }))

const g = conectar(); await signInWithEmailAndPassword(g.auth, email('gabriel'), 'senha123')
const c = conectar(); await signInWithEmailAndPassword(c.auth, email('cleomar'), 'senha123')
const anon = conectar()

await espera('sem login não lê nada', false, () => getDocs(collection(anon.db, 'lancamentos')))
await espera('funcionário cadastra produto', true, () => setDoc(doc(c.db, 'produtos', 'p1'), { nome: 'Peça', preco: 10, quantidade: 0 }))
await espera('funcionário cadastra cliente', true, () => setDoc(doc(c.db, 'clientes', 'c1'), { nome: 'Cli', telefone: '(66) 99999-9999' }))

const lancar = (x, tipo, extra = {}) => runTransaction(x.db, async (t) => {
  const cont = doc(x.db, 'contadores', 'numeros')
  const s = await t.get(cont)
  const numero = (s.data()?.[tipo] ?? 0) + 1
  t.set(cont, { [tipo]: numero }, { merge: true })
  const ref = doc(collection(x.db, 'lancamentos'))
  t.set(ref, { tipo, numero, cliente: 'Cli', itens: [{ produtoId: 'p1', quantidade: 1, preco: 10 }], situacao: 'ativo', criadoPor: x === g ? 'gabriel' : 'cleomar', criadoEm: new Date().toISOString(), ...extra })
  if (extra.origemId) t.update(doc(x.db, 'lancamentos', extra.origemId), { situacao: 'convertido', convertidoEmId: ref.id })
  if (tipo !== 'orcamento') {
    t.update(doc(x.db, 'produtos', 'p1'), { quantidade: increment(-1) })
    t.set(doc(collection(x.db, 'movimentacoes')), { produtoId: 'p1', tipo, quantidade: -1, colaboradorId: x === g ? 'gabriel' : 'cleomar', data: 'x' })
  }
  return ref.id
})

let venda, orc
await espera('funcionário lança venda (baixa estoque)', true, async () => { venda = await lancar(c, 'venda') })
await espera('funcionário lança orçamento', true, async () => { orc = await lancar(c, 'orcamento') })
await espera('funcionário converte orçamento', true, () => lancar(c, 'servico', { origemId: orc }))
await espera('lançar em nome de outra pessoa', false, () => setDoc(doc(c.db, 'lancamentos', 'falso'), { tipo: 'venda', criadoPor: 'gabriel' }))
await espera('funcionário cancela venda', false, () => updateDoc(doc(c.db, 'lancamentos', venda), { situacao: 'cancelado' }))
await espera('funcionário edita valor da venda', false, () => updateDoc(doc(c.db, 'lancamentos', venda), { desconto: 50 }))
await espera('funcionário vira administrador', false, () => updateDoc(doc(c.db, 'colaboradores', 'cleomar'), { funcoes: ['admin'] }))
await espera('admin cancela venda + histórico', true, async () => {
  const b = writeBatch(g.db)
  b.update(doc(g.db, 'lancamentos', venda), { situacao: 'cancelado' })
  b.update(doc(g.db, 'produtos', 'p1'), { quantidade: increment(1) })
  b.set(doc(collection(g.db, 'movimentacoes')), { produtoId: 'p1', tipo: 'cancelamento', quantidade: 1, colaboradorId: 'gabriel', data: 'x' })
  b.set(doc(collection(g.db, 'alteracoes')), { lancamentoId: venda, colaboradorId: 'gabriel', data: 'x', descricao: 'cancelado' })
  await b.commit()
})
const estoque = (await getDoc(doc(g.db, 'produtos', 'p1'))).data().quantidade
console.log(estoque === -1 ? 'ok      estoque final = -1 (venda cancelada devolveu, serviço baixou)' : (falhas++, `FALHOU  estoque final = ${estoque}`))
const numeros = (await getDoc(doc(g.db, 'contadores', 'numeros'))).data()
console.log(JSON.stringify(numeros) === '{"venda":1,"orcamento":1,"servico":1}' ? 'ok      numeração V-1, O-1, S-1' : (falhas++, `FALHOU  numeração ${JSON.stringify(numeros)}`))

// Admin cria conta nova (instância separada, como o app faz)
const temp = conectar()
const uidNovo = (await createUserWithEmailAndPassword(temp.auth, email('novo'), 'senha123')).user.uid
await signOut(temp.auth)
await espera('admin cadastra pessoa com acesso', true, async () => {
  const b = writeBatch(g.db)
  b.set(doc(g.db, 'colaboradores', 'novo'), { nome: 'Novo', funcoes: ['vende'], ativo: true, temLogin: true, usuario: 'novo', uid: uidNovo })
  b.set(doc(g.db, 'acessos', uidNovo), { colaboradorId: 'novo' })
  await b.commit()
})
await espera('admin desativa funcionário', true, () => updateDoc(doc(g.db, 'colaboradores', 'cleomar'), { ativo: false }))
await espera('desativado não lê mais nada', false, () => getDocs(collection(c.db, 'lancamentos')))

for (const x of [inst, g, c, anon, temp]) await deleteApp(x.app)
console.log(falhas ? `\n${falhas} FALHA(S)` : '\nTodas as regras se comportaram como esperado.')
process.exit(falhas ? 1 : 0)

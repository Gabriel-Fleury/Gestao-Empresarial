// Instalação inicial (rodar UMA vez): cria as contas da equipe e os cadastros no Firestore.
// Uso: node scripts/instalar.mjs
// As regras (firestore.rules) só permitem isso enquanto config/instalacao não existir.
import { randomInt } from 'node:crypto'
import { initializeApp } from 'firebase/app'
import { connectAuthEmulator, createUserWithEmailAndPassword, getAuth } from 'firebase/auth'
import { connectFirestoreEmulator, doc, getFirestore, writeBatch } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyDDe6z_Zmx-4HhOM-iCDcv8B5qcoHYOiiQ',
  authDomain: 'elvolcks-auto-som.firebaseapp.com',
  projectId: 'elvolcks-auto-som',
  storageBucket: 'elvolcks-auto-som.firebasestorage.app',
  messagingSenderId: '856129150259',
  appId: '1:856129150259:web:b5e758d8ed19dfb768b246',
}

const EQUIPE = [
  { nome: 'Gabriel Fleury Martins', usuario: 'gabriel', funcoes: ['admin', 'vende', 'instala'] },
  { nome: 'Marcos Fleuri Martins', usuario: 'marcos', funcoes: ['admin', 'vende', 'instala'] },
  { nome: 'Cleomar Vieira de Almeida', usuario: 'cleomar', funcoes: ['vende', 'instala'] },
]

// Senha provisória legível (sem 0/O, 1/l): cada um troca no primeiro acesso
const LETRAS = 'abcdefghjkmnpqrstuvwxyz23456789'
const senhaProvisoria = () => Array.from({ length: 8 }, () => LETRAS[randomInt(LETRAS.length)]).join('')

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)
// Teste local: firebase emulators:exec --only auth,firestore "node scripts/instalar.mjs"
if (process.env.FIRESTORE_EMULATOR_HOST) {
  connectAuthEmulator(auth, `http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}`, { disableWarnings: true })
  connectFirestoreEmulator(db, ...process.env.FIRESTORE_EMULATOR_HOST.split(':').map((x, i) => (i ? +x : x)))
}

const contas = []
for (const p of EQUIPE) {
  const senha = senhaProvisoria()
  const { user } = await createUserWithEmailAndPassword(auth, `${p.usuario}@elvolcks-auto-som.firebaseapp.com`, senha)
  contas.push({ ...p, uid: user.uid, senha })
}

// Tudo num envio só, junto com config/instalacao (depois disso as regras fecham a instalação)
const b = writeBatch(db)
for (const c of contas) {
  const ref = doc(db, 'colaboradores', c.usuario)
  b.set(ref, { nome: c.nome, funcoes: c.funcoes, ativo: true, comissaoPadrao: 0, temLogin: true, usuario: c.usuario, uid: c.uid })
  b.set(doc(db, 'acessos', c.uid), { colaboradorId: ref.id })
}
b.set(doc(db, 'config', 'instalacao'), { em: new Date().toISOString() })
await b.commit()

console.log('\nInstalação concluída. Senhas provisórias:')
for (const c of contas) console.log(`  ${c.nome.padEnd(28)} usuário: ${c.usuario.padEnd(8)} senha: ${c.senha}`)
process.exit(0)

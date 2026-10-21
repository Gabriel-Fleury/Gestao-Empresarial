import { deleteApp, initializeApp } from 'firebase/app'
import { createUserWithEmailAndPassword, getAuth, signOut } from 'firebase/auth'
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore'

// Configuração pública do app web (não é segredo: quem protege os dados são as regras em firestore.rules)
export const firebaseConfig = {
  apiKey: 'AIzaSyDDe6z_Zmx-4HhOM-iCDcv8B5qcoHYOiiQ',
  authDomain: 'elvolcks-auto-som.firebaseapp.com',
  projectId: 'elvolcks-auto-som',
  storageBucket: 'elvolcks-auto-som.firebasestorage.app',
  messagingSenderId: '856129150259',
  appId: '1:856129150259:web:b5e758d8ed19dfb768b246',
}

export const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
// Cache no aparelho: abrir o sistema de novo não baixa tudo outra vez
export const db = initializeFirestore(app, {
  ignoreUndefinedProperties: true,
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
})

/** A equipe entra com um nome de usuário; por baixo, o Firebase usa um e-mail interno (nenhum e-mail é enviado). */
export const emailDoUsuario = (usuario: string) => `${usuario.trim().toLowerCase()}@elvolcks-auto-som.firebaseapp.com`

/**
 * Cria a conta de outra pessoa sem derrubar o login de quem está cadastrando
 * (no Firebase, criar uma conta entra nela automaticamente — por isso usa uma instância separada).
 */
export async function criarConta(usuario: string, senha: string) {
  const temp = initializeApp(firebaseConfig, `cadastro-${Date.now()}`)
  try {
    const authTemp = getAuth(temp)
    const { user } = await createUserWithEmailAndPassword(authTemp, emailDoUsuario(usuario), senha)
    await signOut(authTemp)
    return user.uid
  } finally {
    await deleteApp(temp)
  }
}

/** Mensagem em português para os erros mais comuns do Firebase. */
export function mensagemErro(e: unknown): string {
  const code = (e as { code?: string })?.code ?? ''
  if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found' || code === 'auth/invalid-email') return 'Usuário ou senha incorretos.'
  if (code === 'auth/too-many-requests') return 'Muitas tentativas. Aguarde alguns minutos e tente de novo.'
  if (code === 'auth/network-request-failed' || code === 'unavailable') return 'Sem conexão com a internet. Confira e tente de novo.'
  if (code === 'auth/email-already-in-use') return 'Esse usuário já existe. Escolha outro.'
  if (code === 'auth/weak-password') return 'A senha precisa ter pelo menos 6 caracteres.'
  if (code === 'permission-denied') return 'Sem permissão para isso.'
  return 'Algo deu errado. Tente de novo.'
}

import { useState, type FormEvent } from 'react'
import { Botao, Campo, inputCls, Logo } from '../components/ui'
import { useStore } from '../store'

export function Login() {
  const { entrar, avisoLogin } = useStore()
  const [usuario, setUsuario] = useState('')
  const [senha, setSenha] = useState('')
  const [verSenha, setVerSenha] = useState(false)
  const [erro, setErro] = useState('')
  const [entrando, setEntrando] = useState(false)

  const enviar = async (e: FormEvent) => {
    e.preventDefault()
    if (entrando) return
    if (!usuario.trim() || !senha) return setErro('Preencha usuário e senha.')
    setEntrando(true)
    const falha = await entrar(usuario, senha)
    // Deu certo: a tela troca sozinha quando os dados da conta chegam
    if (falha) {
      setErro(falha)
      setEntrando(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <Logo size={88} />
          <div className="mt-3 font-marca text-3xl leading-none font-bold tracking-wide text-white">ELVOLCKS</div>
          <div className="font-marca text-xs tracking-[0.3em] text-slate-400">AUTO SOM</div>
        </div>

        <form onSubmit={enviar} className="space-y-4 rounded-2xl bg-white p-6 shadow-2xl">
          <h1 className="font-display text-2xl font-semibold tracking-wide uppercase">Entrar</h1>
          <Campo rotulo="Usuário">
            <input
              className={inputCls}
              value={usuario}
              onChange={(e) => { setUsuario(e.target.value); setErro('') }}
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              autoFocus
              placeholder="Ex.: gabriel"
            />
          </Campo>
          <Campo rotulo="Senha">
            <div className="relative">
              <input
                className={`${inputCls} pr-20`}
                type={verSenha ? 'text' : 'password'}
                value={senha}
                onChange={(e) => { setSenha(e.target.value); setErro('') }}
                autoComplete="current-password"
              />
              <button type="button" onClick={() => setVerSenha((v) => !v)} className="absolute inset-y-0 right-0 px-3 text-xs font-semibold text-slate-500 hover:text-slate-800">
                {verSenha ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
          </Campo>
          {(erro || avisoLogin) && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{erro || avisoLogin}</p>}
          <Botao type="submit" className="w-full py-2.5" disabled={entrando}>{entrando ? 'Entrando…' : 'Entrar'}</Botao>
          <p className="text-center text-xs text-slate-500">Esqueceu a senha? Peça para um administrador trocar na tela Colaboradores.</p>
        </form>

      </div>
    </div>
  )
}

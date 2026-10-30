import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

/**
 * Tudo que é digitado no sistema vira MAIÚSCULO.
 * Ficam de fora: e-mail, número, data, senha (autocomplete com "password")
 * e campos marcados com autoCapitalize="none" (usuário de login).
 */
const TIPOS_TEXTO = new Set(['text', 'search', 'tel'])
const setInput = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
const setTextarea = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')!.set!

document.addEventListener(
  'input',
  (e) => {
    const el = e.target
    const ehInput = el instanceof HTMLInputElement
    if (!ehInput && !(el instanceof HTMLTextAreaElement)) return
    if (ehInput && !TIPOS_TEXTO.has(el.type)) return
    if ((e as InputEvent).isComposing) return
    if (el.getAttribute('autocapitalize') === 'none') return
    if ((el.getAttribute('autocomplete') ?? '').includes('password')) return

    const maiusculo = el.value.toUpperCase()
    if (maiusculo === el.value) return
    const { selectionStart, selectionEnd } = el
    // Usa o setter nativo para o React ainda enxergar a mudança e disparar o onChange
    ;(ehInput ? setInput : setTextarea).call(el, maiusculo)
    if (selectionStart !== null && selectionEnd !== null) el.setSelectionRange(selectionStart, selectionEnd)
  },
  true,
)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

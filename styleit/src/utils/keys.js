// Keyboard helpers. "Enter" moves to the next field, and sends the form on the last one.
const SKIP = ['hidden', 'file', 'radio', 'checkbox']

export const fieldsOf = (form) =>
  [...form.querySelectorAll('input,select,textarea')].filter(
    (x) => !x.disabled && !SKIP.includes(x.type) && !x.closest('[hidden]')
  )

export function enterNext(e) {
  if (e.key !== 'Enter' || e.nativeEvent.isComposing) return
  const t = e.target
  const f = t.form
  const typing = t.tagName === 'INPUT' && !['checkbox', 'radio', 'file', 'button', 'submit', 'reset'].includes(t.type)
  const bigBox = t.tagName === 'TEXTAREA' && (e.ctrlKey || e.metaKey) // Ctrl+Enter in a text box
  if (!f || !(typing || bigBox)) return
  e.preventDefault()
  const list = fieldsOf(f)
  const i = list.indexOf(t)
  if (i >= 0 && i < list.length - 1) list[i + 1].focus()
  else f.requestSubmit()
}

// Phone keyboards show "Next" or "Go" on the Enter key.
export function enterHint(e) {
  const t = e.target
  if (t.tagName !== 'INPUT' || !t.form || ['checkbox', 'radio', 'file'].includes(t.type)) return
  const list = fieldsOf(t.form)
  const i = list.indexOf(t)
  t.setAttribute('enterkeyhint', t.type === 'search' ? 'search' : i >= 0 && i < list.length - 1 ? 'next' : 'go')
}

export const formKeys = { onKeyDown: enterNext, onFocusCapture: enterHint }

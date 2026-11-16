import { useState } from 'react'
import Modal from './Modal'
import { useStore } from '../store/StoreContext'

function Body({ email: start, onClose }) {
  const { api } = useStore()
  const [step, setStep] = useState(1) // 1 = ask for email, 2 = code + new password
  const [f, setF] = useState({ email: start || '', code: '', pw: '', pc: '' })
  const [shown, setShown] = useState('') // the demo code
  const [err, setErr] = useState({ msg: '', id: '' })
  const set = (k) => (e) => { setF({ ...f, [k]: e.target.value }); setErr({ msg: '', id: '' }) }
  const fail = (msg, id) => { setErr({ msg, id }); document.getElementById(id)?.focus() }

  const send = async (e) => {
    e.preventDefault()
    const email = f.email.trim().toLowerCase()
    if (!/^\S+@\S+\.\S+$/.test(email)) return fail('Enter a valid email, like you@example.com.', 'fe')
    const r = await api.requestReset(email)
    if (r.error) return fail(r.error, 'fe')
    setF({ ...f, email }); setShown(r.code || ''); setStep(2)
  }
  const save = async (e) => {
    e.preventDefault()
    if (!f.code.trim()) return fail('Enter the 6-digit code.', 'fc')
    if (f.pw.length < 8) return fail('Password needs at least 8 characters.', 'fp')
    if (f.pw !== f.pc) return fail('Passwords do not match.', 'fq')
    const r = await api.resetPassword(f.email, f.code, f.pw)
    if (r.error) return fail(r.error, r.field || 'fc')
    onClose()
  }
  const inv = (id) => err.id === id || undefined
  return (
    <>
      <h2 id="fpt">Forgot password 🔐</h2>
      {step === 1 ? (
        <form className="f" onSubmit={send} noValidate>
          <p className="meta">Enter your account email and we’ll send you a code.</p>
          <label>Email address<input id="fe" type="email" value={f.email} onChange={set('email')} autoComplete="email" aria-invalid={inv('fe')} /></label>
          <div className="err" role="alert">{err.msg}</div>
          <div className="dact"><button type="button" className="btn ghost" onClick={onClose}>Cancel</button><button className="pill">Send code</button></div>
        </form>
      ) : (
        <form className="f" onSubmit={save} noValidate>
          <p className="meta" role="status">{shown ? <>Demo: no email service yet, so your code is shown here: <b>{shown}</b> (good for 10 minutes).</> : 'If that email has a password account, we sent a 6-digit code to it. It is good for 10 minutes. Check your Spam folder too. Didn’t get it? Go back and ask again (once a minute).'}</p>
          <label>6-digit code<input id="fc" inputMode="numeric" maxLength="6" value={f.code} onChange={set('code')} autoComplete="one-time-code" aria-invalid={inv('fc')} /></label>
          <label>New password<input id="fp" type="password" value={f.pw} onChange={set('pw')} autoComplete="new-password" aria-invalid={inv('fp')} /></label>
          <label>Confirm new password<input id="fq" type="password" value={f.pc} onChange={set('pc')} autoComplete="new-password" aria-invalid={inv('fq')} /></label>
          <div className="err" role="alert">{err.msg}</div>
          <div className="dact"><button type="button" className="btn ghost" onClick={() => { setStep(1); setErr({ msg: '', id: '' }) }}>Back</button><button className="pill">Change password</button></div>
        </form>
      )}
    </>
  )
}

export default function ForgotPassword({ open, onClose, email }) {
  return <Modal open={open} onClose={onClose} labelledBy="fpt">{open && <Body email={email} onClose={onClose} />}</Modal>
}

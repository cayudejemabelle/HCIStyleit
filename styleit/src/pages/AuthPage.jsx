import { useState } from 'react'
import Logo from '../components/Logo'
import Tools from '../components/Tools'
import SocialDialog from '../components/SocialDialog'
import ForgotPassword from '../components/ForgotPassword'
import { useStore } from '../store/StoreContext'
import { formKeys } from '../utils/keys'

const Icon = ({ children }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">{children}</svg>
)
const USER = <><circle cx="12" cy="8" r="4" /><path d="M4 20c1-4 4-6 8-6s7 2 8 6" /></>
const MAIL = <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>
const EYE = <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></>
const EYE_OFF = <><path d="M3 3l18 18" /><path d="M10.6 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4M6.5 6.6C3.8 8.4 2 12 2 12s3.5 7 10 7a9.6 9.6 0 0 0 4-.9" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" /></>
const LOCK = <><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>

// One input with a visible label, an icon and an underline.
function Field({ id, label, icon, invalid, extra, ...input }) {
  return (
    <div className="fld">
      <label htmlFor={id}>{label}</label>
      <div className="row">
        <Icon>{icon}</Icon>
        <input id={id} aria-invalid={invalid ? 'true' : undefined} {...input} />
        {extra}
      </div>
    </div>
  )
}

export default function AuthPage() {
  const { api } = useStore()
  const [mode, setMode] = useState('in') // 'in' = Sign In, 'up' = Sign Up
  const [f, setF] = useState({ an: '', ae: '', ap: '', ac: '' })
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState({ msg: '', field: '' })
  const up = mode === 'up'
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const [social, setSocial] = useState(null) // 'Google' | 'Facebook' | null
  const [forgot, setForgot] = useState(false)

  const submit = async (e) => {
    if (busy) return
    e.preventDefault()
    const email = f.ae.trim().toLowerCase()
    const name = f.an.trim()
    let msg = '', field = ''
    if (up && !name) { msg = 'Enter your full name.'; field = 'an' }
    else if (!/^\S+@\S+\.\S+$/.test(email)) { msg = 'Enter a valid email, like you@example.com.'; field = 'ae' }
    else if (f.ap.length < 8) { msg = 'Password needs at least 8 characters.'; field = 'ap' }
    else if (up && f.ac !== f.ap) { msg = 'Passwords do not match.'; field = 'ac' }
    else {
      setBusy(true)
      const r = await (up ? api.signUp(name, email, f.ap) : api.signIn(email, f.ap))
      setBusy(false)
      if (r.error) { msg = r.error; field = r.field }
    }
    if (msg) { setErr({ msg, field }); document.getElementById(field)?.focus() }
  }
  const switchMode = (m) => { setMode(m); setErr({ msg: '', field: '' }) }

  return (
    <div className="auth">
      <div className="tl authtl"><Tools /></div>
      <div className="phone">
        <div className="hero">
          <Logo />
          <div className="dots" aria-hidden="true">
            <span style={{ background: 'var(--women)' }}>👗</span>
            <span style={{ background: 'var(--men)' }}>🧥</span>
            <span style={{ background: 'var(--kids)' }}>👟</span>
          </div>
        </div>
        <div className="sheet">
          <h1 className="sr">Sign in or sign up to StyleIt</h1>
          <div className="utabs" role="group" aria-label="Account options">
            <button data-am="in" aria-pressed={!up} onClick={() => switchMode('in')}>Sign In</button>
            <button data-am="up" aria-pressed={up} onClick={() => switchMode('up')}>Sign Up</button>
          </div>
          <form onSubmit={submit} noValidate {...formKeys}>
            {up && <Field id="an" label="Full name" icon={USER} placeholder="Your name" autoComplete="name" value={f.an} onChange={set('an')} invalid={err.field === 'an'} />}
            <Field id="ae" label="Email address" icon={MAIL} type="email" placeholder="you@example.com" autoComplete="email" value={f.ae} onChange={set('ae')} invalid={err.field === 'ae'} />
            <Field id="ap" label="Password" icon={LOCK} type={show ? 'text' : 'password'} placeholder="At least 8 characters"
              autoComplete={up ? 'new-password' : 'current-password'} value={f.ap} onChange={set('ap')} invalid={err.field === 'ap'}
              extra={<button type="button" aria-label={show ? 'Hide password' : 'Show password'} onClick={() => setShow(!show)}><Icon>{show ? EYE_OFF : EYE}</Icon></button>} />
            {up && <Field id="ac" label="Confirm password" icon={LOCK} type={show ? 'text' : 'password'} placeholder="Re-enter your password" autoComplete="new-password" value={f.ac} onChange={set('ac')} invalid={err.field === 'ac'} />}
            <div className="err" role="alert">{err.msg}</div>
            <button className="pill" disabled={busy}>{busy ? 'Please wait…' : up ? 'Sign Up' : 'Sign In'}</button>
            {!up && <div><button type="button" className="link" onClick={() => setForgot(true)}>Forgot Password?</button></div>}
            <div className="or">or</div>
            <div className="soc">
              <button type="button" aria-label="Continue with Facebook" onClick={() => setSocial('Facebook')}>f</button>
              <button type="button" aria-label="Continue with Google" onClick={() => setSocial('Google')}>G</button>
            </div>
            <p className="hint">{up ? 'New accounts start as buyers. You can start selling later from your dashboard.' : 'New here? Choose Sign Up to make a free account.'}</p>
          </form>
        </div>
      </div>
      <SocialDialog provider={social} onClose={() => setSocial(null)} />
      <ForgotPassword open={forgot} onClose={() => setForgot(false)} email={f.ae} />
    </div>
  )
}

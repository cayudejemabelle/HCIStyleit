import { useState } from 'react'
import Modal from './Modal'
import { useStore } from '../store/StoreContext'

function Body({ provider, onClose }) {
  const { api } = useStore()
  const [f, setF] = useState({ name: '', email: '' })
  const [err, setErr] = useState({ msg: '', id: '' })
  const set = (k) => (e) => { setF({ ...f, [k]: e.target.value }); setErr({ msg: '', id: '' }) }
  const submit = async (e) => {
    e.preventDefault()
    const name = f.name.trim(), email = f.email.trim().toLowerCase()
    const fail = (msg, id) => { setErr({ msg, id }); document.getElementById(id)?.focus() }
    if (!name) return fail('Enter your name.', 'sn')
    if (!/^\S+@\S+\.\S+$/.test(email)) return fail('Enter a valid email, like you@example.com.', 'se')
    const r = await api.socialSignIn(provider, name, email)
    if (r.error) return fail(r.error, 'se')
    onClose()
  }
  return (
    <>
      <h2 id="sdt">Continue with {provider}</h2>
      <p className="meta">Demo screen: this doesn’t connect to {provider}. Type a name and an email that doesn’t already have a StyleIt account.</p>
      <form className="f" onSubmit={submit} noValidate>
        <label>Name<input id="sn" value={f.name} onChange={set('name')} autoComplete="name" aria-invalid={err.id === 'sn' || undefined} /></label>
        <label>{provider} email<input id="se" type="email" value={f.email} onChange={set('email')} autoComplete="email" aria-invalid={err.id === 'se' || undefined} /></label>
        <div className="err" role="alert">{err.msg}</div>
        <div className="dact"><button type="button" className="btn ghost" onClick={onClose}>Cancel</button><button className="pill">Continue</button></div>
      </form>
    </>
  )
}

export default function SocialDialog({ provider, onClose }) {
  return <Modal open={!!provider} onClose={onClose} labelledBy="sdt">{provider && <Body provider={provider} onClose={onClose} />}</Modal>
}

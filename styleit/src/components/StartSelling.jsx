import { useState } from 'react'
import Modal from './Modal'
import { useStore } from '../store/StoreContext'
import { formKeys } from '../utils/keys'

function Body({ onClose }) {
  const { api } = useStore()
  const [name, setName] = useState('')
  const [err, setErr] = useState('')
  const submit = (e) => {
    e.preventDefault()
    if (name.trim().length < 3) return setErr('Shop name needs at least 3 characters.')
    onClose()
    api.openShop(name.trim())
  }
  return (
    <>
      <h2 id="dh">Open your shop 🎀</h2>
      <p className="meta">Pick a shop name. You can switch between buying and selling any time.</p>
      <form className="f" onSubmit={submit} noValidate {...formKeys}>
        <label>Shop name<input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Pretty Closet" autoComplete="off" /></label>
        <div className="err" role="alert">{err}</div>
        <div className="dact">
          <button type="button" className="btn ghost" onClick={onClose}>Cancel</button>
          <button className="pill">Start selling</button>
        </div>
      </form>
    </>
  )
}

export default function StartSelling({ open, onClose }) {
  return <Modal open={open} onClose={onClose} labelledBy="dh">{open && <Body onClose={onClose} />}</Modal>
}

import { useState } from 'react'
import Modal from './Modal'
import { useStore, peso } from '../store/StoreContext'
import { PAY } from '../constants'

function Body({ onClose, onDone }) {
  const { s, api, toast } = useStore()
  const [pm, setPm] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  // group the ticked items by shop
  const groups = {}
  s.chk.forEach((id) => {
    const p = s.products.find((x) => x.id === id)
    if (p) (groups[p.shop] = groups[p.shop] || []).push({ n: p.n, q: s.cart[id], pr: p.pr })
  })
  const total = Object.values(groups).flat().reduce((a, i) => a + i.pr * i.q, 0)

  const submit = async (e) => {
    e.preventDefault()
    if (busy) return
    if (!pm) return setErr('Please choose how you’d like to pay.')
    setBusy(true)
    const r = await api.placeOrder(pm)
    setBusy(false)
    if (r.error) return setErr(r.error)
    toast('Order placed! Your items stay in the cart so you can buy them again.', 4000)
    onDone()
  }
  return (
    <>
      <h2 id="pt">Checkout 🧾</h2>
      {Object.entries(groups).map(([shop, items]) => (
        <div key={shop}>
          <p className="meta" style={{ margin: '.5rem 0 0' }}>From {shop}</p>
          <ul className="al">{items.map((i, k) => <li key={k}><span>{i.n} × {i.q}</span><span>{peso(i.pr * i.q)}</span></li>)}</ul>
        </div>
      ))}
      <p style={{ textAlign: 'right' }}><strong>Total: {peso(total)}</strong></p>
      <form onSubmit={submit} noValidate>
        <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
          <legend><strong>How would you like to pay?</strong></legend>
          {PAY.map(([k, label]) => (
            <label key={k} className="po"><input type="radio" name="pm" value={k} checked={pm === k} onChange={() => { setPm(k); setErr('') }} /> {label}</label>
          ))}
        </fieldset>
        <p className="meta">Demo only: no real payment is made.</p>
        <div className="err" role="alert">{err}</div>
        <div className="dact">
          <button type="button" className="btn ghost" onClick={onClose}>Cancel</button>
          <button className="pill" disabled={busy}>{busy ? 'Placing…' : 'Confirm order'}</button>
        </div>
      </form>
    </>
  )
}

export default function Checkout({ open, onClose, onDone }) {
  return <Modal open={open} onClose={onClose} labelledBy="pt">{open && <Body onClose={onClose} onDone={onDone} />}</Modal>
}

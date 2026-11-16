import { useState } from 'react'
import Modal from './Modal'
import { useStore } from '../store/StoreContext'
import { REASONS } from '../constants'

function Body({ p, onClose }) {
  const { api } = useStore()
  const [r, setR] = useState(-1)
  const [note, setNote] = useState('')
  const [err, setErr] = useState('')
  const submit = async (e) => {
    e.preventDefault()
    if (r < 0) return setErr('Please choose a reason.')
    if (r === 5 && note.trim().length < 5) return setErr('Please explain the reason for “Other”.')
    if (await api.adminRemove(p.id, r, note.trim())) onClose() // the server turns the reason number into words
  }
  return (
    <>
      <h2 id="rt">Remove this product? ⚠️</h2>
      <p>“{p.n}” from <strong>{p.shop}</strong> will be removed. The seller gets a warning with your reason right away.</p>
      <form className="f" onSubmit={submit} noValidate>
        <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
          <legend><strong>Reason for removing</strong></legend>
          {REASONS.map((x, i) => <label key={i} className="po"><input type="radio" name="rr" checked={r === i} onChange={() => { setR(i); setErr('') }} /> {x}</label>)}
        </fieldset>
        <label>Message to the seller (required for “Other”)<textarea rows="3" maxLength="200" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Explain what the seller should fix" /></label>
        <div className="err" role="alert">{err}</div>
        <div className="dact"><button type="button" className="btn ghost" onClick={onClose}>Cancel</button><button className="pill">Remove &amp; warn seller</button></div>
      </form>
    </>
  )
}

// Admin removing a SELLER's product: a reason is required, and the seller is warned.
export default function RemoveProduct({ id, onClose }) {
  const { s } = useStore()
  const p = s.products.find((x) => x.id === id)
  return <Modal open={!!p} onClose={onClose} labelledBy="rt">{p && <Body p={p} onClose={onClose} />}</Modal>
}

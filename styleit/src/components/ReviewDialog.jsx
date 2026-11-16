import { useState } from 'react'
import Modal from './Modal'
import { useStore } from '../store/StoreContext'

const WORDS = ['', 'Not good', 'Okay', 'Good', 'Very good', 'Loved it!']
const stars = (n) => '★'.repeat(n) + '☆'.repeat(5 - n)

function Body({ p, onClose }) {
  const { api } = useStore()
  const [rating, setRating] = useState(0)
  const [text, setText] = useState('')
  const [err, setErr] = useState('')
  const submit = async (e) => {
    e.preventDefault()
    if (!rating) return setErr('Please choose a star rating.')
    if (await api.addReview(p.id, rating, text.trim())) onClose()
  }
  return (
    <>
      <h2 id="rvt">Review “{p.n}” ⭐</h2>
      <form className="f" onSubmit={submit} noValidate>
        <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
          <legend><strong>How was it?</strong></legend>
          {[5, 4, 3, 2, 1].map((n) => (
            <label key={n} className="po"><input type="radio" name="st" checked={rating === n} onChange={() => { setRating(n); setErr('') }} /> <span aria-hidden="true">{stars(n)}</span> {WORDS[n]}</label>
          ))}
        </fieldset>
        <label>Comment (optional)<textarea rows="3" maxLength="200" value={text} onChange={(e) => setText(e.target.value)} placeholder="Fit, quality, shipping…" /></label>
        <div className="err" role="alert">{err}</div>
        <div className="dact"><button type="button" className="btn ghost" onClick={onClose}>Cancel</button><button className="pill">Submit review</button></div>
      </form>
    </>
  )
}

export default function ReviewDialog({ pid, onClose }) {
  const { s } = useStore()
  const p = s.products.find((x) => x.id === pid)
  return <Modal open={!!p} onClose={onClose} labelledBy="rvt">{p && <Body p={p} onClose={onClose} />}</Modal>
}

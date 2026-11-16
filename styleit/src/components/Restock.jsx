import { useEffect, useRef, useState } from 'react'
import { useStore, left } from '../store/StoreContext'

// Pop-up to add more units to a product. "Sold" is history and never changes.
export default function Restock({ id, onClose }) {
  const { s, api } = useStore()
  const ref = useRef()
  const [n, setN] = useState('')
  const [err, setErr] = useState('')
  const p = s.products.find((x) => x.id === id)

  useEffect(() => {
    const d = ref.current
    if (id && p) { if (!d.open) d.showModal(); setN(''); setErr('') }
    else if (d.open) d.close()
  }, [id])

  const submit = async (e) => {
    e.preventDefault()
    const q = Number(n)
    if (!Number.isInteger(q) || q < 1) return setErr('Enter how many items you are adding (1 or more).')
    if (q > 10000) return setErr('That is too many. Enter 10,000 or less.')
    if (await api.restock(id, q)) onClose()
  }

  return (
    <dialog ref={ref} onClose={onClose} aria-labelledby="rs-t">
      {p && (
        <form className="f" onSubmit={submit} noValidate>
          <h2 id="rs-t">Restock {p.n}</h2>
          <p className="meta">Stock left now: <b>{left(p)}</b> · Already sold: {p.sold}</p>
          <label>How many items are you adding?
            <input id="rs-n" type="number" inputMode="numeric" min="1" value={n} onChange={(e) => { setN(e.target.value); setErr('') }} autoFocus aria-invalid={err ? 'true' : undefined} />
          </label>
          {n > 0 && <p className="meta">New stock left: <b>{left(p) + Number(n)}</b></p>}
          <div className="err" role="alert">{err}</div>
          <div className="dact">
            <button type="button" className="btn ghost" onClick={onClose}>Cancel</button>
            <button className="pill">Add stock</button>
          </div>
        </form>
      )}
    </dialog>
  )
}

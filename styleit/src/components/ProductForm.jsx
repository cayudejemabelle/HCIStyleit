import { useState } from 'react'
import { readImg } from '../utils/image'
import { formKeys } from '../utils/keys'

// Used for both "Add a product" and "Edit product". The photo is required when adding.
export default function ProductForm({ pre = 'p', initial, sold = 0, editing = false, submitLabel, onSubmit, onCancel }) {
  const [f, setF] = useState({
    n: initial?.n || '', g: initial?.g || 'Women', s: initial?.s || '',
    pr: initial?.pr ?? '', stock: editing ? Math.max(0, (initial?.stock || 0) - sold) : (initial?.stock ?? ''), desc: initial?.desc || '', // editing shows stock LEFT
  })
  const [img, setImg] = useState('') // a newly chosen photo
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState({ msg: '', id: '' })
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const id = (k) => pre + k

  const pick = async (e) => {
    setBusy(true)
    const r = await readImg(e.target.files[0])
    setBusy(false)
    if (r.error) setErr({ msg: r.error, id: id('i') })
    else { setImg(r.img); setErr({ msg: '', id: '' }) }
  }
  const fail = (msg, key) => { setErr({ msg, id: id(key) }); document.getElementById(id(key))?.focus() }

  const submit = (e) => {
    e.preventDefault()
    const v = { n: f.n.trim(), g: f.g, s: f.s.trim(), pr: Math.round(+f.pr), stock: Math.floor(+f.stock) + (editing ? sold : 0), desc: f.desc.trim(), img }
    if (busy) return setErr({ msg: 'Your photo is still loading. Try again in a second.', id: '' })
    if (!v.n) return fail('Enter a product name.', 'n')
    if (!v.s) return fail('Enter a category.', 's')
    if (!(v.pr > 0)) return fail('Enter a price above 0.', 'p')
    if (editing) { if (f.stock === '' || !(+f.stock >= 0)) return fail('Enter how many items are left (0 or more).', 'k') }
    else if (!(v.stock >= 1)) return fail('Enter how many items you have (at least 1).', 'k')
    if (!editing && !v.img) return fail('Please upload a photo of your product.', 'i')
    onSubmit(v)
  }
  const shown = img || initial?.img
  return (
    <form className="f" onSubmit={submit} noValidate {...formKeys}>
      <label>Product name<input id={id('n')} value={f.n} onChange={set('n')} aria-invalid={err.id === id('n') || undefined} /></label>
      <label>Group<select id={id('g')} value={f.g} onChange={set('g')}><option>Women</option><option>Men</option><option>Kids</option></select></label>
      <label>Category<input id={id('s')} value={f.s} onChange={set('s')} placeholder="Tops, Dresses, Shoes…" aria-invalid={err.id === id('s') || undefined} /></label>
      <label>Price (₱)<input id={id('p')} type="number" min="1" value={f.pr} onChange={set('pr')} aria-invalid={err.id === id('p') || undefined} /></label>
      <label>{editing ? 'Stock left (items on your shelf now)' : 'How many items do you have?'}<input id={id('k')} type="number" min={editing ? 0 : 1} step="1" value={f.stock} onChange={set('stock')} placeholder="e.g. 20" aria-invalid={err.id === id('k') || undefined} /></label>
      <p className="meta" style={{ margin: 0 }}>{editing ? `Already sold: ${sold}. That number never changes. To restock, type how many are on your shelf now.` : 'Buyers will see how many are sold and how many are left.'}</p>
      <label>Description (optional)<textarea id={id('d')} rows="3" maxLength="200" value={f.desc} onChange={set('desc')} placeholder="Fabric, size, how it fits…" /></label>
      <label>{editing ? 'Change photo (optional)' : 'Product photo'}<input id={id('i')} type="file" accept="image/*" onChange={pick} aria-invalid={err.id === id('i') || undefined} /></label>
      {shown && <img className="bigimg" src={shown} alt="Preview of your photo" />}
      <div className="err" role="alert">{err.msg}</div>
      {onCancel
        ? <div className="dact"><button type="button" className="btn ghost" onClick={onCancel}>Cancel</button><button className="pill">{submitLabel}</button></div>
        : <button className="pill">{submitLabel}</button>}
    </form>
  )
}

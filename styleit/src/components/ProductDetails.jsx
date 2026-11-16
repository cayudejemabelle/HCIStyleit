import Modal from './Modal'
import { useStore, left, peso, when } from '../store/StoreContext'
import { rvOf, avg } from '../utils/shop'

const stars = (n) => '★'.repeat(n) + '☆'.repeat(5 - n)

// Buyers only see details and reviews. The Edit button appears only when a seller opens their own product (onEdit).
export default function ProductDetails({ id, onClose, onEdit }) {
  const { s } = useStore()
  const p = s.products.find((x) => x.id === id)
  const rv = p ? rvOf(s, p.id) : []
  return (
    <Modal open={!!p} onClose={onClose} labelledBy="dtn">
      {p && (
        <>
          {p.img
            ? <img className="bigimg" src={p.img} alt={p.n} />
            : <div className="bigimg" style={{ display: 'grid', placeItems: 'center', fontSize: '5rem', background: `var(--${p.g.toLowerCase()})` }} aria-hidden="true">{p.e}</div>}
          <h2 id="dtn" style={{ marginTop: '.6rem' }}>{p.n}</h2>
          <p className="meta">{p.g} · {p.s} · by {p.shop}</p>
          <p className="price" style={{ fontSize: '1.4rem' }}>{peso(p.pr)}</p>
          <p><strong>{p.sold}</strong> sold · <strong>{left(p)}</strong> left (of {p.stock})</p>
          <p>{p.desc || 'No description yet.'}</p>
          <h3 style={{ fontSize: '1rem', margin: '.6rem 0 .2rem' }}>
            Reviews ⭐ {rv.length > 0 && <span className="meta">{avg(s, p.id).toFixed(1)} / 5 · {rv.length} review{rv.length > 1 ? 's' : ''}</span>}
          </h3>
          <ul className="al">
            {rv.length === 0 && <li className="meta">No reviews yet.</li>}
            {[...rv].reverse().map((r, i) => (
              <li key={i}>
                <span><strong aria-label={`${r.rating} out of 5 stars`}>{stars(r.rating)}</strong> {r.name}{r.text && <><br />{r.text}</>}</span>
                <span className="meta">{when(r.t)}</span>
              </li>
            ))}
          </ul>
          <p className="meta">Added {when(p.t)}{p.u ? ' · Last edited ' + when(p.u) : ''}</p>
          <div className="dact">{onEdit ? <button className="btn btn-p" onClick={() => onEdit(p.id)}>Edit</button> : <span />}<button className="btn ghost" onClick={onClose}>Close</button></div>
        </>
      )}
    </Modal>
  )
}

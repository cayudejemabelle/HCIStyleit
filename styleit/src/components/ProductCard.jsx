import { useStore, left, peso } from '../store/StoreContext'
import { rvOf, avg } from '../utils/shop'

export default function ProductCard({ p, onDetails }) {
  const { s, api } = useStore()
  const l = left(p)
  const rv = rvOf(s, p.id)
  return (
    <article className="card" data-c={p.g}>
      <div className="img">
        <span className="tag">{p.g}</span>
        {p.img ? <img src={p.img} alt={p.n} /> : <span aria-hidden="true">{p.e}</span>}
      </div>
      <div className="info">
        <h3>{p.n}</h3>
        <div className="meta">by {p.shop} · {rv.length ? `★ ${avg(s, p.id).toFixed(1)} (${rv.length})` : 'No reviews yet'}</div>
        <div className="price">{peso(p.pr)}</div>
        <div className="meta">
          <strong>{p.sold}</strong> sold ·{' '}
          {l < 1 ? <strong>Sold out</strong> : l <= 5 ? <strong style={{ color: 'var(--deep)' }}>Only {l} left!</strong> : `${l} left`}
        </div>
        <button className="btn ghost" onClick={onDetails}>Details</button>
        <button className="btn btn-p" disabled={l < 1} onClick={() => api.addToCart(p.id)}>{l < 1 ? 'Sold out' : 'Add to cart 🛒'}</button>
      </div>
    </article>
  )
}

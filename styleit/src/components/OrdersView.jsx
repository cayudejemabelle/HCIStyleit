import { useStore, peso, when } from '../store/StoreContext'
import { STEPS } from '../constants'
import { myOrders } from '../utils/shop'

// The "where is my order?" timeline, like parcel tracking apps.
function Timeline({ o }) {
  return (
    <ol className="tmln" aria-label="Order tracking">
      {STEPS.map((x, i) => {
        const done = i < o.st || o.st === 5
        const now = i === o.st && o.st < 5
        return (
          <li key={i} className={done ? 'done' : now ? 'now' : 'todo'}>
            <span className="dot" aria-hidden="true">{done ? '✓' : ''}</span>
            <div>
              <strong>{x[0]}</strong>{now && <span className="nowtag">📍 Now</span>}
              <div className="meta">{x[1]}</div>
              {o.h[i] && <div className="meta">{when(o.h[i])}</div>}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

export default function OrdersView({ onReview }) {
  const { s, me, api, ask } = useStore()
  const list = myOrders(s, me.id).slice().reverse()
  if (!list.length) return <div className="empty"><h3>No orders yet</h3><p>Orders you place will show up here.</p></div>
  return list.map((o) => (
    <article className="box" key={o.id}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '.5rem', flexWrap: 'wrap' }}>
        <strong>Order #{o.id} · {o.shop}</strong><span className="meta">{when(o.t)}</span>
      </div>
      <p className="meta" style={{ margin: '.2rem 0' }}>Payment: {o.pay} · {o.paid ? 'Paid' : 'Pay on delivery'}</p>
      {o.cx
        ? <p><strong>❌ This order was cancelled.</strong></p>
        : <><h3 style={{ fontSize: '1rem', marginTop: '.6rem' }}>Track your order 📍</h3><Timeline o={o} /></>}
      <ul className="al">{o.items.map((i, k) => (
        <li key={k}>
          <span>{i.n} × {i.q}</span>
          <span>{peso(i.pr * i.q)}{' '}
            {!o.cx && o.st === 5 && (s.reviews.some((r) => r.pid === i.pid && r.bid === me.id)
              ? <span className="meta">Reviewed ✓</span>
              : s.products.some((p) => p.id === i.pid) && <button className="btn ghost" onClick={() => onReview(i.pid)}>⭐ Review</button>)}
          </span>
        </li>
      ))}</ul>
      <p style={{ textAlign: 'right', margin: '.5rem 0' }}><strong>Total: {peso(o.total)}</strong></p>
      <div className="acts">
        {!o.cx && o.st < 2 && (
          <button className="btn ghost" onClick={() => ask(`Cancel order #${o.id}?`, 'The seller will be told. You can only cancel before it ships.', 'Yes, cancel order', () => api.cancelOrder(o.id))}>Cancel order</button>
        )}
        {!o.cx && o.st === 4 && (
          <button className="btn btn-p" onClick={() => ask(`Confirm you received order #${o.id}?`, 'Only confirm once the parcel is in your hands.', 'Yes, I got it', () => api.markReceived(o.id))}>Order received ✓</button>
        )}
      </div>
    </article>
  ))
}

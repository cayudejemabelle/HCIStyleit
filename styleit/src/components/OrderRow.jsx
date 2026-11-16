import { useStore, peso } from '../store/StoreContext'
import { STEPS, NEXT } from '../constants'

// One order in a list. Sellers get a button for the next step; admins just see the status.
export default function OrderRow({ o, ship }) {
  const { api, ask } = useStore()
  const next = () => ask(`${NEXT[o.st]} for order #${o.id}?`, 'The buyer will be notified. You can’t undo this.', 'Yes, ' + NEXT[o.st].toLowerCase(), () => api.advanceOrder(o.id))
  return (
    <li>
      <span>
        <strong>#{o.id}</strong> {o.buyer}{' '}
        <span className="meta">→ {o.shop} · {o.pay}<br />{o.items.map((i) => `${i.n} ×${i.q}`).join(', ')}</span>
      </span>
      <span>
        {peso(o.total)}{' '}
        {o.cx ? <span className="meta">Cancelled</span>
          : ship ? (o.st < 5
            ? <button className="btn ghost" {...(o.st < 2 ? { 'data-pend': '' } : {})} onClick={next}>{NEXT[o.st]}</button>
            : <span className="meta">Delivered ✓</span>)
          : <span className="meta">{STEPS[o.st][0]}</span>}
      </span>
    </li>
  )
}

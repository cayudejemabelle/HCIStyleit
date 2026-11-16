import { useEffect, useRef } from 'react'
import { useStore, left, peso } from '../store/StoreContext'
import { CART_MAX } from '../constants'
import { boughtBy } from '../utils/shop'
import Pic from './Pic'

// The cart slides in from the right. Tick items, change quantity, delete, or buy only the ticked ones.
export default function CartDrawer({ onView, onBuy }) {
  const { s, me, api, ask, toast } = useStore()
  const rows = Object.keys(s.cart).map((id) => ({ p: s.products.find((x) => x.id === +id), id: +id, q: s.cart[id] })).filter((r) => r.p)
  const avail = rows.filter((r) => left(r.p) > 0)
  const picked = rows.filter((r) => s.chk.includes(r.id))
  const total = picked.reduce((a, r) => a + r.p.pr * r.q, 0)
  const all = avail.length > 0 && picked.length === avail.length
  const allRef = useRef(null)
  useEffect(() => { if (allRef.current) allRef.current.indeterminate = picked.length > 0 && !all }, [picked.length, all])

  const removeOne = (r) => ask('Remove from cart?', `“${r.p.n}” will be removed from your cart.`, 'Yes, remove', () => { api.removeFromCart([r.id]); toast('Removed from cart') })
  const removeSel = () => {
    if (!picked.length) return toast('Select the items you want to delete first')
    ask(`Remove ${picked.length} item${picked.length > 1 ? 's' : ''}?`, 'The selected items will be removed from your cart.', 'Yes, remove', () => { api.removeFromCart(picked.map((r) => r.id)); toast('Selected items removed') })
  }

  return (
    <aside className={'drawer' + (s.cartOpen ? ' open' : '')} aria-label="Shopping cart" aria-hidden={!s.cartOpen} {...(s.cartOpen ? {} : { inert: '' })}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Your cart 🛒 <span className="meta" aria-live="polite">({rows.length}/{CART_MAX} items{rows.length >= CART_MAX ? ' · full' : ''})</span></h2>
        <button className="btn btn-p" onClick={() => api.setCart(false)}>Close</button>
      </div>
      <div className="cartbar">
        <label className="ck">
          <input type="checkbox" id="selAll" ref={allRef} checked={all} disabled={!avail.length} onChange={(e) => api.selectAll(avail.map((r) => r.id), e.target.checked)} />
          <span>{picked.length ? `${picked.length} selected` : 'Select all'}</span>
        </label>
        <button className="btn ghost" data-delsel onClick={removeSel}>🗑 Delete selected</button>
      </div>
      <ul id="items">
        {rows.length === 0 && <li className="meta">Your cart is empty. Add something pretty!</li>}
        {rows.map((r) => {
          const l = left(r.p)
          const bought = me && boughtBy(s, me.id, r.id)
          return (
            <li key={r.id}>
              <input type="checkbox" checked={s.chk.includes(r.id)} disabled={l < 1} onChange={(e) => api.toggleSel(r.id, e.target.checked)} aria-label={`Select ${r.p.n}`} />
              <button className="cartpic" onClick={() => onView(r.id)} aria-label={`See details of ${r.p.n}`}><Pic p={r.p} /></button>
              <div className="n">
                <button className="link nm" onClick={() => onView(r.id)}>{r.p.n}</button>
                <div className="meta">{r.p.shop} · {peso(r.p.pr)} · {l < 1 ? <strong>Sold out</strong> : `${l} left`}{bought ? ' · ✓ Bought before' : ''}</div>
              </div>
              <div className="qty">
                <button onClick={() => api.changeQty(r.id, -1)} aria-label={`Remove one ${r.p.n}`}>−</button>
                <span>{r.q}</span>
                <button onClick={() => api.changeQty(r.id, 1)} disabled={r.q >= l} aria-label={`Add one ${r.p.n}`}>+</button>
              </div>
              <button className="btn ghost" onClick={() => removeOne(r)} aria-label={`Remove ${r.p.n} from cart`}>🗑</button>
            </li>
          )
        })}
      </ul>
      <p><strong>Total (selected): {peso(total)}</strong></p>
      <button className="pill" id="buyBtn" onClick={() => (picked.length ? onBuy() : toast('Select the items you want to buy first'))}>
        Buy selected{picked.length ? ` (${picked.length})` : ''}
      </button>
    </aside>
  )
}

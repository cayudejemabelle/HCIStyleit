import { useEffect, useRef } from 'react'
import { useStore, left, when } from '../store/StoreContext'
import { boughtBy, myOrders, notesKey } from '../utils/shop'

// Reminders (things to do) + Updates (things that happened). Items with an arrow are clickable.
// The reminders are different for buyers, sellers and the admin.
export default function Notifications({ go }) {
  const { s, me, api } = useStore()
  const key = notesKey(me)
  const mine = s.notes.filter((n) => n.to === key).slice().reverse()
  const fresh = useRef(null)
  if (fresh.current === null) fresh.current = new Set(mine.filter((n) => !n.read).map((n) => n.id)) // remember what was new
  useEffect(() => { api.markRead() }, [])

  const rem = []
  if (me.role === 'admin') {
    // the admin sees no orders or money, so there are no order reminders here
  } else if (s.mode === 'seller') {
    const w = s.orders.filter((o) => o.sel === me.id && !o.cx && o.st < 2).length
    if (w) rem.push([`⏰ ${w} order${w > 1 ? 's are' : ' is'} waiting to be prepared or shipped.`, 's:or:pend'])
    const mp = s.products.filter((p) => p.sel === me.id)
    if (!mp.length) rem.push(['🎀 Add your first product so buyers can find your shop.', 's:ov:pn'])
    mp.forEach((p) => {
      if (left(p) === 0) rem.push([`🚫 “${p.n}” is sold out. Add more stock to sell it again.`, 's:pr'])
      else if (left(p) <= 3) rem.push([`📉 “${p.n}” has only ${left(p)} left. Restock soon.`, 's:pr'])
    })
    if (me.warns) rem.push([`⚠️ You have ${me.warns} warning${me.warns > 1 ? 's' : ''} from the admin. Check your updates below.`, ''])
  } else {
    const inCart = Object.keys(s.cart).filter((id) => !boughtBy(s, me.id, +id)).length
    if (inCart) rem.push([`🛒 You still have ${inCart} item${inCart > 1 ? 's' : ''} in your cart waiting to be bought.`, 'b:cart'])
    const mo = myOrders(s, me.id)
    mo.filter((o) => !o.cx && o.st === 4).forEach((o) => rem.push([`🛵 Order #${o.id} is out for delivery. Tap “Order received” once it arrives.`, 'b:orders']))
    mo.filter((o) => !o.cx && o.st === 5 && o.items.some((i) => s.products.some((p) => p.id === i.pid) && !s.reviews.some((r) => r.pid === i.pid && r.bid === me.id)))
      .forEach((o) => rem.push([`⭐ Order #${o.id} arrived. Tell others what you think with a review.`, 'b:orders']))
  }

  const link = (text, act) => (act ? <button className="link" onClick={() => go(act)}>{text} →</button> : text)
  return (
    <>
      <div className="box">
        <h3>Reminders ⏰</h3>
        <ul className="al">
          {rem.length === 0 && <li className="meta">You’re all caught up. No reminders right now.</li>}
          {rem.map((r, i) => <li key={i}>{link(r[0], r[1])}</li>)}
        </ul>
      </div>
      <div className="box">
        <h3>Updates 🔔</h3>
        <ul className="al">
          {mine.length === 0 && <li className="meta">Nothing here yet.</li>}
          {mine.map((n) => (
            <li key={n.id}>
              <span>{n.icon} {fresh.current.has(n.id) && <strong className="new">New</strong>} {link(n.text, n.act)}{n.note && <><br /><span className="meta">{n.note}</span></>}</span>
              <span className="meta">{when(n.t)}</span>
            </li>
          ))}
        </ul>
      </div>
    </>
  )
}

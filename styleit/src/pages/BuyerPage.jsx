import { useState } from 'react'
import AppHeader from '../components/AppHeader'
import ProductCard from '../components/ProductCard'
import ProductDetails from '../components/ProductDetails'
import TopSellers from '../components/TopSellers'
import CartDrawer from '../components/CartDrawer'
import Checkout from '../components/Checkout'
import OrdersView from '../components/OrdersView'
import Notifications from '../components/Notifications'
import StartSelling from '../components/StartSelling'
import ReviewDialog from '../components/ReviewDialog'
import { useStore } from '../store/StoreContext'
import { formKeys } from '../utils/keys'
import { boughtBy, myOrders } from '../utils/shop'

const GROUPS = ['All', 'Women', 'Men', 'Kids']

// The buyer dashboard: shop, My orders, Notifications. The first screen after login.
export default function BuyerPage() {
  const { s, me, api } = useStore()
  const [vw, setVw] = useState('shop') // 'shop' | 'orders' | 'notif'
  const [grp, setGrp] = useState('All')
  const [cat, setCat] = useState('All')
  const [term, setTerm] = useState('')
  const [sort, setSort] = useState('n')
  const [detail, setDetail] = useState(null) // product id shown in Details
  const [checkout, setCheckout] = useState(false)
  const [selling, setSelling] = useState(false)
  const [reviewing, setReviewing] = useState(null) // product id being reviewed

  const orders = myOrders(s, me.id)
  const unread = s.notes.filter((n) => n.to === me.email && !n.read).length
  const badge = Object.keys(s.cart).reduce((a, id) => a + (boughtBy(s, me.id, +id) ? 0 : s.cart[id]), 0)

  // filter + sort the products
  const subs = ['All', ...new Set(s.products.filter((p) => grp === 'All' || p.g === grp).map((p) => p.s))]
  const catNow = subs.includes(cat) ? cat : 'All'
  const q = term.trim().toLowerCase()
  let list = s.products.filter((p) => (grp === 'All' || p.g === grp) && (catNow === 'All' || p.s === catNow) && (!q || (p.n + ' ' + p.g + ' ' + p.s + ' ' + p.shop).toLowerCase().includes(q)))
  if (sort === 'lo') list = [...list].sort((a, b) => a.pr - b.pr)
  else if (sort === 'hi') list = [...list].sort((a, b) => b.pr - a.pr)
  else list = [...list].reverse()

  const title = (grp === 'All' ? 'All clothes' : grp === 'Kids' ? 'Kids’ clothes' : grp + '’s clothes') + (catNow !== 'All' ? ' – ' + catNow : '')
  const go = (act) => { const [k, v] = act.split(':'); if (k === 'b') (v === 'cart' ? api.setCart(true) : setVw(v)) }
  const viewShop = (shop) => { setTerm(shop); setGrp('All'); setCat('All'); setVw('shop'); window.scrollTo(0, 0) }

  const tab = (label, on, click, extra = {}) => <button key={label} className="tab" aria-pressed={on} onClick={click} {...extra}>{label}</button>

  return (
    <>
      <AppHeader
        mid={
          <form className="search" role="search" onSubmit={(e) => e.preventDefault()} {...formKeys}>
            <label htmlFor="q" className="sr">Search clothes</label>
            <input id="q" type="search" placeholder="Search dresses, shirts, shoes…" autoComplete="off" value={term} onChange={(e) => { setTerm(e.target.value); setVw('shop') }} />
            <button>Search</button>
          </form>
        }
        right={<>
          <button className="btn" onClick={() => api.setCart(true)} aria-label="Open cart">🛒 Cart <span className="badge">{badge}</span></button>
          <button className="btn ghost" onClick={api.logout}>Log out</button>
        </>}
        nav={<>
          <span className="tg">
            {GROUPS.map((g) => tab(g, vw === 'shop' && grp === g, () => { setVw('shop'); setGrp(g); setCat('All') }))}
            {tab(`My orders${orders.length ? ` (${orders.length})` : ''}`, vw === 'orders', () => setVw('orders'), { 'data-v': 'orders' })}
            {tab(`🔔 Notifications${unread ? ` (${unread})` : ''}`, vw === 'notif', () => setVw('notif'), { 'data-v': 'notif' })}
          </span>
          {me.seller
            ? <button className="btn sell" onClick={() => api.setMode('seller')}>🏪 My shop</button>
            : <button className="btn sell" onClick={() => setSelling(true)}>✨ Start selling</button>}
        </>}
      />

      <main className="page">
        <section className="welcome">
          <h1>Hi, {me.name.split(' ')[0]} ✨</h1>
          <p>Find something pretty today. Want to sell too? Tap “Start selling” in the menu. 💖</p>
        </section>

        {vw === 'shop' && (
          <div>
            <TopSellers onShop={viewShop} />
            <h2>{title}</h2>
            <div className="bar">
              <div className="chips" role="group" aria-label="Categories">
                {subs.map((c) => <button key={c} className="chip" aria-pressed={c === catNow} onClick={() => setCat(c)}>{c}</button>)}
              </div>
              <label>Sort{' '}
                <select value={sort} onChange={(e) => setSort(e.target.value)}>
                  <option value="n">Newest</option><option value="lo">Price: low to high</option><option value="hi">Price: high to low</option>
                </select>
              </label>
            </div>
            <p className="meta" aria-live="polite">{list.length} item{list.length === 1 ? '' : 's'}{q ? ` for “${term.trim()}”` : ''}</p>
            <div className="grid">
              {list.length === 0 && <div className="empty"><h3>No items found</h3><p>Try a shorter word like “dress”.</p></div>}
              {list.map((p) => <ProductCard key={p.id} p={p} onDetails={() => setDetail(p.id)} />)}
            </div>
          </div>
        )}
        {vw === 'orders' && <section><h2>My orders 📦</h2><OrdersView onReview={setReviewing} /></section>}
        {vw === 'notif' && <section><h2>Notifications 🔔</h2><Notifications go={go} /></section>}
      </main>

      <CartDrawer onView={setDetail} onBuy={() => { api.setCart(false); setCheckout(true) }} />
      <ProductDetails id={detail} onClose={() => setDetail(null)} />
      <Checkout open={checkout} onClose={() => setCheckout(false)} onDone={() => { setCheckout(false); setVw('orders') }} />
      <StartSelling open={selling} onClose={() => setSelling(false)} />
      <ReviewDialog pid={reviewing} onClose={() => setReviewing(null)} />
    </>
  )
}

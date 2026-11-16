import { useState } from 'react'
import AppHeader from '../components/AppHeader'
import ProductForm from '../components/ProductForm'
import ProductRow from '../components/ProductRow'
import ProductDetails from '../components/ProductDetails'
import EditProduct from '../components/EditProduct'
import Restock from '../components/Restock'
import OrderRow from '../components/OrderRow'
import Stats from '../components/Stats'
import Notifications from '../components/Notifications'
import { useStore, left, peso } from '../store/StoreContext'
import { focusEl } from '../utils/focus'

// The Seller Centre: Overview (stats + add product), My products, Orders, Notifications.
export default function SellerPage() {
  const { s, me, api, ask } = useStore()
  const [sv, setSv] = useState('ov')
  const [detail, setDetail] = useState(null)
  const [edit, setEdit] = useState(null)
  const [restock, setRestock] = useState(null)
  const [formKey, setFormKey] = useState(0) // changing this clears the "Add a product" form

  const mp = s.products.filter((p) => p.sel === me.id)
  const mo = s.orders.filter((o) => o.sel === me.id)
  const unread = s.notes.filter((n) => n.to === me.email && !n.read).length

  // a clicked reminder jumps to the right tab, and to the exact button (e.g. "Start preparing")
  const go = (act) => {
    const [k, v, f] = act.split(':')
    if (k !== 's') return
    setSv(v)
    focusEl(f === 'pend' ? '[data-pend]' : f ? '#' + f : '')
  }
  const remove = (p) => ask('Remove this product?', `“${p.n}” will be removed from the shop and from carts. This can’t be undone, but a record is kept in Notifications.`, 'Yes, remove', () => api.removeOwnProduct(p.id))
  const tab = (id, label) => <button key={id} className="tab" data-st={id} aria-pressed={sv === id} onClick={() => setSv(id)}>{label}</button>

  return (
    <>
      <AppHeader
        mid={<strong className="sc">Seller Centre</strong>}
        right={<>
          <button className="btn sell" onClick={() => api.setMode('buyer')}>🛍 Switch to buying</button>
          <button className="btn ghost" onClick={api.logout}>Log out</button>
        </>}
        nav={<span className="tg">
          {tab('ov', 'Overview')}
          {tab('pr', `My products (${mp.length})`)}
          {tab('or', 'Orders')}
          {tab('nt', `🔔 Notifications${unread ? ` (${unread})` : ''}`)}
        </span>}
      />
      <main className="page">
        <h1>{me.shop} 🏪</h1>

        {sv === 'ov' && <>
          <Stats items={[['My products', mp.length], ['Items left', mp.reduce((a, p) => a + left(p), 0)], ['Orders received', mo.length], ['To ship', mo.filter((o) => !o.cx && o.st < 2).length], ['Sales', peso(mo.filter((o) => !o.cx).reduce((a, o) => a + o.total, 0))]]} />
          <div className="box">
            <h2>Add a product 🎀</h2>
            <ProductForm key={formKey} pre="p" submitLabel="Add product" onSubmit={async (v) => { if (await api.addProduct(v)) setFormKey((k) => k + 1) }} />
          </div>
          <div className="box"><h2>Recent orders</h2><ul className="al">{mo.slice(-3).reverse().map((o) => <OrderRow key={o.id} o={o} ship />)}{mo.length === 0 && <li className="meta">Nothing here yet.</li>}</ul></div>
        </>}

        {sv === 'pr' && (
          <div className="box">
            <h2>My products · {mp.length} item{mp.length === 1 ? '' : 's'}</h2>
            <ul className="al">
              {mp.length === 0 && <li className="meta">No products yet. Add your first one from the Overview tab.</li>}
              {mp.map((p) => (
                <ProductRow key={p.id} p={p}>
                  <button className="btn ghost" onClick={() => setDetail(p.id)}>Details</button>
                  <button className={left(p) === 0 ? 'btn btn-p' : 'btn ghost'} onClick={() => setRestock(p.id)}>{left(p) === 0 ? '📦 Restock (sold out)' : '📦 Restock'}</button>
                  <button className="btn ghost" onClick={() => setEdit(p.id)}>Edit</button>
                  <button className="btn ghost" onClick={() => remove(p)} aria-label={`Remove ${p.n}`}>Remove</button>
                </ProductRow>
              ))}
            </ul>
          </div>
        )}

        {sv === 'or' && <div className="box"><h2>Orders received</h2><ul className="al">{mo.slice().reverse().map((o) => <OrderRow key={o.id} o={o} ship />)}{mo.length === 0 && <li className="meta">Nothing here yet.</li>}</ul></div>}
        {sv === 'nt' && <Notifications go={go} />}
      </main>

      <ProductDetails id={detail} onClose={() => setDetail(null)} onEdit={(id) => { setDetail(null); setEdit(id) }} />
      <Restock id={restock} onClose={() => setRestock(null)} />
      <EditProduct id={edit} onClose={() => setEdit(null)} />
    </>
  )
}

import { useState } from 'react'
import AppHeader from '../components/AppHeader'
import ProductRow from '../components/ProductRow'
import ProductDetails from '../components/ProductDetails'
import RemoveProduct from '../components/RemoveProduct'
import Stats from '../components/Stats'
import Notifications from '../components/Notifications'
import { useStore } from '../store/StoreContext'

const day = (t) => (t ? new Date(t).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' }) : '—')

// The Admin dashboard: the admin keeps the marketplace safe.
// It never shows sellers' orders, sales or revenue, or any buyer's personal details.
export default function AdminPage() {
  const { s, me, api, ask } = useStore()
  const { overview: ov, sellers, buyers } = s.admin
  const [av, setAv] = useState('ov')
  const [detail, setDetail] = useState(null)
  const [removing, setRemoving] = useState(null)
  const [picked, setPicked] = useState(null) // id of the seller whose profile is open

  const unread = s.notes.filter((n) => n.to === 'admin' && !n.read).length
  const go = (act) => { const [k, v] = act.split(':'); if (k === 'a') setAv(v) }
  const tab = (id, label) => <button key={id} className="tab" data-at={id} aria-pressed={av === id} onClick={() => { setAv(id); setPicked(null) }}>{label}</button>
  const status = (u) => (u.suspended ? '⛔ Suspended' : '✅ Active')
  const toggle = (u, name) => u.suspended
    ? ask('Reactivate this account?', `${name} will be able to sign in again.`, 'Yes, reactivate', () => api.setSuspended(u.id, false))
    : ask('Suspend this account?', `${name} will not be able to sign in until you reactivate it.`, 'Yes, suspend', () => api.setSuspended(u.id, true))

  const profile = (u) => {
    const mp = s.products.filter((p) => p.sel === u.id)
    return (
      <>
        <button className="btn ghost" onClick={() => setPicked(null)}>← All sellers</button>
        <div className="box" style={{ marginTop: '.8rem' }}>
          <h2>{u.shop} 🏪</h2>
          <ul className="al">
            <li><span>Owner</span><b>{u.owner}</b></li>
            <li><span>Joined</span><b>{day(u.joined)}</b></li>
            <li><span>Products</span><b>{u.products}</b></li>
            <li><span>Average rating</span><b>{u.ratingCount ? `${u.ratingAvg} ★ (${u.ratingCount})` : 'No reviews yet'}</b></li>
            <li><span>Warnings</span><b>{u.warns || 0}</b></li>
            <li><span>Status</span><b>{status(u)}</b></li>
          </ul>
          <p className="meta">Sales, orders and buyer details are private to the seller, so they are not shown here.</p>
          <div className="acts"><button className="btn ghost" onClick={() => toggle(u, u.shop)}>{u.suspended ? 'Reactivate seller' : 'Suspend seller'}</button></div>
        </div>
        <div className="box">
          <h2>Products ({u.products})</h2>
          <ul className="al">
            {mp.map((p) => (
              <ProductRow key={p.id} p={p}>
                <button className="btn ghost" onClick={() => setDetail(p.id)}>Details</button>
                <button className="btn ghost" onClick={() => setRemoving(p.id)} aria-label={`Remove ${p.n}`}>Remove</button>
              </ProductRow>
            ))}
            {mp.length === 0 && <li className="meta">{u.suspended && u.products ? 'Products are hidden from the shop while this seller is suspended.' : 'No products yet.'}</li>}
          </ul>
          <p className="meta">Removing a product needs a reason. The seller gets a ⚠️ warning with that reason.</p>
        </div>
      </>
    )
  }

  const chosen = picked && sellers.find((u) => u.id === picked)
  return (
    <>
      <AppHeader
        mid={<strong className="sc">Admin dashboard</strong>}
        right={<button className="btn ghost" onClick={api.logout}>Log out</button>}
        nav={<span className="tg">
          {tab('ov', 'Overview')}{tab('se', `Sellers (${sellers.length})`)}{tab('bu', `Buyers (${buyers.length})`)}{tab('nt', `🔔 Notifications${unread ? ` (${unread})` : ''}`)}
        </span>}
      />
      <main className="page">
        <h1>Welcome, {me.name} 👑</h1>
        {av === 'ov' && <>
          {ov && <Stats items={[['Buyers', ov.buyers], ['Sellers', ov.sellers], ['Active products', ov.products], ['Warnings given', ov.warnings], ['Suspended', ov.suspended]]} />}
          <div className="box"><h2>Your job as admin</h2><p className="meta">Keep StyleIt safe: review sellers, remove products that break the rules (with a reason), and suspend accounts that keep breaking them.</p></div>
        </>}
        {av === 'se' && (chosen ? profile(chosen) : (
          <div className="box"><h2>Sellers</h2>
            <ul className="al">
              {sellers.map((u) => (
                <li key={u.id}>
                  <span><strong>{u.shop}</strong> <span className="meta">{status(u)}{u.warns ? ` · ⚠️ ${u.warns}` : ''}</span></span>
                  <button className="btn ghost" onClick={() => setPicked(u.id)}>View profile</button>
                </li>
              ))}
              {sellers.length === 0 && <li className="meta">No sellers yet.</li>}
            </ul>
          </div>
        ))}
        {av === 'bu' && (
          <div className="box"><h2>Buyers</h2>
            <ul className="al">
              {buyers.map((u) => (
                <li key={u.id}>
                  <span><strong>{u.name}</strong> <span className="meta">Joined {day(u.joined)} · {status(u)}{u.seller ? ' · also a seller' : ''}</span></span>
                  <button className="btn ghost" onClick={() => toggle(u, u.name)}>{u.suspended ? 'Reactivate' : 'Suspend'}</button>
                </li>
              ))}
              {buyers.length === 0 && <li className="meta">No buyers yet.</li>}
            </ul>
          </div>
        )}
        {av === 'nt' && <Notifications go={go} />}
      </main>
      <ProductDetails id={detail} onClose={() => setDetail(null)} />
      <RemoveProduct id={removing} onClose={() => setRemoving(null)} />
    </>
  )
}

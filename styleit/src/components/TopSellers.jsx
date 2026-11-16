import { useStore } from '../store/StoreContext'
import { topSellers } from '../utils/shop'

// Top 3 shops by sales. Buyers can jump straight to a shop's products.
export default function TopSellers({ onShop }) {
  const { s } = useStore()
  const t = topSellers(s)
  return (
    <div className="box">
      <h2>🏆 Top sellers</h2>
      <ul className="al">
        {t.length === 0 && <li className="meta">No top seller yet. Our best shops will show up here after the first orders.</li>}
        {t.map((x, i) => (
          <li key={x.shop}>
            <span>{['🥇', '🥈', '🥉'][i]} <strong>{x.shop}</strong><br /><span className="meta">{x.orders} order{x.orders > 1 ? 's' : ''}</span></span>
            {onShop && <button className="btn ghost" onClick={() => onShop(x.shop)}>View shop</button>}
          </li>
        ))}
      </ul>
    </div>
  )
}

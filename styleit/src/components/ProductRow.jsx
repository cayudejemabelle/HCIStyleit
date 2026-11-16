import { left, peso } from '../store/StoreContext'
import Pic from './Pic'

// One product in a list, with whatever buttons the screen needs (children).
export default function ProductRow({ p, children }) {
  return (
    <li>
      <span className="pv">
        <Pic p={p} />
        <span>{p.n}<br /><span className="meta">{p.g} / {p.s} / {peso(p.pr)}<br />Stock {p.stock} · {p.sold} sold · <strong>{left(p)} left</strong></span></span>
      </span>
      <span className="acts">{children}</span>
    </li>
  )
}

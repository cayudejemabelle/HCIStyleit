import Logo from './Logo'
import Tools from './Tools'

// The top bar used by every dashboard: logo + middle part + buttons, then a navigation row.
export default function AppHeader({ mid, right, nav }) {
  return (
    <header>
      <div className="top">
        <Logo />
        {mid}
        <div className="tools">{right}</div>
      </div>
      <nav className="nv" aria-label="Main">
        {nav}
        <span className="tl"><Tools /></span>
      </nav>
    </header>
  )
}

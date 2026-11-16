import { useStore } from '../store/StoreContext'
import { SIZES, SIZE_LABEL } from '../constants'

// Keyboard help, text size and light/dark switch. Shown on every screen.
export default function Tools() {
  const { s, api } = useStore()
  const dark = s.theme === 'dark'
  return (
    <>
      <button className="btn ghost" onClick={() => api.setHelp(true)} aria-label="Keyboard shortcuts" title="Keyboard shortcuts (press ?)">⌨</button>
      <span className="sz" role="group" aria-label="Text size">
        Text
        {Object.keys(SIZES).map((k) => (
          <button key={k} aria-pressed={s.size === k} aria-label={SIZE_LABEL[k] + ' text'} style={{ fontSize: SIZES[k] - 2 }} onClick={() => api.setSize(k)}>A</button>
        ))}
      </span>
      <button className="th" role="switch" aria-checked={dark} aria-label="Dark mode" onClick={api.toggleTheme}>
        <span className="knob" aria-hidden="true">{dark ? '🌙' : '☀️'}</span>
        {dark ? 'Dark' : 'Light'}
      </button>
    </>
  )
}

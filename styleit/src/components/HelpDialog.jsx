import Modal from './Modal'
import { useStore } from '../store/StoreContext'

export default function HelpDialog() {
  const { s, api } = useStore()
  return (
    <Modal open={s.helpOpen} onClose={() => api.setHelp(false)} labelledBy="kbt">
      <h2 id="kbt">Keyboard shortcuts ⌨️</h2>
      <label className="ck">
        <input type="checkbox" checked={s.keysOn} onChange={(e) => api.setKeys(e.target.checked)} /> Single-key shortcuts on
      </label>
      <ul className="al kl">
        <li><span><kbd>Enter</kbd> Go to the next field. On the last field it sends the form. In a big text box use <kbd>Ctrl</kbd>+<kbd>Enter</kbd>.</span></li>
        <li><span><kbd>Esc</kbd> Close a pop-up or the cart</span></li>
        <li><span><kbd>?</kbd> Open this list &nbsp; <kbd>D</kbd> Light / dark mode</span></li>
        <li><span><b>Login:</b> <kbd>1</kbd> Sign In &nbsp; <kbd>2</kbd> Sign Up</span></li>
        <li><span><b>Buyer:</b> <kbd>/</kbd> Search &nbsp; <kbd>C</kbd> Cart &nbsp; <kbd>1</kbd>–<kbd>4</kbd> All, Women, Men, Kids &nbsp; <kbd>5</kbd> or <kbd>O</kbd> My orders &nbsp; <kbd>6</kbd> or <kbd>N</kbd> Notifications</span></li>
        <li><span><b>In the cart:</b> <kbd>A</kbd> Select all &nbsp; <kbd>Delete</kbd> Delete selected &nbsp; <kbd>B</kbd> Buy selected &nbsp; <kbd>C</kbd> Close</span></li>
        <li><span><b>Seller and Admin:</b> <kbd>1</kbd>–<kbd>4</kbd> Switch tabs &nbsp; <kbd>N</kbd> Notifications</span></li>
      </ul>
      <div className="dact"><span /><button className="btn ghost" onClick={() => api.setHelp(false)}>Close</button></div>
    </Modal>
  )
}

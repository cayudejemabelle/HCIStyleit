import { useEffect, useRef } from 'react'
import { useStore } from '../store/StoreContext'

// Single-key shortcuts. They never fire while you are typing, and can be switched off in the ⌨ pop-up.
export default function useShortcuts() {
  const { s, me, api } = useStore()
  const live = useRef()
  live.current = { s, me, api }

  useEffect(() => {
    const onKey = (e) => {
      const { s, me, api } = live.current
      if (e.isComposing || e.key === 'Enter') return
      const open = document.querySelector('dialog[open]')
      if (e.key === 'Escape' && s.cartOpen && !open) return api.setCart(false)
      const t = e.target
      const typing = t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || (t.tagName === 'INPUT' && !['checkbox', 'radio', 'button', 'submit', 'file'].includes(t.type))
      if (!s.keysOn || e.ctrlKey || e.metaKey || e.altKey || typing || open) return
      const k = e.key.toLowerCase()
      const click = (q) => document.querySelector(q)?.click()
      if (k === '?') { e.preventDefault(); return api.setHelp(true) }
      if (k === 'd') return api.toggleTheme()
      if (!me) { if (k === '1' || k === '2') document.querySelectorAll('[data-am]')[+k - 1]?.click(); return }
      if (s.cartOpen) {
        if (k === 'a') click('#selAll')
        else if (e.key === 'Delete') click('[data-delsel]')
        else if (k === 'b') click('#buyBtn')
        else if (k === 'c') api.setCart(false)
        return
      }
      if (k === 'c' && me.role !== 'admin' && s.mode === 'buyer') return api.setCart(true)
      if (k === '/') { const q = document.getElementById('q'); if (q) { e.preventDefault(); q.focus() } return }
      if (/^[1-6]$/.test(k)) click(`nav .tg .tab:nth-child(${k})`)
      else if (k === 'o') click('[data-v="orders"]')
      else if (k === 'n') click('[data-v="notif"],[data-st="nt"],[data-at="nt"]')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}

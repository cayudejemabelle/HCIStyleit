import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { SIZES, STEPS } from '../constants'
import { Toast, Confirm } from '../components/Overlays'
import { server, ApiError, getToken, setToken, loadAll, mapNote, mapCart } from '../api'

const Ctx = createContext(null)
export const useStore = () => useContext(Ctx)

/* ---------- small helpers every screen can import ---------- */
export const left = (p) => Math.max(0, (p.stock || 0) - (p.sold || 0))
export const peso = (n) => '₱' + Number(n).toLocaleString()
export const when = (t) => {
  const d = new Date(t)
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ', ' + d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

// The screens read this state. It is a copy of what the server has, refreshed after every action.
const initial = () => ({
  ready: false, // false while we check the saved login and reach the server
  offline: '', // a message if the server can't be reached on start
  user: null, // the signed-in person (from the server)
  mode: 'buyer', // 'buyer' or 'seller'
  products: [], reviews: [], orders: [], notes: [], top: [],
  admin: { overview: null, sellers: [], buyers: [] },
  cart: {}, // product id -> quantity
  chk: [], // ticked cart items (only in this browser)
  theme: 'light', // light mode is always the first thing people see
  size: 'm', keysOn: true, cartOpen: false, helpOpen: false,
})

// After the cart changes: keep ticks only for items still available, and tick the one just added.
function withCart(p, items, tickId) {
  const ok = new Set(items.filter((i) => i.left > 0).map((i) => i.productId))
  const chk = p.chk.filter((id) => ok.has(id))
  if (tickId && ok.has(tickId) && !chk.includes(tickId)) chk.push(tickId)
  return { ...p, cart: mapCart(items), chk }
}

export function StoreProvider({ children }) {
  const [s, setS] = useState(initial)
  const ref = useRef(s)
  ref.current = s // always the latest state, for checks inside actions
  const [msg, setMsg] = useState('')
  const timer = useRef()
  const [cfm, setCfm] = useState(null)

  const toast = (m, ms = 2200) => {
    setMsg(m)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setMsg(''), ms)
  }
  const ask = (title, text, yes, onYes) => setCfm({ title, text, yes, onYes })

  useEffect(() => {
    document.documentElement.dataset.theme = s.theme
    document.documentElement.style.fontSize = SIZES[s.size] + 'px'
  }, [s.theme, s.size])

  const me = s.user

  /* ---------- talking to the server ---------- */
  const endSession = () => { setToken(''); setS((p) => ({ ...initial(), theme: p.theme, size: p.size, keysOn: p.keysOn, ready: true })) }

  // Reload everything from the server (so every screen shows the truth).
  const refresh = async () => {
    const { user } = await server.me()
    const data = await loadAll(user)
    setS((p) => ({
      ...p, ...data, user,
      chk: p.chk.filter((id) => data.cart[id] && left(data.products.find((x) => x.id === id) || {}) > 0),
    }))
  }
  // Shows a server error as a toast. A bad or expired login (or a suspended account) signs the person out.
  const fail = (e) => {
    if (e instanceof ApiError && (e.status === 401 || (e.status === 403 && /suspended/i.test(e.message)))) {
      endSession()
      return toast(e.status === 401 ? 'Please sign in again.' : e.message, 4500)
    }
    toast(e?.message || 'Something went wrong. Please try again.', 4500)
  }
  const act = async (fn) => { try { return await fn() } catch (e) { fail(e) } } // returns undefined if it failed
  // For forms: returns { error, field } like the old in-memory version did.
  const attempt = async (fn) => {
    try { return (await fn()) || {} } catch (e) {
      if (e instanceof ApiError) return { error: e.message, field: e.field }
      return { error: 'Something went wrong. Please try again.' }
    }
  }
  const begin = async ({ token, user }) => {
    setToken(token)
    try {
      const data = await loadAll(user)
      setS((p) => ({ ...p, ...data, user, mode: 'buyer', chk: [], cartOpen: false, ready: true, offline: '' }))
    } catch (e) { setToken(''); throw e }
  }
  const first = (name) => name.split(' ')[0]

  // On start: if we have a saved login, go straight in.
  const boot = async () => {
    setS((p) => ({ ...p, offline: '' }))
    if (!getToken()) return setS((p) => ({ ...p, ready: true }))
    try {
      const { user } = await server.me()
      const data = await loadAll(user)
      setS((p) => ({ ...p, ...data, user, ready: true, offline: '' }))
    } catch (e) {
      if (e instanceof ApiError && e.status === 0) return setS((p) => ({ ...p, offline: e.message }))
      setToken(''); setS((p) => ({ ...p, ready: true })) // login expired
    }
  }
  useEffect(() => { boot() }, [])

  // Every 15 seconds, quietly pick up what other people did (new orders, replies, warnings).
  const poll = async () => {
    if (document.hidden || !ref.current.user) return
    try { await refresh() } catch (e) { if (e instanceof ApiError && (e.status === 401 || e.status === 403)) fail(e) }
  }
  const pollRef = useRef(); pollRef.current = poll
  useEffect(() => {
    if (!s.user) return
    const t = setInterval(() => pollRef.current(), 15000)
    return () => clearInterval(t)
  }, [s.user?.id])

  /* ---------- actions: everything the screens can do ---------- */
  const api = {
    retry: boot,
    signIn: (email, pw) => attempt(async () => {
      const r = await server.signIn(email, pw)
      await begin(r)
      toast(`Welcome back, ${first(r.user.name)}! 💖`)
    }),
    signUp: (name, email, pw) => attempt(async () => {
      const r = await server.signUp(name, email, pw)
      await begin(r)
      toast(`Welcome, ${first(r.user.name)}! 💖`)
    }),
    // Social sign-in is a DEMO: real Google / Facebook login (OAuth) needs developer accounts.
    socialSignIn: (provider, name, email) => attempt(async () => {
      const r = await server.social(provider, name, email)
      await begin(r)
      toast(`Welcome, ${first(r.user.name)}! 💖`)
    }),
    // Forgot password: the code is shown on screen only while there is no email service (demo).
    requestReset: (email) => attempt(async () => ({ code: (await server.forgot(email)).devCode || '' })),
    resetPassword: (email, code, pw) => attempt(async () => {
      await server.reset(email, code, pw)
      toast('Password changed. You can sign in now 🔐')
    }),
    logout() { endSession(); toast('You are logged out') },
    setMode: (m) => setS((p) => ({ ...p, mode: m })),
    openShop: (name) => act(async () => {
      const r = await server.openShop(name)
      setS((p) => ({ ...p, user: r.user, mode: 'seller' }))
      await refresh()
      toast('Your shop is open! 🎀')
      return true
    }),

    /* cart */
    async addToCart(id) {
      try {
        const items = await server.addToCart(id)
        setS((p) => withCart(p, items, id))
        toast('Added to cart 💖')
      } catch (e) {
        if (e instanceof ApiError && /^Your cart is full/.test(e.message)) { setS((p) => ({ ...p, cartOpen: true })); return toast(e.message, 4500) }
        fail(e)
      }
    },
    changeQty: (id, delta) => act(async () => { const items = await server.changeQty(id, delta); setS((p) => withCart(p, items)) }),
    removeFromCart: (ids) => act(async () => { const items = await server.removeFromCart(ids); setS((p) => withCart(p, items)) }),
    toggleSel: (id, on) => setS((p) => ({ ...p, chk: on ? [...new Set([...p.chk, id])] : p.chk.filter((x) => x !== id) })),
    selectAll: (ids, on) => setS((p) => ({ ...p, chk: on ? [...new Set([...p.chk, ...ids])] : p.chk.filter((x) => !ids.includes(x)) })),

    /* orders: one order per seller; stock goes down; everyone is notified */
    placeOrder: (code) => attempt(async () => {
      await server.placeOrder(ref.current.chk, code)
      setS((p) => ({ ...p, chk: [] })) // bought items stay in the cart, just unticked
      await refresh()
    }),
    cancelOrder: (id) => act(async () => { await server.cancelOrder(id); await refresh(); toast('Order cancelled') }),
    markReceived: (id) => act(async () => { await server.markReceived(id); await refresh(); toast('Thanks! Enjoy your order 💖') }),
    advanceOrder: (id) => act(async () => { const o = await server.advanceOrder(id); await refresh(); toast('Order updated: ' + STEPS[o.status][0]) }),
    markRead: () => act(async () => {
      const notes = await server.markRead()
      setS((p) => ({ ...p, notes: notes.map((n) => mapNote(n, p.user)).sort((a, b) => a.id - b.id) }))
    }),

    /* seller: products. These return true when it worked, so a form can stay open if it did not. */
    addProduct: (v) => act(async () => { await server.addProduct(v); await refresh(); toast('Product added. Buyers can see it now ✨'); return true }),
    editProduct: (id, v) => act(async () => {
      const p = ref.current.products.find((x) => x.id === id)
      await server.editProduct(id, v, p.sold)
      await refresh(); toast('Product updated ✨'); return true
    }),
    removeOwnProduct: (id) => act(async () => { await server.removeProduct(id); await refresh(); toast('Product removed'); return true }),
    // Restock: ADD new units. Sold stays as history; stock left goes up.
    restock: (id, n) => act(async () => { await server.restock(id, n); await refresh(); toast(`Restocked: ${n} more added ✨`); return true }),

    /* admin */
    // reason = the number of the reason in REASONS (0 to 5). The seller gets a warning with it.
    adminRemove: (id, reason, note) => act(async () => { const r = await server.adminRemove(id, reason, note); await refresh(); toast(r.message); return true }),
    setSuspended: (id, on) => act(async () => { await server.setSuspended(id, on); await refresh(); toast(on ? 'Account suspended' : 'Account reactivated'); return true }),

    /* buyer: review a delivered item */
    addReview: (pid, rating, text) => act(async () => { await server.addReview(pid, rating, text); await refresh(); toast('Thanks for your review! 💖'); return true }),

    /* look and feel */
    toggleTheme: () => setS((p) => ({ ...p, theme: p.theme === 'dark' ? 'light' : 'dark' })),
    setSize: (k) => setS((p) => ({ ...p, size: k })),
    setKeys: (on) => setS((p) => ({ ...p, keysOn: on })),
    setCart: (open) => setS((p) => ({ ...p, cartOpen: open })),
    setHelp: (open) => setS((p) => ({ ...p, helpOpen: open })),
  }

  return (
    <Ctx.Provider value={{ s, me, api, toast, ask }}>
      {children}
      <Toast msg={msg} />
      <Confirm cfm={cfm} onNo={() => setCfm(null)} onYes={() => { const f = cfm.onYes; setCfm(null); f() }} />
    </Ctx.Provider>
  )
}

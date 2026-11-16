// Everything that talks to the backend lives here, so the screens never call fetch themselves.
// The mappers turn the server's JSON into the shapes the screens already use
// (p.n, p.pr, o.st, o.cx ...), so the screens barely changed when we moved from seed.js to a real database.
const BASE = import.meta.env?.VITE_API_URL || 'http://localhost:3000/api'
const KEY = 'styleit_token'

let token = ''
try { token = localStorage.getItem(KEY) || '' } catch { /* storage blocked: stay signed out after refresh */ }
export const getToken = () => token
export const setToken = (t) => {
  token = t || ''
  try { t ? localStorage.setItem(KEY, t) : localStorage.removeItem(KEY) } catch { /* ignore */ }
}

// status 0 = the server could not be reached at all
export class ApiError extends Error {
  constructor(message, field = '', status = 0) { super(message); this.field = field; this.status = status }
}

async function request(method, path, body) {
  let res
  try {
    res = await fetch(BASE + path, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError('Can’t reach the StyleIt server. Make sure it is running (npm run dev inside styleit-api).')
  }
  let data = null
  try { data = await res.json() } catch { /* empty body */ }
  if (!res.ok) throw new ApiError(data?.error || 'Something went wrong. Please try again.', data?.field || '', res.status)
  return data
}
export const http = {
  get: (p) => request('GET', p),
  post: (p, b = {}) => request('POST', p, b),
  put: (p, b = {}) => request('PUT', p, b),
  patch: (p, b = {}) => request('PATCH', p, b),
  del: (p) => request('DELETE', p),
}

/* ---------- server JSON -> the shapes the screens use ---------- */
export const mapProduct = (p) => ({
  id: p.id, n: p.name, g: p.group, s: p.category, pr: p.price, e: '🎀',
  sel: p.sellerId, shop: p.shop, img: p.img, desc: p.description,
  t: p.createdAt, u: p.updatedAt, stock: p.stock, sold: p.sold,
})
export const mapOrder = (o) => ({
  id: o.id, buyer: o.buyerName, bid: o.buyerId, sel: o.sellerId, shop: o.shop, total: o.total,
  st: o.status, cx: o.cancelled, h: o.history, pay: o.payment, paid: o.paid, t: o.createdAt,
  items: o.items.map((i) => ({ pid: i.productId, n: i.name, q: i.qty, pr: i.price, shop: o.shop })),
})
export const mapReview = (r) => ({ pid: r.productId, bid: r.buyerId, name: r.buyerName, rating: r.rating, text: r.text, t: r.createdAt })
// Notifications are addressed by "key": the admin has one shared inbox, everyone else uses their email.
export const mapNote = (n, user) => ({ id: n.id, t: n.createdAt, to: user.role === 'admin' ? 'admin' : user.email, icon: n.icon, text: n.text, note: n.note, act: n.act, read: n.read })
export const mapCart = (items) => Object.fromEntries(items.map((i) => [i.productId, i.qty]))

const byId = (a, b) => a.id - b.id // the screens expect oldest first

// Loads everything the signed-in person's screens need.
export async function loadAll(user) {
  const [products, reviews, top] = await Promise.all([http.get('/products'), http.get('/reviews'), http.get('/top-sellers')])
  const data = { products: products.map(mapProduct).sort(byId), reviews: reviews.map(mapReview).sort(byId), top }
  if (user.role === 'admin') {
    const [notes, overview, sellers, buyers] = await Promise.all([http.get('/notifications'), http.get('/admin/overview'), http.get('/admin/sellers'), http.get('/admin/buyers')])
    return { ...data, notes: notes.map((n) => mapNote(n, user)).sort(byId), admin: { overview, sellers, buyers }, orders: [], cart: {} }
  }
  const [cart, notes, mine] = await Promise.all([http.get('/cart'), http.get('/notifications'), http.get('/orders/mine')])
  const received = user.seller ? await http.get('/orders/received') : []
  const orders = new Map([...mine, ...received].map((o) => [o.id, mapOrder(o)])) // one entry per order
  return { ...data, notes: notes.map((n) => mapNote(n, user)).sort(byId), orders: [...orders.values()].sort(byId), cart: mapCart(cart) }
}

/* ---------- one function per thing the app can ask the server to do ---------- */
export const server = {
  signIn: (email, password) => http.post('/auth/signin', { email, password }),
  signUp: (name, email, password) => http.post('/auth/signup', { name, email, password }),
  social: (provider, name, email) => http.post('/auth/social-demo', { provider, name, email }),
  forgot: (email) => http.post('/auth/forgot', { email }),
  reset: (email, code, password) => http.post('/auth/reset', { email, code, password }),
  me: () => http.get('/auth/me'),
  openShop: (name) => http.post('/auth/open-shop', { name }),

  addToCart: (productId) => http.post('/cart', { productId }),
  changeQty: (id, delta) => http.patch('/cart/' + id, { delta }),
  removeFromCart: (ids) => http.post('/cart/remove', { ids }),

  placeOrder: (productIds, payment) => http.post('/orders', { productIds, payment }),
  cancelOrder: (id) => http.post(`/orders/${id}/cancel`),
  advanceOrder: (id) => http.post(`/orders/${id}/advance`),
  markReceived: (id) => http.post(`/orders/${id}/received`),
  markRead: () => http.post('/notifications/read'),

  addProduct: (v) => http.post('/products', { name: v.n, group: v.g, category: v.s, price: v.pr, stock: v.stock, description: v.desc, img: v.img }),
  // the Edit form works with the total (stock = left + sold); the server wants "left"
  editProduct: (id, v, sold) => http.put('/products/' + id, { name: v.n, group: v.g, category: v.s, price: v.pr, description: v.desc, stockLeft: v.stock - sold, img: v.img }),
  removeProduct: (id) => http.del('/products/' + id),
  restock: (id, amount) => http.post(`/products/${id}/restock`, { amount }),
  addReview: (pid, rating, text) => http.post(`/products/${pid}/reviews`, { rating, text }),

  adminRemove: (id, reason, note) => http.post(`/admin/products/${id}/remove`, { reason, note }),
  setSuspended: (id, suspended) => http.post(`/admin/users/${id}/suspend`, { suspended }),
}

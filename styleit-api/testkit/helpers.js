// Shared test helpers. (Not inside test/ so the test runner does not run it as a test.)
process.env.DB_FILE = ':memory:'
process.env.SHOW_RESET_CODE ??= 'true'

import assert from 'node:assert/strict'

export const { ensureAdmin } = await import('../db/seed.js')
export const auth = await import('../controllers/authController.js')
export const prod = await import('../controllers/productController.js')
export const cart = await import('../controllers/cartController.js')
export const orders = await import('../controllers/orderController.js')
export const notes = await import('../controllers/notificationController.js')
export const admin = await import('../controllers/adminController.js')
export const reviews = await import('../controllers/reviewController.js')
export const { requireLogin, requireSeller, requireAdmin } = await import('../middleware/auth.js')
export const { default: Product } = await import('../models/Product.js')
export const { default: db } = await import('../db/database.js')
ensureAdmin()

export const PHOTO = 'data:image/png;base64,iVBORw0KGgo='
export const form = (o = {}) => ({ name: 'Linen Dress', group: 'Women', category: 'Dresses', price: 800, stock: 5, description: '', img: PHOTO, ...o })

const reply = () => ({ code: 200, body: null, status(c) { this.code = c; return this }, json(b) { this.body = b; return this } })
export const call = (fn, req) => { const res = reply(); fn({ body: {}, params: {}, headers: {}, ...req }, res); return res }
export const fails = (fn, req, status, field) =>
  assert.throws(() => call(fn, req), (e) => e.status === status && (field === undefined || e.field === field))

// Creates an account and returns a function that makes "logged in" requests.
export function person(name, email, { shop } = {}) {
  const r = call(auth.signUp, { body: { name, email, password: 'password1' } })
  const token = r.body.token
  const as = (extra = {}) => { const req = { headers: { authorization: 'Bearer ' + token }, body: {}, params: {}, ...extra }; requireLogin(req, null, () => {}); return req }
  if (shop) call(auth.openShop, { ...as(), body: { name: shop } })
  return { as, id: r.body.user.id, email }
}
export const addProduct = (seller, o) => call(prod.create, { ...seller.as(), body: form(o) }).body

// A "logged in as admin" request maker.
export const adminAs = (extra = {}) => {
  const token = call(auth.signIn, { body: { email: 'admin@styleit.com', password: 'Admin1234' } }).body.token
  const req = { headers: { authorization: 'Bearer ' + token }, body: {}, params: {}, ...extra }
  requireLogin(req, null, () => {})
  return req
}

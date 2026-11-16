// Runs the controllers directly with fake requests, using a throw-away in-memory database.
// Start it with:  npm test
process.env.DB_FILE = ':memory:'
process.env.SHOW_RESET_CODE = 'true'

import { test } from 'node:test'
import assert from 'node:assert/strict'

const { ensureAdmin } = await import('../db/seed.js')
const auth = await import('../controllers/authController.js')
const prod = await import('../controllers/productController.js')
const { requireLogin, requireSeller, requireAdmin } = await import('../middleware/auth.js')
const { default: Product } = await import('../models/Product.js')
const { default: User } = await import('../models/User.js')
const { verifyToken } = await import('../utils/token.js')
const { default: db } = await import('../db/database.js')

ensureAdmin()

// A pretend response: remembers the status and body so we can check them.
const reply = () => ({ code: 200, body: null, status(c) { this.code = c; return this }, json(b) { this.body = b; return this } })
const call = (fn, req) => { const res = reply(); fn({ body: {}, params: {}, headers: {}, ...req }, res); return res }
const fails = (fn, req, status, field) => {
  assert.throws(() => call(fn, req), (e) => e.status === status && (field === undefined || e.field === field))
}
// Sign in through the controller and get a ready "logged in" request.
const as = (email, password) => {
  const r = call(auth.signIn, { body: { email, password } })
  return { token: r.body.token, user: r.body.user }
}
const authed = (token, extra = {}) => {
  const req = { headers: { authorization: 'Bearer ' + token }, body: {}, params: {}, ...extra }
  requireLogin(req, null, () => {})
  return req
}
const PHOTO = 'data:image/png;base64,iVBORw0KGgo='
const form = (o = {}) => ({ name: 'Linen Dress', group: 'Women', category: 'Dresses', price: 799, stock: 5, description: 'Soft', img: PHOTO, ...o })

test('sign up validates, creates, and never returns the password hash', () => {
  fails(auth.signUp, { body: { name: '', email: 'a@b.co', password: 'password1' } }, 400, 'an')
  fails(auth.signUp, { body: { name: 'Ann', email: 'nope', password: 'password1' } }, 400, 'ae')
  fails(auth.signUp, { body: { name: 'Ann', email: 'ann@x.co', password: 'short' } }, 400, 'ap')
  const r = call(auth.signUp, { body: { name: 'Ann Lee', email: 'Ann@X.co', password: 'password1' } })
  assert.equal(r.code, 201)
  assert.equal(r.body.user.email, 'ann@x.co')
  assert.equal(r.body.user.pwHash, undefined)
  assert.equal(r.body.user.pw_hash, undefined)
  assert.ok(verifyToken(r.body.token))
  fails(auth.signUp, { body: { name: 'Ann', email: 'ann@x.co', password: 'password1' } }, 409, 'ae')
})

test('sign in: wrong password and unknown email get the same error', () => {
  fails(auth.signIn, { body: { email: 'ann@x.co', password: 'wrongwrong' } }, 401, 'ae')
  fails(auth.signIn, { body: { email: 'ghost@x.co', password: 'password1' } }, 401, 'ae')
  assert.equal(call(auth.signIn, { body: { email: 'ann@x.co', password: 'password1' } }).body.user.name, 'Ann Lee')
  assert.equal(call(auth.signIn, { body: { email: 'admin@styleit.com', password: 'Admin1234' } }).body.user.role, 'admin')
})

test('tampered or missing tokens are rejected', () => {
  const { token } = as('ann@x.co', 'password1')
  assert.throws(() => authed(token + 'x'), (e) => e.status === 401)
  assert.throws(() => authed(''), (e) => e.status === 401)
  assert.ok(authed(token).user)
})

test('open a shop, then only sellers can use seller routes', () => {
  const { token } = as('ann@x.co', 'password1')
  assert.throws(() => requireSeller(authed(token), null, () => {}), (e) => e.status === 403)
  fails(auth.openShop, { ...authed(token), body: { name: 'A' } }, 400, 'shop')
  const r = call(auth.openShop, { ...authed(token), body: { name: 'Ann’s Closet' } })
  assert.equal(r.body.user.seller, true)
  fails(auth.openShop, { ...authed(token), body: { name: 'Again' } }, 409)
  requireSeller(authed(token), null, () => {})
  assert.throws(() => requireAdmin(authed(token), null, () => {}), (e) => e.status === 403)
})

test('add a product: needs a photo and at least 1 item', () => {
  const t = as('ann@x.co', 'password1').token
  fails(prod.create, { ...authed(t), body: form({ img: '' }) }, 400, 'i')
  fails(prod.create, { ...authed(t), body: form({ stock: 0 }) }, 400, 'k')
  fails(prod.create, { ...authed(t), body: form({ price: 0 }) }, 400, 'p')
  fails(prod.create, { ...authed(t), body: form({ group: 'Pets' }) }, 400, 'g')
  fails(prod.create, { ...authed(t), body: form({ img: 'http://evil/x.png' }) }, 400, 'i')
  const r = call(prod.create, { ...authed(t), body: form() })
  assert.equal(r.code, 201)
  assert.equal(r.body.left, 5)
  assert.equal(r.body.shop, 'Ann’s Closet')
  assert.equal(call(prod.list, {}).body.length, 1)
})

test('THE RESTOCK BUG: after selling 29, a seller can still restock and edit', () => {
  const t = as('ann@x.co', 'password1').token
  const p = call(prod.create, { ...authed(t), body: form({ name: 'Tote', stock: 29 }) }).body
  // simulate 29 sales (the orders part comes next)
  const row = Product.find(p.id); row.sold = 29; row.save()
  assert.equal(Product.find(p.id).left, 0) // sold out

  // restock adds on top; sold stays history
  let r = call(prod.restock, { ...authed(t), params: { id: p.id }, body: { amount: 20 } })
  assert.equal(r.body.sold, 29)
  assert.equal(r.body.left, 20)
  assert.equal(r.body.stock, 49)

  // edit by "stock left": sell out again, then type 15 left
  const again = Product.find(p.id); again.sold = 49; again.save()
  r = call(prod.update, { ...authed(t), params: { id: p.id }, body: { name: 'Tote', group: 'Women', category: 'Bags', price: 300, stockLeft: 15 } })
  assert.equal(r.body.sold, 49)
  assert.equal(r.body.left, 15)
  // 0 left is allowed too
  r = call(prod.update, { ...authed(t), params: { id: p.id }, body: { name: 'Tote', group: 'Women', category: 'Bags', price: 300, stockLeft: 0 } })
  assert.equal(r.body.left, 0)
  fails(prod.update, { ...authed(t), params: { id: p.id }, body: { name: 'Tote', group: 'Women', category: 'Bags', price: 300, stockLeft: -1 } }, 400, 'k')
  fails(prod.update, { ...authed(t), params: { id: p.id }, body: { name: 'Tote', group: 'Women', category: 'Bags', price: 300, stockLeft: '' } }, 400, 'k')
  fails(prod.restock, { ...authed(t), params: { id: p.id }, body: { amount: 0 } }, 400, 'amount')
  fails(prod.restock, { ...authed(t), params: { id: p.id }, body: { amount: 1.5 } }, 400, 'amount')
})

test('sellers can only change their own products', () => {
  call(auth.signUp, { body: { name: 'Bo Ray', email: 'bo@x.co', password: 'password1' } })
  const bo = as('bo@x.co', 'password1').token
  call(auth.openShop, { ...authed(bo), body: { name: 'Bo Shop' } })
  const id = call(prod.mine, authed(as('ann@x.co', 'password1').token)).body[0].id
  fails(prod.restock, { ...authed(bo), params: { id }, body: { amount: 5 } }, 403)
  fails(prod.remove, { ...authed(bo), params: { id } }, 403)
  fails(prod.restock, { ...authed(bo), params: { id: 9999 }, body: { amount: 5 } }, 404)
  fails(prod.restock, { ...authed(bo), params: { id: 'abc' }, body: { amount: 5 } }, 404)
  assert.equal(call(prod.mine, authed(bo)).body.length, 0)
})

test('forgot password: code works once, wrong codes lock it, new password works', () => {
  fails(auth.requestReset, { body: { email: 'nope' } }, 400, 'fe')
  // demo mode (code shown on screen): unknown emails get a clear message instead of a silent nothing
  fails(auth.requestReset, { body: { email: 'ghost@x.co' } }, 404, 'fe')
  assert.throws(() => call(auth.requestReset, { body: { email: 'ghost@x.co' } }), (e) => /No StyleIt account uses that email/.test(e.message))
  const code = call(auth.requestReset, { body: { email: 'ann@x.co' } }).body.devCode
  assert.match(code, /^\d{6}$/)
  fails(auth.resetPassword, { body: { email: 'ann@x.co', code: '000000', password: 'newpassword1' } }, 400, 'fc')
  fails(auth.resetPassword, { body: { email: 'ann@x.co', code, password: 'short' } }, 400, 'fp')
  call(auth.resetPassword, { body: { email: 'ann@x.co', code, password: 'newpassword1' } })
  fails(auth.signIn, { body: { email: 'ann@x.co', password: 'password1' } }, 401)
  assert.ok(call(auth.signIn, { body: { email: 'ann@x.co', password: 'newpassword1' } }).body.token)
  fails(auth.resetPassword, { body: { email: 'ann@x.co', code, password: 'another1234' } }, 400, 'fc') // used up

  const c2 = call(auth.requestReset, { body: { email: 'bo@x.co' } }).body.devCode
  for (let i = 0; i < 5; i++) assert.throws(() => call(auth.resetPassword, { body: { email: 'bo@x.co', code: '111111', password: 'newpassword1' } }))
  fails(auth.resetPassword, { body: { email: 'bo@x.co', code: c2, password: 'newpassword1' } }, 429, 'fc') // locked
})

test('suspended users cannot sign in, and their products disappear from the shop', () => {
  const bo = as('bo@x.co', 'password1').token
  call(prod.create, { ...authed(bo), body: form({ name: 'Bo Hat' }) })
  const before = call(prod.list, {}).body.length
  // (the admin Suspend button comes in Part 3: flip it directly for now)
  db.prepare('UPDATE users SET suspended = 1 WHERE email = ?').run('bo@x.co')
  assert.equal(call(prod.list, {}).body.length, before - 1)
  fails(auth.signIn, { body: { email: 'bo@x.co', password: 'password1' } }, 403, 'ae')
  assert.throws(() => authed(bo), (e) => e.status === 403) // an old token stops working too
})

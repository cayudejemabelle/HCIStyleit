import { test } from 'node:test'
import assert from 'node:assert/strict'
import { requireAdmin, auth, admin, orders, cart, notes, call, fails, person, addProduct, adminAs, Product, db } from '../testkit/helpers.js'

const ann = person('Ann Lee', 'ann@x.co', { shop: 'Ann Closet' })
const bo = person('Bo Ray', 'bo@x.co', { shop: 'Bo Shop' })
const cy = person('Cy Dee', 'cy@x.co')
const dress = addProduct(ann, { name: 'Dress' })
const hat = addProduct(bo, { name: 'Hat' })
// Cy buys a dress, so there is order and money data the admin must NOT see
call(cart.add, { ...cy.as(), body: { productId: dress.id } })
call(orders.place, { ...cy.as(), body: { productIds: [dress.id], payment: 'gcash' } })

test('only admins get through the admin door', () => {
  assert.throws(() => requireAdmin(ann.as(), null, () => {}), (e) => e.status === 403)
  assert.throws(() => requireAdmin(cy.as(), null, () => {}), (e) => e.status === 403)
  requireAdmin(adminAs(), null, () => {})
})

test('overview: counts only, no orders or money', () => {
  const o = call(admin.overview, adminAs()).body
  assert.deepEqual(o, { buyers: 3, sellers: 2, warnings: 0, suspended: 0, products: 2 })
  assert.ok(!JSON.stringify(o).match(/order|revenue|sales|total/i))
})

test('seller list and profile show safe info only', () => {
  const list = call(admin.sellers, adminAs()).body
  assert.equal(list.length, 2)
  assert.deepEqual(Object.keys(list[0]).sort(), ['id', 'joined', 'owner', 'products', 'ratingAvg', 'ratingCount', 'shop', 'suspended', 'warns'])
  const p = call(admin.seller, { ...adminAs(), params: { id: ann.id } }).body
  assert.equal(p.shop, 'Ann Closet')
  assert.equal(p.productList.length, 1)
  const text = JSON.stringify(p)
  assert.ok(!text.includes('ann@x.co'), 'no email')
  assert.ok(!text.includes('pw') && !text.includes('1600') && !/buyerName|payment/.test(text), 'no orders, money or passwords')
  fails(admin.seller, { ...adminAs(), params: { id: cy.id } }, 404) // Cy is not a seller
  fails(admin.seller, { ...adminAs(), params: { id: 'abc' } }, 404)
})

test('buyer list has names and status, not emails', () => {
  const b = call(admin.buyers, adminAs()).body
  assert.equal(b.length, 3)
  assert.ok(!JSON.stringify(b).includes('@'))
})

test('suspend and reactivate', () => {
  fails(admin.setSuspended, { ...adminAs(), params: { id: bo.id }, body: { suspended: 'yes' } }, 400)
  const adminId = db.prepare("SELECT id FROM users WHERE role = 'admin'").get().id
  fails(admin.setSuspended, { ...adminAs(), params: { id: adminId }, body: { suspended: true } }, 400) // not an admin
  fails(admin.setSuspended, { ...adminAs(), params: { id: 9999 }, body: { suspended: true } }, 404)

  call(admin.setSuspended, { ...adminAs(), params: { id: bo.id }, body: { suspended: true } })
  fails(auth.signIn, { body: { email: 'bo@x.co', password: 'password1' } }, 403, 'ae')
  assert.equal(call(admin.overview, adminAs()).body.suspended, 1)
  assert.equal(call(admin.overview, adminAs()).body.products, 1) // Bo's hat left the shop
  assert.throws(() => bo.as(), (e) => e.status === 403) // the old token stops working

  call(admin.setSuspended, { ...adminAs(), params: { id: bo.id }, body: { suspended: false } })
  assert.ok(call(auth.signIn, { body: { email: 'bo@x.co', password: 'password1' } }).body.token)
  assert.equal(call(admin.overview, adminAs()).body.products, 2)
})

test('removing a product needs a reason and warns the seller', () => {
  const rm = (body, id = hat.id) => ({ ...adminAs(), params: { id }, body })
  fails(admin.removeProduct, rm({}), 400, 'reason')
  fails(admin.removeProduct, rm({ reason: 9 }), 400, 'reason')
  fails(admin.removeProduct, rm({ reason: 5, note: 'bad' }), 400, 'note') // "Other" needs an explanation
  fails(admin.removeProduct, rm({ reason: 1 }, 9999), 404)
  assert.equal(Product.find(hat.id).name, 'Hat') // nothing was removed by the failed tries

  const r = call(admin.removeProduct, rm({ reason: 5, note: 'Please use your own photos.' })).body
  assert.equal(r.warns, 1)
  assert.equal(Product.find(hat.id), null)
  const warn = call(notes.list, bo.as()).body.find((n) => n.icon === '⚠️')
  assert.equal(warn.text, 'Warning: your product “Hat” was removed by the admin')
  assert.match(warn.note, /Reason: Other – Please use your own photos\./)
  assert.equal(call(admin.sellers, adminAs()).body.find((s) => s.id === bo.id).warns, 1)
  assert.equal(call(admin.overview, adminAs()).body.warnings, 1)

  const r2 = call(admin.removeProduct, { ...adminAs(), params: { id: dress.id }, body: { reason: 0 } }).body
  assert.equal(r2.warns, 1) // Ann's first warning
})

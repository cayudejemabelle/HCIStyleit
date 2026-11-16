import { test } from 'node:test'
import assert from 'node:assert/strict'
import { requireSeller, auth, prod, cart, orders, notes, reviews, call, fails, person, addProduct, Product, db } from '../testkit/helpers.js'

const ann = person('Ann Lee', 'ann@x.co', { shop: 'Ann Closet' })
const bo = person('Bo Ray', 'bo@x.co', { shop: 'Bo Shop' })
const cy = person('Cy Dee', 'cy@x.co') // just a buyer
const dress = addProduct(ann, { name: 'Dress', price: 800, stock: 5 })
const hat = addProduct(bo, { name: 'Hat', price: 250, stock: 2 })
const buy = (who, ids, payment = 'gcash') => call(orders.place, { ...who.as(), body: { productIds: ids, payment } })
const unread = (who) => call(notes.list, who.as()).body.filter((n) => !n.read)

test('cart: an item goes in ONCE; only + changes the number', () => {
  assert.equal(call(cart.add, { ...cy.as(), body: { productId: dress.id } }).body[0].qty, 1)
  fails(cart.add, { ...cy.as(), body: { productId: dress.id } }, 409) // not twice
  assert.equal(call(cart.list, cy.as()).body.length, 1)
  assert.equal(call(cart.change, { ...cy.as(), params: { productId: dress.id }, body: { delta: 1 } }).body[0].qty, 2)
  assert.equal(call(cart.change, { ...cy.as(), params: { productId: dress.id }, body: { delta: -1 } }).body[0].qty, 1)
  fails(cart.change, { ...cy.as(), params: { productId: dress.id }, body: { delta: 99 } }, 409) // only 5 left
  fails(cart.add, { ...ann.as(), body: { productId: dress.id } }, 400) // not your own product
  fails(cart.add, { ...cy.as(), body: { productId: 9999 } }, 404)
  assert.equal(call(cart.change, { ...cy.as(), params: { productId: dress.id }, body: { delta: -1 } }).body.length, 0) // 0 removes it
})

test('cart: limit of 10 different items', () => {
  const many = Array.from({ length: 11 }, (_, i) => addProduct(ann, { name: 'Item ' + i }))
  for (let i = 0; i < 10; i++) call(cart.add, { ...cy.as(), body: { productId: many[i].id } })
  fails(cart.add, { ...cy.as(), body: { productId: many[10].id } }, 409)
  call(cart.removeMany, { ...cy.as(), body: { ids: many.map((m) => m.id) } })
  assert.equal(call(cart.list, cy.as()).body.length, 0)
  for (const m of many) call(prod.remove, { ...ann.as(), params: { id: m.id } })
})

test('placing an order: payment needed, split per seller, stock goes down, everyone told', () => {
  call(cart.add, { ...cy.as(), body: { productId: dress.id } })
  call(cart.change, { ...cy.as(), params: { productId: dress.id }, body: { delta: 1 } }) // 2 dresses
  call(cart.add, { ...cy.as(), body: { productId: hat.id } })
  fails(orders.place, { ...cy.as(), body: { productIds: [dress.id, hat.id] } }, 400, 'pay') // no payment
  fails(orders.place, { ...cy.as(), body: { productIds: [], payment: 'cod' } }, 400)
  const r = buy(cy, [dress.id, hat.id], 'cod')
  assert.equal(r.code, 201)
  assert.equal(r.body.length, 2) // one order per seller
  const [o1, o2] = r.body
  assert.equal(o1.id, 1001); assert.equal(o2.id, 1002)
  assert.equal(r.body.find((o) => o.shop === 'Ann Closet').total, 1600)
  assert.equal(r.body[0].paid, false) // cash on delivery
  assert.equal(Product.find(dress.id).left, 3)
  assert.equal(Product.find(hat.id).left, 1)
  assert.ok(unread(ann).some((n) => n.text.startsWith('Order received #')))
  assert.ok(unread(ann).some((n) => n.text.startsWith('Low stock: Dress'))) // 3 left
  assert.ok(unread(bo).some((n) => n.text.startsWith('Low stock: Hat')))
  assert.ok(unread(cy).some((n) => n.text.startsWith('Order #')))
  assert.equal(call(cart.list, cy.as()).body.length, 2) // bought items stay in the cart
  assert.equal(call(orders.mine, cy.as()).body.length, 2)
  assert.equal(call(orders.received, ann.as()).body.length, 1)
  assert.throws(() => requireSeller(cy.as(), null, () => {}), (e) => e.status === 403) // buyers have no seller view
})

test('a bad order changes nothing (all or nothing), and nobody can oversell', () => {
  const dee = person('Dee Fox', 'dee@x.co')
  const eve = person('Eve Poe', 'eve@x.co')
  call(cart.add, { ...dee.as(), body: { productId: dress.id } })
  call(cart.add, { ...dee.as(), body: { productId: hat.id } })
  call(cart.add, { ...eve.as(), body: { productId: hat.id } })
  assert.equal(buy(eve, [hat.id]).code, 201) // Eve takes the last hat first
  assert.equal(Product.find(hat.id).left, 0)
  const sold = Product.find(dress.id).sold
  fails(orders.place, { ...dee.as(), body: { productIds: [dress.id, hat.id], payment: 'gcash' } }, 409) // hat is gone
  assert.equal(Product.find(dress.id).sold, sold) // the dress was NOT bought either
  assert.equal(call(orders.mine, dee.as()).body.length, 0)
  fails(orders.place, { ...dee.as(), body: { productIds: [dress.id, 9999], payment: 'gcash' } }, 409)
  fails(orders.place, { ...ann.as(), body: { productIds: [dress.id], payment: 'gcash' } }, 409) // not in Ann's cart
})

test('cancelling before it ships puts the stock back; after shipping it is too late', () => {
  const o = call(orders.mine, cy.as()).body.find((x) => x.shop === 'Ann Closet')
  fails(orders.cancel, { ...bo.as(), params: { id: o.id } }, 403)
  call(orders.cancel, { ...cy.as(), params: { id: o.id } })
  assert.equal(Product.find(dress.id).left, 5) // back to 5
  fails(orders.cancel, { ...cy.as(), params: { id: o.id } }, 409)
  fails(orders.advance, { ...ann.as(), params: { id: o.id } }, 409) // cancelled orders cannot move
  assert.ok(unread(ann).some((n) => n.text.includes('was cancelled by Cy Dee')))

  const h = call(orders.mine, cy.as()).body.find((x) => x.shop === 'Bo Shop')
  call(orders.advance, { ...bo.as(), params: { id: h.id } }) // preparing
  call(orders.advance, { ...bo.as(), params: { id: h.id } }) // shipped
  fails(orders.cancel, { ...cy.as(), params: { id: h.id } }, 409)
})

test('seller moves the order along, buyer is told each step, buyer confirms arrival', () => {
  const h = call(orders.mine, cy.as()).body.find((x) => x.shop === 'Bo Shop')
  fails(orders.advance, { ...ann.as(), params: { id: h.id } }, 403) // not Ann's order
  fails(orders.advance, { ...cy.as(), params: { id: h.id } }, 403)
  assert.equal(call(orders.advance, { ...bo.as(), params: { id: h.id } }).body.status, 3)
  assert.ok(unread(cy).some((n) => n.text === `Order #${h.id}: In transit`))
  fails(orders.markReceived, { ...bo.as(), params: { id: h.id } }, 403) // only the buyer
  const done = call(orders.markReceived, { ...cy.as(), params: { id: h.id } }).body
  assert.equal(done.status, 5)
  assert.ok(done.history[5])
  assert.ok(unread(bo).some((n) => n.text.includes('was received by Cy Dee')))
  fails(orders.markReceived, { ...cy.as(), params: { id: h.id } }, 409)
  fails(orders.advance, { ...bo.as(), params: { id: h.id } }, 409)
})

test('reviews: only after delivery, once, rating 1 to 5, and the average shows on the product', () => {
  const rv = (who, id, body) => ({ ...who.as(), params: { id }, body })
  fails(reviews.create, rv(cy, dress.id, { rating: 5 }), 403) // that order was cancelled
  const dee = person('Dee R', 'dee2@x.co')
  fails(reviews.create, rv(dee, hat.id, { rating: 5 }), 403) // never bought it
  fails(reviews.create, rv(cy, hat.id, {}), 400, 'rating')
  fails(reviews.create, rv(cy, hat.id, { rating: 6 }), 400, 'rating')
  fails(reviews.create, rv(cy, hat.id, { rating: 4, text: 'x'.repeat(201) }), 400, 'text')
  const list = call(reviews.create, rv(cy, hat.id, { rating: 4, text: 'Nice fit' })).body
  assert.equal(list[0].rating, 4)
  assert.equal(list[0].buyerName, 'Cy Dee')
  fails(reviews.create, rv(cy, hat.id, { rating: 5 }), 409) // only once
  assert.ok(unread(bo).some((n) => n.text.startsWith('New review for “Hat”')))
  const shown = call(prod.one, { params: { id: hat.id } }).body
  assert.equal(shown.ratingAvg, 4)
  assert.equal(shown.ratingCount, 1)
  assert.equal(call(prod.one, { params: { id: dress.id } }).body.ratingAvg, null)
  assert.equal(call(reviews.list, { params: { id: hat.id } }).body.length, 1)
})

test('notifications: newest first, mark all read, admins hear about users and shops but not orders', () => {
  const list = call(notes.list, cy.as()).body
  assert.ok(list.length > 1 && list[0].id > list[1].id)
  const after = call(notes.readAll, cy.as()).body
  assert.ok(after.every((n) => n.read))
  const admin = call(auth.signIn, { body: { email: 'admin@styleit.com', password: 'Admin1234' } })
  const req = { headers: { authorization: 'Bearer ' + admin.body.token }, body: {}, params: {} }
  const adminNotes = db.prepare("SELECT text FROM notifications WHERE user_id = ?").all(admin.body.user.id).map((n) => n.text)
  assert.ok(adminNotes.some((t) => t.startsWith('User joined: Ann Lee')))
  assert.ok(adminNotes.some((t) => t.startsWith('Shop opened: Ann Closet')))
  assert.ok(adminNotes.some((t) => t.startsWith('Added product: Dress')))
  assert.ok(!adminNotes.some((t) => /order|₱/i.test(t)), 'admin must not get order or money news')
})

test('removing a product that has orders keeps the order history', () => {
  const h = call(orders.mine, cy.as()).body.find((x) => x.shop === 'Bo Shop')
  call(prod.remove, { ...bo.as(), params: { id: hat.id } })
  const after = call(orders.mine, cy.as()).body.find((x) => x.id === h.id)
  assert.equal(after.items[0].name, 'Hat')
  assert.equal(after.items[0].productId, null)
  assert.equal(call(cart.list, cy.as()).body.some((i) => i.productId === hat.id), false) // gone from carts
})

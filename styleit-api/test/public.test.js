import { test } from 'node:test'
import assert from 'node:assert/strict'
import { auth, orders, cart, reviews, call, fails, person, addProduct } from '../testkit/helpers.js'

const ann = person('Ann Lee', 'ann@x.co', { shop: 'Ann Closet' })
const bo = person('Bo Ray', 'bo@x.co', { shop: 'Bo Shop' })
const cy = person('Cy Dee', 'cy@x.co')
const dress = addProduct(ann, { name: 'Dress', price: 800, stock: 9 })
const hat = addProduct(bo, { name: 'Hat', price: 250, stock: 9 })

test('top sellers: ranked by sales, but only shop and order count are public', () => {
  assert.deepEqual(call(orders.topSellers, {}).body, []) // nothing sold yet
  for (const p of [dress, hat]) call(cart.add, { ...cy.as(), body: { productId: p.id } })
  call(orders.place, { ...cy.as(), body: { productIds: [dress.id, hat.id], payment: 'cod' } })
  const top = call(orders.topSellers, {}).body
  assert.deepEqual(top, [{ shop: 'Ann Closet', orders: 1 }, { shop: 'Bo Shop', orders: 1 }]) // dress sold for more
  assert.ok(!JSON.stringify(top).match(/sales|total|800|250/))
  // cancelled orders do not count
  const o = call(orders.mine, cy.as()).body.find((x) => x.shop === 'Ann Closet')
  call(orders.cancel, { ...cy.as(), params: { id: o.id } })
  assert.deepEqual(call(orders.topSellers, {}).body, [{ shop: 'Bo Shop', orders: 1 }])
})

test('all reviews are public and include who wrote them', () => {
  const o = call(orders.mine, cy.as()).body.find((x) => x.shop === 'Bo Shop')
  call(orders.advance, { ...bo.as(), params: { id: o.id } })
  call(orders.advance, { ...bo.as(), params: { id: o.id } })
  call(orders.markReceived, { ...cy.as(), params: { id: o.id } })
  call(reviews.create, { ...cy.as(), params: { id: hat.id }, body: { rating: 5, text: 'Great' } })
  const all = call(reviews.all, {}).body
  assert.equal(all.length, 1)
  assert.equal(all[0].buyerId, cy.id)
  assert.equal(all[0].buyerName, 'Cy Dee')
})

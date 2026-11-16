import db from '../db/database.js'
import Product from './Product.js'
import Cart from './Cart.js'
import { HttpError } from '../utils/validate.js'

const SELECT = `SELECT o.*, b.name AS buyer_name, s.shop AS shop
  FROM orders o JOIN users b ON b.id = o.buyer_id JOIN users s ON s.id = o.seller_id`
const now = () => new Date().toISOString()

// One order = the items a buyer bought from ONE seller.
export default class Order {
  constructor(r) {
    this.id = r.id
    this.buyerId = r.buyer_id
    this.buyerName = r.buyer_name
    this.sellerId = r.seller_id
    this.shop = r.shop
    this.total = r.total
    this.status = r.status // 0 placed, 1 preparing, 2 shipped, 3 in transit, 4 out for delivery, 5 delivered
    this.cancelled = !!r.cancelled
    this.payment = r.pay_label
    this.paid = !!r.paid
    this.createdAt = r.created_at
    this.items = db.prepare('SELECT product_id AS productId, name, price, qty FROM order_items WHERE order_id = ? ORDER BY id').all(r.id).map((i) => ({ ...i }))
    this.history = [] // history[step] = when that step happened
    for (const e of db.prepare('SELECT step, at FROM order_events WHERE order_id = ?').all(r.id)) this.history[e.step] = e.at
  }

  static find(id) { const r = db.prepare(SELECT + ' WHERE o.id = ?').get(id); return r ? new Order(r) : null }
  static forBuyer(id) { return db.prepare(SELECT + ' WHERE o.buyer_id = ? ORDER BY o.id DESC').all(id).map((r) => new Order(r)) }
  static forSeller(id) { return db.prepare(SELECT + ' WHERE o.seller_id = ? ORDER BY o.id DESC').all(id).map((r) => new Order(r)) }

  // The shops with the most sales. Only the shop name and order count leave the server, never the money.
  static topSellers(limit = 3) {
    return db.prepare(`SELECT s.shop AS shop, COUNT(*) AS orders, SUM(o.total) AS sales
      FROM orders o JOIN users s ON s.id = o.seller_id
      WHERE o.cancelled = 0 AND s.suspended = 0 GROUP BY o.seller_id ORDER BY sales DESC LIMIT ?`).all(limit)
      .map((r) => ({ shop: r.shop, orders: r.orders }))
  }

  // Buys the given cart items. Call it inside transaction() so a failure undoes everything.
  static place(buyer, productIds, payLabel, paid) {
    const lines = productIds.map((id) => ({ p: Product.find(id), q: Cart.qty(buyer.id, id) }))
    for (const { p, q } of lines) {
      if (!p || !q) throw new HttpError(409, 'An item isn’t available anymore.')
      if (p.sellerId === buyer.id) throw new HttpError(400, 'You can’t buy your own product.')
      if (q > p.left) throw new HttpError(409, `Sorry, only ${p.left} left of “${p.name}”. Please lower the quantity in your cart.`)
    }
    const bySeller = new Map()
    for (const l of lines) bySeller.set(l.p.sellerId, [...(bySeller.get(l.p.sellerId) || []), l])

    const orders = []
    for (const [sellerId, ls] of bySeller) {
      const id = db.prepare('SELECT COALESCE(MAX(id), 1000) + 1 AS n FROM orders').get().n
      const total = ls.reduce((a, { p, q }) => a + p.price * q, 0)
      db.prepare('INSERT INTO orders (id, buyer_id, seller_id, total, pay_label, paid, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .run(id, buyer.id, sellerId, total, payLabel, paid ? 1 : 0, now())
      for (const { p, q } of ls) {
        db.prepare('INSERT INTO order_items (order_id, product_id, name, price, qty) VALUES (?, ?, ?, ?, ?)').run(id, p.id, p.name, p.price, q)
        // the WHERE makes this safe even if two buyers click at the same moment
        const info = db.prepare('UPDATE products SET sold = sold + ? WHERE id = ? AND stock - sold >= ?').run(q, p.id, q)
        if (!info.changes) throw new HttpError(409, `Sorry, “${p.name}” just sold out.`)
      }
      db.prepare('INSERT INTO order_events (order_id, step, at) VALUES (?, 0, ?)').run(id, now())
      orders.push(Order.find(id))
    }
    const touched = lines.map((l) => Product.find(l.p.id))
    return { orders, touched }
  }

  #setStatus(n) {
    this.status = n
    db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(n, this.id)
    db.prepare('INSERT OR REPLACE INTO order_events (order_id, step, at) VALUES (?, ?, ?)').run(this.id, n, now())
    this.history[n] = now()
  }
  advance() { this.#setStatus(this.status + 1) } // the seller moves it to the next step
  markReceived() { this.#setStatus(5) } // the buyer confirms it arrived

  // Cancelling puts the stock back.
  cancel() {
    db.prepare('UPDATE orders SET cancelled = 1 WHERE id = ?').run(this.id)
    for (const i of this.items) if (i.productId) db.prepare('UPDATE products SET sold = MAX(0, sold - ?) WHERE id = ?').run(i.qty, i.productId)
    this.cancelled = true
  }
}

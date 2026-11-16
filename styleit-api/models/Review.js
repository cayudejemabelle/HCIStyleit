import db from '../db/database.js'

export default class Review {
  static #map(rows) {
    return rows.map((r) => ({ id: r.id, productId: r.product_id, buyerId: r.buyer_id, buyerName: r.buyer_name, rating: r.rating, text: r.text, createdAt: r.created_at }))
  }
  static forProduct(productId) {
    return Review.#map(db.prepare('SELECT r.*, u.name AS buyer_name FROM reviews r JOIN users u ON u.id = r.buyer_id WHERE r.product_id = ? ORDER BY r.id DESC').all(productId))
  }
  // Every review (reviews are public). Lets the shop show stars on every product at once.
  static all() {
    return Review.#map(db.prepare('SELECT r.*, u.name AS buyer_name FROM reviews r JOIN users u ON u.id = r.buyer_id ORDER BY r.id').all())
  }
  static exists(productId, buyerId) {
    return !!db.prepare('SELECT 1 AS x FROM reviews WHERE product_id = ? AND buyer_id = ?').get(productId, buyerId)
  }
  // Only buyers whose order with this product was delivered (and not cancelled) can review it.
  static canReview(productId, buyerId) {
    return !!db.prepare('SELECT 1 AS x FROM orders o JOIN order_items i ON i.order_id = o.id WHERE o.buyer_id = ? AND i.product_id = ? AND o.status = 5 AND o.cancelled = 0').get(buyerId, productId)
  }
  static create(productId, buyerId, rating, text) {
    db.prepare('INSERT INTO reviews (product_id, buyer_id, rating, text, created_at) VALUES (?, ?, ?, ?, ?)').run(productId, buyerId, rating, text, new Date().toISOString())
  }
}

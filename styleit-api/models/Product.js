import db from '../db/database.js'

const SELECT = `SELECT p.*, u.shop AS shop,
  (SELECT ROUND(AVG(rating), 1) FROM reviews WHERE product_id = p.id) AS rating_avg,
  (SELECT COUNT(*) FROM reviews WHERE product_id = p.id) AS rating_count
  FROM products p JOIN users u ON u.id = p.seller_id`

export default class Product {
  constructor(r) {
    this.id = r.id
    this.sellerId = r.seller_id
    this.shop = r.shop
    this.name = r.name
    this.group = r.grp
    this.category = r.category
    this.price = r.price
    this.stock = r.stock // every item ever stocked
    this.sold = r.sold // history: only goes up
    this.img = r.img
    this.description = r.description
    this.createdAt = r.created_at
    this.updatedAt = r.updated_at
    this.ratingAvg = r.rating_avg // null until someone reviews
    this.ratingCount = r.rating_count
  }

  // Items on the shelf right now.
  get left() { return Math.max(0, this.stock - this.sold) }

  static find(id) {
    const r = db.prepare(SELECT + ' WHERE p.id = ?').get(id)
    return r ? new Product(r) : null
  }
  // What buyers see: products of sellers who are not suspended.
  static visible() {
    return db.prepare(SELECT + ' WHERE u.suspended = 0 ORDER BY p.id DESC').all().map((r) => new Product(r))
  }
  static countVisible() {
    return db.prepare('SELECT COUNT(*) AS n FROM products p JOIN users u ON u.id = p.seller_id WHERE u.suspended = 0').get().n
  }
  static bySeller(sellerId) {
    return db.prepare(SELECT + ' WHERE p.seller_id = ? ORDER BY p.id DESC').all(sellerId).map((r) => new Product(r))
  }
  static create({ sellerId, name, group, category, price, stock, img, description }) {
    const info = db.prepare('INSERT INTO products (seller_id, name, grp, category, price, stock, img, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .run(sellerId, name, group, category, price, stock, img, description, new Date().toISOString())
    return Product.find(Number(info.lastInsertRowid))
  }

  // Restock ADDS items. Sold is history and never changes.
  restock(n) { this.stock += n; this.save() }
  // Edit form: the seller types how many are on the shelf now.
  setLeft(n) { this.stock = this.sold + n }

  save() {
    this.updatedAt = new Date().toISOString()
    db.prepare('UPDATE products SET name = ?, grp = ?, category = ?, price = ?, stock = ?, sold = ?, img = ?, description = ?, updated_at = ? WHERE id = ?')
      .run(this.name, this.group, this.category, this.price, this.stock, this.sold, this.img, this.description, this.updatedAt, this.id)
  }
  remove() { db.prepare('DELETE FROM products WHERE id = ?').run(this.id) }

  toJSON() { return { ...this, left: this.left } }
}

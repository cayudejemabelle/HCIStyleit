import db from '../db/database.js'

export default class User {
  constructor(r) {
    this.id = r.id
    this.name = r.name
    this.email = r.email
    this.pwHash = r.pw_hash
    this.role = r.role
    this.provider = r.provider
    this.seller = !!r.seller
    this.shop = r.shop
    this.joined = r.joined
    this.warns = r.warns
    this.suspended = !!r.suspended
  }

  static #wrap(r) { return r ? new User(r) : null }
  static findByEmail(email) { return User.#wrap(db.prepare('SELECT * FROM users WHERE email = ?').get(email)) }
  static findById(id) { return User.#wrap(db.prepare('SELECT * FROM users WHERE id = ?').get(id)) }

  static create({ name, email, pwHash = null, provider = 'password', role = 'user' }) {
    const info = db.prepare('INSERT INTO users (name, email, pw_hash, role, provider, joined) VALUES (?, ?, ?, ?, ?, ?)')
      .run(name, email, pwHash, role, provider, new Date().toISOString())
    return User.findById(Number(info.lastInsertRowid))
  }

  // ---- admin views: only what an admin needs to moderate. No orders, sales or emails.
  static #summaries(where, ...args) {
    return db.prepare(`SELECT u.*,
      (SELECT COUNT(*) FROM products WHERE seller_id = u.id) AS product_count,
      (SELECT ROUND(AVG(r.rating), 1) FROM reviews r JOIN products p ON p.id = r.product_id WHERE p.seller_id = u.id) AS rating_avg,
      (SELECT COUNT(*) FROM reviews r JOIN products p ON p.id = r.product_id WHERE p.seller_id = u.id) AS rating_count
      FROM users u WHERE u.seller = 1 ${where} ORDER BY u.id DESC`).all(...args)
      .map((r) => ({ id: r.id, shop: r.shop, owner: r.name, joined: r.joined, products: r.product_count, ratingAvg: r.rating_avg, ratingCount: r.rating_count, warns: r.warns, suspended: !!r.suspended }))
  }
  static sellerSummaries() { return User.#summaries('') }
  static sellerSummary(id) { return User.#summaries('AND u.id = ?', id)[0] || null }
  static nonAdmins() { return db.prepare("SELECT * FROM users WHERE role != 'admin' ORDER BY id DESC").all().map((r) => new User(r)) }
  static counts() {
    const n = (sql) => db.prepare(sql).get().n
    return {
      buyers: n("SELECT COUNT(*) AS n FROM users WHERE role != 'admin'"),
      sellers: n('SELECT COUNT(*) AS n FROM users WHERE seller = 1'),
      warnings: n("SELECT COALESCE(SUM(warns), 0) AS n FROM users WHERE role != 'admin'"),
      suspended: n('SELECT COUNT(*) AS n FROM users WHERE suspended = 1'),
    }
  }
  setSuspended(on) {
    db.prepare('UPDATE users SET suspended = ? WHERE id = ?').run(on ? 1 : 0, this.id)
    this.suspended = on
  }
  addWarning() {
    db.prepare('UPDATE users SET warns = warns + 1 WHERE id = ?').run(this.id)
    this.warns += 1
  }

  openShop(name) {
    db.prepare('UPDATE users SET seller = 1, shop = ? WHERE id = ?').run(name, this.id)
    this.seller = true
    this.shop = name
  }
  setPassword(hash) {
    db.prepare('UPDATE users SET pw_hash = ? WHERE id = ?').run(hash, this.id)
    this.pwHash = hash
  }

  // What the frontend may see. The password hash never leaves the server.
  toPublic() {
    const { id, name, email, role, provider, seller, shop, joined, warns, suspended } = this
    return { id, name, email, role, provider, seller, shop, joined, warns, suspended }
  }
}

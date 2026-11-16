import db from '../db/database.js'

const ROWS = `SELECT c.qty, p.id AS product_id, p.name, p.price, p.img, p.grp, p.category, p.stock, p.sold, p.seller_id, u.shop
  FROM cart_items c JOIN products p ON p.id = c.product_id JOIN users u ON u.id = p.seller_id
  WHERE c.user_id = ? ORDER BY c.rowid`

// One row per different product. "qty" is how many of it.
export default class Cart {
  static items(userId) {
    return db.prepare(ROWS).all(userId).map((r) => {
      const left = Math.max(0, r.stock - r.sold)
      let qty = r.qty
      if (left >= 1 && qty > left) { // someone else bought some: lower it to what is left
        qty = left
        db.prepare('UPDATE cart_items SET qty = ? WHERE user_id = ? AND product_id = ?').run(qty, userId, r.product_id)
      }
      return { productId: r.product_id, name: r.name, price: r.price, img: r.img, group: r.grp, category: r.category, shop: r.shop, sellerId: r.seller_id, qty, left }
    })
  }
  static qty(userId, productId) {
    const r = db.prepare('SELECT qty FROM cart_items WHERE user_id = ? AND product_id = ?').get(userId, productId)
    return r ? r.qty : 0
  }
  static count(userId) { return db.prepare('SELECT COUNT(*) AS n FROM cart_items WHERE user_id = ?').get(userId).n }
  static add(userId, productId) { db.prepare('INSERT INTO cart_items (user_id, product_id, qty) VALUES (?, ?, 1)').run(userId, productId) }
  static setQty(userId, productId, qty) {
    if (qty <= 0) db.prepare('DELETE FROM cart_items WHERE user_id = ? AND product_id = ?').run(userId, productId)
    else db.prepare('UPDATE cart_items SET qty = ? WHERE user_id = ? AND product_id = ?').run(qty, userId, productId)
  }
  static remove(userId, ids) { for (const id of ids) Cart.setQty(userId, id, 0) }
}

import Cart from '../models/Cart.js'
import Product from '../models/Product.js'
import { HttpError } from '../utils/validate.js'
import { CART_MAX } from '../constants.js'

const mine = (req) => Cart.items(req.user.id)
const findProduct = (raw) => { const id = Number(raw); return Number.isInteger(id) ? Product.find(id) : null }

export const list = (req, res) => res.json(mine(req))

// Add an item for the FIRST time. After that, only the + button in the cart changes the number.
export function add(req, res) {
  const p = findProduct((req.body ?? {}).productId)
  if (!p) throw new HttpError(404, 'That product was not found.')
  if (p.sellerId === req.user.id) throw new HttpError(400, 'You can’t buy your own product.')
  if (Cart.qty(req.user.id, p.id)) throw new HttpError(409, 'Already in your cart. Use the + button in your cart to add more.')
  if (p.left < 1) throw new HttpError(409, 'Sorry, this item is sold out.')
  if (Cart.count(req.user.id) >= CART_MAX) throw new HttpError(409, `Your cart is full (${CART_MAX} items). Remove some items to add new ones.`)
  Cart.add(req.user.id, p.id)
  res.status(201).json(mine(req))
}

// The + and − buttons send { delta: 1 } or { delta: -1 }. { qty: 3 } sets it directly.
export function change(req, res) {
  const p = findProduct(req.params.productId)
  const have = p ? Cart.qty(req.user.id, p.id) : 0
  if (!have) throw new HttpError(404, 'That item is not in your cart.')
  const b = req.body ?? {}
  const q = Number.isInteger(b.delta) ? have + b.delta : Number(b.qty)
  if (!Number.isInteger(q)) throw new HttpError(400, 'Enter a whole number.')
  if (q > have && q > p.left) throw new HttpError(409, `Only ${p.left} left.`)
  Cart.setQty(req.user.id, p.id, q) // 0 or less removes it
  res.json(mine(req))
}

export function removeMany(req, res) {
  const ids = (Array.isArray((req.body ?? {}).ids) ? req.body.ids : []).map(Number).filter(Number.isInteger)
  Cart.remove(req.user.id, ids)
  res.json(mine(req))
}

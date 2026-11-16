import User from '../models/User.js'
import Product from '../models/Product.js'
import Notification from '../models/Notification.js'
import { transaction } from '../db/database.js'
import { HttpError, str } from '../utils/validate.js'
import { REASONS } from '../constants.js'

const userOf = (req) => {
  const id = Number(req.params.id)
  const u = Number.isInteger(id) ? User.findById(id) : null
  if (!u) throw new HttpError(404, 'That account was not found.')
  return u
}

// Counts only. No orders, no money.
export const overview = (req, res) => res.json({ ...User.counts(), products: Product.countVisible() })

export const sellers = (req, res) => res.json(User.sellerSummaries())

// One seller's profile: shop info and products. Never sales, orders, emails or buyer details.
export function seller(req, res) {
  const id = Number(req.params.id)
  const s = Number.isInteger(id) ? User.sellerSummary(id) : null
  if (!s) throw new HttpError(404, 'That seller was not found.')
  res.json({ ...s, productList: Product.bySeller(id) })
}

export const buyers = (req, res) =>
  res.json(User.nonAdmins().map((u) => ({ id: u.id, name: u.name, joined: u.joined, seller: u.seller, warns: u.warns, suspended: u.suspended })))

// Suspend or reactivate. Suspended people cannot sign in, and their products leave the shop.
export function setSuspended(req, res) {
  const u = userOf(req)
  const on = (req.body ?? {}).suspended
  if (typeof on !== 'boolean') throw new HttpError(400, 'Say whether to suspend (true) or reactivate (false).')
  if (u.role === 'admin') throw new HttpError(400, 'Admin accounts can’t be suspended.')
  transaction(() => {
    u.setSuspended(on)
    Notification.toAdmins(on ? '⛔' : '✅', (on ? 'Suspended: ' : 'Reactivated: ') + (u.shop || u.name))
  })
  res.json({ id: u.id, suspended: u.suspended })
}

// Remove a seller's product. A reason is required, and the seller gets a warning with it.
export function removeProduct(req, res) {
  const id = Number(req.params.id)
  const p = Number.isInteger(id) ? Product.find(id) : null
  if (!p) throw new HttpError(404, 'That product was not found.')
  const b = req.body ?? {}
  const r = Number(b.reason), note = str(b.note)
  if (!Number.isInteger(r) || r < 0 || r >= REASONS.length) throw new HttpError(400, 'Please choose a reason.', 'reason')
  if (note.length > 200) throw new HttpError(400, 'Keep the message under 200 characters.', 'note')
  if (r === REASONS.length - 1 && note.length < 5) throw new HttpError(400, 'Please explain the reason for “Other”.', 'note')
  const why = REASONS[r].split(' ').slice(1).join(' ').replace(' (explain below)', '')
  const tail = why + (note ? ' – ' + note.replace(/[.!? ]+$/, '') : '')
  const seller = User.findById(p.sellerId)
  transaction(() => {
    p.remove()
    seller.addWarning()
    Notification.add(seller.id, '⚠️', `Warning: your product “${p.name}” was removed by the admin`, `Reason: ${tail}. Please follow the shop rules to avoid more warnings.`)
    Notification.toAdmins('📋', `Removed “${p.name}” from ${p.shop}`, `Reason: ${tail} · seller warned`)
  })
  res.json({ message: `Product removed and ${p.shop} was warned.`, warns: seller.warns })
}

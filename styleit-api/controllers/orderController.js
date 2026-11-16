import Order from '../models/Order.js'
import Notification from '../models/Notification.js'
import { transaction } from '../db/database.js'
import { HttpError } from '../utils/validate.js'
import { peso } from '../utils/format.js'
import { PAY, STEPS } from '../constants.js'

const orderId = (req) => {
  const id = Number(req.params.id)
  const o = Number.isInteger(id) ? Order.find(id) : null
  if (!o) throw new HttpError(404, 'That order was not found.')
  return o
}

// Buyer: buy the ticked cart items. One order per seller. Stock goes down. Everyone is told.
export function place(req, res) {
  const b = req.body ?? {}
  const label = PAY[b.payment]
  if (!label) throw new HttpError(400, 'Choose a payment method first.', 'pay')
  const ids = [...new Set((Array.isArray(b.productIds) ? b.productIds : []).map(Number))]
  if (!ids.length || ids.some((x) => !Number.isInteger(x))) throw new HttpError(400, 'Tick at least one item to buy.')
  const paid = b.payment !== 'cod'

  const orders = transaction(() => {
    const { orders, touched } = Order.place(req.user, ids, label, paid)
    for (const o of orders) {
      Notification.add(req.user.id, '🧾', `Order #${o.id} placed`, `Payment: ${label}${paid ? ' (paid)' : ' (pay on delivery)'}`, 'b:orders')
      Notification.add(o.sellerId, '🛍', `Order received #${o.id} from ${req.user.name} · ${peso(o.total)}`, 'Payment: ' + label, 's:or:pend')
    }
    for (const p of touched) {
      if (p.left === 0) Notification.add(p.sellerId, '🚫', 'Sold out: ' + p.name, `All ${p.stock} items were sold.`, 's:pr')
      else if (p.left <= 3) Notification.add(p.sellerId, '📉', 'Low stock: ' + p.name, `Only ${p.left} left.`, 's:pr')
    }
    return orders
  })
  res.status(201).json(orders)
}

export const topSellers = (req, res) => res.json(Order.topSellers())
export const mine = (req, res) => res.json(Order.forBuyer(req.user.id))
export const received = (req, res) => res.json(Order.forSeller(req.user.id))

// Buyer cancels, but only before it ships.
export function cancel(req, res) {
  const o = orderId(req)
  if (o.buyerId !== req.user.id) throw new HttpError(403, 'That is not your order.')
  if (o.cancelled) throw new HttpError(409, 'This order is already cancelled.')
  if (o.status >= 2) throw new HttpError(409, 'Too late: this order already shipped.')
  transaction(() => {
    o.cancel()
    Notification.add(o.sellerId, '❌', `Order #${o.id} was cancelled by ${o.buyerName}`)
    Notification.add(o.buyerId, '❌', `You cancelled order #${o.id}`)
  })
  res.json(o)
}

// Seller moves the order to the next step. The buyer is told each time.
export function advance(req, res) {
  const o = orderId(req)
  if (o.sellerId !== req.user.id) throw new HttpError(403, 'That is not your order.')
  if (o.cancelled) throw new HttpError(409, 'This order was cancelled.')
  if (o.status >= 5) throw new HttpError(409, 'This order is already delivered.')
  transaction(() => {
    o.advance()
    Notification.add(o.buyerId, '📦', `Order #${o.id}: ${STEPS[o.status][0]}`, STEPS[o.status][1], 'b:orders')
  })
  res.json(o)
}

// Buyer confirms the parcel arrived.
export function markReceived(req, res) {
  const o = orderId(req)
  if (o.buyerId !== req.user.id) throw new HttpError(403, 'That is not your order.')
  if (o.cancelled) throw new HttpError(409, 'This order was cancelled.')
  if (o.status < 2) throw new HttpError(409, 'Your order has not shipped yet.')
  if (o.status >= 5) throw new HttpError(409, 'This order is already marked as received.')
  transaction(() => {
    o.markReceived()
    Notification.add(o.sellerId, '✅', `Order #${o.id} was received by ${o.buyerName}`)
  })
  res.json(o)
}

import Product from '../models/Product.js'
import Review from '../models/Review.js'
import Notification from '../models/Notification.js'
import { HttpError, str } from '../utils/validate.js'

const productOf = (req) => {
  const id = Number(req.params.id)
  const p = Number.isInteger(id) ? Product.find(id) : null
  if (!p) throw new HttpError(404, 'That product was not found.')
  return p
}

export const all = (req, res) => res.json(Review.all())
export const list = (req, res) => res.json(Review.forProduct(productOf(req).id))

export function create(req, res) {
  const p = productOf(req)
  const b = req.body ?? {}
  const rating = Number(b.rating), text = str(b.text)
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new HttpError(400, 'Please choose a star rating from 1 to 5.', 'rating')
  if (text.length > 200) throw new HttpError(400, 'Keep your comment under 200 characters.', 'text')
  if (!Review.canReview(p.id, req.user.id)) throw new HttpError(403, 'You can review an item after your order is delivered.')
  if (Review.exists(p.id, req.user.id)) throw new HttpError(409, 'You already reviewed this item.')
  Review.create(p.id, req.user.id, rating, text)
  Notification.add(p.sellerId, '⭐', `New review for “${p.name}”: ${'★'.repeat(rating)}${'☆'.repeat(5 - rating)}`, text || 'No comment', 's:pr')
  res.status(201).json(Review.forProduct(p.id))
}

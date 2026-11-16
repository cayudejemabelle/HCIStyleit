import Product from '../models/Product.js'
import Notification from '../models/Notification.js'
import { HttpError, str } from '../utils/validate.js'
import { peso } from '../utils/format.js'

const GROUPS = ['Women', 'Men', 'Kids']

// Checks the form. "creating" = Add a product. Otherwise it is Edit.
function readForm(b = {}, creating) {
  const v = {
    name: str(b.name), group: str(b.group), category: str(b.category),
    price: Math.round(Number(b.price)), description: str(b.description), img: str(b.img),
  }
  if (!v.name) throw new HttpError(400, 'Enter a product name.', 'n')
  if (!GROUPS.includes(v.group)) throw new HttpError(400, 'Choose Women, Men or Kids.', 'g')
  if (!v.category) throw new HttpError(400, 'Enter a category.', 's')
  if (!(v.price > 0)) throw new HttpError(400, 'Enter a price above 0.', 'p')
  if (v.description.length > 200) throw new HttpError(400, 'Keep the description under 200 characters.', 'd')
  if (creating) {
    v.stock = Math.floor(Number(b.stock))
    if (!(v.stock >= 1)) throw new HttpError(400, 'Enter how many items you have (at least 1).', 'k')
    if (!v.img) throw new HttpError(400, 'Please upload a photo of your product.', 'i')
  } else {
    if (b.stockLeft === '' || b.stockLeft == null || !(Number(b.stockLeft) >= 0)) throw new HttpError(400, 'Enter how many items are left (0 or more).', 'k')
    v.stockLeft = Math.floor(Number(b.stockLeft))
  }
  if (v.img && (!v.img.startsWith('data:image/') || v.img.length > 6_000_000)) throw new HttpError(400, 'That photo could not be used. Try a smaller image.', 'i')
  return v
}

// Finds a product and makes sure it belongs to the logged-in seller.
function ownProduct(req) {
  const id = Number(req.params.id)
  const p = Number.isInteger(id) ? Product.find(id) : null
  if (!p) throw new HttpError(404, 'That product was not found.')
  if (p.sellerId !== req.user.id) throw new HttpError(403, 'You can only change your own products.')
  return p
}

export const list = (req, res) => res.json(Product.visible())
export const mine = (req, res) => res.json(Product.bySeller(req.user.id))

export function one(req, res) {
  const id = Number(req.params.id)
  const p = Number.isInteger(id) ? Product.find(id) : null
  if (!p) throw new HttpError(404, 'That product was not found.')
  res.json(p)
}

export function create(req, res) {
  const v = readForm(req.body, true)
  const p = Product.create({ ...v, sellerId: req.user.id })
  Notification.add(req.user.id, '🎀', 'Added: ' + p.name, `Price ${peso(p.price)} · ${p.group} / ${p.category} · Stock ${p.stock}`, 's:pr')
  Notification.toAdmins('📋', `Added product: ${p.name} (${p.shop})`)
  res.status(201).json(p)
}

export function update(req, res) {
  const p = ownProduct(req)
  const v = readForm(req.body, false)
  const changes = []
  if (v.name !== p.name) changes.push(`Name: ${p.name} → ${v.name}`)
  if (v.price !== p.price) changes.push(`Price: ${peso(p.price)} → ${peso(v.price)}`)
  if (v.group !== p.group || v.category !== p.category) changes.push(`Category: ${p.group} / ${p.category} → ${v.group} / ${v.category}`)
  if (v.stockLeft !== p.left) changes.push(`Stock left: ${p.left} → ${v.stockLeft}`)
  if (v.description !== p.description) changes.push('Description changed')
  if (v.img) changes.push('Photo changed')
  Object.assign(p, { name: v.name, group: v.group, category: v.category, price: v.price, description: v.description })
  p.setLeft(v.stockLeft)
  if (v.img) p.img = v.img
  p.save()
  if (changes.length) Notification.add(p.sellerId, '✏️', 'Edited: ' + p.name, changes.join('; '), 's:pr')
  res.json(p)
}

export function restock(req, res) {
  const p = ownProduct(req)
  const n = Number((req.body ?? {}).amount)
  if (!Number.isInteger(n) || n < 1) throw new HttpError(400, 'Enter how many items you are adding (1 or more).', 'amount')
  if (n > 10000) throw new HttpError(400, 'That is too many. Enter 10,000 or less.', 'amount')
  p.restock(n)
  Notification.add(p.sellerId, '📦', 'Restocked: ' + p.name, `Added ${n}. Now ${p.left} left.`, 's:pr')
  res.json(p)
}

export function remove(req, res) {
  const p = ownProduct(req)
  p.remove()
  Notification.add(p.sellerId, '🗑️', 'Removed: ' + p.name, 'Price ' + peso(p.price))
  Notification.toAdmins('📋', `Removed product: ${p.name} (${p.shop})`)
  res.json({ message: 'Product removed.' })
}

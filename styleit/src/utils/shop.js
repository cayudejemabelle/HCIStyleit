// Small read-only helpers about products, reviews and orders.
export const rvOf = (s, pid) => s.reviews.filter((r) => r.pid === pid)
export const avg = (s, pid) => {
  const l = rvOf(s, pid)
  return l.length ? l.reduce((a, r) => a + r.rating, 0) / l.length : 0
}
// Has this buyer already bought the product (and not cancelled)?
export const boughtBy = (s, userId, pid) =>
  s.orders.some((o) => o.bid === userId && !o.cx && o.items.some((i) => i.pid === pid))
export const myOrders = (s, userId) => s.orders.filter((o) => o.bid === userId)
// The server ranks the shops and sends only the shop name and order count (never the money).
export const topSellers = (s) => s.top || []

// Who a notification is addressed to: the admin has one shared inbox, everyone else uses their email.
export const notesKey = (me) => (me.role === 'admin' ? 'admin' : me.email)

// What changed between the saved product and the form values (used for the "Save these changes?" pop-up).
export function diffProduct(p, v) {
  const ch = []
  if (v.n !== p.n) ch.push(`Name: ${p.n} → ${v.n}`)
  if (v.pr !== p.pr) ch.push(`Price: ₱${p.pr} → ₱${v.pr}`)
  if (v.g !== p.g) ch.push(`Group: ${p.g} → ${v.g}`)
  if (v.s !== p.s) ch.push(`Category: ${p.s} → ${v.s}`)
  if (v.desc !== (p.desc || '')) ch.push('Description changed')
  if (v.img) ch.push('Photo changed')
  if (v.stock !== p.stock) ch.push(`Stock left: ${p.stock - p.sold} → ${v.stock - p.sold}`)
  return ch
}

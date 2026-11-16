// Fixed lists the whole app uses. Change them here and every screen updates.
export const CART_MAX = 10 // most different items allowed in the cart

export const SIZES = { s: 14, m: 16, l: 19 } // text sizes in px
export const SIZE_LABEL = { s: 'Small', m: 'Medium', l: 'Large' }

export const STEPS = [
  ['Order placed', 'We’ve received your order.'],
  ['Preparing', 'The seller is packing your items.'],
  ['Shipped', 'Your parcel has left the seller.'],
  ['In transit', 'Your parcel is at the sorting hub.'],
  ['Out for delivery', 'The rider is bringing it to you.'],
  ['Delivered', 'Your order has arrived. Enjoy!'],
]
export const NEXT = ['Start preparing', 'Mark shipped', 'Mark in transit', 'Mark out for delivery', 'Mark delivered']

export const PAY = [
  ['cod', '💵 Cash on delivery'],
  ['gcash', '📱 GCash'],
  ['maya', '📱 Maya'],
  ['card', '💳 Credit / debit card'],
  ['bank', '🏦 Bank transfer'],
]

// Reasons an admin can give when removing a seller's product (the seller sees the reason)
export const REASONS = [
  '🚫 Prohibited or unsafe item',
  '🧢 Fake or counterfeit item',
  '🖼️ Misleading photo or description',
  '✏️ Wrong category or price error',
  '📸 Copied or stolen photos',
  '💬 Other (explain below)',
]

// Same lists as the React app's constants.js, so both sides agree.
export const CART_MAX = 10 // most different items allowed in the cart
export const PAY = { cod: 'Cash on delivery', gcash: 'GCash', maya: 'Maya', card: 'Credit / debit card', bank: 'Bank transfer' }
// Reasons an admin can give when removing a seller's product (the seller sees the reason)
export const REASONS = [
  '🚫 Prohibited or unsafe item',
  '🧢 Fake or counterfeit item',
  '🖼️ Misleading photo or description',
  '✏️ Wrong category or price error',
  '📸 Copied or stolen photos',
  '💬 Other (explain below)',
]
export const STEPS = [
  ['Order placed', 'We’ve received your order.'],
  ['Preparing', 'The seller is packing your items.'],
  ['Shipped', 'Your parcel has left the seller.'],
  ['In transit', 'Your parcel is at the sorting hub.'],
  ['Out for delivery', 'The rider is bringing it to you.'],
  ['Delivered', 'Your order has arrived. Enjoy!'],
]

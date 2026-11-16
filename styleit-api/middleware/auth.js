import User from '../models/User.js'
import { verifyToken } from '../utils/token.js'
import { HttpError } from '../utils/validate.js'

// Runs before a controller. Checks the login token and loads the user into req.user.
export function requireLogin(req, res, next) {
  const h = req.headers.authorization || ''
  const data = verifyToken(h.startsWith('Bearer ') ? h.slice(7) : '')
  if (!data) throw new HttpError(401, 'Please sign in first.')
  const user = User.findById(data.sub)
  if (!user) throw new HttpError(401, 'Please sign in first.')
  if (user.suspended) throw new HttpError(403, 'This account is suspended. Please contact the StyleIt admin.')
  req.user = user
  next()
}
export function requireSeller(req, res, next) {
  if (!req.user.seller) throw new HttpError(403, 'Open your shop first (Start selling).')
  next()
}
export function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') throw new HttpError(403, 'Admins only.')
  next()
}

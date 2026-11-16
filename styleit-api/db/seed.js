import User from '../models/User.js'
import { hashPassword } from '../utils/password.js'
import { ADMIN_EMAIL, ADMIN_PASSWORD } from '../config.js'

// The app starts empty, except for one admin so you can get into the admin side.
export function ensureAdmin() {
  if (!User.findByEmail(ADMIN_EMAIL)) {
    User.create({ name: 'Store Admin', email: ADMIN_EMAIL, pwHash: hashPassword(ADMIN_PASSWORD), role: 'admin' })
  }
}

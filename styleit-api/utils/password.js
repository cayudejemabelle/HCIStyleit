import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

// Passwords are never stored. We store "salt:hash" made with scrypt.
export function hashPassword(pw) {
  const salt = randomBytes(16).toString('hex')
  return salt + ':' + scryptSync(pw, salt, 64).toString('hex')
}
export function verifyPassword(pw, stored) {
  if (!stored) return false // social-only accounts have no password
  const [salt, hash] = stored.split(':')
  const a = Buffer.from(hash, 'hex')
  const b = scryptSync(pw, salt, 64)
  return a.length === b.length && timingSafeEqual(a, b)
}

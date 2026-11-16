import { createHmac, timingSafeEqual } from 'node:crypto'
import { SECRET, TOKEN_DAYS } from '../config.js'

// A login token = payload + signature. Nobody can change it without knowing SECRET.
const b64 = (s) => Buffer.from(s).toString('base64url')
const sign = (body) => createHmac('sha256', SECRET).update(body).digest('base64url')

export function signToken(userId) {
  const body = b64(JSON.stringify({ sub: userId, exp: Date.now() + TOKEN_DAYS * 864e5 }))
  return body + '.' + sign(body)
}
export function verifyToken(token) {
  const [body, sig] = String(token || '').split('.')
  if (!body || !sig) return null
  const want = Buffer.from(sign(body)), got = Buffer.from(sig)
  if (want.length !== got.length || !timingSafeEqual(want, got)) return null
  try {
    const data = JSON.parse(Buffer.from(body, 'base64url').toString())
    return data.exp > Date.now() ? data : null
  } catch { return null }
}

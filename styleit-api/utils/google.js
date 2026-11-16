import { createPublicKey, createVerify } from 'node:crypto'
import { HttpError } from './validate.js'

const CERTS = 'https://www.googleapis.com/oauth2/v3/certs'
let cache = { keys: [], until: 0 }

async function googleKeys(force = false) {
  if (!force && Date.now() < cache.until) return cache.keys
  let res
  try { res = await fetch(CERTS) } catch { throw new HttpError(502, 'Couldn’t reach Google to check your sign-in. Please try again.') }
  if (!res.ok) throw new HttpError(502, 'Couldn’t reach Google to check your sign-in. Please try again.')
  cache = { keys: (await res.json()).keys || [], until: Date.now() + 60 * 60 * 1000 } // keys change rarely: keep for 1 hour
  return cache.keys
}
const part = (s) => JSON.parse(Buffer.from(s, 'base64url').toString())
const bad = () => new HttpError(401, 'Google sign-in could not be verified. Please try again.')

// Checks the "credential" Google gives the browser. Returns { email, name } only if it is real,
// made for OUR app, not expired, and the email is verified by Google.
export async function verifyGoogleToken(credential, clientId) {
  const bits = String(credential || '').split('.')
  if (bits.length !== 3) throw bad()
  let header, payload
  try { header = part(bits[0]); payload = part(bits[1]) } catch { throw bad() }
  if (header.alg !== 'RS256' || !header.kid) throw bad() // never accept "alg: none" tricks

  let jwk = (await googleKeys()).find((k) => k.kid === header.kid)
  if (!jwk) jwk = (await googleKeys(true)).find((k) => k.kid === header.kid) // Google may have rotated its keys
  if (!jwk) throw bad()
  const signedOk = createVerify('RSA-SHA256').update(bits[0] + '.' + bits[1]).verify(createPublicKey({ key: jwk, format: 'jwk' }), Buffer.from(bits[2], 'base64url'))
  if (!signedOk) throw bad()

  if (!['https://accounts.google.com', 'accounts.google.com'].includes(payload.iss)) throw bad()
  if (payload.aud !== clientId) throw bad() // a token made for a different app
  if (!(payload.exp > Date.now() / 1000)) throw new HttpError(401, 'That Google sign-in expired. Please try again.')
  if (!payload.email || payload.email_verified !== true) throw new HttpError(401, 'Google says that email is not verified, so we can’t use it.')
  return { email: String(payload.email).toLowerCase(), name: payload.name || String(payload.email).split('@')[0] }
}

import { createHash } from 'node:crypto'
import db from '../db/database.js'

const hash = (code) => createHash('sha256').update(String(code)).digest('hex')
const MAX_TRIES = 5
const TTL = 10 * 60 * 1000

// A password-reset code: stored hashed, lasts 10 minutes, 5 wrong tries then it is locked.
export default class ResetCode {
  static issue(email, code) {
    db.prepare('INSERT OR REPLACE INTO reset_codes (email, code_hash, expires_at, attempts) VALUES (?, ?, ?, 0)')
      .run(email, hash(code), Date.now() + TTL)
  }
  // Was a code issued in the last `ms` milliseconds? (stops people spamming someone's inbox)
  static issuedWithin(email, ms) {
    const r = db.prepare('SELECT expires_at FROM reset_codes WHERE email = ?').get(email)
    return !!r && r.expires_at - TTL > Date.now() - ms
  }
  // returns 'ok', 'bad', 'expired' or 'locked'
  static check(email, code) {
    const r = db.prepare('SELECT * FROM reset_codes WHERE email = ?').get(email)
    if (!r) return 'bad'
    if (Date.now() > r.expires_at) return 'expired'
    if (r.attempts >= MAX_TRIES) return 'locked'
    if (r.code_hash !== hash(String(code).trim())) {
      db.prepare('UPDATE reset_codes SET attempts = attempts + 1 WHERE email = ?').run(email)
      return 'bad'
    }
    return 'ok'
  }
  static clear(email) { db.prepare('DELETE FROM reset_codes WHERE email = ?').run(email) }
}

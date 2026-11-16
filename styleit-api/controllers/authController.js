import { randomInt } from 'node:crypto'
import User from '../models/User.js'
import ResetCode from '../models/ResetCode.js'
import { hashPassword, verifyPassword } from '../utils/password.js'
import { signToken } from '../utils/token.js'
import { HttpError, isEmail, str } from '../utils/validate.js'
import Notification from '../models/Notification.js'
import { sendMail, mailEnabled, resetEmail } from '../utils/mailer.js'
import { SHOW_RESET_CODE, DEMO_SOCIAL } from '../config.js'

const session = (user) => ({ token: signToken(user.id), user: user.toPublic() })

export function signUp(req, res) {
  const b = req.body ?? {}
  const name = str(b.name), email = str(b.email).toLowerCase(), password = String(b.password ?? '')
  if (!name) throw new HttpError(400, 'Enter your full name.', 'an')
  if (!isEmail(email)) throw new HttpError(400, 'Enter a valid email, like you@example.com.', 'ae')
  if (password.length < 8) throw new HttpError(400, 'Password needs at least 8 characters.', 'ap')
  if (User.findByEmail(email)) throw new HttpError(409, 'That email already has an account. Try signing in.', 'ae')
  const user = User.create({ name, email, pwHash: hashPassword(password) })
  Notification.toAdmins('🙋', 'User joined: ' + name, email)
  Notification.add(user.id, '💖', `Welcome to StyleIt, ${name.split(' ')[0]}!`, 'Browse the shop, or tap “Start selling” to open your own.')
  res.status(201).json(session(user))
}

export function signIn(req, res) {
  const b = req.body ?? {}
  const email = str(b.email).toLowerCase(), password = String(b.password ?? '')
  const user = User.findByEmail(email)
  if (!user || !verifyPassword(password, user.pwHash)) throw new HttpError(401, 'Email or password is incorrect. New here? Choose Sign Up.', 'ae')
  if (user.suspended) throw new HttpError(403, 'This account is suspended. Please contact the StyleIt admin.', 'ae')
  res.json(session(user))
}

// DEMO social sign-in: the Google / Facebook buttons do not talk to Google or Facebook.
// It only signs in accounts that were created through the SAME button, so nobody can walk into
// a password account just by typing its email.
export function socialDemo(req, res) {
  if (!DEMO_SOCIAL) throw new HttpError(404, 'Not found')
  const b = req.body ?? {}
  const provider = str(b.provider), name = str(b.name), email = str(b.email).toLowerCase()
  if (!['Google', 'Facebook'].includes(provider)) throw new HttpError(400, 'Unknown sign-in provider.')
  if (!name) throw new HttpError(400, 'Enter your name.', 'sn')
  if (!isEmail(email)) throw new HttpError(400, 'Enter a valid email, like you@example.com.', 'se')
  const old = User.findByEmail(email)
  if (old && (old.role === 'admin' || old.provider !== provider)) {
    throw new HttpError(409, 'That email already has a StyleIt account. Sign in with your password, or use a different email for this demo.', 'se')
  }
  if (old?.suspended) throw new HttpError(403, 'This account is suspended. Please contact the StyleIt admin.', 'se')
  const user = old || User.create({ name, email, provider })
  if (!old) {
    Notification.toAdmins('🙋', 'User joined: ' + name, provider)
    Notification.add(user.id, '💖', `Welcome to StyleIt, ${name.split(' ')[0]}!`, 'Browse the shop, or tap “Start selling” to open your own.')
  }
  res.status(old ? 200 : 201).json(session(user))
}

export function me(req, res) {
  res.json({ user: req.user.toPublic() })
}

export function openShop(req, res) {
  const name = str((req.body ?? {}).name)
  if (req.user.seller) throw new HttpError(409, 'You already have a shop.', 'shop')
  if (name.length < 2 || name.length > 40) throw new HttpError(400, 'Shop name must be 2 to 40 characters.', 'shop')
  req.user.openShop(name)
  Notification.toAdmins('🏪', 'Shop opened: ' + name, 'By ' + req.user.name)
  Notification.add(req.user.id, '🎉', `Your shop “${name}” is open!`, 'Add your first product from the Overview tab.')
  res.json({ user: req.user.toPublic() })
}

// Forgot password, step 1. The reply is the same whether or not the email exists,
// so nobody can use this to find out who has an account.
export function requestReset(req, res) {
  const email = str((req.body ?? {}).email).toLowerCase()
  if (!isEmail(email)) throw new HttpError(400, 'Enter a valid email, like you@example.com.', 'fe')
  const user = User.findByEmail(email)
  // Demo mode (the code is shown on screen anyway, so there is nothing secret to protect): say what is wrong.
  // With real email the reply stays the same for every address, so strangers cannot learn who has an account.
  if (SHOW_RESET_CODE && !(user && user.pwHash)) {
    throw new HttpError(404, user
      ? 'That account was made with the Google or Facebook button, so it has no password to reset. Use that button to sign in.'
      : 'No StyleIt account uses that email. Check the spelling, or choose Sign Up.', 'fe')
  }
  const out = { message: 'If that email has a password account, a code was sent.' }
  if (user && user.pwHash) {
    if (mailEnabled() && ResetCode.issuedWithin(email, 60 * 1000)) return res.json(out) // at most one email a minute
    const code = String(randomInt(100000, 1000000))
    ResetCode.issue(email, code)
    if (mailEnabled()) {
      // Send in the background so the page answers right away. If it fails, forget the code and log why.
      sendMail(resetEmail(user, code)).catch((e) => { ResetCode.clear(email); console.error('Could not send the reset email:', e.message) })
    } else {
      console.log(`[demo email] Password reset code for ${email}: ${code}`)
    }
    if (SHOW_RESET_CODE) out.devCode = code // only while email is not set up (or you force it on)
  }
  res.json(out)
}

// Forgot password, step 2.
export function resetPassword(req, res) {
  const b = req.body ?? {}
  const email = str(b.email).toLowerCase(), code = str(b.code), password = String(b.password ?? '')
  if (!code) throw new HttpError(400, 'Enter the 6-digit code.', 'fc')
  if (password.length < 8) throw new HttpError(400, 'Password needs at least 8 characters.', 'fp')
  const result = ResetCode.check(email, code)
  if (result === 'expired') throw new HttpError(400, 'That code expired. Go back and ask for a new one.', 'fc')
  if (result === 'locked') throw new HttpError(429, 'Too many wrong tries. Ask for a new code.', 'fc')
  if (result !== 'ok') throw new HttpError(400, 'That code isn’t right. Check it and try again.', 'fc')
  User.findByEmail(email).setPassword(hashPassword(password))
  ResetCode.clear(email)
  res.json({ message: 'Password changed. You can sign in now.' })
}

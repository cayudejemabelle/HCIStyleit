import { test } from 'node:test'
import assert from 'node:assert/strict'
import { auth, call, fails, person, db } from '../testkit/helpers.js'

const social = (b) => ({ body: { provider: 'Google', name: 'Gia Lu', email: 'gia@g.co', ...b } })

test('demo social sign-in: creates once, signs in again', () => {
  const first = call(auth.socialDemo, social({}))
  assert.equal(first.code, 201)
  assert.equal(first.body.user.provider, 'Google')
  assert.ok(first.body.token)
  assert.equal(call(auth.socialDemo, social({})).code, 200) // second time = sign in
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM users WHERE email = 'gia@g.co'").get().n, 1)
})

test('demo social sign-in: never walks into a password account or the admin, with a clear message', () => {
  person('Jema', 'jema@gmail.com')
  assert.throws(() => call(auth.socialDemo, social({ email: 'jema@gmail.com' })), (e) => e.status === 409 && e.field === 'se' && /Sign in with your password, or use a different email/.test(e.message))
  fails(auth.socialDemo, social({ email: 'admin@styleit.com' }), 409, 'se')
  fails(auth.socialDemo, social({ provider: 'Facebook' }), 409, 'se') // same email, other button
  fails(auth.socialDemo, social({ provider: 'Twitter' }), 400)
  fails(auth.socialDemo, social({ name: '' }), 400, 'sn')
  fails(auth.socialDemo, social({ email: 'nope' }), 400, 'se')
  fails(auth.signIn, { body: { email: 'gia@g.co', password: 'anything123' } }, 401) // no password on these accounts
})

test('demo social sign-in: suspended accounts are blocked', () => {
  call(auth.socialDemo, social({ email: 'sus@g.co' }))
  db.prepare("UPDATE users SET suspended = 1 WHERE email = 'sus@g.co'").run()
  fails(auth.socialDemo, social({ email: 'sus@g.co' }), 403, 'se')
})

test('forgot password in demo mode explains that button accounts have no password', () => {
  call(auth.socialDemo, social({ email: 'btn@g.co' }))
  assert.throws(() => call(auth.requestReset, { body: { email: 'btn@g.co' } }), (e) => e.status === 404 && /Google or Facebook button/.test(e.message))
})

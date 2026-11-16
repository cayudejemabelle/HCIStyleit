import '../testkit/mailenv.js' // must be first
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { auth, call, fails, person, db } from '../testkit/helpers.js'
const { setTransport } = await import('../utils/mailer.js')
const { MAIL_ON, SHOW_RESET_CODE, SMTP_PASS, MAIL_FROM } = await import('../config.js')

const sent = []
let failNext = false
setTransport(async (msg) => { if (failNext) { failNext = false; throw new Error('smtp down') } sent.push(msg); return true })
const tick = () => new Promise((r) => setImmediate(r))
const ask = (email) => call(auth.requestReset, { body: { email } })

person('Ann Lee', 'ann@x.co')
person('Bo Ray', 'bo@x.co')
call(auth.socialDemo, { body: { provider: 'Google', name: 'Gia', email: 'gia@g.co' } })

test('settings: email counts as on, spaces are stripped from the app password, the on-screen code is off', () => {
  assert.equal(MAIL_ON, true)
  assert.equal(SMTP_PASS, 'abcdefghijklmnop')
  assert.equal(MAIL_FROM, 'StyleIt <shop@test.com>')
  assert.equal(SHOW_RESET_CODE, false)
})

test('forgot password emails the code and does NOT put it in the reply', async () => {
  const r = ask('ann@x.co')
  await tick()
  assert.equal(r.body.devCode, undefined) // the code must never be in the response when email works
  assert.equal(sent.length, 1)
  const m = sent[0]
  assert.equal(m.to, 'ann@x.co')
  assert.equal(m.subject, 'Your StyleIt password reset code')
  const code = m.text.match(/code is: (\d{6})/)[1]
  assert.ok(m.html.includes(code))
  assert.ok(!/password1/.test(m.text + m.html)) // never mails a password
  // the emailed code really works
  fails(auth.resetPassword, { body: { email: 'ann@x.co', code: '000000', password: 'newpassword1' } }, 400, 'fc')
  call(auth.resetPassword, { body: { email: 'ann@x.co', code, password: 'newpassword1' } })
  assert.ok(call(auth.signIn, { body: { email: 'ann@x.co', password: 'newpassword1' } }).body.token)
})

test('unknown emails and Google/Facebook-only accounts get the same reply and no email', async () => {
  const before = sent.length
  const a = ask('ghost@x.co'), b = ask('gia@g.co'), c = ask('bo@x.co')
  await tick()
  assert.deepEqual(a.body, b.body); assert.deepEqual(a.body, c.body) // identical, so nothing leaks
  assert.equal(sent.length, before + 1) // only Bo (a real password account) got an email
  assert.equal(sent.at(-1).to, 'bo@x.co')
})

test('at most one email a minute per address', async () => {
  const before = sent.length
  ask('bo@x.co'); ask('bo@x.co'); await tick()
  assert.equal(sent.length, before) // Bo was already emailed in the last minute
  db.prepare('UPDATE reset_codes SET expires_at = expires_at - 120000 WHERE email = ?').run('bo@x.co') // pretend 2 minutes passed
  ask('bo@x.co'); await tick()
  assert.equal(sent.length, before + 1)
})

test('if sending fails the person still gets the normal reply, and can try again right away', async () => {
  db.prepare('DELETE FROM reset_codes WHERE email = ?').run('bo@x.co') // start clean (Bo was emailed moments ago)
  const quiet = console.error; console.error = () => {}
  failNext = true
  const r = ask('bo@x.co')
  await tick(); console.error = quiet
  assert.equal(r.code, 200)
  assert.equal(r.body.devCode, undefined) // a failed send must not leak a code either
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM reset_codes WHERE email = ?').get('bo@x.co').n, 0) // failed code was forgotten
  const before = sent.length
  ask('bo@x.co'); await tick()
  assert.equal(sent.length, before + 1) // not blocked by the failed attempt
})

test('the email greets by first name and escapes anything odd', async () => {
  const { resetEmail } = await import('../utils/mailer.js')
  const m = resetEmail({ name: '<b>Eve</b> Poe', email: 'e@x.co' }, '123456')
  assert.ok(!m.html.includes('<b>Eve</b>'))
  assert.ok(m.html.includes('&lt;b&gt;Eve&lt;/b&gt;'))
  assert.ok(m.text.startsWith('Hi <b>Eve</b>,'))
})

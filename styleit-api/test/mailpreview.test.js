import '../testkit/mailpreviewenv.js' // must be first
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { auth, call, person } from '../testkit/helpers.js'
const { MAIL_ON, MAIL_PREVIEW, SHOW_RESET_CODE } = await import('../config.js')
const { setTransport } = await import('../utils/mailer.js')

test('preview mode turns email on without any SMTP settings, and hides the on-screen code', async () => {
  assert.equal(MAIL_PREVIEW, true)
  assert.equal(MAIL_ON, true)
  assert.equal(SHOW_RESET_CODE, false)
  const sent = []
  setTransport(async (m) => { sent.push(m) })
  person('Ann Lee', 'ann@x.co')
  const r = call(auth.requestReset, { body: { email: 'ann@x.co' } })
  await new Promise((res) => setImmediate(res))
  assert.equal(r.body.devCode, undefined)
  assert.equal(sent.length, 1)
  assert.match(sent[0].text, /code is: \d{6}/)
})

// Checks your email settings:  npm run mail:test -- you@gmail.com
import { MAIL_ON, MAIL_PREVIEW, SMTP_HOST, SMTP_PORT, SMTP_USER, MAIL_FROM } from '../config.js'
import { sendMail, resetEmail } from '../utils/mailer.js'

const to = process.argv[2] || SMTP_USER || 'test@example.com'
if (!MAIL_ON) {
  console.log('Email is not set up yet. Add SMTP_HOST, SMTP_USER and SMTP_PASS to the .env file (see SETUP-EMAIL.md).')
  process.exit(1)
}
console.log(MAIL_PREVIEW ? `Sending a preview email to ${to} (free test inbox, nothing reaches a real mailbox) ...` : `Sending a test email to ${to} using ${SMTP_HOST}:${SMTP_PORT} as ${MAIL_FROM} ...`)
try {
  await sendMail(resetEmail({ name: 'Test', email: to }, '123456'))
  console.log(MAIL_PREVIEW ? '✅ Done! Open the "Read it here" link above in your browser.' : '✅ Sent! Check the inbox (and the Spam folder).')
} catch (e) {
  console.log('❌ Could not send:', e.message)
  if (/Invalid login|Username and Password|535|534/i.test(e.message)) console.log('   -> Gmail rejected the login. Use an APP PASSWORD (not your normal password). See SETUP-EMAIL.md.')
  if (/ENOTFOUND|ECONNREFUSED|ETIMEDOUT|ESOCKET/i.test(e.message)) console.log('   -> Could not reach the mail server. Check SMTP_HOST, SMTP_PORT and your internet.')
  if (/Cannot find package 'nodemailer'|ERR_MODULE_NOT_FOUND/i.test(e.message)) console.log('   -> Run  npm install  first.')
  process.exit(1)
}

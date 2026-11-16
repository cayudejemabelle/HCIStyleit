import { MAIL_ON, MAIL_PREVIEW, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM } from '../config.js'

// Sends email through your own mail account (Gmail works well). Nothing is sent unless SMTP_* is set in .env.
let transporter, nodemailer, from
let testSend = null // lets tests replace the real sending
export const setTransport = (fn) => { testSend = fn }
export const mailEnabled = () => MAIL_ON || !!testSend

export async function sendMail(msg) {
  if (testSend) return testSend({ from: MAIL_FROM, ...msg })
  if (!MAIL_ON) return false
  if (!transporter) {
    nodemailer = (await import('nodemailer')).default // loaded only when email is really used
    if (MAIL_PREVIEW) {
      // A free throw-away test inbox (ethereal.email). Nothing reaches a real inbox.
      const acct = await nodemailer.createTestAccount()
      from = `StyleIt <${acct.user}>`
      transporter = nodemailer.createTransport({ host: acct.smtp.host, port: acct.smtp.port, secure: acct.smtp.secure, auth: { user: acct.user, pass: acct.pass } })
    } else {
      from = MAIL_FROM
      transporter = nodemailer.createTransport({ host: SMTP_HOST, port: SMTP_PORT, secure: SMTP_PORT === 465, auth: { user: SMTP_USER, pass: SMTP_PASS } })
    }
  }
  const info = await transporter.sendMail({ from, ...msg })
  if (MAIL_PREVIEW) console.log(`📧 Email "${msg.subject}" to ${msg.to}. Read it here: ${nodemailer.getTestMessageUrl(info)}`)
  return true
}

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

// The password reset email.
export function resetEmail(user, code) {
  const first = user.name.split(' ')[0]
  return {
    to: user.email,
    subject: 'Your StyleIt password reset code',
    text: `Hi ${first},\n\nYour StyleIt password reset code is: ${code}\n\nIt works for 10 minutes. If you did not ask to reset your password, you can ignore this email. Nobody can change your password without this code.\n\nStyleIt 🎀`,
    html: `<div style="font-family:Arial,sans-serif;max-width:420px;margin:auto;padding:24px;background:#FFF8FA;border-radius:16px;color:#3D2A33">
  <h2 style="margin:0 0 8px;color:#B03A66">StyleIt 🎀</h2>
  <p>Hi ${esc(first)},</p>
  <p>Your password reset code is:</p>
  <p style="font-size:32px;letter-spacing:6px;font-weight:bold;background:#FDE8EF;padding:12px;text-align:center;border-radius:12px;margin:12px 0">${esc(code)}</p>
  <p>It works for 10 minutes. If you did not ask to reset your password, you can ignore this email.</p>
</div>`,
  }
}

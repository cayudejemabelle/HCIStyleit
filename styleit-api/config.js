import { readFileSync } from 'node:fs'

// Reads KEY=value lines from .env (if it exists) so you do not have to set Windows environment variables.
// Real environment variables win. Tests never read .env.
if (!process.env.NODE_TEST_CONTEXT) {
  try {
    for (const line of readFileSync(new URL('./.env', import.meta.url), 'utf8').split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/)
      if (m && !line.trim().startsWith('#') && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2')
    }
  } catch { /* no .env file: fine */ }
}

// Settings in one place. Change them with environment variables, or edit the defaults.
export const PORT = Number(process.env.PORT) || 3000
// Tests (node --test) always use a throw-away in-memory database, never your real styleit.db.
export const DB_FILE = process.env.DB_FILE || (process.env.NODE_TEST_CONTEXT ? ':memory:' : 'styleit.db')
export const SECRET = process.env.JWT_SECRET || 'dev-secret-change-me' // signs login tokens
export const TOKEN_DAYS = 7
export const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173' // your React app
// The Google / Facebook buttons are a DEMO (they do not talk to Google or Facebook).
// Anyone who knows an email that signed up this way could sign in as it. Turn off with DEMO_SOCIAL=false.
export const DEMO_SOCIAL = process.env.DEMO_SOCIAL !== 'false'

// Email (for Forgot Password). Leave empty to skip real emails. See SETUP-EMAIL.md.
export const SMTP_HOST = process.env.SMTP_HOST || ''
export const SMTP_PORT = Number(process.env.SMTP_PORT) || 465
export const SMTP_USER = process.env.SMTP_USER || ''
export const SMTP_PASS = (process.env.SMTP_PASS || '').replace(/\s+/g, '') // Gmail shows app passwords with spaces
export const MAIL_FROM = process.env.MAIL_FROM || (SMTP_USER ? `StyleIt <${SMTP_USER}>` : '')
// MAIL_MODE=preview: no real mailbox needed. Emails go to a free test inbox and the link to read them is printed in the terminal.
export const MAIL_PREVIEW = process.env.MAIL_MODE === 'preview'
export const MAIL_ON = MAIL_PREVIEW || !!(SMTP_HOST && SMTP_USER && SMTP_PASS)

// With no email set up, the reset code is shown on screen (demo). Once email works, it is never shown.
export const SHOW_RESET_CODE = process.env.SHOW_RESET_CODE ? process.env.SHOW_RESET_CODE !== 'false' : !MAIL_ON
export const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@styleit.com'
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin1234'

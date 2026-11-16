import { HttpError } from './validate.js'

const GRAPH = 'https://graph.facebook.com/v23.0'
const bad = () => new HttpError(401, 'Facebook sign-in could not be verified. Please try again.')

async function get(url) {
  let res
  try { res = await fetch(url) } catch { throw new HttpError(502, 'Couldn’t reach Facebook to check your sign-in. Please try again.') }
  return res.ok ? res.json() : null
}

// Asks Facebook: is this token real, and was it made for OUR app? Then reads the person's name and email.
export async function verifyFacebookToken(accessToken, appId, appSecret) {
  const token = String(accessToken || '')
  if (!token) throw bad()
  const dbg = await get(`${GRAPH}/debug_token?input_token=${encodeURIComponent(token)}&access_token=${encodeURIComponent(appId + '|' + appSecret)}`)
  if (!dbg?.data?.is_valid || dbg.data.app_id !== appId) throw bad()
  const me = await get(`${GRAPH}/me?fields=id,name,email&access_token=${encodeURIComponent(token)}`)
  if (!me?.id || me.id !== dbg.data.user_id) throw bad()
  if (!me.email) throw new HttpError(400, 'Facebook did not share your email. Allow email access, or sign up with your email instead.')
  return { email: String(me.email).toLowerCase(), name: me.name || String(me.email).split('@')[0] }
}

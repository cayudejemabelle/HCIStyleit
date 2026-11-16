import { Router } from 'express'
import * as c from '../controllers/authController.js'
import { requireLogin } from '../middleware/auth.js'

// Routes only point a URL at the right controller function.
const r = Router()
r.post('/signup', c.signUp)
r.post('/signin', c.signIn)
r.post('/social-demo', c.socialDemo)
r.post('/forgot', c.requestReset)
r.post('/reset', c.resetPassword)
r.get('/me', requireLogin, c.me)
r.post('/open-shop', requireLogin, c.openShop)
export default r

import { Router } from 'express'
import * as c from '../controllers/notificationController.js'
import { requireLogin } from '../middleware/auth.js'

const r = Router()
r.use(requireLogin)
r.get('/', c.list)
r.post('/read', c.readAll)
export default r

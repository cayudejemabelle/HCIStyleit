import { Router } from 'express'
import * as c from '../controllers/orderController.js'
import { requireLogin, requireSeller } from '../middleware/auth.js'

const r = Router()
r.use(requireLogin)
r.post('/', c.place)
r.get('/mine', c.mine) // orders I bought
r.get('/received', requireSeller, c.received) // orders from my shop
r.post('/:id/cancel', c.cancel)
r.post('/:id/advance', requireSeller, c.advance)
r.post('/:id/received', c.markReceived)
export default r

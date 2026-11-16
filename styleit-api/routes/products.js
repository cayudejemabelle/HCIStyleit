import { Router } from 'express'
import * as c from '../controllers/productController.js'
import * as rv from '../controllers/reviewController.js'
import { requireLogin, requireSeller } from '../middleware/auth.js'

const r = Router()
r.get('/', c.list) // everyone can browse
r.get('/mine', requireLogin, requireSeller, c.mine) // must come before '/:id'
r.get('/:id', c.one)
r.get('/:id/reviews', rv.list)
r.post('/:id/reviews', requireLogin, rv.create) // only after the order is delivered
r.post('/', requireLogin, requireSeller, c.create)
r.put('/:id', requireLogin, requireSeller, c.update)
r.post('/:id/restock', requireLogin, requireSeller, c.restock)
r.delete('/:id', requireLogin, requireSeller, c.remove)
export default r

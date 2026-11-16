import { Router } from 'express'
import * as c from '../controllers/adminController.js'
import { requireLogin, requireAdmin } from '../middleware/auth.js'

const r = Router()
r.use(requireLogin, requireAdmin) // admins only, for every route below
r.get('/overview', c.overview)
r.get('/sellers', c.sellers)
r.get('/sellers/:id', c.seller)
r.get('/buyers', c.buyers)
r.post('/users/:id/suspend', c.setSuspended) // body: { suspended: true | false }
r.post('/products/:id/remove', c.removeProduct) // body: { reason: 0-5, note }
export default r

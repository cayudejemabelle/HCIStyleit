import { Router } from 'express'
import * as c from '../controllers/cartController.js'
import { requireLogin } from '../middleware/auth.js'

const r = Router()
r.use(requireLogin) // everything here needs a signed-in user
r.get('/', c.list)
r.post('/', c.add)
r.post('/remove', c.removeMany)
r.patch('/:productId', c.change)
export default r

import { Router } from 'express'
import * as rv from '../controllers/reviewController.js'
import * as oc from '../controllers/orderController.js'

// Things anyone can read without signing in.
const r = Router()
r.get('/reviews', rv.all)
r.get('/top-sellers', oc.topSellers)
export default r

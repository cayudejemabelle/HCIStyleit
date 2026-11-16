import express from 'express'
import cors from 'cors'
import authRoutes from './routes/auth.js'
import productRoutes from './routes/products.js'
import cartRoutes from './routes/cart.js'
import orderRoutes from './routes/orders.js'
import notificationRoutes from './routes/notifications.js'
import adminRoutes from './routes/admin.js'
import publicRoutes from './routes/public.js'
import errorHandler from './middleware/errorHandler.js'
import { CLIENT_ORIGIN } from './config.js'

export default function createApp() {
  const app = express()
  app.use(cors({ origin: CLIENT_ORIGIN }))
  app.use(express.json({ limit: '8mb' })) // product photos arrive as text, so allow big bodies
  app.get('/api/health', (req, res) => res.json({ ok: true, app: 'StyleIt API' }))
  app.use('/api', publicRoutes)
  app.use('/api/auth', authRoutes)
  app.use('/api/products', productRoutes)
  app.use('/api/cart', cartRoutes)
  app.use('/api/orders', orderRoutes)
  app.use('/api/notifications', notificationRoutes)
  app.use('/api/admin', adminRoutes)
  app.use((req, res) => res.status(404).json({ error: 'Not found' }))
  app.use(errorHandler)
  return app
}

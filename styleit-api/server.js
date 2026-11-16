import createApp from './app.js'
import { ensureAdmin } from './db/seed.js'
import { PORT } from './config.js'

ensureAdmin()
createApp().listen(PORT, () => console.log(`StyleIt API running at http://localhost:${PORT}`))

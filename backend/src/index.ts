import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { initDb } from './db.js'
import apiRoutes from './routes.js'

const app = express()
const port = process.env.PORT || 4000

app.use(
  cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true
  })
)
app.use(express.json({ limit: '10mb' }))

initDb()

// Block direct public static access to /uploads
app.use('/uploads', (_req, res) => {
  res.status(403).json({
    error: 'Direct public file access is prohibited. Documents must be accessed via authenticated endpoints.'
  })
})

app.use('/api', apiRoutes)

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'suraksha-setu-backend' })
})

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, status: 'ok', service: 'suraksha-setu-backend' })
})

app.listen(port, () => {
  console.log(`Suraksha Setu backend listening on http://localhost:${port}`)
})

export default app

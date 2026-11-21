import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { initDb } from './db.js'

const app = express()
const port = process.env.PORT || 4000

app.use(cors())
app.use(express.json())

initDb()

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'suraksha-setu-backend' })
})

app.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`)
})
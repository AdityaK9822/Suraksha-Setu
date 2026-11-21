import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { insertDocument } from './documents.js'

const app = express()
const port = process.env.PORT || 4000

app.use(cors())
app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'suraksha-setu-backend' })
})

// TODO(auth): protect this route once JWT auth lands; owner_id is not tracked yet.
// Upload raw document bytes (Content-Type: application/octet-stream), optional
// filename via ?name=. Returns the stored record with the keccak-256 docHash.
app.post('/documents', express.raw({ type: 'application/octet-stream', limit: '10mb' }), (req, res) => {
  if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
    res.status(400).json({ error: 'expected raw document bytes in request body' })
    return
  }
  const name = typeof req.query.name === 'string' && req.query.name.trim() !== '' ? req.query.name.trim() : 'document'
  const record = insertDocument(name, req.body)
  res.status(201).json(record)
})

app.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`)
})

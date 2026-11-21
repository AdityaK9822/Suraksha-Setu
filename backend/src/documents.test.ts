import test from 'node:test'
import assert from 'node:assert/strict'
import { hashToBytes32 } from './hash.js'

process.env.DB_PATH = ':memory:'

test('insertDocument hashes and persists', async () => {
  const { insertDocument } = await import('./documents.js')
  const data = new TextEncoder().encode('hello blockchain')
  const rec = insertDocument('noc.pdf', data)
  assert.equal(rec.name, 'noc.pdf')
  assert.equal(rec.docHash, hashToBytes32(data))
  assert.ok(rec.id > 0)
  assert.ok(rec.createdAt)
})

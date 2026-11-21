import { db } from './db.js'
import { hashToBytes32 } from './hash.js'

export interface DocumentRecord {
  id: number
  name: string
  docHash: string
  createdAt: string
}

export function insertDocument(name: string, data: Uint8Array): DocumentRecord {
  const docHash = hashToBytes32(data)
  const info = db.prepare('INSERT INTO documents (name, doc_hash) VALUES (?, ?)').run(name, docHash)
  return db
    .prepare('SELECT id, name, doc_hash AS docHash, created_at AS createdAt FROM documents WHERE id = ?')
    .get(info.lastInsertRowid) as DocumentRecord
}

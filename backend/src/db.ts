import Database from 'better-sqlite3'
import path from 'node:path'

const dbPath = process.env.DB_PATH || path.join(process.cwd(), 'data.db')
export const db = new Database(dbPath)

db.pragma('journal_mode = WAL')
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    doc_hash TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );
`)

console.log('Database initialized at', dbPath)

import Database from 'better-sqlite3'
import path from 'node:path'

export function initDb() {
  const dbPath = process.env.DB_PATH || path.join(process.cwd(), 'data.db')
  const db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `)
  db.close()
  console.log('Database initialized at', dbPath)
}
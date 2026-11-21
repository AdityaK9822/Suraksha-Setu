import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { getDb } from './db.js'
import { cuid } from './utils.js'

const JWT_SECRET = process.env.JWT_SECRET || 'suraksha-setu-dev-secret-change-in-prod'

export interface AuthUser {
  id: string
  email: string
  name: string
  role: 'SOCIETY_ADMIN' | 'HOMEOWNER' | 'BANK_USER'
  phone?: string
  isActive: number
}

export interface AuthedRequest extends Request {
  user?: AuthUser
}

export function signToken(payload: { userId: string; role: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): { userId: string; role: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; role: string }
  } catch {
    return null
  }
}

export function authMiddleware(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  let token = header?.startsWith('Bearer ') ? header.slice(7) : undefined
  if (!token && req.headers.cookie) {
    const match = req.headers.cookie.match(/(?:^|;\s*)token=([^;]+)/)
    if (match) token = decodeURIComponent(match[1])
  }
  if (!token) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }
  const payload = verifyToken(token)
  if (!payload) {
    res.status(401).json({ error: 'Invalid token' })
    return
  }
  const db = getDb()
  const user = db.prepare('SELECT id, email, name, role, phone, isActive FROM users WHERE id = ?').get(payload.userId) as
    | AuthUser
    | undefined
  if (!user || !user.isActive) {
    res.status(401).json({ error: 'User inactive or not found' })
    return
  }
  req.user = user
  next()
}

export function requireRole(...roles: string[]) {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Forbidden' })
      return
    }
    next()
  }
}

export function logActivity(
  userId: string | null,
  action: string,
  entity?: string | null,
  entityId?: string | null,
  metadata?: Record<string, unknown> | null,
  ip?: string | null
) {
  try {
    const db = getDb()
    db.prepare(
      'INSERT INTO activity_logs (id, userId, action, entity, entityId, metadata, ip, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(
      cuid(),
      userId || null,
      action,
      entity || null,
      entityId || null,
      metadata ? JSON.stringify(metadata) : null,
      ip || null,
      new Date().toISOString()
    )
  } catch (e) {
    console.error('activity log error', e)
  }
}

export function createNotification(userId: string, title: string, message: string, type = 'INFO') {
  try {
    const db = getDb()
    db.prepare(
      'INSERT INTO notifications (id, userId, title, message, type, read, createdAt) VALUES (?, ?, ?, ?, ?, 0, ?)'
    ).run(cuid(), userId, title, message, type, new Date().toISOString())
  } catch (e) {
    console.error('notification error', e)
  }
}

import { Router, type Response } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import path from 'node:path'
import fs from 'node:fs'
import { getDb } from './db.js'
import { cuid, genId, sha3Hash, parseMultipartRequest } from './utils.js'
import {
  authMiddleware,
  requireRole,
  signToken,
  logActivity,
  createNotification,
  type AuthedRequest
} from './auth.js'

const r = Router()

const ALLOWED_MIMES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024

function getUploadDir(): string {
  const dir = path.resolve(process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads'))
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  return dir
}

// ==================== ZOD SCHEMAS ====================
const registerSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(2, 'Full name is required'),
  role: z.enum(['SOCIETY_ADMIN', 'HOMEOWNER', 'BANK_USER']),
  phone: z.string().optional().nullable(),
  institutionName: z.string().optional(),
  branch: z.string().optional(),
  designation: z.string().optional()
})

const loginSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(1, 'Password is required')
})

const societySchema = z.object({
  name: z.string().min(2, 'Society name is required'),
  registrationNo: z.string().optional().nullable(),
  address: z.string().min(3, 'Full address is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  pincode: z.string().min(4, 'PIN code is required'),
  buildingsCount: z.coerce.number().int().min(1).default(1),
  totalFlats: z.coerce.number().int().min(1).default(1),
  contactEmail: z.string().optional().nullable(),
  contactPhone: z.string().optional().nullable(),
  chairmanName: z.string().optional(),
  chairmanEmail: z.string().optional(),
  chairmanPhone: z.string().optional(),
  secretaryName: z.string().optional(),
  secretaryEmail: z.string().optional(),
  secretaryPhone: z.string().optional(),
  treasurerName: z.string().optional(),
  treasurerEmail: z.string().optional(),
  treasurerPhone: z.string().optional()
})

const officeBearerSchema = z.object({
  name: z.string().min(2, 'Representative full name is required'),
  designation: z.enum(['Chairman', 'Secretary', 'Treasurer']),
  email: z.string().email('Valid official email is required'),
  phone: z.string().optional().nullable()
})

const homeownerSchema = z.object({
  name: z.string().min(2, 'Homeowner name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional().nullable(),
  flatNumber: z.string().min(1, 'Flat number is required'),
  wing: z.string().optional().nullable(),
  societyAddress: z.string().optional().nullable(),
  ownershipCategory: z.string().default('Primary Owner'),
  password: z.string().optional().nullable()
})

const accessRequestSchema = z.object({
  societyId: z.string().min(1, 'Society ID is required'),
  homeownerId: z.string().min(1, 'Homeowner ID is required'),
  flatNumber: z.string().optional().nullable(),
  purpose: z.string().min(3, 'Purpose is required'),
  requestedInfo: z.array(z.string()).min(1, 'Select at least one information field'),
  requestedDocs: z.array(z.string()).min(1, 'Select at least one document category'),
  explanation: z.string().optional().nullable(),
  expiryDate: z.string().optional().nullable()
})

// ==================== HELPER HYDRATORS ====================
function hydrateSociety(socIdOrCode: string) {
  const db = getDb()
  const soc = db
    .prepare('SELECT * FROM societies WHERE id = ? OR societyId = ?')
    .get(socIdOrCode, socIdOrCode) as any
  if (!soc) return null
  soc.officeBearers = db
    .prepare('SELECT * FROM society_office_bearers WHERE societyId = ? ORDER BY createdAt ASC')
    .all(soc.id)
  return soc
}

function hydrateHomeowner(h: any) {
  const db = getDb()
  if (!h) return null
  const assocs = db
    .prepare('SELECT * FROM homeowner_flat_associations WHERE homeownerId = ?')
    .all(h.id) as any[]
  const flats = assocs.map(a => {
    const flat = db.prepare('SELECT * FROM flats WHERE id = ?').get(a.flatId) as any
    if (flat) {
      flat.building = flat.buildingId ? db.prepare('SELECT * FROM buildings WHERE id = ?').get(flat.buildingId) : null
      flat.property = db.prepare('SELECT * FROM properties WHERE flatId = ?').get(flat.id) || null
    }
    return { ...a, flat }
  })
  const documents = db
    .prepare('SELECT id, documentId, category, subcategory, originalName, status, version, sha3Hash, createdAt FROM documents WHERE ownerId = ? ORDER BY createdAt DESC')
    .all(h.id) as any[]
  return {
    ...h,
    flats,
    documents,
    documentCount: documents.length,
    propertyDocCount: documents.filter(d => d.category === 'PROPERTY').length,
    loanDocCount: documents.filter(d => d.category === 'LOAN').length
  }
}

function hydrateAccessRequest(ar: any) {
  const db = getDb()
  if (!ar) return null
  const bank = db.prepare('SELECT * FROM banks WHERE id = ?').get(ar.bankId)
  const society = db.prepare('SELECT * FROM societies WHERE id = ?').get(ar.societyId)
  const hoRaw = db.prepare('SELECT * FROM homeowners WHERE id = ?').get(ar.homeownerId)
  const homeowner = hydrateHomeowner(hoRaw)
  const societyApproval = db.prepare('SELECT * FROM society_approvals WHERE accessRequestId = ?').get(ar.id) || null
  const homeownerConsent = db.prepare('SELECT * FROM homeowner_consents WHERE accessRequestId = ?').get(ar.id) || null
  const accessGrant = db.prepare('SELECT * FROM access_grants WHERE accessRequestId = ?').get(ar.id) || null
  return {
    ...ar,
    bank,
    society,
    homeowner,
    societyApproval,
    homeownerConsent,
    accessGrant
  }
}

// ==================== 1. AUTH ROUTES ====================
r.post('/auth/register', (req, res) => {
  try {
    const parsed = registerSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid registration data' })
      return
    }
    const { email, password, name, role, phone, institutionName, branch, designation } = parsed.data
    const normalizedEmail = email.toLowerCase().trim()
    const db = getDb()

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail)
    if (existing) {
      res.status(409).json({ error: 'Email already registered' })
      return
    }

    const now = new Date().toISOString()
    const hash = bcrypt.hashSync(password, 10)
    const userId = cuid()

    db.prepare(
      'INSERT INTO users (id, email, passwordHash, role, name, phone, isActive, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)'
    ).run(userId, normalizedEmail, hash, role, name.trim(), phone || null, now, now)

    if (role === 'BANK_USER' && institutionName) {
      const bankId = cuid()
      db.prepare(
        `INSERT INTO banks (id, name, branch, officialEmail, contactNumber, authorisedUser, designation, verified, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`
      ).run(
        bankId,
        institutionName.trim(),
        branch || 'Main Corporate Branch',
        normalizedEmail,
        phone || null,
        name.trim(),
        designation || 'Authorised Credit Officer',
        now,
        now
      )
      db.prepare('INSERT INTO bank_users (id, userId, bankId) VALUES (?, ?, ?)').run(cuid(), userId, bankId)
    }

    const token = signToken({ userId, role })
    logActivity(userId, 'REGISTER', 'User', userId, { role }, req.ip)
    res.json({ token, user: { id: userId, email: normalizedEmail, name: name.trim(), role, phone: phone || undefined } })
  } catch (e: any) {
    res.status(500).json({ error: e.message })
  }
})

r.post('/auth/login', (req, res) => {
  try {
    const parsed = loginSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Missing email or password' })
      return
    }
    const email = parsed.data.email.toLowerCase().trim()
    const db = getDb()
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any
    if (!user || !bcrypt.compareSync(parsed.data.password, user.passwordHash)) {
      res.status(401).json({ error: 'Invalid credentials' })
      return
    }
    if (!user.isActive) {
      res.status(403).json({ error: 'Account deactivated' })
      return
    }
    const token = signToken({ userId: user.id, role: user.role })
    logActivity(user.id, 'LOGIN', 'User', user.id, { role: user.role }, req.ip)
    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role, phone: user.phone }
    })
  } catch (e: any) {
    res.status(500).json({ error: e.message })
  }
})

r.post('/auth/logout', authMiddleware, (req: AuthedRequest, res: Response) => {
  if (req.user) logActivity(req.user.id, 'LOGOUT', 'User', req.user.id, null, req.ip)
  res.json({ ok: true })
})

r.post('/auth/password-reset', (req, res) => {
  const { email } = req.body
  if (!email) {
    res.status(400).json({ error: 'Email is required' })
    return
  }
  res.json({
    message: 'If an account matches that email, a secure password reset instruction has been dispatched (simulated).'
  })
})

r.post('/auth/update-password', authMiddleware, (req: AuthedRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body
  if (!currentPassword || !newPassword || newPassword.length < 6) {
    res.status(400).json({ error: 'Provide current password and a new password of at least 6 characters' })
    return
  }
  const db = getDb()
  const u = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user!.id) as any
  if (!u || !bcrypt.compareSync(currentPassword, u.passwordHash)) {
    res.status(401).json({ error: 'Current password is incorrect' })
    return
  }
  const hash = bcrypt.hashSync(newPassword, 10)
  db.prepare('UPDATE users SET passwordHash = ?, updatedAt = ? WHERE id = ?').run(
    hash,
    new Date().toISOString(),
    req.user!.id
  )
  logActivity(req.user!.id, 'PASSWORD_UPDATED', 'User', req.user!.id, null, req.ip)
  res.json({ ok: true, message: 'Password updated successfully' })
})

r.get('/auth/me', authMiddleware, (req: AuthedRequest, res: Response) => {
  const u = req.user!
  res.json({ user: { id: u.id, email: u.email, name: u.name, role: u.role, phone: u.phone } })
})

// ==================== 2. SOCIETY ROUTES ====================
r.post('/societies', authMiddleware, requireRole('SOCIETY_ADMIN'), (req: AuthedRequest, res: Response) => {
  try {
    const parsed = societySchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Missing society fields' })
      return
    }
    const d = parsed.data
    const db = getDb()
    const now = new Date().toISOString()
    const id = cuid()
    const societyCode = genId('SOC')

    db.prepare(
      `INSERT INTO societies (id, societyId, name, registrationNo, address, city, state, pincode, buildingsCount, totalFlats, contactEmail, contactPhone, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      societyCode,
      d.name.trim(),
      d.registrationNo || null,
      d.address.trim(),
      d.city.trim(),
      d.state.trim(),
      d.pincode.trim(),
      d.buildingsCount || 1,
      d.totalFlats || 1,
      d.contactEmail || req.user!.email,
      d.contactPhone || req.user!.phone || null,
      now,
      now
    )

    const existingAdmin = db.prepare('SELECT id FROM society_admins WHERE userId = ?').get(req.user!.id) as any
    if (existingAdmin) {
      db.prepare('UPDATE society_admins SET societyId = ? WHERE userId = ?').run(id, req.user!.id)
    } else {
      db.prepare('INSERT INTO society_admins (id, userId, societyId) VALUES (?, ?, ?)').run(cuid(), req.user!.id, id)
    }

    db.prepare('INSERT INTO buildings (id, societyId, name, wings, createdAt) VALUES (?, ?, ?, ?, ?)').run(
      cuid(),
      id,
      'Building A',
      'A, B',
      now
    )

    const inlineBearers: Array<[string, string | undefined, string | undefined, string | undefined]> = [
      ['Chairman', d.chairmanName, d.chairmanEmail, d.chairmanPhone],
      ['Secretary', d.secretaryName, d.secretaryEmail, d.secretaryPhone],
      ['Treasurer', d.treasurerName, d.treasurerEmail, d.treasurerPhone]
    ]
    for (const [role, bName, bEmail, bPhone] of inlineBearers) {
      if (bName && bName.trim()) {
        db.prepare(
          'INSERT INTO society_office_bearers (id, societyId, name, designation, email, phone, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        ).run(
          cuid(),
          id,
          bName.trim(),
          role,
          (bEmail || `${role.toLowerCase()}@${societyCode.toLowerCase()}.demo`).trim(),
          bPhone || d.contactPhone || null,
          now,
          now
        )
      }
    }

    logActivity(req.user!.id, 'CREATE_SOCIETY', 'Society', id, { societyId: societyCode, name: d.name }, req.ip)
    res.json({ society: hydrateSociety(id) })
  } catch (e: any) {
    res.status(500).json({ error: e.message })
  }
})

r.get('/societies/search', (req, res) => {
  try {
    const q = String(req.query.q || '').trim()
    const db = getDb()
    let rows: any[]
    if (q) {
      const like = `%${q}%`
      rows = db
        .prepare(
          `SELECT * FROM societies
           WHERE name LIKE ? OR city LIKE ? OR state LIKE ? OR address LIKE ? OR societyId LIKE ? OR registrationNo LIKE ?
           ORDER BY name ASC LIMIT 25`
        )
        .all(like, like, like, like, like, like)
    } else {
      rows = db.prepare('SELECT * FROM societies ORDER BY name ASC LIMIT 25').all()
    }
    res.json({ societies: rows.map(s => hydrateSociety(s.id)) })
  } catch (e: any) {
    res.status(500).json({ error: e.message })
  }
})

r.get('/societies', (_req, res) => {
  try {
    const db = getDb()
    const rows = db.prepare('SELECT id FROM societies ORDER BY name ASC').all() as any[]
    res.json({ societies: rows.map(s => hydrateSociety(s.id)) })
  } catch (e: any) {
    res.status(500).json({ error: e.message })
  }
})

r.get('/societies/:id', (req, res) => {
  const soc = hydrateSociety(String(req.params.id))
  if (!soc) {
    res.status(404).json({ error: 'Society not found' })
    return
  }
  res.json({ society: soc })
})

r.put('/societies/:id', authMiddleware, requireRole('SOCIETY_ADMIN'), (req: AuthedRequest, res: Response) => {
  try {
    const db = getDb()
    const soc = hydrateSociety(String(req.params.id))
    if (!soc) {
      res.status(404).json({ error: 'Society not found' })
      return
    }
    const admin = db
      .prepare('SELECT id FROM society_admins WHERE userId = ? AND societyId = ?')
      .get(req.user!.id, soc.id)
    if (!admin) {
      res.status(403).json({ error: 'Forbidden' })
      return
    }
    const b = req.body
    const now = new Date().toISOString()
    db.prepare(
      `UPDATE societies SET
         name = COALESCE(?, name),
         registrationNo = COALESCE(?, registrationNo),
         address = COALESCE(?, address),
         city = COALESCE(?, city),
         state = COALESCE(?, state),
         pincode = COALESCE(?, pincode),
         buildingsCount = COALESCE(?, buildingsCount),
         totalFlats = COALESCE(?, totalFlats),
         contactEmail = COALESCE(?, contactEmail),
         contactPhone = COALESCE(?, contactPhone),
         updatedAt = ?
       WHERE id = ?`
    ).run(
      b.name ?? null,
      b.registrationNo ?? null,
      b.address ?? null,
      b.city ?? null,
      b.state ?? null,
      b.pincode ?? null,
      b.buildingsCount ? Number(b.buildingsCount) : null,
      b.totalFlats ? Number(b.totalFlats) : null,
      b.contactEmail ?? null,
      b.contactPhone ?? null,
      now,
      soc.id
    )
    logActivity(req.user!.id, 'UPDATE_SOCIETY', 'Society', soc.id, { name: b.name || soc.name }, req.ip)
    res.json({ society: hydrateSociety(soc.id) })
  } catch (e: any) {
    res.status(500).json({ error: e.message })
  }
})

r.get('/society-admin/me', authMiddleware, requireRole('SOCIETY_ADMIN'), (req: AuthedRequest, res: Response) => {
  const db = getDb()
  const admin = db.prepare('SELECT * FROM society_admins WHERE userId = ?').get(req.user!.id) as any
  if (!admin) {
    res.status(404).json({ error: 'No society created yet' })
    return
  }
  const society = hydrateSociety(admin.societyId)
  res.json({ society, admin })
})

r.get('/society-admin/dashboard', authMiddleware, requireRole('SOCIETY_ADMIN'), (req: AuthedRequest, res: Response) => {
  const db = getDb()
  const admin = db.prepare('SELECT * FROM society_admins WHERE userId = ?').get(req.user!.id) as any
  if (!admin) {
    res.json({
      society: null,
      officeBearers: [],
      stats: { homeowners: 0, flats: 0, pendingRegs: 0, pendingBankReqs: 0, docs: 0, acceptedDocs: 0 },
      recent: []
    })
    return
  }
  const society = hydrateSociety(admin.societyId)
  const homeowners = (db.prepare('SELECT COUNT(*) as c FROM homeowners WHERE societyId = ?').get(admin.societyId) as any).c
  const flats = (db.prepare('SELECT COUNT(*) as c FROM flats WHERE societyId = ?').get(admin.societyId) as any).c
  const pendingRegs = (
    db.prepare("SELECT COUNT(*) as c FROM homeowners WHERE societyId = ? AND status = 'PENDING'").get(admin.societyId) as any
  ).c
  const pendingBankReqs = (
    db
      .prepare(
        "SELECT COUNT(*) as c FROM access_requests WHERE societyId = ? AND status IN ('SUBMITTED', 'CLARIFICATION_REQUIRED')"
      )
      .get(admin.societyId) as any
  ).c
  const docs = (
    db
      .prepare(
        'SELECT COUNT(*) as c FROM documents WHERE ownerId IN (SELECT id FROM homeowners WHERE societyId = ?)'
      )
      .get(admin.societyId) as any
  ).c
  const acceptedDocs = (
    db
      .prepare(
        "SELECT COUNT(*) as c FROM documents WHERE ownerId IN (SELECT id FROM homeowners WHERE societyId = ?) AND status IN ('Accepted for stated purpose', 'ACCEPTED_FOR_STATED_PURPOSE')"
      )
      .get(admin.societyId) as any
  ).c
  const recent = db
    .prepare('SELECT * FROM activity_logs WHERE userId = ? ORDER BY createdAt DESC LIMIT 10')
    .all(req.user!.id)

  res.json({
    society,
    officeBearers: society?.officeBearers || [],
    stats: {
      homeowners,
      flats: society?.totalFlats || flats,
      registeredFlats: flats,
      pendingRegs,
      pendingBankReqs,
      docs,
      acceptedDocs
    },
    recent
  })
})

// ==================== 3. OFFICE BEARERS ROUTES ====================
r.get('/societies/:societyId/office-bearers', authMiddleware, (req: AuthedRequest, res: Response) => {
  const soc = hydrateSociety(String(req.params.societyId))
  if (!soc) {
    res.status(404).json({ error: 'Society not found' })
    return
  }
  res.json({ officeBearers: soc.officeBearers || [] })
})

r.post(
  '/societies/:societyId/office-bearers',
  authMiddleware,
  requireRole('SOCIETY_ADMIN'),
  (req: AuthedRequest, res: Response) => {
    const db = getDb()
    const soc = hydrateSociety(String(req.params.societyId))
    if (!soc) {
      res.status(404).json({ error: 'Society not found' })
      return
    }
    const admin = db
      .prepare('SELECT id FROM society_admins WHERE userId = ? AND societyId = ?')
      .get(req.user!.id, soc.id)
    if (!admin) {
      res.status(403).json({ error: 'Forbidden' })
      return
    }
    const parsed = officeBearerSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid office bearer details' })
      return
    }
    const { name, designation, email, phone } = parsed.data
    const now = new Date().toISOString()

    const existing = db
      .prepare('SELECT * FROM society_office_bearers WHERE societyId = ? AND designation = ?')
      .get(soc.id, designation) as any

    let obId: string
    if (existing) {
      obId = existing.id
      db.prepare(
        'UPDATE society_office_bearers SET name = ?, email = ?, phone = ?, updatedAt = ? WHERE id = ?'
      ).run(name.trim(), email.trim(), phone || null, now, obId)
      logActivity(req.user!.id, 'UPDATE_OFFICE_BEARER', 'SocietyOfficeBearer', obId, { designation, name }, req.ip)
    } else {
      obId = cuid()
      db.prepare(
        'INSERT INTO society_office_bearers (id, societyId, name, designation, email, phone, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      ).run(obId, soc.id, name.trim(), designation, email.trim(), phone || null, now, now)
      logActivity(req.user!.id, 'ADD_OFFICE_BEARER', 'SocietyOfficeBearer', obId, { designation, name }, req.ip)
    }

    const ob = db.prepare('SELECT * FROM society_office_bearers WHERE id = ?').get(obId)
    res.json({ officeBearer: ob })
  }
)

r.put('/office-bearers/:id', authMiddleware, requireRole('SOCIETY_ADMIN'), (req: AuthedRequest, res: Response) => {
  const db = getDb()
  const ob = db.prepare('SELECT * FROM society_office_bearers WHERE id = ?').get(req.params.id) as any
  if (!ob) {
    res.status(404).json({ error: 'Office bearer not found' })
    return
  }
  const admin = db
    .prepare('SELECT id FROM society_admins WHERE userId = ? AND societyId = ?')
    .get(req.user!.id, ob.societyId)
  if (!admin) {
    res.status(403).json({ error: 'Forbidden' })
    return
  }
  const { name, designation, email, phone } = req.body
  const now = new Date().toISOString()
  db.prepare(
    `UPDATE society_office_bearers SET
       name = COALESCE(?, name),
       designation = COALESCE(?, designation),
       email = COALESCE(?, email),
       phone = COALESCE(?, phone),
       updatedAt = ?
     WHERE id = ?`
  ).run(name ?? null, designation ?? null, email ?? null, phone ?? null, now, ob.id)
  const updated = db.prepare('SELECT * FROM society_office_bearers WHERE id = ?').get(ob.id)
  res.json({ officeBearer: updated })
})

// ==================== 4. HOMEOWNER REGISTRATION & DIRECTORY (SOCIETY ADMIN) ====================
r.post(
  '/societies/:societyId/homeowners',
  authMiddleware,
  requireRole('SOCIETY_ADMIN'),
  (req: AuthedRequest, res: Response) => {
    try {
      const db = getDb()
      const soc = hydrateSociety(String(req.params.societyId))
      if (!soc) {
        res.status(404).json({ error: 'Society not found' })
        return
      }
      const admin = db
        .prepare('SELECT id FROM society_admins WHERE userId = ? AND societyId = ?')
        .get(req.user!.id, soc.id)
      if (!admin) {
        res.status(403).json({ error: 'Forbidden' })
        return
      }

      const parsed = homeownerSchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.issues[0]?.message || 'Missing homeowner fields' })
        return
      }
      const { name, email, phone, flatNumber, wing, ownershipCategory, password } = parsed.data
      const normalizedEmail = email.toLowerCase().trim()
      const now = new Date().toISOString()

      let building = db.prepare('SELECT * FROM buildings WHERE societyId = ? LIMIT 1').get(soc.id) as any
      if (!building) {
        const bId = cuid()
        db.prepare('INSERT INTO buildings (id, societyId, name, wings, createdAt) VALUES (?, ?, ?, ?, ?)').run(
          bId,
          soc.id,
          'Building A',
          wing || 'A',
          now
        )
        building = { id: bId }
      }

      let flat = db
        .prepare('SELECT * FROM flats WHERE societyId = ? AND flatNumber = ? AND COALESCE(wing, "") = ?')
        .get(soc.id, flatNumber.trim(), wing ? wing.trim() : '') as any
      if (!flat) {
        const flatId = cuid()
        db.prepare(
          'INSERT INTO flats (id, societyId, buildingId, flatNumber, wing, createdAt) VALUES (?, ?, ?, ?, ?, ?)'
        ).run(flatId, soc.id, building.id, flatNumber.trim(), wing ? wing.trim() : null, now)
        flat = db.prepare('SELECT * FROM flats WHERE id = ?').get(flatId)
      }

      let user = db.prepare('SELECT * FROM users WHERE email = ?').get(normalizedEmail) as any
      const rawPw = password && password.trim().length >= 6 ? password.trim() : 'Password@123'
      if (!user) {
        const uId = cuid()
        const hash = bcrypt.hashSync(rawPw, 10)
        db.prepare(
          'INSERT INTO users (id, email, passwordHash, role, name, phone, isActive, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)'
        ).run(uId, normalizedEmail, hash, 'HOMEOWNER', name.trim(), phone || null, now, now)
        user = db.prepare('SELECT * FROM users WHERE id = ?').get(uId)
      }

      let homeowner = db.prepare('SELECT * FROM homeowners WHERE userId = ?').get(user.id) as any
      if (!homeowner) {
        const hoId = cuid()
        db.prepare(
          'INSERT INTO homeowners (id, userId, societyId, name, email, phone, ownershipCategory, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        ).run(
          hoId,
          user.id,
          soc.id,
          name.trim(),
          normalizedEmail,
          phone || null,
          ownershipCategory || 'Primary Owner',
          'ACTIVE',
          now,
          now
        )
        homeowner = db.prepare('SELECT * FROM homeowners WHERE id = ?').get(hoId)
      }

      const existingAssoc = db
        .prepare('SELECT id FROM homeowner_flat_associations WHERE homeownerId = ? AND flatId = ?')
        .get(homeowner.id, flat.id)
      if (!existingAssoc) {
        db.prepare(
          'INSERT INTO homeowner_flat_associations (id, homeownerId, flatId, isPrimary, createdAt) VALUES (?, ?, ?, 1, ?)'
        ).run(cuid(), homeowner.id, flat.id, now)
      }

      let property = db.prepare('SELECT * FROM properties WHERE flatId = ?').get(flat.id) as any
      if (!property) {
        const pId = cuid()
        const propCode = genId('PROP')
        db.prepare(
          'INSERT INTO properties (id, propertyId, flatId, ownerId, societyId, createdAt) VALUES (?, ?, ?, ?, ?, ?)'
        ).run(pId, propCode, flat.id, homeowner.id, soc.id, now)
        property = db.prepare('SELECT * FROM properties WHERE id = ?').get(pId)
      }

      createNotification(
        user.id,
        'Registered into Society Property Ledger',
        `You have been registered for Flat ${flat.wing ? flat.wing + '-' : ''}${flat.flatNumber} at ${soc.name}.`,
        'SUCCESS'
      )
      logActivity(
        req.user!.id,
        'REGISTER_HOMEOWNER',
        'Homeowner',
        homeowner.id,
        { name: homeowner.name, flatNumber: flat.flatNumber },
        req.ip
      )

      res.json({
        homeowner: hydrateHomeowner(homeowner),
        flat,
        property,
        temporaryPassword: password && password.trim().length >= 6 ? undefined : 'Password@123'
      })
    } catch (e: any) {
      res.status(500).json({ error: e.message })
    }
  }
)

r.get('/societies/:societyId/homeowners', authMiddleware, (req: AuthedRequest, res: Response) => {
  const db = getDb()
  const soc = hydrateSociety(String(req.params.societyId))
  if (!soc) {
    res.status(404).json({ error: 'Society not found' })
    return
  }
  if (req.user!.role === 'SOCIETY_ADMIN') {
    const admin = db
      .prepare('SELECT id FROM society_admins WHERE userId = ? AND societyId = ?')
      .get(req.user!.id, soc.id)
    if (!admin) {
      res.status(403).json({ error: 'Forbidden' })
      return
    }
  }
  const rows = db.prepare('SELECT * FROM homeowners WHERE societyId = ? ORDER BY createdAt DESC').all(soc.id)
  res.json({ homeowners: rows.map(hydrateHomeowner) })
})

r.get('/societies/:societyId/directory', authMiddleware, (req: AuthedRequest, res: Response) => {
  const db = getDb()
  const soc = hydrateSociety(String(req.params.societyId))
  if (!soc) {
    res.status(404).json({ error: 'Society not found' })
    return
  }
  if (req.user!.role === 'SOCIETY_ADMIN') {
    const admin = db
      .prepare('SELECT id FROM society_admins WHERE userId = ? AND societyId = ?')
      .get(req.user!.id, soc.id)
    if (!admin) {
      res.status(403).json({ error: 'Forbidden' })
      return
    }
  }
  const rows = db.prepare('SELECT * FROM homeowners WHERE societyId = ? ORDER BY name ASC').all(soc.id)
  res.json({ homeowners: rows.map(hydrateHomeowner) })
})

r.put('/homeowners/:id', authMiddleware, requireRole('SOCIETY_ADMIN'), (req: AuthedRequest, res: Response) => {
  const db = getDb()
  const h = db.prepare('SELECT * FROM homeowners WHERE id = ?').get(req.params.id) as any
  if (!h) {
    res.status(404).json({ error: 'Homeowner not found' })
    return
  }
  const admin = db
    .prepare('SELECT id FROM society_admins WHERE userId = ? AND societyId = ?')
    .get(req.user!.id, h.societyId)
  if (!admin) {
    res.status(403).json({ error: 'Forbidden' })
    return
  }
  const { name, phone, ownershipCategory, status } = req.body
  const now = new Date().toISOString()
  db.prepare(
    `UPDATE homeowners SET
       name = COALESCE(?, name),
       phone = COALESCE(?, phone),
       ownershipCategory = COALESCE(?, ownershipCategory),
       status = COALESCE(?, status),
       updatedAt = ?
     WHERE id = ?`
  ).run(name ?? null, phone ?? null, ownershipCategory ?? null, status ?? null, now, h.id)
  const updated = db.prepare('SELECT * FROM homeowners WHERE id = ?').get(h.id)
  res.json({ homeowner: hydrateHomeowner(updated) })
})

r.post(
  '/homeowners/:id/deactivate',
  authMiddleware,
  requireRole('SOCIETY_ADMIN'),
  (req: AuthedRequest, res: Response) => {
    const db = getDb()
    const h = db.prepare('SELECT * FROM homeowners WHERE id = ?').get(req.params.id) as any
    if (!h) {
      res.status(404).json({ error: 'Not found' })
      return
    }
    const admin = db
      .prepare('SELECT id FROM society_admins WHERE userId = ? AND societyId = ?')
      .get(req.user!.id, h.societyId)
    if (!admin) {
      res.status(403).json({ error: 'Forbidden' })
      return
    }
    const nextStatus = h.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
    const now = new Date().toISOString()
    db.prepare('UPDATE homeowners SET status = ?, updatedAt = ? WHERE id = ?').run(nextStatus, now, h.id)
    db.prepare('UPDATE users SET isActive = ?, updatedAt = ? WHERE id = ?').run(
      nextStatus === 'ACTIVE' ? 1 : 0,
      now,
      h.userId
    )
    const updated = db.prepare('SELECT * FROM homeowners WHERE id = ?').get(h.id)
    res.json({ homeowner: hydrateHomeowner(updated) })
  }
)

// ==================== 5. HOMEOWNER PORTAL & DOCUMENT LOCKER ====================
r.get('/homeowner/profile', authMiddleware, requireRole('HOMEOWNER'), (req: AuthedRequest, res: Response) => {
  const db = getDb()
  const raw = db.prepare('SELECT * FROM homeowners WHERE userId = ?').get(req.user!.id) as any
  if (!raw) {
    res.status(404).json({ error: 'Not found' })
    return
  }
  const h = hydrateHomeowner(raw)
  h.society = hydrateSociety(h.societyId)
  res.json({ homeowner: h })
})

r.get('/homeowner/dashboard', authMiddleware, requireRole('HOMEOWNER'), (req: AuthedRequest, res: Response) => {
  const db = getDb()
  const raw = db.prepare('SELECT * FROM homeowners WHERE userId = ?').get(req.user!.id) as any
  if (!raw) {
    res.status(404).json({ error: 'Homeowner profile not found' })
    return
  }
  const h = hydrateHomeowner(raw)
  h.society = hydrateSociety(h.societyId)
  const primaryFlat = h.flats?.[0]?.flat || null
  const property = primaryFlat?.property || null

  const docCount = h.documents.length
  const propertyDocCount = h.propertyDocCount
  const loanDocCount = h.loanDocCount
  const pendingDocs = h.documents.filter((d: any) =>
    ['Pending Review', 'Under Review', 'PENDING_REVIEW', 'UNDER_REVIEW'].includes(d.status)
  ).length
  const bankReqs = (
    db
      .prepare(
        "SELECT COUNT(*) as c FROM access_requests WHERE homeownerId = ? AND status IN ('SUBMITTED', 'SOCIETY_APPROVED')"
      )
      .get(h.id) as any
  ).c
  const activeGrants = (
    db
      .prepare("SELECT COUNT(*) as c FROM access_grants WHERE homeownerId = ? AND status = 'ACTIVE'")
      .get(h.id) as any
  ).c
  const recent = db
    .prepare('SELECT * FROM activity_logs WHERE userId = ? ORDER BY createdAt DESC LIMIT 10')
    .all(req.user!.id)

  res.json({
    homeowner: h,
    flat: primaryFlat,
    property,
    stats: { docCount, propertyDocCount, loanDocCount, pendingDocs, bankReqs, activeGrants },
    recent
  })
})

r.get('/homeowner/property', authMiddleware, requireRole('HOMEOWNER'), (req: AuthedRequest, res: Response) => {
  const db = getDb()
  const raw = db.prepare('SELECT * FROM homeowners WHERE userId = ?').get(req.user!.id) as any
  if (!raw) {
    res.status(404).json({ error: 'Not found' })
    return
  }
  const h = hydrateHomeowner(raw)
  const society = hydrateSociety(h.societyId)
  const flat = h.flats?.[0]?.flat || null
  if (flat) {
    const coAssocs = db.prepare('SELECT * FROM homeowner_flat_associations WHERE flatId = ?').all(flat.id) as any[]
    flat.homeowners = coAssocs.map(ca => ({
      id: ca.id,
      homeowner: db.prepare('SELECT id, name, email, ownershipCategory FROM homeowners WHERE id = ?').get(ca.homeownerId)
    }))
  }
  res.json({
    homeowner: h,
    property: flat?.property || null,
    flat,
    society
  })
})

r.get('/homeowner/passport', authMiddleware, requireRole('HOMEOWNER'), (req: AuthedRequest, res: Response) => {
  const db = getDb()
  const raw = db.prepare('SELECT * FROM homeowners WHERE userId = ?').get(req.user!.id) as any
  if (!raw) {
    res.status(404).json({ error: 'Not found' })
    return
  }
  const h = hydrateHomeowner(raw)
  const society = hydrateSociety(h.societyId)
  const flat = h.flats?.[0]?.flat || null
  const docs = h.documents || []

  const approvalsRaw = db
    .prepare('SELECT * FROM access_requests WHERE homeownerId = ? ORDER BY createdAt DESC')
    .all(h.id) as any[]
  const approvals = approvalsRaw.map(hydrateAccessRequest)

  const grantsRaw = db
    .prepare('SELECT * FROM access_grants WHERE homeownerId = ? ORDER BY createdAt DESC')
    .all(h.id) as any[]
  const grants = grantsRaw.map(g => {
    const bank = db.prepare('SELECT * FROM banks WHERE id = ?').get(g.bankId) as any
    const docCount = (
      db.prepare('SELECT COUNT(*) as c FROM access_grant_documents WHERE grantId = ?').get(g.id) as any
    ).c
    return {
      grantId: g.grantId,
      bank: bank?.name,
      createdAt: g.createdAt,
      expiryDate: g.expiryDate,
      status: g.status,
      documentCount: docCount
    }
  })

  res.json({
    passport: {
      propertyId: flat?.property?.propertyId || `PROP-${h.id.slice(-6).toUpperCase()}`,
      homeowner: {
        id: h.id,
        name: h.name,
        email: h.email,
        phone: h.phone,
        ownershipCategory: h.ownershipCategory || 'Primary Owner',
        status: h.status
      },
      society,
      flat,
      documentCategories: [...new Set(docs.map((d: any) => d.subcategory || d.category))],
      propertyDocumentsCount: h.propertyDocCount,
      loanDocumentsCount: h.loanDocCount,
      documentCount: docs.length,
      documents: docs,
      submissionStatus: docs.length > 0 ? 'RECORDS_ON_FILE' : 'AWAITING_SUBMISSION',
      approvalRecords: approvals.map(a => ({
        requestId: a.requestId,
        bankName: a.bank?.name,
        purpose: a.purpose,
        societyDecision: a.societyApproval?.decision || 'PENDING',
        homeownerDecision: a.homeownerConsent?.decision || 'PENDING',
        status: a.status,
        createdAt: a.createdAt
      })),
      sharingHistory: grants
    }
  })
})

r.get('/homeowner/documents', authMiddleware, requireRole('HOMEOWNER'), (req: AuthedRequest, res: Response) => {
  const db = getDb()
  const raw = db.prepare('SELECT * FROM homeowners WHERE userId = ?').get(req.user!.id) as any
  if (!raw) {
    res.status(404).json({ error: 'Not found' })
    return
  }
  const docs = db.prepare('SELECT * FROM documents WHERE ownerId = ? ORDER BY createdAt DESC').all(raw.id) as any[]
  for (const d of docs) {
    d.versions = db
      .prepare('SELECT * FROM document_versions WHERE documentId = ? ORDER BY version DESC')
      .all(d.id)
  }
  res.json({ documents: docs })
})

r.post('/homeowner/documents', authMiddleware, requireRole('HOMEOWNER'), async (req: AuthedRequest, res: Response) => {
  try {
    const db = getDb()
    const h = db.prepare('SELECT * FROM homeowners WHERE userId = ?').get(req.user!.id) as any
    if (!h) {
      res.status(404).json({ error: 'Homeowner profile not found' })
      return
    }
    const { fields, file } = await parseMultipartRequest(req, MAX_UPLOAD_BYTES)
    if (!file) {
      res.status(400).json({ error: 'File required' })
      return
    }
    if (!ALLOWED_MIMES.includes(file.mimetype)) {
      res.status(400).json({ error: 'Invalid file type. Only PDF, JPG, JPEG, and PNG are allowed.' })
      return
    }
    const category = fields.category || 'PROPERTY'
    const subcategory = fields.subcategory || (category === 'PROPERTY' ? 'Other property records' : 'Other loan documents')

    const ext = path.extname(file.originalname) || '.pdf'
    const filename = `${Date.now()}-${cuid()}${ext}`
    const storedPath = path.join(getUploadDir(), filename)
    fs.writeFileSync(storedPath, file.buffer)

    const digest = sha3Hash(file.buffer)
    const docPk = cuid()
    const docCode = genId('DOC')
    const now = new Date().toISOString()

    const assoc = db.prepare('SELECT * FROM homeowner_flat_associations WHERE homeownerId = ? LIMIT 1').get(h.id) as any
    const prop = assoc ? (db.prepare('SELECT * FROM properties WHERE flatId = ?').get(assoc.flatId) as any) : null

    db.prepare(
      `INSERT INTO documents (id, documentId, ownerId, propertyId, category, subcategory, originalName, storedPath, mimeType, size, sha3Hash, status, version, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Uploaded', 1, ?, ?)`
    ).run(
      docPk,
      docCode,
      h.id,
      prop?.id || null,
      category,
      subcategory,
      file.originalname,
      storedPath,
      file.mimetype,
      file.size,
      digest,
      now,
      now
    )

    db.prepare(
      `INSERT INTO document_versions (id, documentId, version, storedPath, originalName, mimeType, size, sha3Hash, createdAt)
       VALUES (?, ?, 1, ?, ?, ?, ?, ?, ?)`
    ).run(cuid(), docPk, storedPath, file.originalname, file.mimetype, file.size, digest, now)

    const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(docPk) as any
    doc.versions = db.prepare('SELECT * FROM document_versions WHERE documentId = ?').all(docPk)

    logActivity(req.user!.id, 'UPLOAD_DOCUMENT', 'Document', docPk, { documentId: docCode, category, subcategory, sha3Hash: digest }, req.ip)
    res.json({ document: doc })
  } catch (e: any) {
    res.status(400).json({ error: e.message || 'Upload failed' })
  }
})

r.post(
  '/homeowner/documents/digilocker-demo',
  authMiddleware,
  requireRole('HOMEOWNER'),
  (req: AuthedRequest, res: Response) => {
    const db = getDb()
    const h = db.prepare('SELECT * FROM homeowners WHERE userId = ?').get(req.user!.id) as any
    if (!h) {
      res.status(404).json({ error: 'Not found' })
      return
    }
    const label = req.body.docType || 'Index II Record'
    const buf = Buffer.from(`%PDF-1.4\n% Suraksha Setu Simulated DigiLocker Record: ${label} for ${h.name}\n`)
    const filename = `${Date.now()}-digilocker-${cuid()}.pdf`
    const storedPath = path.join(getUploadDir(), filename)
    fs.writeFileSync(storedPath, buf)

    const digest = sha3Hash(buf)
    const docPk = cuid()
    const docCode = genId('DOC')
    const now = new Date().toISOString()
    const origName = `${label.replace(/\s+/g, '_')}_DigiLocker_Demo.pdf`

    db.prepare(
      `INSERT INTO documents (id, documentId, ownerId, propertyId, category, subcategory, originalName, storedPath, mimeType, size, sha3Hash, status, version, createdAt, updatedAt)
       VALUES (?, ?, ?, NULL, 'PROPERTY', ?, ?, ?, 'application/pdf', ?, ?, 'Pending Review', 1, ?, ?)`
    ).run(docPk, docCode, h.id, label, origName, storedPath, buf.length, digest, now, now)

    db.prepare(
      `INSERT INTO document_versions (id, documentId, version, storedPath, originalName, mimeType, size, sha3Hash, createdAt)
       VALUES (?, ?, 1, ?, ?, 'application/pdf', ?, ?, ?)`
    ).run(cuid(), docPk, storedPath, origName, buf.length, digest, now)

    const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(docPk)
    logActivity(req.user!.id, 'DIGILOCKER_DEMO_IMPORT', 'Document', docPk, { label, sha3Hash: digest }, req.ip)
    res.json({ document: doc, simulated: true })
  }
)

r.put(
  '/homeowner/documents/:id',
  authMiddleware,
  requireRole('HOMEOWNER'),
  async (req: AuthedRequest, res: Response) => {
    try {
      const db = getDb()
      const h = db.prepare('SELECT * FROM homeowners WHERE userId = ?').get(req.user!.id) as any
      const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id) as any
      if (!doc || !h || doc.ownerId !== h.id) {
        res.status(403).json({ error: 'Forbidden' })
        return
      }
      const { file } = await parseMultipartRequest(req, MAX_UPLOAD_BYTES)
      if (!file || !ALLOWED_MIMES.includes(file.mimetype)) {
        res.status(400).json({ error: 'Valid PDF/JPG/PNG file required' })
        return
      }
      const ext = path.extname(file.originalname) || '.pdf'
      const storedPath = path.join(getUploadDir(), `${Date.now()}-${cuid()}${ext}`)
      fs.writeFileSync(storedPath, file.buffer)

      const digest = sha3Hash(file.buffer)
      const newVer = Number(doc.version) + 1
      const now = new Date().toISOString()

      db.prepare(
        `INSERT INTO document_versions (id, documentId, version, storedPath, originalName, mimeType, size, sha3Hash, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(cuid(), doc.id, newVer, storedPath, file.originalname, file.mimetype, file.size, digest, now)

      db.prepare(
        `UPDATE documents SET storedPath = ?, originalName = ?, mimeType = ?, size = ?, sha3Hash = ?, version = ?, status = 'Uploaded', updatedAt = ? WHERE id = ?`
      ).run(storedPath, file.originalname, file.mimetype, file.size, digest, newVer, now, doc.id)

      const updated = db.prepare('SELECT * FROM documents WHERE id = ?').get(doc.id) as any
      updated.versions = db
        .prepare('SELECT * FROM document_versions WHERE documentId = ? ORDER BY version DESC')
        .all(doc.id)

      logActivity(req.user!.id, 'REPLACE_DOCUMENT', 'Document', doc.id, { version: newVer, sha3Hash: digest }, req.ip)
      res.json({ document: updated })
    } catch (e: any) {
      res.status(400).json({ error: e.message })
    }
  }
)

r.get('/homeowner/documents/:id/preview', authMiddleware, requireRole('HOMEOWNER'), (req: AuthedRequest, res: Response) => {
  const db = getDb()
  const h = db.prepare('SELECT * FROM homeowners WHERE userId = ?').get(req.user!.id) as any
  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id) as any
  if (!doc || !h || doc.ownerId !== h.id) {
    res.status(403).json({ error: 'Forbidden' })
    return
  }
  if (!fs.existsSync(doc.storedPath)) {
    res.status(404).json({ error: 'File not found' })
    return
  }
  res.setHeader('Content-Type', doc.mimeType)
  res.setHeader('Content-Disposition', `inline; filename="${doc.originalName}"`)
  res.send(fs.readFileSync(doc.storedPath))
})

r.get(
  '/homeowner/documents/:id/download',
  authMiddleware,
  requireRole('HOMEOWNER'),
  (req: AuthedRequest, res: Response) => {
    const db = getDb()
    const h = db.prepare('SELECT * FROM homeowners WHERE userId = ?').get(req.user!.id) as any
    const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id) as any
    if (!doc || !h || doc.ownerId !== h.id) {
      res.status(403).json({ error: 'Forbidden' })
      return
    }
    if (!fs.existsSync(doc.storedPath)) {
      res.status(404).json({ error: 'File not found' })
      return
    }
    res.setHeader('Content-Type', doc.mimeType)
    res.setHeader('Content-Disposition', `attachment; filename="${doc.originalName}"`)
    res.send(fs.readFileSync(doc.storedPath))
  }
)

r.put(
  '/homeowner/documents/:id/status',
  authMiddleware,
  requireRole('SOCIETY_ADMIN'),
  (req: AuthedRequest, res: Response) => {
    const db = getDb()
    const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id) as any
    if (!doc) {
      res.status(404).json({ error: 'Document not found' })
      return
    }
    const owner = db.prepare('SELECT * FROM homeowners WHERE id = ?').get(doc.ownerId) as any
    const admin = db
      .prepare('SELECT id FROM society_admins WHERE userId = ? AND societyId = ?')
      .get(req.user!.id, owner.societyId)
    if (!admin) {
      res.status(403).json({ error: 'Forbidden' })
      return
    }
    const { status } = req.body
    db.prepare('UPDATE documents SET status = ?, updatedAt = ? WHERE id = ?').run(
      status,
      new Date().toISOString(),
      doc.id
    )
    const updated = db.prepare('SELECT * FROM documents WHERE id = ?').get(doc.id)
    res.json({ document: updated })
  }
)

// ==================== 6. BANK PORTAL ROUTES ====================
r.post('/bank/register', authMiddleware, requireRole('BANK_USER'), (req: AuthedRequest, res: Response) => {
  const { name, branch, officialEmail, contactNumber, authorisedUser, designation } = req.body
  if (!name || !officialEmail) {
    res.status(400).json({ error: 'Institution name and official email are required' })
    return
  }
  const db = getDb()
  const now = new Date().toISOString()
  const existingBu = db.prepare('SELECT * FROM bank_users WHERE userId = ?').get(req.user!.id) as any

  if (existingBu) {
    db.prepare(
      `UPDATE banks SET name = ?, branch = ?, officialEmail = ?, contactNumber = ?, authorisedUser = ?, designation = ?, updatedAt = ? WHERE id = ?`
    ).run(name, branch || null, officialEmail, contactNumber || null, authorisedUser || null, designation || null, now, existingBu.bankId)
    const bank = db.prepare('SELECT * FROM banks WHERE id = ?').get(existingBu.bankId)
    res.json({ bank })
    return
  }

  const bankId = cuid()
  db.prepare(
    `INSERT INTO banks (id, name, branch, officialEmail, contactNumber, authorisedUser, designation, verified, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`
  ).run(bankId, name, branch || null, officialEmail, contactNumber || null, authorisedUser || req.user!.name, designation || null, now, now)
  db.prepare('INSERT INTO bank_users (id, userId, bankId) VALUES (?, ?, ?)').run(cuid(), req.user!.id, bankId)
  const bank = db.prepare('SELECT * FROM banks WHERE id = ?').get(bankId)
  logActivity(req.user!.id, 'REGISTER_BANK', 'Bank', bankId, { name }, req.ip)
  res.json({ bank })
})

r.get('/bank/profile', authMiddleware, requireRole('BANK_USER'), (req: AuthedRequest, res: Response) => {
  const db = getDb()
  const bu = db.prepare('SELECT * FROM bank_users WHERE userId = ?').get(req.user!.id) as any
  if (!bu) {
    res.status(404).json({ error: 'No bank profile' })
    return
  }
  const bank = db.prepare('SELECT * FROM banks WHERE id = ?').get(bu.bankId)
  res.json({ bank, bankUser: bu })
})

r.get('/bank/dashboard', authMiddleware, requireRole('BANK_USER'), (req: AuthedRequest, res: Response) => {
  const db = getDb()
  const bu = db.prepare('SELECT * FROM bank_users WHERE userId = ?').get(req.user!.id) as any
  if (!bu) {
    res.status(404).json({ error: 'No bank profile' })
    return
  }
  const pending = (
    db
      .prepare(
        "SELECT COUNT(*) as c FROM access_requests WHERE bankId = ? AND status IN ('SUBMITTED', 'SOCIETY_APPROVED', 'CLARIFICATION_REQUIRED')"
      )
      .get(bu.bankId) as any
  ).c
  const approved = (
    db
      .prepare("SELECT COUNT(*) as c FROM access_requests WHERE bankId = ? AND status = 'ACCESS_GRANTED'")
      .get(bu.bankId) as any
  ).c
  const rejected = (
    db
      .prepare(
        "SELECT COUNT(*) as c FROM access_requests WHERE bankId = ? AND status IN ('SOCIETY_REJECTED', 'CONSENT_REJECTED')"
      )
      .get(bu.bankId) as any
  ).c
  const activeGrants = (
    db.prepare("SELECT COUNT(*) as c FROM access_grants WHERE bankId = ? AND status = 'ACTIVE'").get(bu.bankId) as any
  ).c
  const expired = (
    db
      .prepare("SELECT COUNT(*) as c FROM access_grants WHERE bankId = ? AND status IN ('EXPIRED', 'REVOKED')")
      .get(bu.bankId) as any
  ).c

  const recentRaw = db
    .prepare('SELECT * FROM access_requests WHERE bankId = ? ORDER BY createdAt DESC LIMIT 8')
    .all(bu.bankId)
  res.json({
    stats: { pending, approved, rejected, activeGrants, expired },
    recent: recentRaw.map(hydrateAccessRequest)
  })
})

r.get(
  '/bank/societies/:societyId/homeowners',
  authMiddleware,
  requireRole('BANK_USER'),
  (req: AuthedRequest, res: Response) => {
    const db = getDb()
    const soc = hydrateSociety(String(req.params.societyId))
    if (!soc) {
      res.status(404).json({ error: 'Society not found' })
      return
    }
    const q = String(req.query.q || '').trim().toLowerCase()
    const rows = db.prepare("SELECT * FROM homeowners WHERE societyId = ? AND status = 'ACTIVE'").all(soc.id) as any[]
    const hydrated = rows.map(hydrateHomeowner)
    const filtered = q
      ? hydrated.filter(h => {
          const flatMatch = h.flats.some(
            (f: any) =>
              (f.flat?.flatNumber || '').toLowerCase().includes(q) ||
              (f.flat?.wing || '').toLowerCase().includes(q)
          )
          return flatMatch || h.name.toLowerCase().includes(q)
        })
      : hydrated

    // Never expose private documents before two-key authorization
    const safe = filtered.map(h => ({
      id: h.id,
      name: h.name,
      ownershipCategory: h.ownershipCategory,
      status: h.status,
      flats: h.flats.map((f: any) => ({
        flatNumber: f.flat?.flatNumber,
        wing: f.flat?.wing,
        propertyId: f.flat?.property?.propertyId
      }))
    }))
    res.json({ homeowners: safe, society: soc })
  }
)

r.post('/bank/requests', authMiddleware, requireRole('BANK_USER'), (req: AuthedRequest, res: Response) => {
  const parsed = accessRequestSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid request payload' })
    return
  }
  const d = parsed.data
  const db = getDb()
  const soc = hydrateSociety(d.societyId)
  if (!soc) {
    res.status(404).json({ error: 'Society not found' })
    return
  }
  const homeowner = db.prepare('SELECT * FROM homeowners WHERE id = ?').get(d.homeownerId) as any
  if (!homeowner || homeowner.societyId !== soc.id) {
    res.status(404).json({ error: 'Homeowner not found in society' })
    return
  }
  const bu = db.prepare('SELECT * FROM bank_users WHERE userId = ?').get(req.user!.id) as any
  if (!bu) {
    res.status(403).json({ error: 'No bank profile' })
    return
  }

  const id = cuid()
  const requestId = genId('REQ')
  const now = new Date().toISOString()
  const exp = d.expiryDate ? new Date(d.expiryDate).toISOString() : new Date(Date.now() + 14 * 86400000).toISOString()

  db.prepare(
    `INSERT INTO access_requests (id, requestId, bankId, societyId, homeownerId, flatId, purpose, requestedInfo, requestedDocs, explanation, expiryDate, status, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, NULL, ?, ?, ?, ?, ?, 'SUBMITTED', ?, ?)`
  ).run(
    id,
    requestId,
    bu.bankId,
    soc.id,
    homeowner.id,
    d.purpose.trim(),
    JSON.stringify(d.requestedInfo),
    JSON.stringify(d.requestedDocs),
    d.explanation || null,
    exp,
    now,
    now
  )

  const admins = db.prepare('SELECT userId FROM society_admins WHERE societyId = ?').all(soc.id) as any[]
  for (const a of admins) {
    createNotification(a.userId, `New Bank Access Request (${requestId})`, `Request for ${homeowner.name}: ${d.purpose}`, 'INFO')
  }
  createNotification(homeowner.userId, `Bank Verification Request (${requestId})`, `A bank requested access for: ${d.purpose}`, 'INFO')
  logActivity(req.user!.id, 'CREATE_ACCESS_REQUEST', 'AccessRequest', id, { requestId }, req.ip)

  const ar = db.prepare('SELECT * FROM access_requests WHERE id = ?').get(id)
  res.json({ accessRequest: hydrateAccessRequest(ar) })
})

r.get('/bank/requests', authMiddleware, requireRole('BANK_USER'), (req: AuthedRequest, res: Response) => {
  const db = getDb()
  const bu = db.prepare('SELECT * FROM bank_users WHERE userId = ?').get(req.user!.id) as any
  if (!bu) {
    res.json({ requests: [] })
    return
  }
  const rows = db.prepare('SELECT * FROM access_requests WHERE bankId = ? ORDER BY createdAt DESC').all(bu.bankId)
  res.json({ requests: rows.map(hydrateAccessRequest) })
})

// ==================== 7. TWO-KEY APPROVAL WORKFLOW & GRANTS ====================
r.get(
  '/societies/:societyId/requests',
  authMiddleware,
  requireRole('SOCIETY_ADMIN'),
  (req: AuthedRequest, res: Response) => {
    const db = getDb()
    const soc = hydrateSociety(String(req.params.societyId))
    if (!soc) {
      res.status(404).json({ error: 'Society not found' })
      return
    }
    const admin = db
      .prepare('SELECT id FROM society_admins WHERE userId = ? AND societyId = ?')
      .get(req.user!.id, soc.id)
    if (!admin) {
      res.status(403).json({ error: 'Forbidden' })
      return
    }
    const rows = db.prepare('SELECT * FROM access_requests WHERE societyId = ? ORDER BY createdAt DESC').all(soc.id)
    res.json({ requests: rows.map(hydrateAccessRequest) })
  }
)

function handleSocietyDecision(
  req: AuthedRequest,
  res: Response,
  decision: 'SOCIETY_APPROVED' | 'SOCIETY_REJECTED' | 'CLARIFICATION_REQUIRED'
) {
  const db = getDb()
  const ar = db.prepare('SELECT * FROM access_requests WHERE id = ?').get(req.params.id) as any
  if (!ar) {
    res.status(404).json({ error: 'Request not found' })
    return
  }
  const admin = db
    .prepare('SELECT id FROM society_admins WHERE userId = ? AND societyId = ?')
    .get(req.user!.id, ar.societyId)
  if (!admin) {
    res.status(403).json({ error: 'Forbidden: Cross-society approval denied' })
    return
  }
  const { note, officeBearerId } = req.body
  let repLabel = `${req.user!.name} (Society Admin)`
  if (officeBearerId) {
    const ob = db
      .prepare('SELECT * FROM society_office_bearers WHERE id = ? AND societyId = ?')
      .get(officeBearerId, ar.societyId) as any
    if (ob) repLabel = `${ob.name} (${ob.designation})`
  }
  const fullNote = note ? `[${repLabel}] ${note}` : `[${repLabel}] ${decision}`
  const now = new Date().toISOString()

  const existing = db.prepare('SELECT id FROM society_approvals WHERE accessRequestId = ?').get(ar.id) as any
  if (existing) {
    db.prepare('UPDATE society_approvals SET decision = ?, note = ?, approverId = ? WHERE id = ?').run(
      decision,
      fullNote,
      req.user!.id,
      existing.id
    )
  } else {
    db.prepare(
      'INSERT INTO society_approvals (id, accessRequestId, approverId, decision, note, createdAt) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(cuid(), ar.id, req.user!.id, decision, fullNote, now)
  }

  db.prepare('UPDATE access_requests SET status = ?, updatedAt = ? WHERE id = ?').run(decision, now, ar.id)
  const h = db.prepare('SELECT * FROM homeowners WHERE id = ?').get(ar.homeownerId) as any
  if (h) createNotification(h.userId, `Society Decision: ${decision}`, fullNote, 'INFO')
  logActivity(req.user!.id, decision, 'AccessRequest', ar.id, { requestId: ar.requestId, representative: repLabel }, req.ip)
  res.json({ ok: true, status: decision })
}

r.post('/requests/:id/society-approve', authMiddleware, requireRole('SOCIETY_ADMIN'), (req, res) =>
  handleSocietyDecision(req, res, 'SOCIETY_APPROVED')
)
r.post('/requests/:id/society-reject', authMiddleware, requireRole('SOCIETY_ADMIN'), (req, res) =>
  handleSocietyDecision(req, res, 'SOCIETY_REJECTED')
)
r.post('/requests/:id/society-clarify', authMiddleware, requireRole('SOCIETY_ADMIN'), (req, res) =>
  handleSocietyDecision(req, res, 'CLARIFICATION_REQUIRED')
)

r.get('/homeowner/requests', authMiddleware, requireRole('HOMEOWNER'), (req: AuthedRequest, res: Response) => {
  const db = getDb()
  const h = db.prepare('SELECT * FROM homeowners WHERE userId = ?').get(req.user!.id) as any
  if (!h) {
    res.json({ requests: [] })
    return
  }
  const rows = db.prepare('SELECT * FROM access_requests WHERE homeownerId = ? ORDER BY createdAt DESC').all(h.id)
  res.json({ requests: rows.map(hydrateAccessRequest) })
})

r.post(
  '/homeowner/requests/:id/consent',
  authMiddleware,
  requireRole('HOMEOWNER'),
  (req: AuthedRequest, res: Response) => {
    const db = getDb()
    const ar = db.prepare('SELECT * FROM access_requests WHERE id = ?').get(req.params.id) as any
    if (!ar) {
      res.status(404).json({ error: 'Access request not found' })
      return
    }
    const h = db.prepare('SELECT * FROM homeowners WHERE userId = ?').get(req.user!.id) as any
    if (!h || h.id !== ar.homeownerId) {
      res.status(403).json({ error: 'Forbidden' })
      return
    }
    const sa = db.prepare('SELECT * FROM society_approvals WHERE accessRequestId = ?').get(ar.id) as any
    if (!sa || sa.decision !== 'SOCIETY_APPROVED' || ar.status !== 'SOCIETY_APPROVED') {
      res.status(400).json({ error: 'Two-Key Violation: Society approval (Key 1) is required before homeowner consent.' })
      return
    }

    const { decision, note, authorisedDocs } = req.body
    if (!['CONSENT_GRANTED', 'CONSENT_REJECTED'].includes(decision)) {
      res.status(400).json({ error: 'Invalid decision' })
      return
    }
    const now = new Date().toISOString()

    const existingC = db.prepare('SELECT id FROM homeowner_consents WHERE accessRequestId = ?').get(ar.id) as any
    if (existingC) {
      db.prepare('UPDATE homeowner_consents SET decision = ?, note = ? WHERE id = ?').run(
        decision,
        note || null,
        existingC.id
      )
    } else {
      db.prepare(
        'INSERT INTO homeowner_consents (id, accessRequestId, homeownerId, decision, note, createdAt) VALUES (?, ?, ?, ?, ?, ?)'
      ).run(cuid(), ar.id, h.id, decision, note || null, now)
    }

    if (decision === 'CONSENT_REJECTED') {
      db.prepare("UPDATE access_requests SET status = 'CONSENT_REJECTED', updatedAt = ? WHERE id = ?").run(now, ar.id)
      logActivity(req.user!.id, 'CONSENT_REJECTED', 'AccessRequest', ar.id, null, req.ip)
      res.json({ ok: true, status: 'CONSENT_REJECTED' })
      return
    }

    if (!Array.isArray(authorisedDocs) || authorisedDocs.length === 0) {
      res.status(400).json({ error: 'Please explicitly select at least one document to share.' })
      return
    }

    const allHoDocs = db.prepare('SELECT * FROM documents WHERE ownerId = ?').all(h.id) as any[]
    const matchedDocs = allHoDocs.filter(
      d =>
        authorisedDocs.includes(d.id) ||
        authorisedDocs.includes(d.documentId) ||
        authorisedDocs.includes(d.subcategory) ||
        authorisedDocs.includes(d.category)
    )
    if (matchedDocs.length === 0) {
      res.status(400).json({ error: 'Selected documents not found in locker.' })
      return
    }

    const grantPk = cuid()
    const grantCode = genId('GRANT')
    db.prepare(
      `INSERT INTO access_grants (id, grantId, accessRequestId, bankId, homeownerId, authorisedInfo, expiryDate, status, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?)`
    ).run(grantPk, grantCode, ar.id, ar.bankId, h.id, ar.requestedInfo, ar.expiryDate, now)

    for (const md of matchedDocs) {
      db.prepare('INSERT INTO access_grant_documents (id, grantId, documentId) VALUES (?, ?, ?)').run(
        cuid(),
        grantPk,
        md.id
      )
    }

    db.prepare("UPDATE access_requests SET status = 'ACCESS_GRANTED', updatedAt = ? WHERE id = ?").run(now, ar.id)
    const grant = db.prepare('SELECT * FROM access_grants WHERE id = ?').get(grantPk)
    logActivity(req.user!.id, 'CONSENT_GRANTED', 'AccessGrant', grantPk, { grantId: grantCode }, req.ip)
    res.json({ ok: true, status: 'ACCESS_GRANTED', grant })
  }
)

function hydrateGrant(g: any) {
  const db = getDb()
  const bank = db.prepare('SELECT * FROM banks WHERE id = ?').get(g.bankId)
  const hoRaw = db.prepare('SELECT * FROM homeowners WHERE id = ?').get(g.homeownerId)
  const homeowner = hydrateHomeowner(hoRaw)
  if (homeowner) homeowner.society = hydrateSociety(homeowner.societyId)
  const accessRequest = db.prepare('SELECT * FROM access_requests WHERE id = ?').get(g.accessRequestId)
  const links = db.prepare('SELECT * FROM access_grant_documents WHERE grantId = ?').all(g.id) as any[]
  const documents = links.map(l => ({
    id: l.id,
    document: db.prepare('SELECT * FROM documents WHERE id = ?').get(l.documentId)
  }))

  let infoFields: string[] = []
  try {
    infoFields = JSON.parse(g.authorisedInfo || '[]')
  } catch {
    infoFields = []
  }
  const flat = homeowner?.flats?.[0]?.flat
  const disclosedHomeowner = {
    name: homeowner?.name,
    ...(infoFields.includes('Email') && { email: homeowner?.email }),
    ...(infoFields.includes('Contact number') && { phone: homeowner?.phone }),
    ...(infoFields.includes('Property ID') && { propertyId: flat?.property?.propertyId }),
    ...(infoFields.includes('Flat details') && { flatNumber: flat?.flatNumber, wing: flat?.wing }),
    ...(infoFields.includes('Address') && {
      address: `${homeowner?.society?.address || ''}, ${homeowner?.society?.city || ''}, ${homeowner?.society?.state || ''} - ${homeowner?.society?.pincode || ''}`
    })
  }

  return {
    ...g,
    bank,
    homeowner,
    accessRequest,
    documents,
    disclosedHomeowner
  }
}

r.get('/homeowner/grants', authMiddleware, requireRole('HOMEOWNER'), (req: AuthedRequest, res: Response) => {
  const db = getDb()
  const h = db.prepare('SELECT * FROM homeowners WHERE userId = ?').get(req.user!.id) as any
  if (!h) {
    res.json({ grants: [] })
    return
  }
  const rows = db.prepare('SELECT * FROM access_grants WHERE homeownerId = ? ORDER BY createdAt DESC').all(h.id)
  res.json({ grants: rows.map(hydrateGrant) })
})

r.post('/homeowner/grants/:id/revoke', authMiddleware, requireRole('HOMEOWNER'), (req: AuthedRequest, res: Response) => {
  const db = getDb()
  const grant = db
    .prepare('SELECT * FROM access_grants WHERE id = ? OR grantId = ?')
    .get(req.params.id, req.params.id) as any
  if (!grant) {
    res.status(404).json({ error: 'Grant not found' })
    return
  }
  const h = db.prepare('SELECT * FROM homeowners WHERE userId = ?').get(req.user!.id) as any
  if (!h || h.id !== grant.homeownerId) {
    res.status(403).json({ error: 'Forbidden' })
    return
  }
  const now = new Date().toISOString()
  db.prepare("UPDATE access_grants SET status = 'REVOKED', revokedAt = ? WHERE id = ?").run(now, grant.id)
  db.prepare("UPDATE access_requests SET status = 'REVOKED', updatedAt = ? WHERE id = ?").run(
    now,
    grant.accessRequestId
  )
  logActivity(req.user!.id, 'REVOKE_GRANT', 'AccessGrant', grant.id, { grantId: grant.grantId }, req.ip)
  res.json({ ok: true, status: 'REVOKED' })
})

r.get('/bank/records', authMiddleware, requireRole('BANK_USER'), (req: AuthedRequest, res: Response) => {
  const db = getDb()
  const bu = db.prepare('SELECT * FROM bank_users WHERE userId = ?').get(req.user!.id) as any
  if (!bu) {
    res.json({ grants: [], allGrants: [] })
    return
  }
  const rows = db.prepare('SELECT * FROM access_grants WHERE bankId = ? ORDER BY createdAt DESC').all(bu.bankId) as any[]
  const now = new Date()
  const allGrants = rows.map(hydrateGrant)
  const active = allGrants.filter(g => g.status === 'ACTIVE' && !g.revokedAt && new Date(g.expiryDate) > now)
  res.json({ grants: active, allGrants })
})

r.get(
  '/bank/documents/:grantId/:documentId',
  authMiddleware,
  requireRole('BANK_USER'),
  (req: AuthedRequest, res: Response) => {
    const db = getDb()
    const grant = db
      .prepare('SELECT * FROM access_grants WHERE id = ? OR grantId = ?')
      .get(req.params.grantId, req.params.grantId) as any
    if (!grant) {
      res.status(404).json({ error: 'Grant not found' })
      return
    }
    const bu = db.prepare('SELECT * FROM bank_users WHERE userId = ?').get(req.user!.id) as any
    if (!bu || bu.bankId !== grant.bankId) {
      res.status(403).json({ error: 'Forbidden' })
      return
    }
    if (grant.status !== 'ACTIVE' || grant.revokedAt || new Date(grant.expiryDate) < new Date()) {
      res.status(403).json({ error: 'Grant expired or revoked' })
      return
    }
    const doc = db
      .prepare('SELECT * FROM documents WHERE id = ? OR documentId = ?')
      .get(req.params.documentId, req.params.documentId) as any
    if (!doc) {
      res.status(404).json({ error: 'Document not found' })
      return
    }
    const link = db
      .prepare('SELECT id FROM access_grant_documents WHERE grantId = ? AND documentId = ?')
      .get(grant.id, doc.id)
    if (!link) {
      res.status(403).json({ error: 'Document not authorised under this grant' })
      return
    }
    if (!fs.existsSync(doc.storedPath)) {
      res.status(404).json({ error: 'File missing on server' })
      return
    }
    const dl = req.query.download === 'true'
    res.setHeader('Content-Type', doc.mimeType)
    res.setHeader('Content-Disposition', `${dl ? 'attachment' : 'inline'}; filename="${doc.originalName}"`)
    logActivity(
      req.user!.id,
      dl ? 'BANK_DOWNLOAD_DOCUMENT' : 'BANK_VIEW_DOCUMENT',
      'Document',
      doc.id,
      { grantId: grant.grantId },
      req.ip
    )
    res.send(fs.readFileSync(doc.storedPath))
  }
)

// ==================== 8. NOTIFICATIONS & ACTIVITY ====================
r.get('/notifications', authMiddleware, (req: AuthedRequest, res: Response) => {
  const db = getDb()
  const rows = db
    .prepare('SELECT * FROM notifications WHERE userId = ? ORDER BY createdAt DESC LIMIT 50')
    .all(req.user!.id) as any[]
  res.json({ notifications: rows.map(n => ({ ...n, read: Boolean(n.read) })) })
})

r.post('/notifications/:id/read', authMiddleware, (req: AuthedRequest, res: Response) => {
  const db = getDb()
  db.prepare('UPDATE notifications SET read = 1 WHERE id = ? AND userId = ?').run(req.params.id, req.user!.id)
  res.json({ ok: true })
})

r.get('/activity', authMiddleware, (req: AuthedRequest, res: Response) => {
  const db = getDb()
  const rows = db
    .prepare('SELECT * FROM activity_logs WHERE userId = ? ORDER BY createdAt DESC LIMIT 50')
    .all(req.user!.id)
  res.json({ activities: rows })
})

export default r

import Database from 'better-sqlite3'
import path from 'node:path'
import fs from 'node:fs'
import bcrypt from 'bcryptjs'
import { cuid, sha3Hash } from './utils.js'

let dbInstance: Database.Database | null = null

export function getDb(): Database.Database {
  if (!dbInstance) {
    const dbPath = process.env.DB_PATH || path.join(process.cwd(), 'data.db')
    dbInstance = new Database(dbPath)
    dbInstance.pragma('journal_mode = WAL')
    dbInstance.pragma('foreign_keys = ON')
  }
  return dbInstance
}

export function initDb() {
  const db = getDb()
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      passwordHash TEXT NOT NULL,
      role TEXT NOT NULL,
      name TEXT NOT NULL,
      phone TEXT,
      isActive INTEGER DEFAULT 1,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS societies (
      id TEXT PRIMARY KEY,
      societyId TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      registrationNo TEXT,
      address TEXT NOT NULL,
      city TEXT NOT NULL,
      state TEXT NOT NULL,
      pincode TEXT NOT NULL,
      buildingsCount INTEGER DEFAULT 1,
      totalFlats INTEGER DEFAULT 1,
      contactEmail TEXT,
      contactPhone TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS society_admins (
      id TEXT PRIMARY KEY,
      userId TEXT UNIQUE NOT NULL,
      societyId TEXT NOT NULL,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (societyId) REFERENCES societies(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS society_office_bearers (
      id TEXT PRIMARY KEY,
      societyId TEXT NOT NULL,
      name TEXT NOT NULL,
      designation TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (societyId) REFERENCES societies(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS buildings (
      id TEXT PRIMARY KEY,
      societyId TEXT NOT NULL,
      name TEXT NOT NULL,
      wings TEXT,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (societyId) REFERENCES societies(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS flats (
      id TEXT PRIMARY KEY,
      societyId TEXT NOT NULL,
      buildingId TEXT,
      flatNumber TEXT NOT NULL,
      wing TEXT,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (societyId) REFERENCES societies(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS homeowners (
      id TEXT PRIMARY KEY,
      userId TEXT UNIQUE NOT NULL,
      societyId TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      ownershipCategory TEXT DEFAULT 'Primary Owner',
      status TEXT DEFAULT 'ACTIVE',
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (societyId) REFERENCES societies(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS homeowner_flat_associations (
      id TEXT PRIMARY KEY,
      homeownerId TEXT NOT NULL,
      flatId TEXT NOT NULL,
      isPrimary INTEGER DEFAULT 1,
      createdAt TEXT NOT NULL,
      UNIQUE(homeownerId, flatId),
      FOREIGN KEY (homeownerId) REFERENCES homeowners(id) ON DELETE CASCADE,
      FOREIGN KEY (flatId) REFERENCES flats(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS properties (
      id TEXT PRIMARY KEY,
      propertyId TEXT UNIQUE NOT NULL,
      flatId TEXT UNIQUE NOT NULL,
      ownerId TEXT,
      societyId TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (flatId) REFERENCES flats(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      documentId TEXT UNIQUE NOT NULL,
      ownerId TEXT NOT NULL,
      propertyId TEXT,
      category TEXT NOT NULL,
      subcategory TEXT,
      originalName TEXT NOT NULL,
      storedPath TEXT NOT NULL,
      mimeType TEXT NOT NULL,
      size INTEGER NOT NULL,
      sha3Hash TEXT,
      status TEXT DEFAULT 'Uploaded',
      version INTEGER DEFAULT 1,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (ownerId) REFERENCES homeowners(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS document_versions (
      id TEXT PRIMARY KEY,
      documentId TEXT NOT NULL,
      version INTEGER NOT NULL,
      storedPath TEXT NOT NULL,
      originalName TEXT NOT NULL,
      mimeType TEXT NOT NULL,
      size INTEGER NOT NULL,
      sha3Hash TEXT,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (documentId) REFERENCES documents(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS banks (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      branch TEXT,
      officialEmail TEXT NOT NULL,
      contactNumber TEXT,
      authorisedUser TEXT,
      designation TEXT,
      verified INTEGER DEFAULT 1,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS bank_users (
      id TEXT PRIMARY KEY,
      userId TEXT UNIQUE NOT NULL,
      bankId TEXT NOT NULL,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (bankId) REFERENCES banks(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS access_requests (
      id TEXT PRIMARY KEY,
      requestId TEXT UNIQUE NOT NULL,
      bankId TEXT NOT NULL,
      societyId TEXT NOT NULL,
      homeownerId TEXT NOT NULL,
      flatId TEXT,
      purpose TEXT NOT NULL,
      requestedInfo TEXT NOT NULL,
      requestedDocs TEXT NOT NULL,
      explanation TEXT,
      expiryDate TEXT NOT NULL,
      status TEXT DEFAULT 'SUBMITTED',
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (bankId) REFERENCES banks(id) ON DELETE CASCADE,
      FOREIGN KEY (societyId) REFERENCES societies(id) ON DELETE CASCADE,
      FOREIGN KEY (homeownerId) REFERENCES homeowners(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS society_approvals (
      id TEXT PRIMARY KEY,
      accessRequestId TEXT UNIQUE NOT NULL,
      approverId TEXT NOT NULL,
      decision TEXT NOT NULL,
      note TEXT,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (accessRequestId) REFERENCES access_requests(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS homeowner_consents (
      id TEXT PRIMARY KEY,
      accessRequestId TEXT UNIQUE NOT NULL,
      homeownerId TEXT NOT NULL,
      decision TEXT NOT NULL,
      note TEXT,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (accessRequestId) REFERENCES access_requests(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS access_grants (
      id TEXT PRIMARY KEY,
      grantId TEXT UNIQUE NOT NULL,
      accessRequestId TEXT UNIQUE NOT NULL,
      bankId TEXT NOT NULL,
      homeownerId TEXT NOT NULL,
      authorisedInfo TEXT NOT NULL,
      expiryDate TEXT NOT NULL,
      revokedAt TEXT,
      status TEXT DEFAULT 'ACTIVE',
      createdAt TEXT NOT NULL,
      FOREIGN KEY (accessRequestId) REFERENCES access_requests(id) ON DELETE CASCADE,
      FOREIGN KEY (bankId) REFERENCES banks(id) ON DELETE CASCADE,
      FOREIGN KEY (homeownerId) REFERENCES homeowners(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS access_grant_documents (
      id TEXT PRIMARY KEY,
      grantId TEXT NOT NULL,
      documentId TEXT NOT NULL,
      UNIQUE(grantId, documentId),
      FOREIGN KEY (grantId) REFERENCES access_grants(id) ON DELETE CASCADE,
      FOREIGN KEY (documentId) REFERENCES documents(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT DEFAULT 'INFO',
      read INTEGER DEFAULT 0,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS activity_logs (
      id TEXT PRIMARY KEY,
      userId TEXT,
      action TEXT NOT NULL,
      entity TEXT,
      entityId TEXT,
      metadata TEXT,
      ip TEXT,
      createdAt TEXT NOT NULL
    );
  `)

  seedDemoDataIfEmpty(db)
}

function seedDemoDataIfEmpty(db: Database.Database) {
  const existingAdmin = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@greenvalley.demo')
  if (existingAdmin) return

  const now = new Date().toISOString()
  const hash = bcrypt.hashSync('Password@123', 10)

  // 1. Society Admin User & Green Valley Residency
  const adminUserId = cuid()
  db.prepare(
    'INSERT INTO users (id, email, passwordHash, role, name, phone, isActive, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)'
  ).run(adminUserId, 'admin@greenvalley.demo', hash, 'SOCIETY_ADMIN', 'Ramesh Iyer', '+91 98200 11223', now, now)

  const societyId = cuid()
  db.prepare(
    `INSERT INTO societies (id, societyId, name, registrationNo, address, city, state, pincode, buildingsCount, totalFlats, contactEmail, contactPhone, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    societyId,
    'SOC-GVR-001',
    'Green Valley Residency',
    'BOM/HSG/TC-2024-001',
    'Plot 12, Malabar Crest Road, Sector 4',
    'Mumbai',
    'Maharashtra',
    '400001',
    3,
    120,
    'office@greenvalley.demo',
    '+91 22 2284 9900',
    now,
    now
  )

  db.prepare('INSERT INTO society_admins (id, userId, societyId) VALUES (?, ?, ?)').run(cuid(), adminUserId, societyId)

  // 2. Three Office Bearers
  const bearers = [
    ['Ramesh Iyer', 'Chairman', 'chairman@greenvalley.demo', '+91 98200 11223'],
    ['Sunita Rao', 'Secretary', 'secretary@greenvalley.demo', '+91 98200 11224'],
    ['Vikram Patil', 'Treasurer', 'treasurer@greenvalley.demo', '+91 98200 11225']
  ]
  for (const [bName, bDesig, bEmail, bPhone] of bearers) {
    db.prepare(
      'INSERT INTO society_office_bearers (id, societyId, name, designation, email, phone, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(cuid(), societyId, bName, bDesig, bEmail, bPhone, now, now)
  }

  // 3. Buildings & Flats
  const b1 = cuid()
  const b2 = cuid()
  const b3 = cuid()
  db.prepare('INSERT INTO buildings (id, societyId, name, wings, createdAt) VALUES (?, ?, ?, ?, ?)').run(b1, societyId, 'Building A', 'A', now)
  db.prepare('INSERT INTO buildings (id, societyId, name, wings, createdAt) VALUES (?, ?, ?, ?, ?)').run(b2, societyId, 'Building B', 'B', now)
  db.prepare('INSERT INTO buildings (id, societyId, name, wings, createdAt) VALUES (?, ?, ?, ?, ?)').run(b3, societyId, 'Building C', 'C', now)

  const flatSpecs = [
    { bId: b1, num: '101', wing: 'A', propCode: 'PROP-GVR-A101', name: 'Aarav Sharma', email: 'aarav@greenvalley.demo', phone: '+91 98111 22001' },
    { bId: b1, num: '202', wing: 'A', propCode: 'PROP-GVR-A202', name: 'Priya Mehta', email: 'priya@greenvalley.demo', phone: '+91 98111 22002' },
    { bId: b2, num: '301', wing: 'B', propCode: 'PROP-GVR-B301', name: 'Rohan Desai', email: 'rohan@greenvalley.demo', phone: '+91 98111 22003' },
    { bId: b2, num: '402', wing: 'B', propCode: 'PROP-GVR-B402', name: 'Neha Kulkarni', email: 'neha@greenvalley.demo', phone: '+91 98111 22004' },
    { bId: b3, num: '501', wing: 'C', propCode: 'PROP-GVR-C501', name: 'Karan Joshi', email: 'karan@greenvalley.demo', phone: '+91 98111 22005' }
  ]

  let firstHomeownerId = ''
  let firstFlatId = ''
  let firstPropId = ''

  for (let i = 0; i < flatSpecs.length; i++) {
    const sp = flatSpecs[i]
    const flatId = cuid()
    db.prepare('INSERT INTO flats (id, societyId, buildingId, flatNumber, wing, createdAt) VALUES (?, ?, ?, ?, ?, ?)').run(
      flatId,
      societyId,
      sp.bId,
      sp.num,
      sp.wing,
      now
    )

    const hoUserId = cuid()
    db.prepare(
      'INSERT INTO users (id, email, passwordHash, role, name, phone, isActive, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)'
    ).run(hoUserId, sp.email, hash, 'HOMEOWNER', sp.name, sp.phone, now, now)

    const homeownerId = cuid()
    db.prepare(
      'INSERT INTO homeowners (id, userId, societyId, name, email, phone, ownershipCategory, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(homeownerId, hoUserId, societyId, sp.name, sp.email, sp.phone, 'Primary Owner', 'ACTIVE', now, now)

    db.prepare(
      'INSERT INTO homeowner_flat_associations (id, homeownerId, flatId, isPrimary, createdAt) VALUES (?, ?, ?, 1, ?)'
    ).run(cuid(), homeownerId, flatId, now)

    const propId = cuid()
    db.prepare(
      'INSERT INTO properties (id, propertyId, flatId, ownerId, societyId, createdAt) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(propId, sp.propCode, flatId, homeownerId, societyId, now)

    if (i === 0) {
      firstHomeownerId = homeownerId
      firstFlatId = flatId
      firstPropId = propId
    }
  }

  // 4. Sample Documents for Aarav Sharma (Flat A-101)
  const uploadsDir = path.resolve(process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads'))
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })

  const sampleDocs = [
    { category: 'PROPERTY', subcategory: 'Sale deed', name: 'Aarav_Sharma_Registered_Sale_Deed.pdf', status: 'Accepted for stated purpose' },
    { category: 'PROPERTY', subcategory: 'Society share certificate', name: 'GreenValley_Share_Certificate_A101.pdf', status: 'Accepted for stated purpose' },
    { category: 'PROPERTY', subcategory: 'Property tax receipts', name: 'BMC_Property_Tax_Receipt_2025.pdf', status: 'Uploaded' },
    { category: 'PROPERTY', subcategory: 'Index II', name: 'SubRegistrar_Index_II_A101.pdf', status: 'Accepted for stated purpose' },
    { category: 'LOAN', subcategory: 'Loan sanction letter', name: 'Home_Loan_Sanction_Letter_A101.pdf', status: 'Uploaded' },
    { category: 'LOAN', subcategory: 'No-objection certificate', name: 'Society_Mortgage_NOC_A101.pdf', status: 'Accepted for stated purpose' }
  ]

  for (const sd of sampleDocs) {
    const content = Buffer.from(`%PDF-1.4\n% Suraksha Setu Demo Record: ${sd.subcategory} (${sd.name})\n`)
    const storedPath = path.join(uploadsDir, `seed-${cuid()}-${sd.name}`)
    fs.writeFileSync(storedPath, content)
    const digest = sha3Hash(content)
    const docPk = cuid()
    const docCode = 'DOC-' + docPk.slice(-6).toUpperCase()

    db.prepare(
      `INSERT INTO documents (id, documentId, ownerId, propertyId, category, subcategory, originalName, storedPath, mimeType, size, sha3Hash, status, version, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'application/pdf', ?, ?, ?, 1, ?, ?)`
    ).run(docPk, docCode, firstHomeownerId, firstPropId, sd.category, sd.subcategory, sd.name, storedPath, content.length, digest, sd.status, now, now)

    db.prepare(
      `INSERT INTO document_versions (id, documentId, version, storedPath, originalName, mimeType, size, sha3Hash, createdAt)
       VALUES (?, ?, 1, ?, ?, 'application/pdf', ?, ?, ?)`
    ).run(cuid(), docPk, storedPath, sd.name, content.length, digest, now)
  }

  // 5. Bank User & Bank Profile
  const bankUserId = cuid()
  db.prepare(
    'INSERT INTO users (id, email, passwordHash, role, name, phone, isActive, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)'
  ).run(bankUserId, 'bank@demo.bank', hash, 'BANK_USER', 'Siddharth Malhotra', '+91 22 6655 4400', now, now)

  const bankId = cuid()
  db.prepare(
    `INSERT INTO banks (id, name, branch, officialEmail, contactNumber, authorisedUser, designation, verified, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`
  ).run(
    bankId,
    'Imperial National Bank',
    'Mumbai Nariman Point Corporate Branch',
    'bank@demo.bank',
    '+91 22 6655 4400',
    'Siddharth Malhotra',
    'Senior Mortgage Underwriting Officer',
    now,
    now
  )

  db.prepare('INSERT INTO bank_users (id, userId, bankId) VALUES (?, ?, ?)').run(cuid(), bankUserId, bankId)

  // 6. Pre-seeded Bank Request (REQ-DEMO01)
  const exp = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
  db.prepare(
    `INSERT INTO access_requests (id, requestId, bankId, societyId, homeownerId, flatId, purpose, requestedInfo, requestedDocs, explanation, expiryDate, status, createdAt, updatedAt)
     VALUES (?, 'REQ-DEMO01', ?, ?, ?, ?, ?, ?, ?, ?, ?, 'SUBMITTED', ?, ?)`
  ).run(
    cuid(),
    bankId,
    societyId,
    firstHomeownerId,
    firstFlatId,
    'Home Loan Refinance & Title Verification',
    JSON.stringify(['Name', 'Property ID', 'Flat details', 'Address']),
    JSON.stringify(['Sale deed', 'Society share certificate', 'Loan sanction letter']),
    'Verification of Flat A-101 membership and property records for mortgage underwriting.',
    exp,
    now,
    now
  )

  console.log('Seeded Suraksha Setu demo data (admin@greenvalley.demo, aarav@greenvalley.demo, bank@demo.bank)')
}

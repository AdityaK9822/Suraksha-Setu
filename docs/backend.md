# Backend Module

Express + TypeScript API for Suraksha Setu. SQLite (better-sqlite3) for the
prototype. Zod validation. Default port 4000.

## Structure

```
backend/
├── src/
│   ├── index.ts     # Express app bootstrap, CORS, routes, /health
│   ├── db.ts        # SQLite schema + demo seed data
│   ├── auth.ts      # JWT sign/verify, middleware, roles, activity/notifications
│   ├── utils.ts     # cuid, genId, SHA-3 hash, multipart parser
│   └── routes.ts    # All API routes
├── uploads/         # Stored document files
├── data.db          # SQLite database (prototype)
├── .env.example     # PORT, JWT_SECRET, DB_PATH, UPLOAD_DIR
└── package.json
```

## Environment

| Var | Default | Meaning |
|---|---|---|
| `PORT` | 4000 | Listen port |
| `JWT_SECRET` | dev secret | JWT signing secret (change in prod) |
| `DB_PATH` | `./data.db` | SQLite file path |
| `UPLOAD_DIR` | `./uploads` | Document storage directory |

## Run

```
cd backend
npm install
npm run dev      # tsx watch src/index.ts
npm run build    # tsc
npm start        # node dist/index.js
```

## Auth

- Roles: `SOCIETY_ADMIN`, `HOMEOWNER`, `BANK_USER`.
- JWT (7-day expiry), signed with `JWT_SECRET`. Token via `Authorization: Bearer`
  or `token` cookie.
- `authMiddleware` validates token + active user; `requireRole(...)` enforces role.
- Passwords bcrypt (cost 10).

Endpoints: `POST /api/auth/register`, `POST /api/auth/login`,
`POST /api/auth/logout`, `POST /api/auth/password-reset`,
`POST /api/auth/update-password`, `GET /api/auth/me`.

## Data model (SQLite)

Core tables: `users`, `societies`, `society_admins`, `society_office_bearers`,
`buildings`, `flats`, `homeowners`, `homeowner_flat_associations`, `properties`,
`documents`, `document_versions`, `banks`, `bank_users`, `access_requests`,
`society_approvals`, `homeowner_consents`, `access_grants`,
`access_grant_documents`, `notifications`, `activity_logs`.

## Route groups (routes.ts)

1. Auth — register/login/logout/password/me.
2. Societies — create, search, list, get, update; society admin profile/dashboard.
3. Office bearers — list/add/update (Chairman/Secretary/Treasurer).
4. Homeowners — register into society, list, directory, update, deactivate.
5. Homeowner portal — profile, dashboard, property, passport, documents
   (upload/replace/preview/download/status), DigiLocker demo import.
6. Bank portal — register bank profile, profile, dashboard, search homeowners,
   create access requests, list requests, approved records, history.
7. Access flow — society approval + homeowner consent -> access grant +
   document sharing with expiry.
8. Notifications & activity logs.

## Document handling

- Allowed MIME types: PDF, JPEG, PNG. Max 10 MB.
- Custom zero-dependency multipart parser (`parseMultipartRequest`).
- Files stored under `UPLOAD_DIR`; direct `/uploads` static access is blocked
  (403) — served only via authenticated preview/download endpoints.
- Each document SHA-3 hashed (`sha3Hash`, Node crypto `sha3-256`, `0x`-prefixed).
- Versioning via `document_versions`; status flow: Uploaded -> Under/Pending Review
  -> Accepted for stated purpose / rejected.

## Seed data

`seedDemoDataIfEmpty` creates demo society "Green Valley Residency" with admin
`admin@greenvalley.demo`, 5 homeowners, sample documents, bank user
`bank@demo.bank`, and a pre-seeded access request `REQ-DEMO01`. Password for all:
`Password@123`.

## Health

`GET /health` and `GET /api/health` return `{ status: 'ok' }`.
# Frontend Module

Vite + React 18 + TypeScript + Tailwind CSS portal. React Router v6, axios
client, Framer Motion, Three.js for landing visuals.

## Structure

```
frontend/
├── src/
│   ├── main.tsx, App.tsx        # Entry + route table
│   ├── context/AuthContext.tsx  # Auth state
│   ├── services/api.ts         # axios client (/api, Bearer token)
│   ├── components/             # common, documents, landing
│   ├── layouts/                # SocietyLayout, HomeownerLayout, BankLayout, DashboardLayout
│   ├── pages/                  # auth, society, homeowner, bank, public
│   ├── hooks/useFetch.ts
│   └── types.ts
├── .env.example                # VITE_API_URL
├── tailwind.config.js, vite.config.ts
└── package.json
```

## Environment

| Var | Default | Meaning |
|---|---|---|
| `VITE_API_URL` | `http://localhost:4000` | Backend base URL |

## Run

```
cd frontend
npm install
npm run dev      # vite
npm run build    # tsc -b && vite build
npm run preview
npm run lint
```

## Routing (App.tsx)

Public: `/`, `/login`, `/register`.

Protected by role (ProtectedRoute):
- `/society/*` — SOCIETY_ADMIN: dashboard, create, profile, office-bearers,
  register-homeowners, directory, documents, bank-requests, notifications,
  activity, settings.
- `/homeowner/*` — HOMEOWNER: dashboard, property, passport, documents, upload,
  bank-requests, consent, grants, activity, notifications, settings.
- `/bank/*` — BANK_USER: dashboard, search-societies, directory, homeowner-search,
  request-access, requests, records, history, notifications, settings.

API client: axios instance baseURL `/api`, attaches `bhuid_token` from
localStorage as Bearer; clears token on 401.

## Auth

- `AuthContext` holds user/token; `ProtectedRoute` gates by role.
- Token stored in `localStorage` under `bhuid_token`.
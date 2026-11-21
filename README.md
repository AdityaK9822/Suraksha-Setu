# Suraksha Setu

> A blockchain-based platform to securely store and verify non-government issued documents.

## Overview

**Suraksha Setu** ("Bridge of Safety") is a blockchain-backed platform for securely storing
non-government issued documents (e.g. NBFC documents) and verifying their authenticity.

For this hackathon prototype, the focus is on **Cooperative Housing Society (CHS)** documents —
registering NOCs, builder contracts, and similar records on-chain — to prevent NOC/document fraud.

## The Problem

NOC and document fraud recur in real-estate: flats sold/mortgaged multiple times, forged owner
identities, hidden loans on mortgaged properties. Reported cases: Santacruz (Jan 2026),
Bandra West Iconic Tower (EOW), Govandi/IDBI Bank, Versova redevelopment (₹55cr),
Navi Mumbai builder (ED, ₹50cr), Chinchpokli (₹42.96cr).

## How It Works

1. User creates an account on the portal.
2. User joins/creates community orgs (as admin) or stores private docs/assets.
3. Uploaded document is hashed and stored on the blockchain.
4. Community documents require verification by admins/authorized people.

## Hashing

Documents are hashed using **SHA-3** before being recorded on-chain.

## Prototype Scope

- Complete integration for **CHS**: NOC registration, builder contracts, society records.
- Broader vision: general non-government document storage (NBFC, etc.).

## Tech Stack

- Frontend: Vite + React + TypeScript + Tailwind CSS
- Backend: Node.js + Express + TypeScript (SQLite for prototype)
- Smart contracts: Solidity + Hardhat
- Firmware (prototype): Rust via esp-rs (ESP32-S3) — verification kiosk in `firmware/`
- Hashing: SHA-3
- Document storage: IPFS (Pinata)
- Auth: JWT + bcrypt

## Project Structure

```
frontend/   Vite + React + TypeScript portal
backend/    Express + TypeScript API (SQLite prototype)
contracts/  Solidity + Hardhat smart contracts
firmware/   ESP32-S3 verification kiosk (Rust, esp-rs)
```

## Roles & portals

- **Society Admin** — create/manage society, register homeowners, verify documents, approve bank access requests.
- **Homeowner** — upload property/loan documents, view property passport, manage consent & grants.
- **Bank User** — search societies/homeowners, request document access, view approved records.

## Document verification flow

1. Homeowner uploads a document → stored off-chain, SHA-3 hash computed.
2. Society admin reviews and marks status (Accepted for stated purpose / rejected).
3. Bank requests access → society approves → homeowner consents → time-bound access grant issued.
4. Kiosk (firmware) hashes a PDF with Keccak-256 and queries backend to verify against records.

## Getting Started

Frontend: `cd frontend && npm install && npm run dev`
Backend: `cd backend && npm install && npm run dev`
Contracts: `cd contracts && npm install && npx hardhat test`

## Team

- Aditya ([@AdityaK9822](https://github.com/AdityaK9822)) — owner
- Deva ([@deva2407-eng](https://github.com/deva2407-eng))
- Antara ([@Antaraaaa14](https://github.com/Antaraaaa14))
- Aaroh ([@aarohwankh-dotcom](https://github.com/aarohwankh-dotcom))

## Contributors

Thanks to all contributors:

- [@AdityaK9822](https://github.com/AdityaK9822)
- [@deva2407-eng](https://github.com/deva2407-eng)
- [@Antaraaaa14](https://github.com/Antaraaaa14)
- [@aarohwankh-dotcom](https://github.com/aarohwankh-dotcom)

## Documentation

See the [docs/](./docs/) folder for per-module documentation:

- [Backend](./docs/backend.md)
- [Frontend](./docs/frontend.md)
- [Smart Contracts](./docs/contracts.md)
- [Firmware](./docs/firmware.md)

## License

MIT
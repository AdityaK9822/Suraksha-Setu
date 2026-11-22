# Suraksha Setu — Documentation

Suraksha Setu ("Bridge of Safety") is a blockchain-backed platform for securely
storing non-government issued documents (NBFC, CHS, etc.) and verifying their
authenticity. This hackathon prototype focuses on Cooperative Housing Society
(CHS) documents: NOCs, builder contracts, society records.

## Modules

- [Backend](./backend.md) — Express + TypeScript API, SQLite, JWT auth, document storage, standalone blockchain anchoring
- [Frontend](./frontend.md) — Vite + React + TypeScript portal
- [Smart Contracts](./contracts.md) — Solidity + Hardhat document hash registry
- [Firmware](./firmware.md) — ESP32-S3 verification kiosk (Rust, esp-rs)

## Architecture at a glance

```
frontend/ (Vite+React)  -->  backend/ (Express :4000)  -->  contracts/ (Solidity)
                                  |                              |
                                  +--> SQLite (data.db)          +--> blockchain (hashes only)
                                  +--> uploads/ (files)
                                  +--> IPFS/Pinata (off-chain docs)
firmware/ (ESP32-S3 kiosk)  --HTTP-->  backend/ (verify endpoints)
```

- Documents hashed with SHA-3 before any on-chain record; plaintext never goes on-chain.
- Community documents require admin/authorized verification before being trusted.
- Firmware performs no blockchain logic — only SHA3-256 hashing + backend queries.
- Standalone backend blockchain client (`backend/src/blockchain.ts`) anchors hashes on-chain via a demo CLI; not wired into the API.

## Getting started

- Frontend: `cd frontend && npm install && npm run dev`
- Backend: `cd backend && npm install && npm run dev`
- Contracts: `cd contracts && npm install && npx hardhat test`
- Firmware: see [firmware.md](./firmware.md)
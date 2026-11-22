# Suraksha Setu — Main Idea

Blockchain-based platform to securely store and verify **non-government issued documents**.

**Prototype scope:** CHS (Cooperative Housing Society) documents — NOCs, builder contracts, society records.
(The real product targets any non-government document, e.g. NBFC papers. For this hackathon we build the complete integration for CHS.)

## Pain point: NOC fraud

All cases below are news-reported allegations or arrests, not convictions.

| Case | What happened |
|---|---|
| Santacruz, Mumbai (Jan 2026) | Couple allegedly hid multiple loans on the same flat and sold it, cheating a businessman of ~₹74 lakh. The buyer discovered during loan formalities that three loans totalling ₹1.11 crore already existed on the flat. (lokmattimes) |
| Bandra West, Iconic Tower (EOW, Dec 2025–Jan 2026) | Owner's identity allegedly forged to sell the flat and take a loan. Buyer had legally purchased it in May 2023 for ₹6.25 Cr; it was mortgaged for ₹11.35 Cr (Utkarsh Small Finance Bank). Fraud surfaced when the society ran a due-diligence check for flats sold multiple times. (freepressjournal) |
| Govandi police / IDBI Bank (Jan) | Three family members booked for allegedly cheating IDBI Bank of ₹2.70 Cr by selling a Navi Mumbai flat already mortgaged to another lender. (freepressjournal) |
| Navi Mumbai couple (Dec 2025) | Forged-documents case; fraud surfaced after another bank seized the same flat under SARFAESI. Loan was only ₹30 lakh — these cases aren't all crore-scale. (freepressjournal) |
| Versova redevelopment (EOW, ₹55 Cr) | Flats meant for original society members allegedly mortgaged to banks and sold to third parties without their consent. (propnewstime) |
| Navi Mumbai builder (ED, 2021, ₹50 Cr) | Builder sold flats to multiple persons and took NBFC loans by mortgaging the same flats without customers' knowledge. (dailypioneer) |
| Chinchpokli redevelopment (₹42.96 Cr) | Police booked a builder, its directors, nine financial institutions and 13 flat purchasers over alleged cheating of a society and its tenants. |

**Pattern:** buyers and lenders discover the fraud too late — during loan formalities, SARFAESI seizure, or society due-diligence checks.

## How blockchain tackles it

1. User creates an account on our portal.
2. User can join community orgs, create orgs as admin, or store private documents/assets.
3. The uploaded document is hashed and the hash is stored on a blockchain.
4. Community documents need to be verified by admins or authorized people before being trusted.

## Design principles

- **Hash-only on chain:** documents are hashed (SHA-3) before storing on-chain; plaintext documents never go on-chain (stored off-chain via IPFS).
- **Generic org model:** CHS is just the first organization type — treat "organization" as generic from day one so NBFCs and others plug in later.
- **Verification gate:** community documents are trusted only after admin/authorized verification.

## Hashing algorithm

SHA-3 (via js-sha3 / @noble/hashes).

## Prototype mapping (repo structure)

| Idea | Implementation |
|---|---|
| Portal + auth | `frontend/` (Vite + React) + `backend/` (Express, JWT + bcrypt) |
| Hash on-chain | `contracts/` (Solidity + Hardhat), SHA-3; standalone backend client `backend/src/blockchain.ts` |
| Off-chain document storage | IPFS via Pinata HTTP API |
| Community verification | Backend admin roles + on-chain verification status |
| Firmware (deferred) | `firmware/` (esp-rs) |

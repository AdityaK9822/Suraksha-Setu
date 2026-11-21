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

## Tech Stack (planned)

- Smart contracts (Solidity) on EVM chain
- IPFS for document storage; on-chain hash for integrity
- Web portal (frontend + backend)
- SHA-3 document hashing

## Getting Started

Setup instructions to be added as the project is built.

## Team

- Aditya (owner)
- (team members to be added)

## License

MIT
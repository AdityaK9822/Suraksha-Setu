# Blockchain anchoring (standalone demo)

This directory contains a self-contained Ethereum integration for the
`SurakshaSetu` registry contract (`contracts/contracts/SurakshaSetu.sol`).
It is **not wired into the running API** — the upload/verify flows are unchanged.
It exists to demonstrate the plumbing works end-to-end.

## What's here

- `src/blockchain.ts` — provider/signer/contract factory plus `registerHash`,
  `verifyHash`, and `getRecord`.
- `scripts/anchor-demo.ts` — CLI that hashes a file (or takes a raw `0x…` hash)
  and calls the contract.

## Run it

```bash
# 1. Start a local chain and deploy the contract (from the contracts/ dir)
cd ../contracts
npx hardhat node &                       # account #0 is admin/deployer
npx hardhat run scripts/deploy.ts --network localhost   # note the printed address

# 2. Configure env (copy .env.example -> .env and fill in CONTRACT_ADDRESS + PRIVATE_KEY)
cd ../backend
cp .env.example .env

# 3. Anchor a file (computes SHA3-256, registers on-chain)
npm run anchor:demo -- ./path/to/document.pdf

# or with a raw hash
npm run anchor:demo -- 0x<64-hex-chars>

# 4. Read the record back / verify (admin-only)
npm run anchor:demo -- 0x<64-hex-chars> --read
npm run anchor:demo -- 0x<64-hex-chars> --verify
```

## Notes

- Uses the local Hardhat default key (`0xac09…f2ff80`) — demo only.
- `register` reverts on a duplicate hash, and `verify` is admin-only.
- To wire this into the API later, import from `src/blockchain.ts` in the document
  upload/status routes.

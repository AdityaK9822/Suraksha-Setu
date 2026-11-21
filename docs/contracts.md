# Smart Contracts Module

Solidity + Hardhat (TypeScript). Document hash registry on-chain.

## Structure

```
contracts/
├── contracts/SurakshaSetu.sol   # hash registry contract
├── scripts/deploy.ts            # deploy script
├── test/SurakshaSetu.test.ts    # tests
├── hardhat.config.ts
└── package.json
```

## Contract: SurakshaSetu

Stores SHA-3 document hashes with admin verification.

- `struct Record { docHash, uploader, verifier, verified, timestamp }`
- `mapping(bytes32 => Record) records`
- `address public admin` (set in constructor to deployer)
- Events: `DocumentRegistered(docHash, uploader)`, `DocumentVerified(docHash, verifier)`

Functions:
- `register(bytes32 docHash)` — anyone; reverts if already registered.
- `verify(bytes32 docHash)` — admin only; reverts if not registered or already verified.

Principle: hash-only on chain; plaintext documents never stored on-chain.

## Run

```
cd contracts
npm install
npm run compile      # hardhat compile
npm test             # hardhat test
npm run deploy:local # hardhat run scripts/deploy.ts --network localhost
```
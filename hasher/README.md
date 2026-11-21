# Suraksha Setu — SHA-3 Document Hasher

Hashes documents with **SHA-3** before they are recorded on-chain. The digest (hex)
is what gets stored as `bytes32 docHash` in the `SurakshaSetu` contract.

> SHA-3 is a one-way hash (not encryption). "Encrypt" in the issue title refers to
> hashing the document for integrity/verification.

## Supported algorithms

- NIST SHA-3: `sha3-224`, `sha3-256` (default), `sha3-384`, `sha3-512`
- Keccak (EVM-compatible, matches Solidity `keccak256` / `ethers.keccak256`):
  `keccak-224`, `keccak-256`, `keccak-384`, `keccak-512`

NIST SHA-3 uses Node's built-in `crypto` (no install needed). Keccak needs
`@noble/hashes` (installed via `npm install`).

## Usage

```ts
import { hashString, hashFile, verifyHash, toBytes32, keccak256 } from './src/index.ts'

// Hash a document's bytes / text
const hex = hashString('document contents') // sha3-256 by default

// Hash a file
const fileHash = await hashFile('/path/to/noc.pdf', { algorithm: 'sha3-256' })

// Verify against an on-chain record (EVM uses keccak-256)
const onChain = keccak256('document contents')
const ok = verifyHash('document contents', onChain, { algorithm: 'keccak-256' })

// Convert to bytes32 for the contract
const bytes32 = toBytes32(onChain)
```

## CLI

```bash
# stdin
echo -n "abc" | node src/cli.ts

# file(s)
node src/cli.ts ./doc.pdf --alg=keccak-256
```

## Tests

```bash
npm install
npm test        # node --test
npm run typecheck
```

## Integration (backend)

When a document is uploaded, compute its hash and pass the `bytes32` digest to
`SurakshaSetu.register(bytes32 docHash)`. For EVM matching, hash with
`keccak-256`; for the project's stated SHA-3, use `sha3-256`.
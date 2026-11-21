import { keccak_256 } from '@noble/hashes/sha3.js'

/**
 * Keccak-256 (EVM) hash of document bytes, returned as a 0x-prefixed bytes32
 * hex string — the exact shape SurakshaSetu.register(bytes32 docHash) accepts.
 *
 * Keccak-256 is Ethereum's native hash (Solidity `keccak256`, `ethers.keccak256`),
 * so this matches on-chain records. Do not substitute NIST SHA-3 here.
 */
export function hashToBytes32(data: Uint8Array): string {
  return `0x${Buffer.from(keccak_256(data)).toString('hex')}`
}

/**
 * SHA-3 document hasher for Suraksha Setu.
 *
 * Documents are hashed (NOT encrypted) with SHA-3 before being recorded on-chain.
 * The resulting digest is what gets stored as `bytes32 docHash` in the contract.
 *
 * Two families are supported:
 *   - NIST SHA-3 (sha3-224/256/384/512) via Node's built-in crypto (no deps).
 *   - Keccak (keccak-224/256/384/512) via @noble/hashes, used to match EVM's
 *     keccak256 (Solidity) when verifying documents against on-chain records.
 *
 * Note: SHA-3 is a one-way hash. "Encrypting" in the issue title refers to
 * hashing the document for integrity/verification on the blockchain.
 */

import { createHash, timingSafeEqual } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

// @noble/hashes is optional: required only for Keccak (EVM) support.
let nobleSha3: Record<string, (data: Uint8Array) => Uint8Array> | null = null
try {
  nobleSha3 = require('@noble/hashes/sha3.js') as Record<string, (data: Uint8Array) => Uint8Array>
} catch {
  nobleSha3 = null
}

export type HashAlgorithm =
  | 'sha3-224' | 'sha3-256' | 'sha3-384' | 'sha3-512'
  | 'keccak-224' | 'keccak-256' | 'keccak-384' | 'keccak-512'

export const SHA3_ALGORITHMS: readonly HashAlgorithm[] = [
  'sha3-224', 'sha3-256', 'sha3-384', 'sha3-512',
  'keccak-224', 'keccak-256', 'keccak-384', 'keccak-512',
] as const

/** Default algorithm for document hashing. NIST SHA-3-256 per project spec. */
export const DEFAULT_ALGORITHM: HashAlgorithm = 'sha3-256'

export type HashOutput = 'hex' | 'bytes'

export interface HashOptions {
  /** Hash algorithm. Defaults to sha3-256. */
  algorithm?: HashAlgorithm | string
  /** Output format. Defaults to 'hex'. */
  output?: HashOutput
  /** Prefix hex output with 0x. Defaults to false. */
  prefix0x?: boolean
}

export function normalizeAlgorithm(input: HashAlgorithm | string | undefined): HashAlgorithm {
  if (!input) return DEFAULT_ALGORITHM
  const v = String(input).toLowerCase().replace(/[\s_]/g, '-')
  const aliases: Record<string, HashAlgorithm> = {
    'sha3-224': 'sha3-224', 'sha3224': 'sha3-224', 'sha3.224': 'sha3-224',
    'sha3-256': 'sha3-256', 'sha3256': 'sha3-256', 'sha3.256': 'sha3-256',
    'sha3-384': 'sha3-384', 'sha3384': 'sha3-384', 'sha3.384': 'sha3-384',
    'sha3-512': 'sha3-512', 'sha3512': 'sha3-512', 'sha3.512': 'sha3-512',
    'keccak-224': 'keccak-224', 'keccak224': 'keccak-224',
    'keccak-256': 'keccak-256', 'keccak256': 'keccak-256',
    'keccak-384': 'keccak-384', 'keccak384': 'keccak-384',
    'keccak-512': 'keccak-512', 'keccak512': 'keccak-512',
  }
  const resolved = aliases[v]
  if (!resolved) {
    throw new Error(`Unsupported hash algorithm: ${input}. Supported: ${SHA3_ALGORITHMS.join(', ')}`)
  }
  return resolved
}

function isKeccak(alg: HashAlgorithm): boolean {
  return alg.startsWith('keccak')
}

function hashRaw(data: Uint8Array, alg: HashAlgorithm): Uint8Array {
  if (isKeccak(alg)) {
    if (!nobleSha3) {
      throw new Error(
        `Keccak (${alg}) requires @noble/hashes. Install it: cd hasher && npm install @noble/hashes`,
      )
    }
    const fnName = alg.replace('-', '_') // keccak_256
    const fn = nobleSha3[fnName]
    if (typeof fn !== 'function') {
      throw new Error(`@noble/hashes does not provide ${fnName}`)
    }
    return fn(data)
  }
  // NIST SHA-3 via Node crypto (algorithm name matches: sha3-256 etc.)
  const h = createHash(alg)
  h.update(data)
  return new Uint8Array(h.digest())
}

/**
 * Hash raw bytes.
 */
export function hashBytes(data: Uint8Array | Buffer, options: HashOptions = {}): string | Uint8Array {
  const alg = normalizeAlgorithm(options.algorithm)
  const digest = hashRaw(data instanceof Buffer ? new Uint8Array(data) : data, alg)
  if (options.output === 'bytes') return digest
  const hex = Buffer.from(digest).toString('hex')
  return options.prefix0x ? `0x${hex}` : hex
}

/**
 * Hash a UTF-8 string.
 */
export function hashString(value: string, options: HashOptions = {}): string | Uint8Array {
  return hashBytes(new TextEncoder().encode(value), options)
}

/**
 * Hash a JSON-serializable value (canonical-ish via JSON.stringify).
 */
export function hashObject(value: unknown, options: HashOptions = {}): string | Uint8Array {
  return hashString(JSON.stringify(value), options)
}

/**
 * Hash a file synchronously.
 */
export function hashFileSync(filePath: string, options: HashOptions = {}): string | Uint8Array {
  const buf = readFileSync(filePath)
  return hashBytes(new Uint8Array(buf), options)
}

/**
 * Hash a file asynchronously.
 */
export async function hashFile(filePath: string, options: HashOptions = {}): Promise<string | Uint8Array> {
  const { readFile } = await import('node:fs/promises')
  const buf = await readFile(filePath)
  return hashBytes(new Uint8Array(buf), options)
}

/**
 * Hash a readable stream (collects chunks, then hashes).
 */
export async function hashStream(
  stream: AsyncIterable<Uint8Array | Buffer | string>,
  options: HashOptions = {},
): Promise<string | Uint8Array> {
  const chunks: Buffer[] = []
  for await (const chunk of stream) {
    if (typeof chunk === 'string') chunks.push(Buffer.from(chunk))
    else if (Buffer.isBuffer(chunk)) chunks.push(chunk)
    else chunks.push(Buffer.from(chunk))
  }
  return hashBytes(new Uint8Array(Buffer.concat(chunks)), options)
}

/**
 * Constant-time comparison of a computed hash against an expected hash.
 * Accepts optional 0x prefix on the expected value.
 */
export function verifyHash(
  data: string | Uint8Array | Buffer,
  expectedHash: string,
  options: HashOptions = {},
): boolean {
  const computed = typeof data === 'string'
    ? hashString(data, { ...options, output: 'hex' })
    : hashBytes(data as Uint8Array, { ...options, output: 'hex' })
  const a = String(computed).replace(/^0x/i, '').toLowerCase()
  const b = String(expectedHash).replace(/^0x/i, '').toLowerCase()
  if (a.length !== b.length || !/^[0-9a-f]+$/.test(a) || !/^[0-9a-f]+$/.test(b)) {
    return false
  }
  try {
    return timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'))
  } catch {
    return false
  }
}

/**
 * Convert a hex hash to a 0x-prefixed 32-byte (bytes32) value for EVM.
 */
export function toBytes32(hash: string): string {
  const h = String(hash).replace(/^0x/i, '')
  if (h.length !== 64 || !/^[0-9a-fA-F]+$/.test(h)) {
    throw new Error(`Expected a 32-byte (64 hex char) hash, got length ${h.length}`)
  }
  return `0x${h.toLowerCase()}`
}

// Convenience: EVM-compatible Keccak-256 (matches Solidity keccak256 / ethers.keccak256)
export function keccak256(value: string | Uint8Array | Buffer, options: Omit<HashOptions, 'algorithm'> = {}): string | Uint8Array {
  const input = typeof value === 'string' ? value : value
  if (typeof value === 'string') {
    return hashString(value, { ...options, algorithm: 'keccak-256' })
  }
  return hashBytes(value as Uint8Array, { ...options, algorithm: 'keccak-256' })
}

// Convenience: NIST SHA-3-256
export function sha3_256(value: string | Uint8Array | Buffer, options: Omit<HashOptions, 'algorithm'> = {}): string | Uint8Array {
  if (typeof value === 'string') {
    return hashString(value, { ...options, algorithm: 'sha3-256' })
  }
  return hashBytes(value as Uint8Array, { ...options, algorithm: 'sha3-256' })
}

export default {
  hashBytes,
  hashString,
  hashObject,
  hashFileSync,
  hashFile,
  hashStream,
  verifyHash,
  toBytes32,
  keccak256,
  sha3_256,
  DEFAULT_ALGORITHM,
  SHA3_ALGORITHMS,
}
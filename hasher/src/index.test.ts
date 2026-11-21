import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  hashString,
  hashBytes,
  hashObject,
  hashFileSync,
  hashFile,
  hashStream,
  verifyHash,
  toBytes32,
  keccak256,
  sha3_256,
  normalizeAlgorithm,
} from './index.ts'

test('sha3-256 empty string known vector', () => {
  const h = hashString('', { algorithm: 'sha3-256' }) as string
  assert.equal(h, 'a7ffc6f8bf1ed76651c14756a061d662f580ff4de43b49fa82d80a4b80f8434a')
})

test('sha3-256 "abc" known vector', () => {
  const h = hashString('abc', { algorithm: 'sha3-256' }) as string
  assert.equal(h, '3a985da74fe225b2045c172d6bd390bd855f086e3e9d525b46bfe24511431532')
})

test('keccak-256 empty string known vector (EVM)', () => {
  const h = hashString('', { algorithm: 'keccak-256' }) as string
  assert.equal(h, 'c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470')
})

test('keccak-256 "abc"', () => {
  const h = hashString('abc', { algorithm: 'keccak-256' }) as string
  assert.equal(h, '4e03657aea45a94fc7d47ba826c8d667c0d1e6e33a64a036ec44f58fa12d6c45')
})

test('sha3-224/384/512 and keccak variants run', () => {
  for (const alg of ['sha3-224','sha3-384','sha3-512','keccak-224','keccak-384','keccak-512']) {
    const h = hashString('doc', { algorithm: alg }) as string
    assert.ok(/^[0-9a-f]+$/.test(h), alg)
  }
})

test('output bytes and 0x prefix', () => {
  const b = hashString('doc', { algorithm: 'sha3-256', output: 'bytes' }) as Uint8Array
  assert.ok(b instanceof Uint8Array)
  assert.equal(b.length, 32)
  const hex = hashString('doc', { algorithm: 'sha3-256', prefix0x: true }) as string
  assert.ok(hex.startsWith('0x'))
})

test('hashBytes works', () => {
  const h = hashBytes(new TextEncoder().encode('abc'), { algorithm: 'sha3-256' }) as string
  assert.equal(h, '3a985da74fe225b2045c172d6bd390bd855f086e3e9d525b46bfe24511431532')
})

test('hashObject canonicalizes via JSON.stringify', () => {
  const h1 = hashObject({ a: 1, b: 2 }, { algorithm: 'sha3-256' }) as string
  const h2 = hashString(JSON.stringify({ a: 1, b: 2 }), { algorithm: 'sha3-256' }) as string
  assert.equal(h1, h2)
})

test('hashFile and hashFileSync', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'hasher-'))
  const p = join(dir, 'doc.txt')
  writeFileSync(p, 'hello blockchain')
  try {
    const sync = hashFileSync(p, { algorithm: 'sha3-256' }) as string
    const asyncR = await hashFile(p, { algorithm: 'sha3-256' })
    assert.equal(sync, asyncR)
    const stream = (await import('node:fs')).createReadStream(p)
    const s = await hashStream(stream, { algorithm: 'sha3-256' })
    assert.equal(sync, s)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('verifyHash true/false and 0x handling', () => {
  const h = hashString('doc', { algorithm: 'sha3-256' }) as string
  assert.equal(verifyHash('doc', h, { algorithm: 'sha3-256' }), true)
  assert.equal(verifyHash('doc', '0x' + h, { algorithm: 'sha3-256' }), true)
  assert.equal(verifyHash('tampered', h, { algorithm: 'sha3-256' }), false)
})

test('toBytes32', () => {
  const h = hashString('doc', { algorithm: 'keccak-256', prefix0x: true }) as string
  const b = toBytes32(h)
  assert.ok(b.startsWith('0x'))
  assert.equal(b.length, 66)
})

test('convenience keccak256/sha3_256', () => {
  assert.equal(keccak256('abc'), hashString('abc', { algorithm: 'keccak-256' }))
  assert.equal(sha3_256('abc'), hashString('abc', { algorithm: 'sha3-256' }))
})

test('normalizeAlgorithm aliases', () => {
  assert.equal(normalizeAlgorithm('sha3_256'), 'sha3-256')
  assert.equal(normalizeAlgorithm('keccak256'), 'keccak-256')
  assert.equal(normalizeAlgorithm('SHA3-256'), 'sha3-256')
})

test('invalid algorithm throws', () => {
  assert.throws(() => hashString('x', { algorithm: 'md5' }))
})
import test from 'node:test'
import assert from 'node:assert/strict'
import { hashToBytes32 } from './hash.js'

test('keccak-256 of empty input matches EVM vector', () => {
  assert.equal(
    hashToBytes32(new Uint8Array(0)),
    '0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470',
  )
})

test('keccak-256 of "abc" matches ethers.keccak256 vector', () => {
  assert.equal(
    hashToBytes32(new TextEncoder().encode('abc')),
    '0x4e03657aea45a94fc7d47ba826c8d667c0d1e6e33a64a036ec44f58fa12d6c45',
  )
})

test('changing one byte changes the digest', () => {
  const a = hashToBytes32(new TextEncoder().encode('abc'))
  const b = hashToBytes32(new TextEncoder().encode('abd'))
  assert.notEqual(a, b)
})

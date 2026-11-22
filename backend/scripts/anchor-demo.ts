import { readFileSync } from 'node:fs'
import { sha3Hash } from '../src/utils.js'
import { registerHash, verifyHash, getRecord } from '../src/blockchain.js'

const usage = 'Usage: npm run anchor:demo -- <file-path | 0x-hex-hash> [--read] [--verify]'

async function main() {
  const args = process.argv.slice(2)
  const input = args.find(a => !a.startsWith('--'))
  const mode = args.includes('--read') ? 'read' : args.includes('--verify') ? 'verify' : 'register'

  if (!input) {
    console.error(usage)
    process.exit(1)
  }

  const hash = input.startsWith('0x') ? input : sha3Hash(readFileSync(input))
  if (!input.startsWith('0x')) console.log('SHA3-256:', hash)

  if (mode === 'read') {
    console.log('On-chain record:', await getRecord(hash))
    return
  }
  const txHash = mode === 'verify' ? await verifyHash(hash) : await registerHash(hash)
  console.log(`${mode === 'verify' ? 'Verified' : 'Registered'}. txHash:`, txHash)
}

main().catch((e: any) => {
  console.error('Anchor failed:', e?.shortMessage || e?.message || e)
  process.exitCode = 1
})

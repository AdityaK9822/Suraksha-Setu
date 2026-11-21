#!/usr/bin/env node
import { createReadStream } from 'node:fs'
import { hashFileSync, hashStream } from './index.ts'

async function main() {
  const args = process.argv.slice(2)
  const algFlag = args.find((a) => a.startsWith('--alg='))
  const algorithm = algFlag ? algFlag.slice('--alg='.length) : undefined
  const files = args.filter((a) => !a.startsWith('--'))
  const opts = { algorithm, output: 'hex' as const }

  if (files.length === 0) {
    // read stdin
    const digest = await hashStream(process.stdin, opts)
    process.stdout.write(String(digest) + '\n')
    return
  }
  for (const f of files) {
    const digest = f === '-' ? await hashStream(process.stdin, opts) : hashFileSync(f, opts)
    process.stdout.write(`${digest}  ${f}\n`)
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
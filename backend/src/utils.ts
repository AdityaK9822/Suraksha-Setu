import { createHash, randomBytes } from 'node:crypto'
import type { Request } from 'express'

export function cuid(): string {
  return 'c' + Date.now().toString(36) + randomBytes(6).toString('hex')
}

export function genId(prefix: string): string {
  const rand = randomBytes(3).toString('hex').toUpperCase()
  return `${prefix}-${rand}`
}

/**
 * Compute NIST SHA3-256 hex digest (0x-prefixed) for uploaded documents
 * in accordance with Suraksha Setu's SHA-3 specification.
 */
export function sha3Hash(buf: Buffer | Uint8Array | string): string {
  const h = createHash('sha3-256')
  h.update(buf)
  return '0x' + h.digest('hex')
}

export interface ParsedMultipartFile {
  fieldname: string
  originalname: string
  mimetype: string
  buffer: Buffer
  size: number
}

/**
 * Lightweight zero-dependency multipart/form-data parser for Express requests.
 * Supports single/multiple fields and binary file uploads up to maxBytes.
 */
export async function parseMultipartRequest(
  req: Request,
  maxBytes = 12 * 1024 * 1024
): Promise<{ fields: Record<string, string>; file?: ParsedMultipartFile }> {
  const contentType = req.headers['content-type'] || ''
  const match = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i)
  if (!match) {
    throw new Error('Missing multipart boundary')
  }
  const boundary = match[1] || match[2]

  const chunks: Buffer[] = []
  let total = 0
  for await (const chunk of req) {
    const b = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    total += b.length
    if (total > maxBytes) {
      const err: any = new Error('File exceeds maximum allowed size of 10 MB')
      err.code = 'LIMIT_FILE_SIZE'
      throw err
    }
    chunks.push(b)
  }
  const raw = Buffer.concat(chunks)
  const boundaryBuf = Buffer.from(`--${boundary}`)
  const fields: Record<string, string> = {}
  let parsedFile: ParsedMultipartFile | undefined

  let pos = raw.indexOf(boundaryBuf)
  while (pos !== -1) {
    const start = pos + boundaryBuf.length
    if (raw.subarray(start, start + 2).equals(Buffer.from('--'))) {
      break
    }
    const nextPos = raw.indexOf(boundaryBuf, start)
    if (nextPos === -1) break

    // Trim leading CRLF and trailing CRLF before next boundary
    let part = raw.subarray(start, nextPos)
    if (part.subarray(0, 2).equals(Buffer.from('\r\n'))) {
      part = part.subarray(2)
    }
    if (part.subarray(part.length - 2).equals(Buffer.from('\r\n'))) {
      part = part.subarray(0, part.length - 2)
    }

    const headerEnd = part.indexOf(Buffer.from('\r\n\r\n'))
    if (headerEnd !== -1) {
      const headerText = part.subarray(0, headerEnd).toString('utf8')
      const bodyBuf = part.subarray(headerEnd + 4)

      const nameMatch = headerText.match(/name="([^"]+)"/i)
      const filenameMatch = headerText.match(/filename="([^"]*)"/i)
      const typeMatch = headerText.match(/Content-Type:\s*([^\r\n]+)/i)

      const fieldname = nameMatch ? nameMatch[1] : ''
      if (filenameMatch) {
        parsedFile = {
          fieldname,
          originalname: filenameMatch[1] || 'document.pdf',
          mimetype: typeMatch ? typeMatch[1].trim().toLowerCase() : 'application/octet-stream',
          buffer: bodyBuf,
          size: bodyBuf.length
        }
      } else if (fieldname) {
        fields[fieldname] = bodyBuf.toString('utf8')
      }
    }
    pos = nextPos
  }

  return { fields, file: parsedFile }
}

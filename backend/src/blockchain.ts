import { ethers } from 'ethers'

// Minimal ABI for the SurakshaSetu registry. Kept inline so this module has no
// cross-directory dependency on the contracts/artifacts build output.
// `records` is the auto-generated getter for `mapping(bytes32 => Record) public records`
// and returns every struct field (none are mappings/arrays).
const ABI = [
  'function register(bytes32 docHash)',
  'function verify(bytes32 docHash)',
  'function records(bytes32) view returns (bytes32 docHash, address uploader, address verifier, bool verified, uint256 timestamp)'
]

let contract: ethers.Contract | null = null

function getContract(): ethers.Contract {
  if (contract) return contract
  const rpcUrl = process.env.RPC_URL || 'http://127.0.0.1:8545'
  const privateKey = process.env.PRIVATE_KEY
  const address = process.env.CONTRACT_ADDRESS
  if (!privateKey) throw new Error('PRIVATE_KEY is not set')
  if (!address) throw new Error('CONTRACT_ADDRESS is not set')
  const provider = new ethers.JsonRpcProvider(rpcUrl)
  const wallet = new ethers.Wallet(privateKey, provider)
  contract = new ethers.Contract(address, ABI, wallet)
  return contract
}

export interface DocumentRecord {
  docHash: string
  uploader: string
  verifier: string
  verified: boolean
  timestamp: number
}

/** Register a 0x-prefixed SHA3-256 digest on-chain. Returns the transaction hash. */
export async function registerHash(hash: string): Promise<string> {
  const tx = await getContract().register(hash)
  const receipt = await tx.wait()
  return receipt!.hash
}

/** Mark a registered hash as verified. Admin (deployer) only. Returns the tx hash. */
export async function verifyHash(hash: string): Promise<string> {
  const tx = await getContract().verify(hash)
  const receipt = await tx.wait()
  return receipt!.hash
}

/** Read the on-chain record for a hash. */
export async function getRecord(hash: string): Promise<DocumentRecord> {
  const r = await getContract().records(hash)
  return {
    docHash: r[0],
    uploader: r[1],
    verifier: r[2],
    verified: r[3],
    timestamp: Number(r[4])
  }
}

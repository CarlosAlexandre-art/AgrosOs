import { ethers } from 'ethers'
import ABI from '@/lib/abi/AgroTokenRegistry.json'

const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY
const CONTRACT_ADDRESS = process.env.BLOCKCHAIN_CONTRACT_ADDRESS
const MINTER_KEY = process.env.BLOCKCHAIN_MINTER_KEY
const NETWORK = process.env.BLOCKCHAIN_NETWORK ?? 'polygon' // 'polygon' | 'amoy'

// UUID string → uint256 (128-bit UUID cabe perfeitamente em uint256)
export function uuidToTokenId(uuid: string): bigint {
  const hex = uuid.replace(/-/g, '')
  return BigInt('0x' + hex)
}

export function isBlockchainConfigured(): boolean {
  return !!(ALCHEMY_API_KEY && CONTRACT_ADDRESS && MINTER_KEY)
}

function getRpcUrl(): string {
  if (NETWORK === 'amoy') {
    return `https://polygon-amoy.g.alchemy.com/v2/${ALCHEMY_API_KEY}`
  }
  return `https://polygon-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`
}

export function getPolygonScanUrl(txHash: string): string {
  const base = NETWORK === 'amoy' ? 'https://amoy.polygonscan.com' : 'https://polygonscan.com'
  return `${base}/tx/${txHash}`
}

function getProvider() {
  return new ethers.JsonRpcProvider(getRpcUrl())
}

function getMinterWallet() {
  return new ethers.Wallet(MINTER_KEY!, getProvider())
}

function getContract(signer?: ethers.Signer) {
  return new ethers.Contract(CONTRACT_ADDRESS!, ABI, signer ?? getProvider())
}

export async function mintToken(params: {
  dbId: string          // UUID do AgroToken no banco
  totalTokens: number   // quantidade total a mintar
  metadataHash: string  // hash IPFS ou identificador off-chain
  toAddress: string     // wallet da plataforma (custodial)
}): Promise<string> {
  const wallet = getMinterWallet()
  const contract = getContract(wallet)
  const tokenId = uuidToTokenId(params.dbId)

  const tx = await contract.mint(
    params.toAddress,
    tokenId,
    params.totalTokens,
    params.metadataHash
  )
  const receipt = await tx.wait()
  return receipt.hash
}

export async function burnToken(params: {
  dbId: string
  amount: number
  fromAddress: string
}): Promise<string> {
  const wallet = getMinterWallet()
  const contract = getContract(wallet)
  const tokenId = uuidToTokenId(params.dbId)

  const tx = await contract.burn(params.fromAddress, tokenId, params.amount)
  const receipt = await tx.wait()
  return receipt.hash
}

export async function recordPurchaseOnChain(params: {
  dbId: string
  buyerAddress: string
  quantity: number
  totalAmountBRL: number
}): Promise<string> {
  const wallet = getMinterWallet()
  const contract = getContract(wallet)
  const tokenId = uuidToTokenId(params.dbId)
  // totalAmount em centavos (uint256 não suporta decimais)
  const totalCents = Math.round(params.totalAmountBRL * 100)

  const tx = await contract.recordPurchase(
    tokenId,
    params.buyerAddress,
    params.quantity,
    totalCents
  )
  const receipt = await tx.wait()
  return receipt.hash
}

export async function getTokenOnChainStatus(dbId: string): Promise<{
  supply: number
  metadata: string
} | null> {
  try {
    const contract = getContract()
    const tokenId = uuidToTokenId(dbId)
    const [supply, metadata] = await Promise.all([
      contract.tokenSupply(tokenId),
      contract.tokenMetadata(tokenId),
    ])
    return { supply: Number(supply), metadata: String(metadata) }
  } catch {
    return null
  }
}

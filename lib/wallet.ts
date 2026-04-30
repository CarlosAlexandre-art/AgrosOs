import { createHmac } from 'crypto'
import { ethers } from 'ethers'
import { getPolygonScanUrl } from './blockchain'

const RPC_URL = `https://polygon-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`

export function getProvider() {
  return new ethers.JsonRpcProvider(RPC_URL)
}

// Deriva deterministicamente uma wallet Polygon a partir do userId do usuário.
// Mesmo userId sempre gera o mesmo endereço — carteira invisível sem seed phrase.
export function deriveUserWallet(userId: string): ethers.Wallet {
  const secret = process.env.WALLET_MASTER_SECRET!
  const seed = createHmac('sha256', secret).update(userId).digest('hex')
  return new ethers.Wallet('0x' + seed, getProvider())
}

export function deriveUserAddress(userId: string): string {
  const secret = process.env.WALLET_MASTER_SECRET!
  const seed = createHmac('sha256', secret).update(userId).digest('hex')
  return new ethers.Wallet('0x' + seed).address
}

const TRANSFER_ABI = [
  'function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes calldata data) external',
  'function addToWhitelist(address account) external',
  'function whitelisted(address account) view returns (bool)',
]

function getPlatformWallet() {
  return new ethers.Wallet(process.env.BLOCKCHAIN_MINTER_KEY!, getProvider())
}

function getRegistryContract(signer: ethers.Signer) {
  return new ethers.Contract(process.env.BLOCKCHAIN_CONTRACT_ADDRESS!, TRANSFER_ABI, signer)
}

// Converte UUID para tokenId on-chain (mesmo algoritmo do lib/blockchain.ts)
function uuidToTokenId(uuid: string): bigint {
  return BigInt('0x' + uuid.replace(/-/g, ''))
}

export async function transferTokensToInvestor(params: {
  buyerUserId: string
  agroTokenId: string   // UUID do AgroToken no banco
  quantity: number
}): Promise<{ txHash: string; explorerUrl: string } | null> {
  if (!process.env.BLOCKCHAIN_CONTRACT_ADDRESS || !process.env.BLOCKCHAIN_MINTER_KEY || !process.env.WALLET_MASTER_SECRET) {
    return null
  }

  const platform = getPlatformWallet()
  const registry = getRegistryContract(platform)
  const investorAddress = deriveUserAddress(params.buyerUserId)
  const tokenId = uuidToTokenId(params.agroTokenId)

  // Whitelist o investidor se ainda não estiver
  const isWhitelisted: boolean = await registry.whitelisted(investorAddress)
  if (!isWhitelisted) {
    const wlTx = await registry.addToWhitelist(investorAddress)
    await wlTx.wait()
  }

  // Transfere os tokens da plataforma para o investidor
  const tx = await registry.safeTransferFrom(
    process.env.BLOCKCHAIN_PLATFORM_ADDRESS!,
    investorAddress,
    tokenId,
    params.quantity,
    '0x'
  )
  const receipt = await tx.wait()

  return {
    txHash: receipt.hash,
    explorerUrl: getPolygonScanUrl(receipt.hash),
  }
}

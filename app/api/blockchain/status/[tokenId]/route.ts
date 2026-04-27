import { NextResponse } from 'next/server'
import { getTokenOnChainStatus, isBlockchainConfigured, uuidToTokenId } from '@/lib/blockchain'

export async function GET(_req: Request, { params }: { params: Promise<{ tokenId: string }> }) {
  const { tokenId } = await params

  if (!isBlockchainConfigured()) {
    return NextResponse.json({ configured: false })
  }

  const status = await getTokenOnChainStatus(tokenId)
  if (!status) {
    return NextResponse.json({ configured: true, minted: false })
  }

  return NextResponse.json({
    configured: true,
    minted: status.supply > 0,
    supply: status.supply,
    metadata: status.metadata,
    onChainId: uuidToTokenId(tokenId).toString(),
  })
}

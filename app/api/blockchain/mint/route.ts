import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { mintToken, isBlockchainConfigured, getPolygonScanUrl } from '@/lib/blockchain'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = await prisma.user.findUnique({ where: { supabaseId: user.id }, select: { role: true } })
  if (admin?.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { tokenId } = await request.json()
  const token = await prisma.agroToken.findUnique({ where: { id: tokenId }, select: { id: true, totalTokens: true, title: true, blockchainTx: true } })
  if (!token) return NextResponse.json({ error: 'Token não encontrado' }, { status: 404 })
  if (token.blockchainTx) return NextResponse.json({ error: 'Token já mintado na blockchain' }, { status: 409 })

  if (!isBlockchainConfigured()) {
    return NextResponse.json({ error: 'Blockchain não configurada (ALCHEMY_API_KEY, BLOCKCHAIN_CONTRACT_ADDRESS, BLOCKCHAIN_MINTER_KEY)' }, { status: 503 })
  }

  const platformAddress = process.env.BLOCKCHAIN_PLATFORM_ADDRESS!
  const txHash = await mintToken({
    dbId: token.id,
    totalTokens: token.totalTokens,
    metadataHash: `agrotoken:${token.id}`,
    toAddress: platformAddress,
  })

  await prisma.agroToken.update({
    where: { id: tokenId },
    data: { blockchainTx: txHash },
  })

  return NextResponse.json({
    txHash,
    explorerUrl: getPolygonScanUrl(txHash),
  })
}

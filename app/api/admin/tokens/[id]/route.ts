import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { mintToken, isBlockchainConfigured, getPolygonScanUrl } from '@/lib/blockchain'

const ORIGINACAO_RATE = 0.02

async function assertAdmin(supabaseId: string) {
  const u = await prisma.user.findUnique({ where: { supabaseId }, select: { role: true, id: true } })
  return u?.role === 'ADMIN' ? u : null
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = await assertAdmin(user.id)
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { action } = await request.json() // 'approve' | 'reject'
  const token = await prisma.agroToken.findUnique({ where: { id } })
  if (!token) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (action === 'approve') {
    const originacaoFee = Number(token.totalValue) * ORIGINACAO_RATE
    const updated = await prisma.agroToken.update({
      where: { id },
      data: {
        status: 'ACTIVE',
        originacaoFee,
        transactions: {
          create: {
            buyerId: admin.id,
            quantity: 0,
            pricePerToken: 0,
            totalAmount: originacaoFee,
            commission: originacaoFee,
            type: 'ORIGINACAO',
          },
        },
      },
    })

    // Minta na Polygon se a blockchain estiver configurada (falha silenciosa)
    if (isBlockchainConfigured() && process.env.BLOCKCHAIN_PLATFORM_ADDRESS) {
      try {
        const txHash = await mintToken({
          dbId: id,
          totalTokens: token.totalTokens,
          metadataHash: `agrotoken:${id}`,
          toAddress: process.env.BLOCKCHAIN_PLATFORM_ADDRESS,
        })
        await prisma.agroToken.update({
          where: { id },
          data: { blockchainTx: txHash },
        })
        return NextResponse.json({ ...updated, blockchainTx: txHash, explorerUrl: getPolygonScanUrl(txHash) })
      } catch (err) {
        console.error('[blockchain] mint failed (token aprovado no DB):', err)
      }
    }

    return NextResponse.json(updated)
  }

  if (action === 'reject') {
    const updated = await prisma.agroToken.update({ where: { id }, data: { status: 'CANCELLED' } })
    return NextResponse.json(updated)
  }

  return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
}

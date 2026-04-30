import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const [activeTokens, transactions, totalTokensRow] = await Promise.all([
    prisma.agroToken.count({ where: { status: 'ACTIVE' } }),
    prisma.tokenTransaction.aggregate({ _sum: { totalAmount: true }, _count: { buyerId: true } }),
    prisma.agroToken.aggregate({ _sum: { soldTokens: true } }),
  ])

  const uniqueBuyers = await prisma.tokenTransaction.groupBy({ by: ['buyerId'] })

  return NextResponse.json({
    activeTokens,
    totalValue: Number(transactions._sum.totalAmount ?? 0),
    investors: uniqueBuyers.length,
    totalTokens: Number(totalTokensRow._sum.soldTokens ?? 0),
  })
}

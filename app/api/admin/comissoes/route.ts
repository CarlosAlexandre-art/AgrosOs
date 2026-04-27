import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id }, select: { role: true } })
  if (dbUser?.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const transactions = await prisma.tokenTransaction.findMany({
    orderBy: { createdAt: 'desc' },
    include: { token: { select: { title: true, type: true } }, buyer: { select: { name: true } } },
  })

  const totalBuy = transactions.filter(t => t.type === 'BUY').reduce((s, t) => s + Number(t.commission), 0)
  const totalOriginacao = transactions.filter(t => t.type === 'ORIGINACAO').reduce((s, t) => s + Number(t.commission), 0)
  const totalSucesso = transactions.filter(t => t.type === 'SUCESSO').reduce((s, t) => s + Number(t.commission), 0)
  const totalGeral = totalBuy + totalOriginacao + totalSucesso

  const tokensAtivos = await prisma.agroToken.count({ where: { status: 'ACTIVE' } })
  const tokensPendentes = await prisma.agroToken.count({ where: { status: 'PENDING_REVIEW' } })
  const volumeTotal = await prisma.agroToken.aggregate({ where: { status: { in: ['ACTIVE', 'REDEEMED'] } }, _sum: { totalValue: true } })

  return NextResponse.json({
    totalBuy,
    totalOriginacao,
    totalSucesso,
    totalGeral,
    tokensAtivos,
    tokensPendentes,
    volumeTotal: Number(volumeTotal._sum.totalValue ?? 0),
    transactions: transactions.slice(0, 50),
  })
}

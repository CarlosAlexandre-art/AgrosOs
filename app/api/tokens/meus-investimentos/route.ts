import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } })
  if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const transactions = await prisma.tokenTransaction.findMany({
    where: { buyerId: dbUser.id, type: 'BUY' },
    orderBy: { createdAt: 'desc' },
    include: {
      token: {
        select: {
          id: true, title: true, type: true, status: true,
          expectedReturn: true, periodMonths: true, deliveryDate: true,
          tokenPrice: true, totalTokens: true, soldTokens: true,
          property: { select: { name: true } },
        },
      },
    },
  })

  const totalInvestido = transactions.reduce((s, t) => s + Number(t.totalAmount), 0)
  const totalTokens = transactions.reduce((s, t) => s + t.quantity, 0)
  const ativos = transactions.filter(t => t.token.status === 'ACTIVE').length
  const resgatados = transactions.filter(t => t.token.status === 'REDEEMED').length

  return NextResponse.json({ transactions, totalInvestido, totalTokens, ativos, resgatados })
}

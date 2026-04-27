import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } })
  if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  // Only token owner or the buyer can see transactions
  const token = await prisma.agroToken.findFirst({
    where: { id, property: { userId: dbUser.id } },
  })

  const transactions = await prisma.tokenTransaction.findMany({
    where: token ? { tokenId: id } : { tokenId: id, buyerId: dbUser.id },
    orderBy: { createdAt: 'desc' },
    include: { buyer: { select: { name: true, email: true } } },
  })

  const totalCommission = transactions.reduce((sum, t) => sum + Number(t.commission), 0)

  return NextResponse.json({ transactions, totalCommission })
}

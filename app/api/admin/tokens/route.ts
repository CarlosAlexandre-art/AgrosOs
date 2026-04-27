import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

async function assertAdmin(supabaseId: string) {
  const u = await prisma.user.findUnique({ where: { supabaseId }, select: { role: true } })
  return u?.role === 'ADMIN'
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!(await assertAdmin(user.id))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const tokens = await prisma.agroToken.findMany({
    where: { status: { in: ['PENDING_REVIEW', 'ACTIVE', 'REDEEMED', 'CANCELLED'] } },
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    include: {
      property: { select: { name: true, user: { select: { name: true, email: true, cpf: true, kycVerified: true } } } },
      _count: { select: { transactions: true } },
    },
  })
  return NextResponse.json(tokens)
}

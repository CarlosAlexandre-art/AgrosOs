import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const tokens = await prisma.agroToken.findMany({
    where: { status: 'ACTIVE' },
    orderBy: { createdAt: 'desc' },
    include: {
      property: { select: { name: true, location: true } },
    },
  })

  return NextResponse.json(tokens)
}

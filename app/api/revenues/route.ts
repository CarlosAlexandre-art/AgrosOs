import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: { properties: { include: { revenues: { orderBy: { date: 'desc' } } } } },
  })
  const revenues = dbUser?.properties.flatMap((p: any) => p.revenues) || []
  return NextResponse.json(revenues)
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { propertyId, amount, category, description, date } = await req.json()
  if (!propertyId || !amount) return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 })

  const revenue = await prisma.revenue.create({
    data: {
      propertyId,
      amount,
      category: category || 'VENDA',
      description: description || null,
      date: date ? new Date(date) : new Date(),
    },
  })
  return NextResponse.json(revenue, { status: 201 })
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

async function getPropertyId(supabaseId: string) {
  const user = await prisma.user.findUnique({
    where: { supabaseId },
    include: { properties: { take: 1, select: { id: true } } },
  })
  return user?.properties[0]?.id ?? null
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const propertyId = await getPropertyId(user.id)
  if (!propertyId) return NextResponse.json([])

  try {
    const records = await prisma.energyRecord.findMany({
      where: { propertyId },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    })
    return NextResponse.json(records)
  } catch {
    return NextResponse.json([])
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const propertyId = await getPropertyId(user.id)
  if (!propertyId) return NextResponse.json({ error: 'Propriedade não encontrada' }, { status: 404 })

  const body = await req.json()
  const { month, year, source, consumption, production, cost, notes } = body

  const record = await prisma.energyRecord.upsert({
    where: { propertyId_month_year: { propertyId, month, year } },
    create: { propertyId, month, year, source, consumption: consumption ?? 0, production: production ?? 0, cost: cost ?? 0, notes: notes ?? '' },
    update: { source, consumption: consumption ?? 0, production: production ?? 0, cost: cost ?? 0, notes: notes ?? '' },
  })
  return NextResponse.json(record, { status: 201 })
}

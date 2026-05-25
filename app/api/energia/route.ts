import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

async function getOrCreatePropertyId(supabaseId: string, userEmail?: string) {
  let dbUser = await prisma.user.findUnique({
    where: { supabaseId },
    include: { properties: { take: 1, select: { id: true } } },
  })
  if (!dbUser && userEmail) {
    dbUser = await prisma.user.findUnique({
      where: { email: userEmail },
      include: { properties: { take: 1, select: { id: true } } },
    })
    if (dbUser) {
      await prisma.user.update({ where: { id: dbUser.id }, data: { supabaseId } })
    }
  }
  if (!dbUser) {
    dbUser = await prisma.user.create({
      data: { supabaseId, email: userEmail ?? supabaseId, name: userEmail?.split('@')[0] ?? 'Usuário' },
      include: { properties: { take: 1, select: { id: true } } },
    })
  }
  if (dbUser.properties.length > 0) return dbUser.properties[0].id
  const prop = await prisma.property.create({
    data: { userId: dbUser.id, name: 'Minha Propriedade' },
    select: { id: true },
  })
  return prop.id
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const propertyId = await getOrCreatePropertyId(user.id, user.email ?? undefined)

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

  const propertyId = await getOrCreatePropertyId(user.id, user.email ?? undefined)

  const body = await req.json()
  const { month, year, source, consumption, production, cost, notes } = body

  const record = await prisma.energyRecord.upsert({
    where: { propertyId_month_year: { propertyId, month, year } },
    create: { propertyId, month, year, source, consumption: consumption ?? 0, production: production ?? 0, cost: cost ?? 0, notes: notes ?? '' },
    update: { source, consumption: consumption ?? 0, production: production ?? 0, cost: cost ?? 0, notes: notes ?? '' },
  })
  return NextResponse.json(record, { status: 201 })
}

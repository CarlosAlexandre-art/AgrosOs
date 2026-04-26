import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } })
  if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const cookieHeader = (await import('next/headers')).cookies
  const cookieStore = await cookieHeader()
  const activePropertyId = cookieStore.get('activePropertyId')?.value

  const where = activePropertyId
    ? { propertyId: activePropertyId, property: { userId: dbUser.id } }
    : { property: { userId: dbUser.id } }

  const tokens = await prisma.agroToken.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: { property: { select: { name: true } } },
  })

  return NextResponse.json(tokens)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: { properties: { select: { id: true } } },
  })
  if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const body = await request.json()
  const {
    propertyId, type, title, description,
    totalValue, tokenPrice, expectedReturn, periodMonths,
    commodity, quantityKg, deliveryDate, fieldId,
    materialType, quantity, unit,
    machineType, machineModel, machineYear, usageHours,
  } = body

  const owned = dbUser.properties.some(p => p.id === propertyId)
  if (!owned) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const tv = parseFloat(totalValue)
  const tp = parseFloat(tokenPrice || '100')
  const totalTokens = Math.floor(tv / tp)

  const token = await prisma.agroToken.create({
    data: {
      propertyId,
      type,
      title,
      description,
      totalValue: tv,
      tokenPrice: tp,
      totalTokens,
      expectedReturn: expectedReturn ? parseFloat(expectedReturn) : null,
      periodMonths: periodMonths ? parseInt(periodMonths) : null,
      commodity: commodity || null,
      quantityKg: quantityKg ? parseFloat(quantityKg) : null,
      deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
      fieldId: fieldId || null,
      materialType: materialType || null,
      quantity: quantity ? parseFloat(quantity) : null,
      unit: unit || null,
      machineType: machineType || null,
      machineModel: machineModel || null,
      machineYear: machineYear ? parseInt(machineYear) : null,
      usageHours: usageHours ? parseFloat(usageHours) : null,
    },
  })

  return NextResponse.json(token, { status: 201 })
}

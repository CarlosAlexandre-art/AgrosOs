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
    carNumber,
  } = body

  const owned = dbUser.properties.some(p => p.id === propertyId)
  if (!owned) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const tv = parseFloat(totalValue)
  const tp = parseFloat(tokenPrice || '100')

  // Validações de segurança — piloto
  if (!type || !['SAFRA', 'MATERIAL', 'MAQUINARIO'].includes(type))
    return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 })
  if (!title?.trim())
    return NextResponse.json({ error: 'Título obrigatório' }, { status: 400 })
  if (isNaN(tv) || tv <= 0)
    return NextResponse.json({ error: 'Valor total inválido' }, { status: 400 })
  if (tv > 100_000)
    return NextResponse.json({ error: 'Valor máximo por oferta no piloto: R$ 100.000' }, { status: 400 })
  if (isNaN(tp) || tp < 10)
    return NextResponse.json({ error: 'Preço mínimo por token: R$ 10' }, { status: 400 })
  if (tp > 10_000)
    return NextResponse.json({ error: 'Preço máximo por token no piloto: R$ 10.000' }, { status: 400 })
  if (!carNumber?.trim())
    return NextResponse.json({ error: 'Número do CAR obrigatório' }, { status: 400 })

  // Validar formato básico CAR: UF-{7 dígitos}-{32 hex}
  const carRegex = /^[A-Z]{2}-\d{7}-[0-9A-F]{32}$/i
  if (!carRegex.test(carNumber.trim()))
    return NextResponse.json({ error: 'Formato do CAR inválido. Ex: SP-3512020-19BD8D....' }, { status: 400 })

  const totalTokens = Math.floor(tv / tp)

  const token = await prisma.agroToken.create({
    data: {
      propertyId,
      type,
      title,
      description: description || null,
      totalValue: tv,
      tokenPrice: tp,
      totalTokens,
      status: 'PENDING_REVIEW',
      carNumber: carNumber.trim().toUpperCase(),
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

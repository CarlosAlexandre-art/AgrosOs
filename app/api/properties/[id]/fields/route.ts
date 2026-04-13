import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { getUserPlan, planoBloqueado } from '@/lib/planos'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const fields = await prisma.field.findMany({ where: { propertyId: id }, include: { crop: true } })
  return NextResponse.json(fields)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { plan, limites } = await getUserPlan(user.id)

  // Limite de talhões por propriedade
  if (limites.talhoesPorProp < 9999) {
    const count = await prisma.field.count({ where: { propertyId: id } })
    if (count >= limites.talhoesPorProp) return planoBloqueado('talhoes', plan)
  }

  const { name, sizeHectares, cropId } = await req.json()
  if (!name) return NextResponse.json({ error: 'Nome obrigatório' }, { status: 400 })
  const field = await prisma.field.create({ data: { propertyId: id, name, sizeHectares: sizeHectares || 0, cropId: cropId || null } })
  return NextResponse.json(field, { status: 201 })
}

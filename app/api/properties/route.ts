import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { getUserPlan, planoBloqueado } from '@/lib/planos'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id }, include: { properties: true } })
  return NextResponse.json(dbUser?.properties || [])
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { plan, limites, dbUser } = await getUserPlan(user.id)
  if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const count = await prisma.property.count({ where: { userId: dbUser.id } })
  if (count >= limites.propriedades) return planoBloqueado('propriedades', plan)

  const { name, location, sizeHectares } = await req.json()
  if (!name) return NextResponse.json({ error: 'Nome obrigatório' }, { status: 400 })

  const property = await prisma.property.create({
    data: { userId: dbUser.id, name, location: location || null, sizeHectares: sizeHectares || 0 },
  })
  return NextResponse.json(property, { status: 201 })
}

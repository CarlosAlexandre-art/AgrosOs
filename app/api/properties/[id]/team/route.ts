import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { getUserPlan, planoBloqueado } from '@/lib/planos'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const team = await prisma.teamMember.findMany({ where: { propertyId: id } })
  return NextResponse.json(team)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { plan, limites } = await getUserPlan(user.id)
  const { id } = await params

  const currentCount = await prisma.teamMember.count({ where: { propertyId: id } })
  if (currentCount >= limites.membrosEquipe) return planoBloqueado('membrosEquipe', plan)

  const { name, role, phone } = await req.json()
  if (!name || !role) return NextResponse.json({ error: 'Nome e cargo obrigatórios' }, { status: 400 })
  const member = await prisma.teamMember.create({ data: { propertyId: id, name, role, phone: phone || null } })
  return NextResponse.json(member, { status: 201 })
}

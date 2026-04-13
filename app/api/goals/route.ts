import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { getUserPlan, planoBloqueado } from '@/lib/planos'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { plan, limites } = await getUserPlan(user.id)
  if (!limites.metas) return planoBloqueado('metas', plan)

  const body = await req.json()
  const { title, description, type, targetValue, deadline } = body

  if (!title || !targetValue) {
    return NextResponse.json({ error: 'Campos obrigatórios ausentes' }, { status: 400 })
  }

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: { properties: { select: { id: true } } },
  })

  const propertyId = dbUser?.properties[0]?.id
  if (!propertyId) {
    return NextResponse.json({ error: 'Nenhuma propriedade encontrada' }, { status: 404 })
  }

  const goal = await prisma.goal.create({
    data: {
      propertyId,
      title,
      description: description || null,
      type: type || 'REVENUE',
      targetValue,
      deadline: deadline ? new Date(deadline) : null,
    },
  })

  return NextResponse.json(goal, { status: 201 })
}

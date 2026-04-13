import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { sendPushToProperty } from '@/lib/push'
import { getUserPlan, planoBloqueado } from '@/lib/planos'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: { properties: { include: { activities: { include: { field: true, assignedTo: true }, orderBy: { startDate: 'desc' } } } } },
  })
  const activities = dbUser?.properties.flatMap((p: { activities: unknown[] }) => p.activities) || []
  return NextResponse.json(activities)
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { plan, limites } = await getUserPlan(user.id)

  const body = await req.json()
  const { propertyId, fieldId, assignedToId, type, description, status, executor, startDate, endDate } = body

  if (!propertyId || !type || !startDate) {
    return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 })
  }

  // Limite de atividades por mês (starter = 20)
  if (limites.atividadesMes < 9999) {
    const inicioMes = new Date()
    inicioMes.setDate(1); inicioMes.setHours(0, 0, 0, 0)
    const count = await prisma.activity.count({
      where: { propertyId, createdAt: { gte: inicioMes } },
    })
    if (count >= limites.atividadesMes) return planoBloqueado('atividadesMes', plan)
  }

  const activity = await prisma.activity.create({
    data: {
      propertyId,
      fieldId: fieldId || null,
      assignedToId: assignedToId || null,
      type,
      description: description || null,
      status: status || 'PENDING',
      executor: executor || 'INTERNAL',
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
    },
  })
  // Notificação push (sem bloquear a resposta)
  sendPushToProperty(propertyId, {
    title: '🌾 Nova atividade criada',
    body: `${type}${description ? ' — ' + description : ''}`,
    url: `/dashboard/operacoes/${activity.id}`,
  }).catch(() => {})

  return NextResponse.json(activity, { status: 201 })
}

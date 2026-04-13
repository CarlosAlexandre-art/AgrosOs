import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { sendPushToProperty } from '@/lib/push'

async function getPropertyId(userId: string) {
  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: userId },
    include: { properties: { select: { id: true } } },
  })
  return dbUser?.properties[0]?.id
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const propertyId = await getPropertyId(user.id)
  if (!propertyId) return NextResponse.json({ error: 'Propriedade não encontrada' }, { status: 404 })

  const body = await req.json()

  const goal = await prisma.goal.findFirst({ where: { id, propertyId } })
  if (!goal) return NextResponse.json({ error: 'Meta não encontrada' }, { status: 404 })

  const updated = await prisma.goal.update({
    where: { id },
    data: body,
  })

  // Notifica quando meta é concluída
  if (body.isCompleted && !goal.isCompleted) {
    sendPushToProperty(propertyId, {
      title: '🎯 Meta concluída!',
      body: goal.title,
      url: '/dashboard/metas',
    }).catch(() => {})
  }

  return NextResponse.json(updated)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const propertyId = await getPropertyId(user.id)
  if (!propertyId) return NextResponse.json({ error: 'Propriedade não encontrada' }, { status: 404 })

  const goal = await prisma.goal.findFirst({ where: { id, propertyId } })
  if (!goal) return NextResponse.json({ error: 'Meta não encontrada' }, { status: 404 })

  await prisma.goal.delete({ where: { id } })

  return NextResponse.json({ ok: true })
}

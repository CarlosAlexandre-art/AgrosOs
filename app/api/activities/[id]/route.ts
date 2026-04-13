import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { sendPushToProperty } from '@/lib/push'

const STATUS_PUSH: Record<string, { title: string; emoji: string }> = {
  DONE:        { title: 'Atividade concluída',  emoji: '✅' },
  LATE:        { title: 'Atividade atrasada',   emoji: '⚠️' },
  CANCELLED:   { title: 'Atividade cancelada',  emoji: '❌' },
  IN_PROGRESS: { title: 'Atividade iniciada',   emoji: '🔄' },
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const activity = await prisma.activity.findUnique({ where: { id }, include: { field: true, assignedTo: true, costs: true } })
  if (!activity) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(activity)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const allowed = ['status', 'type', 'description', 'startDate', 'endDate', 'fieldId', 'assignedToId', 'executor']
  const data: any = {}
  for (const key of allowed) {
    if (body[key] !== undefined) data[key] = body[key]
  }
  if (data.startDate) data.startDate = new Date(data.startDate)
  if (data.endDate) data.endDate = new Date(data.endDate)

  const prev = await prisma.activity.findUnique({ where: { id } })
  const updated = await prisma.activity.update({ where: { id }, data })

  // Notifica mudança de status relevante
  if (data.status && data.status !== prev?.status && STATUS_PUSH[data.status]) {
    const { title, emoji } = STATUS_PUSH[data.status]
    sendPushToProperty(updated.propertyId, {
      title: `${emoji} ${title}`,
      body: updated.type,
      url: `/dashboard/operacoes/${id}`,
    }).catch(() => {})
  }

  return NextResponse.json(updated)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Se havia serviço vinculado no AgroCore, cancela lá também
  const activity = await prisma.activity.findUnique({ where: { id }, select: { agrolinkServiceId: true } })
  if (activity?.agrolinkServiceId) {
    const agrocoreUrl = process.env.AGROCORE_API_URL || 'https://agrolink-opal.vercel.app'
    fetch(`${agrocoreUrl}/api/internal/servicos/${activity.agrolinkServiceId}`, {
      method: 'DELETE',
      headers: { 'x-internal-secret': process.env.AGROLINK_INTERNAL_SECRET! },
    }).catch(() => {})
  }

  await prisma.activity.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}

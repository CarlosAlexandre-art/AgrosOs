import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

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

  const updated = await prisma.activity.update({ where: { id }, data })
  return NextResponse.json(updated)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await prisma.activity.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}

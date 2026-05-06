import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { alertId } = await req.json()
  if (!alertId) return NextResponse.json({ error: 'alertId required' }, { status: 400 })

  // Verifica que o alerta pertence ao usuário
  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: { properties: { select: { id: true } } },
  })
  const propertyIds = dbUser?.properties.map(p => p.id) ?? []

  const alert = await prisma.alert.findFirst({ where: { id: alertId, propertyId: { in: propertyIds } } })
  if (!alert) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.alert.update({ where: { id: alertId }, data: { isRead: true } })
  return NextResponse.json({ ok: true })
}

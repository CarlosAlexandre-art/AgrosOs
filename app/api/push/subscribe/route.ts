import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { getUserPlan, planoBloqueado } from '@/lib/planos'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { endpoint, keys } = await req.json()
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  const { plan, limites, dbUser } = await getUserPlan(user.id)
  if (!dbUser) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
  if (!limites.push) return planoBloqueado('push', plan)

  await prisma.pushSubscription.upsert({
    where: { endpoint },
    update: { p256dh: keys.p256dh, auth: keys.auth },
    create: { userId: dbUser.id, endpoint, p256dh: keys.p256dh, auth: keys.auth },
  })

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const { endpoint } = await req.json()
  if (endpoint) {
    await prisma.pushSubscription.deleteMany({ where: { endpoint } }).catch(() => {})
  }
  return NextResponse.json({ ok: true })
}

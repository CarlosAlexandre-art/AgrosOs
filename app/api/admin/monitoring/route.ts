import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id }, select: { role: true } })
  if (dbUser?.role !== 'ADMIN') return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const [
    eventsCritical,
    eventsHigh,
    eventsUnresolved,
    recentEvents,
    tokenStats,
    transactionStats,
  ] = await Promise.all([
    prisma.securityEvent.count({ where: { severity: 'CRITICAL', createdAt: { gte: since24h } } }),
    prisma.securityEvent.count({ where: { severity: 'HIGH', createdAt: { gte: since24h } } }),
    prisma.securityEvent.count({ where: { resolved: false } }),
    prisma.securityEvent.findMany({
      where: { createdAt: { gte: since24h } },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: { id: true, type: true, severity: true, userId: true, tokenId: true, details: true, resolved: true, createdAt: true },
    }),
    prisma.agroToken.groupBy({
      by: ['status'],
      _count: true,
    }),
    prisma.tokenTransaction.aggregate({
      where: { createdAt: { gte: since7d }, type: 'BUY' },
      _sum: { totalAmount: true },
      _count: true,
    }),
  ])

  const tokenSummary = Object.fromEntries(tokenStats.map(s => [s.status, s._count]))

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    alerts: {
      critical24h: eventsCritical,
      high24h: eventsHigh,
      unresolved: eventsUnresolved,
      status: eventsCritical > 0 ? 'CRITICAL' : eventsHigh > 0 ? 'WARNING' : 'OK',
    },
    tokens: tokenSummary,
    transactions7d: {
      count: transactionStats._count,
      volumeBRL: Number(transactionStats._sum.totalAmount ?? 0),
    },
    recentEvents,
  })
}

// Marcar evento como resolvido
export async function PATCH(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id }, select: { role: true } })
  if (dbUser?.role !== 'ADMIN') return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  const { id } = await req.json()
  await prisma.securityEvent.update({ where: { id }, data: { resolved: true } })
  return NextResponse.json({ ok: true })
}

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ total: 0, byType: {} })

    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      include: { properties: { select: { id: true } } },
    })

    const propertyIds = dbUser?.properties.map(p => p.id) ?? []
    if (propertyIds.length === 0) return NextResponse.json({ total: 0, byType: {} })

    const alerts = await prisma.alert.findMany({
      where: { propertyId: { in: propertyIds }, isRead: false },
      select: { type: true },
    })

    const byType: Record<string, number> = {}
    for (const a of alerts) {
      byType[a.type] = (byType[a.type] || 0) + 1
    }

    return NextResponse.json({ total: alerts.length, byType })
  } catch {
    return NextResponse.json({ total: 0, byType: {} })
  }
}

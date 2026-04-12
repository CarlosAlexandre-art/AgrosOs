import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { propertyId } = await req.json()
  await prisma.alert.updateMany({ where: { propertyId, isRead: false }, data: { isRead: true } })
  return NextResponse.json({ ok: true })
}

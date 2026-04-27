import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ role: null }, { status: 401 })
  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id }, select: { role: true, kycVerified: true, cpf: true } })
  return NextResponse.json(dbUser ?? { role: null })
}

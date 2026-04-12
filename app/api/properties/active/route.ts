import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { ACTIVE_PROPERTY_COOKIE } from '@/lib/active-property'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { propertyId } = await req.json()

  // Verifica se a propriedade pertence ao usuário
  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: { properties: { select: { id: true } } },
  })
  const valid = dbUser?.properties.some(p => p.id === propertyId)
  if (!valid) return NextResponse.json({ error: 'Propriedade inválida' }, { status: 403 })

  const res = NextResponse.json({ ok: true })
  res.cookies.set(ACTIVE_PROPERTY_COOKIE, propertyId, {
    httpOnly: false,
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 dias
  })
  return res
}

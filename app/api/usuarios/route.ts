import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { name, email } = await req.json()

  const existing = await prisma.user.findUnique({ where: { supabaseId: user.id } })
  if (existing) return NextResponse.json(existing)

  const dbUser = await prisma.user.create({
    data: {
      supabaseId: user.id,
      name: name || user.user_metadata?.name || 'Usuário',
      email: email || user.email!,
    },
  })

  return NextResponse.json(dbUser, { status: 201 })
}

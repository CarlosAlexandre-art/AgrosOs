import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { sendWelcomeEmail } from '@/lib/email/resend'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { propertyName, location, sizeHectares } = await req.json()
  if (!propertyName) return NextResponse.json({ error: 'Nome da propriedade obrigatório' }, { status: 400 })

  // Criar ou buscar usuário no banco
  let dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } })
  if (!dbUser) {
    dbUser = await prisma.user.create({
      data: {
        supabaseId: user.id,
        name: user.user_metadata?.name || user.email!.split('@')[0],
        email: user.email!,
      },
    })
  }

  // Criar a primeira propriedade
  const property = await prisma.property.create({
    data: {
      userId: dbUser.id,
      name: propertyName,
      location: location || null,
      sizeHectares: sizeHectares || 0,
    },
  })

  // Enviar email de boas-vindas (sem bloquear a resposta)
  sendWelcomeEmail(dbUser.name, dbUser.email).catch(() => {})

  return NextResponse.json({ ok: true, propertyId: property.id }, { status: 201 })
}

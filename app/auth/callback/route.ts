import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)

    // Recovery de senha — vai direto para atualizar-senha
    if (next === '/atualizar-senha') {
      return NextResponse.redirect(`${origin}/atualizar-senha`)
    }

    // Se o destino é o onboarding, vai direto
    if (next === '/onboarding') {
      return NextResponse.redirect(`${origin}/onboarding`)
    }

    // Verificar se o usuário já tem propriedade cadastrada
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const dbUser = await prisma.user.findUnique({
        where: { supabaseId: user.id },
        select: { _count: { select: { properties: true } } },
      })
      if (!dbUser || dbUser._count.properties === 0) {
        return NextResponse.redirect(`${origin}/onboarding`)
      }
    }
  }

  return NextResponse.redirect(`${origin}${next}`)
}

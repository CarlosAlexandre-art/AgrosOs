import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (!code) return NextResponse.redirect(`${origin}${next}`)

  // Recovery: passa o code para a página cliente fazer o exchange
  if (next === '/atualizar-senha') {
    return NextResponse.redirect(`${origin}/atualizar-senha?code=${code}`)
  }

  const cookieStore = await cookies()
  const response = NextResponse.redirect(`${origin}${next}`)

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  await supabase.auth.exchangeCodeForSession(code)

  if (next === '/onboarding') return response

  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      select: { _count: { select: { properties: true } } },
    })
    if (!dbUser || dbUser._count.properties === 0) {
      response.headers.set('Location', `${origin}/onboarding`)
      return response
    }
  }

  return response
}

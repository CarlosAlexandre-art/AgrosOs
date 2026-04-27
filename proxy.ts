import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const PUBLIC_PREFIXES = [
  '/',
  '/login',
  '/cadastro',
  '/auth/',
  '/demo',
  '/faq',
  '/docs',
  '/blog',
  '/agrocore',
  '/como-funciona',
  '/funcionalidades',
  '/aprendizado',
]

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isPublic = PUBLIC_PREFIXES.some(r => pathname === r || pathname.startsWith(r))

  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Lock all AgroToken sub-pages — redirect to the "Em Breve" page
  // Exceptions: /sucesso (payment confirmation) and /cancelado
  if (
    pathname.startsWith('/dashboard/token/') &&
    !pathname.startsWith('/dashboard/token/sucesso') &&
    !pathname.startsWith('/dashboard/token/cancelado')
  ) {
    return NextResponse.redirect(new URL('/dashboard/token', request.url))
  }

  if (!user && !isPublic) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user && (pathname === '/login' || pathname === '/cadastro')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}

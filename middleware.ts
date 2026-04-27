import { NextRequest, NextResponse } from 'next/server'

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Lock all token sub-pages — redirect to the "Em Breve" page
  if (pathname.startsWith('/dashboard/token/')) {
    return NextResponse.redirect(new URL('/dashboard/token', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/token/:path+'],
}

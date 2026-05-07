import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getEmbrapaToken } from '@/lib/embrapa-token'

const AGROFIT_BASE = 'https://api.cnptia.embrapa.br/agrofit/v1'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams, pathname } = req.nextUrl
  // extrai o caminho após /api/embrapa/agrofit
  const path = pathname.replace(/.*\/api\/embrapa\/agrofit/, '') || '/'

  try {
    const token = await getEmbrapaToken()
    const qs = searchParams.toString()
    const url = `${AGROFIT_BASE}${path}${qs ? `?${qs}` : ''}`

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 86400 }, // cache 24h — dados raramente mudam
    })

    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json({ error: text }, { status: res.status })
    }

    const data = await res.json()
    const response = NextResponse.json(data)

    // repassa headers de paginação
    for (const h of ['x-records-count', 'x-pages', 'x-page-size']) {
      const v = res.headers.get(h)
      if (v) response.headers.set(h, v)
    }
    return response
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

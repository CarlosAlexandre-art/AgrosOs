import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getEmbrapaToken } from '@/lib/embrapa-token'

const BASE = 'https://api.cnptia.embrapa.br/agrofit/v1'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { path } = await params
  const subpath = path ? `/${path.join('/')}` : ''
  const qs = req.nextUrl.searchParams.toString()
  const url = `${BASE}${subpath}${qs ? `?${qs}` : ''}`

  try {
    const token = await getEmbrapaToken()
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 86400 },
    })
    if (!res.ok) return NextResponse.json({ error: await res.text() }, { status: res.status })

    const data = await res.json()
    const response = NextResponse.json(data)
    for (const h of ['x-records-count', 'x-pages', 'x-page-size']) {
      const v = res.headers.get(h); if (v) response.headers.set(h, v)
    }
    return response
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getEmbrapaToken } from '@/lib/embrapa-token'

const BASE = 'https://api.cnptia.embrapa.br/smartsolos/expert/v1'

export async function GET(req: NextRequest) {
  return handleEmbrapa(req, 'GET', null)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  return handleEmbrapa(req, 'POST', body)
}

async function handleEmbrapa(req: NextRequest, method: string, body: unknown) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams, pathname } = req.nextUrl
  const path = pathname.replace(/.*\/api\/embrapa\/smartsolos/, '') || '/'

  try {
    const token = await getEmbrapaToken()
    const qs = searchParams.toString()
    const url = `${BASE}${path}${qs ? `?${qs}` : ''}`

    const res = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    })

    if (!res.ok) return NextResponse.json({ error: await res.text() }, { status: res.status })

    const data = await res.json()
    const response = NextResponse.json(data)
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

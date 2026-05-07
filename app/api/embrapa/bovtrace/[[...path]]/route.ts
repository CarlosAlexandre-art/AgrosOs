import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getEmbrapaToken } from '@/lib/embrapa-token'

const BASE = 'https://api.cnptia.embrapa.br/bovtrace/v1'

async function handle(req: NextRequest, method: string, pathSegments?: string[], body?: unknown) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const subpath = pathSegments ? `/${pathSegments.join('/')}` : ''
  const qs = req.nextUrl.searchParams.toString()
  const url = `${BASE}${subpath}${qs ? `?${qs}` : ''}`

  try {
    const token = await getEmbrapaToken()
    const res = await fetch(url, {
      method,
      headers: { Authorization: `Bearer ${token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
    })
    if (!res.ok) return NextResponse.json({ error: await res.text() }, { status: res.status })

    const data = await res.json()
    const response = NextResponse.json(data)
    for (const h of ['x-records-count', 'x-pages', 'x-page-size']) {
      const v = res.headers.get(h); if (v) response.headers.set(h, v)
    }
    return response
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erro' }, { status: 500 })
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  const { path } = await params
  return handle(req, 'GET', path)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  const { path } = await params
  return handle(req, 'POST', path, await req.json())
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  const { path } = await params
  return handle(req, 'DELETE', path)
}

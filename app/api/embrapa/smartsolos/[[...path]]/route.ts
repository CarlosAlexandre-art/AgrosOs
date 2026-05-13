import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getEmbrapaToken, clearEmbrapaTokenCache } from '@/lib/embrapa-token'

const BASE = 'https://api.cnptia.embrapa.br/smartsolos/expert/v1'

function parseWso2Error(text: string): { code: string; message: string } | null {
  try {
    const json = JSON.parse(text)
    const fault = json?.fault
    if (fault?.code) return { code: String(fault.code), message: fault.description || fault.message || text }
  } catch {}
  return null
}

async function callSmartSolos(url: string, method: string, body?: unknown, retrying = false): Promise<Response> {
  const token = await getEmbrapaToken()
  const res = await fetch(url, {
    method,
    headers: { Authorization: `Bearer ${token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(20_000),
  })

  // WSO2 101508 = backend transitoriamente indisponível — retry uma vez
  if (!res.ok && !retrying) {
    const text = await res.clone().text()
    const wso2 = parseWso2Error(text)
    if (wso2?.code === '101508') {
      await new Promise(r => setTimeout(r, 1500))
      return callSmartSolos(url, method, body, true)
    }
    // 401 = token expirado — limpa cache e retry
    if (res.status === 401) {
      clearEmbrapaTokenCache()
      return callSmartSolos(url, method, body, true)
    }
  }

  return res
}

async function handle(req: NextRequest, method: string, pathSegments?: string[], body?: unknown) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const subpath = pathSegments ? `/${pathSegments.join('/')}` : ''
  const qs = req.nextUrl.searchParams.toString()
  const url = `${BASE}${subpath}${qs ? `?${qs}` : ''}`

  try {
    const res = await callSmartSolos(url, method, body)

    if (!res.ok) {
      const text = await res.text()
      const wso2 = parseWso2Error(text)
      if (wso2) {
        const userMsg = wso2.code === '101508'
          ? 'O serviço SmartSolos da Embrapa está temporariamente indisponível (erro 101508). Tente novamente em alguns minutos.'
          : `Erro WSO2 ${wso2.code}: ${wso2.message}`
        return NextResponse.json({ error: userMsg, wso2_code: wso2.code }, { status: res.status })
      }
      return NextResponse.json({ error: text }, { status: res.status })
    }

    const text = await res.text()
    if (!text || text.trim() === '') {
      return NextResponse.json({ error: 'A API SmartSolos não retornou resultado. Verifique os dados do perfil e tente novamente.' }, { status: 422 })
    }
    let data: unknown
    try {
      data = JSON.parse(text)
    } catch {
      return NextResponse.json({ raw: text }, { status: 200 })
    }
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

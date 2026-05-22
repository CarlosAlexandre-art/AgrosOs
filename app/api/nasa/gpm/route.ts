import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

function latIdx(lat: number): number {
  return Math.min(1799, Math.max(0, Math.round((lat + 89.95) / 0.1)))
}
function lonIdx(lng: number): number {
  return Math.min(3599, Math.max(0, Math.round((lng + 179.95) / 0.1)))
}
function ddmm(d: Date): string {
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
}
function yyyymmdd(d: Date): string {
  return d.toISOString().slice(0, 10).replace(/-/g, '')
}

// CMR retorna URLs concept-ID que não suportam .ascii — converter para formato providers/
function toOpendapUrl(href: string): string {
  const decoded = decodeURIComponent(href)
  const m = decoded.match(/\/granules\/GPM_3IMERGDL\.\d+:(.+)$/)
  if (m) {
    return `https://opendap.earthdata.nasa.gov/providers/GES_DISC/collections/GPM_3IMERGDL.07/granules/${m[1]}`
  }
  return href
}

// Busca URLs OPeNDAP reais via CMR (sem autenticação)
async function getCmrUrls(dates: Date[]): Promise<Map<string, string>> {
  const sorted = [...dates].sort((a, b) => a.getTime() - b.getTime())
  const start = sorted[0].toISOString().slice(0, 10) + 'T00:00:00Z'
  const end = sorted[sorted.length - 1].toISOString().slice(0, 10) + 'T23:59:59Z'

  const url = `https://cmr.earthdata.nasa.gov/search/granules.json` +
    `?short_name=GPM_3IMERGDL&version=07&temporal=${start},${end}&page_size=20`

  try {
    const res = await fetch(url, { next: { revalidate: 86400 } })
    if (!res.ok) return new Map()
    const data = await res.json()

    const map = new Map<string, string>()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const granule of (data.feed?.entry ?? []) as any[]) {
      const dateStr = granule.time_start?.slice(0, 10).replace(/-/g, '')
      if (!dateStr) continue

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const opendap = (granule.links as any[])?.find(
        (l) => l.subtype?.includes('OPeNDAP') ||
          (l.href?.includes('opendap') && l.rel?.includes('service'))
      )
      if (opendap?.href) map.set(dateStr, toOpendapUrl(opendap.href))
    }
    return map
  } catch {
    return new Map()
  }
}

// Segue redirects manualmente para preservar Authorization
async function fetchAuth(url: string, token: string): Promise<{ status: number; body: string | null; finalUrl: string }> {
  let current = url
  for (let hop = 0; hop < 5; hop++) {
    let res: Response
    try {
      res = await fetch(current, {
        headers: { Authorization: `Bearer ${token}` },
        redirect: 'manual',
      })
    } catch (e) {
      return { status: -1, body: String(e), finalUrl: current }
    }
    if (res.status === 200) return { status: 200, body: await res.text(), finalUrl: current }
    if ([301, 302, 307, 308].includes(res.status)) {
      const loc = res.headers.get('location')
      if (loc) { current = loc; continue }
    }
    const errBody = await res.text().catch(() => null)
    return { status: res.status, body: errBody?.slice(0, 300) ?? null, finalUrl: current }
  }
  return { status: 0, body: null, finalUrl: current }
}

async function fetchPoint(
  opendapUrl: string, li: number, lni: number, token: string
): Promise<{ mm: number | null; debugUrl: string; debugStatus: number; debugBody?: string }> {
  const enc = (i: number) => `%5B${i}%5D`
  // IMERG Daily: dimensões [time=1][lon=3600][lat=1800] — lon antes de lat
  // Tentar brackets literais (alguns servidores rejeitam URL-encoded) e encoded
  const suffixes = [
    `.ascii?precipitation[0][${lni}][${li}]`,              // literal [lon][lat] — correto para IMERG
    `.ascii?precipitation[0][${li}][${lni}]`,              // literal [lat][lon] — fallback
    `.ascii?precipitation${enc(0)}${enc(lni)}${enc(li)}`,  // encoded [lon][lat]
    `.ascii?precipitation${enc(0)}${enc(li)}${enc(lni)}`,  // encoded [lat][lon]
  ]
  const bases = opendapUrl.endsWith('.nc4')
    ? [opendapUrl]
    : [opendapUrl + '.nc4', opendapUrl]

  let lastDebug = { url: bases[0] + suffixes[0], status: 0, body: undefined as string | undefined }

  for (const base of bases) {
    for (const suffix of suffixes) {
      const result = await fetchAuth(base + suffix, token)
      lastDebug = { url: result.finalUrl, status: result.status, body: result.body?.slice(0, 300) ?? undefined }

      if (result.status === 200 && result.body) {
        const lines = result.body.trim().split('\n').filter(l => l.trim())
        const val = parseFloat(lines[lines.length - 1])
        if (!isNaN(val) && val >= 0) {
          return { mm: Math.round(val * 10) / 10, debugUrl: result.finalUrl, debugStatus: 200 }
        }
        // 200 mas valor inválido (fill negativo ou NaN) — continuar tentando
        continue
      }

      // 401/403 = erro de auth — parar imediatamente (outra combinação não vai resolver)
      if (result.status === 401 || result.status === 403) {
        return { mm: null, debugUrl: result.finalUrl, debugStatus: result.status, debugBody: result.body?.slice(0, 300) ?? undefined }
      }
      // 404/400/0/-1: tentar próxima combinação de variável/dimensão
    }
  }
  return { mm: null, debugUrl: lastDebug.url, debugStatus: lastDebug.status, debugBody: lastDebug.body }
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const token = process.env.EARTHDATA_TOKEN
  if (!token) return NextResponse.json({ hasKey: false, error: 'EARTHDATA_TOKEN não configurado' })

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: { properties: { take: 1, select: { lat: true, lng: true, name: true } } },
  })

  const property = dbUser?.properties[0]
  if (!property?.lat || !property?.lng) return NextResponse.json({ error: 'SEM_COORDENADAS' })

  const { lat, lng } = property
  const li = latIdx(lat)
  const lni = lonIdx(lng)

  const today = new Date()
  const dates: Date[] = Array.from({ length: 10 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() - (i + 2))
    return d
  })

  // 1) Buscar URLs via CMR (1 request, sem auth)
  const cmrUrls = await getCmrUrls(dates)

  // 2) Buscar dado de precipitação para cada dia (paralelo)
  const results = await Promise.all(
    dates.map(async (d) => {
      const ymd = yyyymmdd(d)
      const opendapUrl = cmrUrls.get(ymd)
      if (!opendapUrl) return { mm: null, debugUrl: `NO_CMR:${ymd}`, debugStatus: 0 }
      return fetchPoint(opendapUrl, li, lni, token)
    })
  )

  const days = dates.map((d, i) => ({ date: ddmm(d), mm: results[i].mm })).reverse()
  const valid = days.filter(d => d.mm !== null)
  const total10d = Math.round(valid.reduce((s, d) => s + (d.mm ?? 0), 0) * 10) / 10
  const maxDay = valid.length
    ? valid.reduce((max, d) => (d.mm ?? 0) > (max.mm ?? 0) ? d : max)
    : null

  const first = results[0]
  return NextResponse.json({
    property: property.name, lat, lng,
    resolution: '0.1° (~11 km)',
    source: 'NASA GPM IMERG Late Daily Run V07B',
    days,
    summary: { total10d, maxDay, validDays: valid.length },
    hasKey: true,
    debug: { cmrFound: cmrUrls.size, firstUrl: first.debugUrl, firstStatus: first.debugStatus, firstBody: first.debugBody },
    updatedAt: new Date().toISOString(),
  })
}

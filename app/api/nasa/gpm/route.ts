import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

function latIdx(lat: number): number {
  return Math.min(1799, Math.max(0, Math.round((lat + 89.95) / 0.1)))
}
function lonIdx(lng: number): number {
  return Math.min(3599, Math.max(0, Math.round((lng + 179.95) / 0.1)))
}
function julianDay(d: Date): string {
  const start = new Date(d.getFullYear(), 0, 0)
  return String(Math.floor((d.getTime() - start.getTime()) / 86400000)).padStart(3, '0')
}
function yyyymmdd(d: Date): string {
  return d.toISOString().slice(0, 10).replace(/-/g, '')
}
function ddmm(d: Date): string {
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
}

type FetchResult = { status: number; finalUrl: string; body: string | null }

// Segue redirects manualmente preservando Authorization header
async function fetchAuth(url: string, token: string): Promise<FetchResult> {
  let current = url
  for (let hop = 0; hop < 5; hop++) {
    let res: Response
    try {
      res = await fetch(current, {
        headers: { Authorization: `Bearer ${token}` },
        redirect: 'manual',
      })
    } catch (e) {
      return { status: -1, finalUrl: current, body: String(e) }
    }
    if (res.status === 200) {
      const body = await res.text()
      return { status: 200, finalUrl: current, body }
    }
    if (res.status === 301 || res.status === 302 || res.status === 307 || res.status === 308) {
      const loc = res.headers.get('location')
      if (loc) { current = loc; continue }
    }
    return { status: res.status, finalUrl: current, body: null }
  }
  return { status: 0, finalUrl: current, body: null }
}

async function fetchImergDay(
  date: Date, li: number, lni: number, token: string
): Promise<{ mm: number | null; debug?: FetchResult }> {
  const yyyy = date.getFullYear()
  const ddd = julianDay(date)
  const ymd = yyyymmdd(date)
  const suffix = `.ascii?precipitationCal[0][${li}][${lni}]`

  const candidates = [
    `https://disc2.gesdisc.eosdis.nasa.gov/opendap/GPM_L3/GPM_3IMERGDL.07/${yyyy}/${ddd}/3B-DAY-L.MS.MRG.3IMERG.${ymd}-S000000-E235959.V07B.nc4${suffix}`,
    `https://disc2.gesdisc.eosdis.nasa.gov/opendap/hyrax/GPM_L3/GPM_3IMERGDL.07/${yyyy}/${ddd}/3B-DAY-L.MS.MRG.3IMERG.${ymd}-S000000-E235959.V07B.nc4${suffix}`,
    `https://disc2.gesdisc.eosdis.nasa.gov/opendap/GPM_L3/GPM_3IMERGDL.07/${yyyy}/${ddd}/3B-DAY-L.MS.MRG.3IMERG.${ymd}-S000000-E235959.0000.V07B.nc4${suffix}`,
  ]

  let lastDebug: FetchResult | undefined
  for (const url of candidates) {
    const result = await fetchAuth(url, token)
    lastDebug = result
    if (result.status === 200 && result.body) {
      const lines = result.body.trim().split('\n').filter(l => l.trim())
      const val = parseFloat(lines[lines.length - 1])
      if (!isNaN(val) && val >= 0) return { mm: Math.round(val * 10) / 10 }
    }
    // Se 404, tentar próximo; qualquer outro erro pior, parar
    if (result.status !== 404 && result.status !== 0) break
  }
  return { mm: null, debug: lastDebug }
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

  const results = await Promise.all(dates.map(d => fetchImergDay(d, li, lni, token)))
  const days = dates.map((d, i) => ({ date: ddmm(d), mm: results[i].mm })).reverse()
  const valid = days.filter(d => d.mm !== null)
  const total10d = Math.round(valid.reduce((s, d) => s + (d.mm ?? 0), 0) * 10) / 10
  const maxDay = valid.length ? valid.reduce((max, d) => (d.mm ?? 0) > (max.mm ?? 0) ? d : max) : null

  // Debug: info da última tentativa no dia mais recente
  const debugInfo = results[0].debug
    ? { url: results[0].debug.finalUrl, status: results[0].debug.status, bodyPreview: results[0].debug.body?.slice(0, 200) }
    : null

  return NextResponse.json({
    property: property.name, lat, lng,
    resolution: '0.1° (~11 km)',
    source: 'NASA GPM IMERG Late Daily Run V07B',
    days,
    summary: { total10d, maxDay, validDays: valid.length },
    hasKey: true,
    debug: debugInfo,
    updatedAt: new Date().toISOString(),
  })
}

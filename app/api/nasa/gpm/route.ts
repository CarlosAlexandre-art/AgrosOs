import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

// IMERG grid: 0.1° resolution
// lat index 0 = -89.95 (sul), 1799 = 89.95 (norte)
// lon index 0 = -179.95 (oeste), 3599 = 179.95 (leste)
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

// Follow redirects manually to preserve Authorization header
// (GES DISC redireciona para outro servidor e fetch padrão dropa o header)
async function fetchAuth(url: string, token: string): Promise<Response | null> {
  let current = url
  for (let hop = 0; hop < 5; hop++) {
    const res = await fetch(current, {
      headers: { Authorization: `Bearer ${token}` },
      redirect: 'manual',
    })
    if (res.status === 200) return res
    if (res.status === 301 || res.status === 302 || res.status === 307 || res.status === 308) {
      const loc = res.headers.get('location')
      if (loc) { current = loc; continue }
    }
    return null
  }
  return null
}

async function fetchImergDay(
  date: Date,
  li: number,
  lni: number,
  token: string
): Promise<number | null> {
  const yyyy = date.getFullYear()
  const ddd = julianDay(date)
  const ymd = yyyymmdd(date)

  // V07B daily: sem o segmento MMMM no nome do arquivo
  // Tentativas: servidor principal GES DISC + formato alternativo com 0000
  const base = `https://disc2.gesdisc.eosdis.nasa.gov/opendap/GPM_L3/GPM_3IMERGDL.07/${yyyy}/${ddd}`
  const suffix = `.ascii?precipitationCal[0][${li}][${lni}]`
  const filenames = [
    `3B-DAY-L.MS.MRG.3IMERG.${ymd}-S000000-E235959.V07B.nc4`,
    `3B-DAY-L.MS.MRG.3IMERG.${ymd}-S000000-E235959.0000.V07B.nc4`,
  ]

  for (const fn of filenames) {
    try {
      const res = await fetchAuth(`${base}/${fn}${suffix}`, token)
      if (!res) continue
      const text = await res.text()
      const lines = text.trim().split('\n').filter(l => l.trim())
      const val = parseFloat(lines[lines.length - 1])
      if (!isNaN(val) && val >= 0) return Math.round(val * 10) / 10
    } catch { continue }
  }
  return null
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const token = process.env.EARTHDATA_TOKEN
  if (!token) {
    return NextResponse.json({ hasKey: false, error: 'EARTHDATA_TOKEN não configurado' })
  }

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: {
      properties: {
        take: 1,
        select: { lat: true, lng: true, name: true },
      },
    },
  })

  const property = dbUser?.properties[0]
  if (!property?.lat || !property?.lng) {
    return NextResponse.json({ error: 'SEM_COORDENADAS' })
  }

  const { lat, lng } = property
  const li = latIdx(lat)
  const lni = lonIdx(lng)

  // IMERG Late Run tem ~12h de latência → começa 2 dias atrás
  const today = new Date()
  const dates: Date[] = Array.from({ length: 10 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() - (i + 2))
    return d
  })

  const values = await Promise.all(
    dates.map(d => fetchImergDay(d, li, lni, token))
  )

  const days = dates
    .map((d, i) => ({ date: ddmm(d), mm: values[i] }))
    .reverse()

  const valid = days.filter(d => d.mm !== null)
  const total10d = Math.round(valid.reduce((s, d) => s + (d.mm ?? 0), 0) * 10) / 10
  const maxDay = valid.length
    ? valid.reduce((max, d) => (d.mm ?? 0) > (max.mm ?? 0) ? d : max)
    : null

  return NextResponse.json({
    property: property.name,
    lat,
    lng,
    resolution: '0.1° (~11 km)',
    source: 'NASA GPM IMERG Late Daily Run V07B',
    days,
    summary: { total10d, maxDay, validDays: valid.length },
    hasKey: true,
    updatedAt: new Date().toISOString(),
  })
}

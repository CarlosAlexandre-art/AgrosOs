import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

function ddmm(d: Date): string {
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
}
function yyyymmdd(d: Date): string {
  return d.toISOString().slice(0, 10).replace(/-/g, '')
}

async function fetchPower(lat: number, lng: number, dates: Date[]): Promise<Map<string, number | null>> {
  const sorted = [...dates].sort((a, b) => a.getTime() - b.getTime())
  const start = yyyymmdd(sorted[0])
  const end = yyyymmdd(sorted[sorted.length - 1])

  const url =
    `https://power.larc.nasa.gov/api/temporal/daily/point` +
    `?parameters=PRECTOTCORR&community=AG&longitude=${lng}&latitude=${lat}` +
    `&start=${start}&end=${end}&format=JSON`

  try {
    const res = await fetch(url, { next: { revalidate: 3600 } })
    if (!res.ok) return new Map()
    const data = await res.json()
    const precip = data.properties?.parameter?.PRECTOTCORR as Record<string, number> | undefined
    if (!precip) return new Map()

    const map = new Map<string, number | null>()
    for (const [dateStr, mm] of Object.entries(precip)) {
      map.set(dateStr, mm >= 0 ? Math.round(mm * 10) / 10 : null)
    }
    return map
  } catch {
    return new Map()
  }
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: { properties: { take: 1, select: { lat: true, lng: true, name: true } } },
  })

  const property = dbUser?.properties[0]
  if (!property?.lat || !property?.lng) return NextResponse.json({ error: 'SEM_COORDENADAS' })

  const { lat, lng } = property

  const today = new Date()
  const dates: Date[] = Array.from({ length: 10 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() - (i + 2))
    return d
  })

  const powerData = await fetchPower(lat, lng, dates)

  const days = dates
    .map(d => ({ date: ddmm(d), mm: powerData.get(yyyymmdd(d)) ?? null }))
    .reverse()

  const valid = days.filter(d => d.mm !== null)
  const total10d = Math.round(valid.reduce((s, d) => s + (d.mm ?? 0), 0) * 10) / 10
  const maxDay = valid.length
    ? valid.reduce((max, d) => ((d.mm ?? 0) > (max.mm ?? 0) ? d : max))
    : null

  return NextResponse.json({
    property: property.name, lat, lng,
    resolution: '0.5° (~50 km)',
    source: 'NASA POWER · MERRA-2',
    days,
    summary: { total10d, maxDay, validDays: valid.length },
    hasKey: true,
    updatedAt: new Date().toISOString(),
  })
}

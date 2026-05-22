import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function yyyymmdd(d: Date): string {
  return d.toISOString().slice(0, 10).replace(/-/g, '')
}

function soilStatus(v: number | null): { label: string; color: string; level: number } {
  if (v === null) return { label: 'Sem dados', color: 'slate', level: 0 }
  if (v < 0.2) return { label: 'Muito seco', color: 'red', level: 1 }
  if (v < 0.4) return { label: 'Seco', color: 'orange', level: 2 }
  if (v < 0.6) return { label: 'Normal', color: 'green', level: 3 }
  if (v < 0.8) return { label: 'Úmido', color: 'blue', level: 4 }
  return { label: 'Saturado', color: 'indigo', level: 5 }
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: {
      properties: {
        take: 1,
        select: { id: true, name: true, lat: true, lng: true },
      },
    },
  })

  const property = dbUser?.properties[0]
  if (!property?.lat || !property?.lng) {
    return NextResponse.json({ error: 'SEM_COORDENADAS' })
  }

  const { lat, lng, id: propertyId, name: propertyName } = property

  const today = new Date()
  const start30 = new Date(today)
  start30.setDate(today.getDate() - 31)
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)

  // ── NASA POWER (sem chave, 100% gratuito) ────────────────────────────────
  let powerParam: Record<string, Record<string, number>> = {}
  try {
    const url = new URL('https://power.larc.nasa.gov/api/temporal/daily/point')
    url.searchParams.set('parameters', 'PRECTOTCORR,T2M,GWETROOT,GWETPROF,RH2M')
    url.searchParams.set('community', 'AG')
    url.searchParams.set('longitude', String(lng))
    url.searchParams.set('latitude', String(lat))
    url.searchParams.set('start', yyyymmdd(start30))
    url.searchParams.set('end', yyyymmdd(yesterday))
    url.searchParams.set('format', 'JSON')

    const res = await fetch(url.toString(), { next: { revalidate: 21600 } })
    if (res.ok) {
      const json = await res.json()
      powerParam = json.properties?.parameter ?? {}
    }
  } catch {}

  // Processar umidade do solo (último valor disponível)
  let soilMoisture: number | null = null
  if (powerParam['GWETROOT']) {
    const entries = Object.values(powerParam['GWETROOT']).filter(v => v !== -999)
    if (entries.length) soilMoisture = entries[entries.length - 1]
  }

  // Processar precipitação dos últimos 30 dias
  let precip30d = 0
  const precipByDay: { date: string; mm: number }[] = []
  if (powerParam['PRECTOTCORR']) {
    for (const [key, mm] of Object.entries(powerParam['PRECTOTCORR'])) {
      if (mm === -999) continue
      precip30d += mm
      precipByDay.push({
        date: `${key.slice(6, 8)}/${key.slice(4, 6)}`,
        mm: Math.round(mm * 10) / 10,
      })
    }
  }

  // Temperatura média
  let avgTemp: number | null = null
  if (powerParam['T2M']) {
    const vals = Object.values(powerParam['T2M']).filter(v => v !== -999)
    if (vals.length) avgTemp = Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10
  }

  // ── NASA FIRMS — focos de incêndio (requer NASA_FIRMS_KEY) ───────────────
  type FirePoint = { lat: number; lng: number; date: string; confidence: string; distKm: number }
  const fireAlerts: FirePoint[] = []
  const firmsKey = process.env.NASA_FIRMS_KEY

  if (firmsKey) {
    try {
      const pad = 1.8 // ~200 km
      const bounds = [
        (lng - pad).toFixed(4),
        (lat - pad).toFixed(4),
        (lng + pad).toFixed(4),
        (lat + pad).toFixed(4),
      ].join(',')
      const firmsUrl =
        `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${firmsKey}/VIIRS_SNPP_NRT/${bounds}/7`

      const res = await fetch(firmsUrl, { next: { revalidate: 3600 } })
      if (res.ok) {
        const csv = await res.text()
        const lines = csv.trim().split('\n').slice(1)
        for (const line of lines) {
          const cols = line.split(',')
          if (cols.length < 10) continue
          const fireLat = parseFloat(cols[0])
          const fireLng = parseFloat(cols[1])
          const date = cols[5]        // acq_date
          const confidence = cols[9]  // low | nominal | high
          if (confidence === 'low') continue
          const distKm = Math.round(haversineKm(lat, lng, fireLat, fireLng))
          if (distKm <= 200) fireAlerts.push({ lat: fireLat, lng: fireLng, date, confidence, distKm })
        }
        fireAlerts.sort((a, b) => a.distKm - b.distKm)
      }
    } catch {}

    // Auto-criar alerta se fogo < 100 km
    if (fireAlerts.length > 0 && fireAlerts[0].distKm <= 100) {
      const closest = fireAlerts[0]
      const msg = `🔥 Foco de incêndio a ${closest.distKm}km da propriedade (NASA FIRMS · ${closest.date})`
      const hoje = new Date()
      hoje.setHours(0, 0, 0, 0)
      const exists = await prisma.alert.findFirst({
        where: { propertyId, type: 'FOGO', createdAt: { gte: hoje } },
      })
      if (!exists) {
        await prisma.alert.create({
          data: { propertyId, message: msg, type: 'FOGO', isRead: false },
        }).catch(() => {})
      }
    }
  }

  const soil = soilStatus(soilMoisture)

  return NextResponse.json({
    property: propertyName,
    lat,
    lng,
    soil: {
      moisture: soilMoisture,
      percent: soilMoisture !== null ? Math.round(soilMoisture * 100) : null,
      label: soil.label,
      color: soil.color,
      level: soil.level,
    },
    precipitation: {
      total30d: Math.round(precip30d * 10) / 10,
      byDay: precipByDay.slice(-14),
    },
    temperature: { avg30d: avgTemp },
    fires: {
      count: fireAlerts.length,
      closest: fireAlerts[0] ?? null,
      list: fireAlerts.slice(0, 5),
      hasKey: !!firmsKey,
    },
    source: 'NASA POWER (MERRA-2) + NASA FIRMS VIIRS',
    updatedAt: new Date().toISOString(),
  })
}

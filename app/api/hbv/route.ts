import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

// HBV-96 soil parameters by type (FC=field capacity mm, LP=evap threshold, K1=fast drain)
const SOIL_PARAMS: Record<string, { FC: number; LP: number; K1: number }> = {
  areia:           { FC: 100, LP: 0.40, K1: 0.10 },
  franco_arenoso:  { FC: 150, LP: 0.50, K1: 0.07 },
  franco:          { FC: 200, LP: 0.60, K1: 0.05 },
  franco_argiloso: { FC: 250, LP: 0.70, K1: 0.03 },
  argiloso:        { FC: 300, LP: 0.75, K1: 0.02 },
}

// Runoff coefficient by land use (fraction of precip that becomes surface runoff)
const LANDUSE_RC: Record<string, number> = {
  agricultura_intensiva: 0.50,
  pastagem:              0.40,
  agricultura_organica:  0.30,
  reflorestamento:       0.25,
  mata_nativa:           0.20,
}

const K2 = 0.005 // slow groundwater reservoir drain rate

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: {
      properties: {
        take: 1,
        select: { id: true, name: true, lat: true, lng: true, sizeHectares: true, waterAnalysisData: true },
      },
    },
  })

  const property = dbUser?.properties[0]
  if (!property) return NextResponse.json({ error: 'Propriedade não encontrada' }, { status: 404 })
  if (!property.lat || !property.lng) return NextResponse.json({ error: 'SEM_COORDENADAS' }, { status: 422 })

  const { lat, lng } = property

  // Derive soil/landuse params from vulnerability analysis if available
  const analysis = property.waterAnalysisData as Record<string, any> | null
  const soilType = analysis?.inputs?.solo ?? 'franco'
  const landUse = analysis?.inputs?.usoSolo ?? 'pastagem'
  const { FC, LP, K1 } = SOIL_PARAMS[soilType] ?? SOIL_PARAMS.franco
  const rc = LANDUSE_RC[landUse] ?? 0.35

  // Area in km² (1 km² = 100 ha)
  const areaKm2 = Math.max(0.01, Number(property.sizeHectares) / 100)

  // Fetch 365 days of historical precip + temperature from Open-Meteo archive
  const today = new Date()
  const d365 = new Date(today)
  d365.setDate(d365.getDate() - 365)
  const fmt = (d: Date) => d.toISOString().split('T')[0]

  const histUrl =
    `https://archive-api.open-meteo.com/v1/archive` +
    `?latitude=${lat}&longitude=${lng}` +
    `&start_date=${fmt(d365)}&end_date=${fmt(today)}` +
    `&daily=precipitation_sum,temperature_2m_mean` +
    `&timezone=America%2FSao_Paulo`

  const res = await fetch(histUrl, { next: { revalidate: 3600 } })
  if (!res.ok) return NextResponse.json({ error: 'Falha ao buscar dados históricos' }, { status: 502 })

  const hist = await res.json()
  const dates: string[] = hist.daily.time
  const precips: number[] = hist.daily.precipitation_sum.map((v: number | null) => v ?? 0)
  const temps: number[] = hist.daily.temperature_2m_mean.map((v: number | null) => v ?? 25)

  // ── HBV-96 Simulation ─────────────────────────────────────────────────────
  let SM = FC * 0.5   // initial soil moisture (mm) — 50% field capacity
  let SUZ = 0          // fast runoff store (mm)
  let SLZ = 0          // slow groundwater store (mm)

  interface SimDay {
    date: string
    precip: number
    temp: number
    sm: number
    smPct: number
    q: number
    et: number
    deficit: boolean
  }

  const simDays: SimDay[] = []

  for (let i = 0; i < dates.length; i++) {
    const P = precips[i]
    const T = temps[i]

    // Actual evapotranspiration limited by soil moisture
    const ET = Math.max(0, 0.4 * T * Math.min(1, SM / (FC * LP + 1e-9)))

    // Water available after ET exceeds soil storage → recharge
    const recharge = Math.max(0, SM + P - ET - FC)
    SM = Math.max(0, Math.min(FC, SM + P - ET - recharge))

    // Fast and slow runoff routing
    SUZ = Math.max(0, SUZ + recharge - K1 * SUZ)
    SLZ = Math.max(0, SLZ + K1 * SUZ * 0.3 - K2 * SLZ)

    // Stream flow in m³/s
    const Q = Math.max(0, (K1 * SUZ + K2 * SLZ) * areaKm2 / 86.4)

    simDays.push({
      date: dates[i],
      precip:  Math.round(P * 10) / 10,
      temp:    Math.round(T * 10) / 10,
      sm:      Math.round(SM * 10) / 10,
      smPct:   Math.round((SM / FC) * 100),
      q:       Math.round(Q * 100) / 100,
      et:      Math.round(ET * 10) / 10,
      deficit: SM < FC * 0.30, // deficit when soil moisture < 30% of field capacity
    })
  }

  // ── Summary (last 30 days) ─────────────────────────────────────────────────
  const last30 = simDays.slice(-30)
  const deficitDays30d  = last30.filter(d => d.deficit).length
  const avgSmPct30d     = Math.round(last30.reduce((s, d) => s + d.smPct, 0) / last30.length)
  const totalPrecip30d  = Math.round(last30.reduce((s, d) => s + d.precip, 0) * 10) / 10
  const totalRunoffMm30d = Math.round(totalPrecip30d * rc * 10) / 10
  const currentSmPct    = simDays[simDays.length - 1]?.smPct ?? 50
  const currentSm       = simDays[simDays.length - 1]?.sm ?? FC * 0.5

  let irrigationStatus: 'OK' | 'ALERTA' | 'CRÍTICO'
  if (currentSmPct >= 50) irrigationStatus = 'OK'
  else if (currentSmPct >= 30) irrigationStatus = 'ALERTA'
  else irrigationStatus = 'CRÍTICO'

  // Irrigation needs insight
  const nextDeficit = [...simDays].reverse().findIndex(d => !d.deficit)
  const irrigationNote =
    irrigationStatus === 'OK'
      ? 'Umidade do solo adequada — irrigação não necessária no momento'
      : irrigationStatus === 'ALERTA'
        ? `Umidade abaixo de 50% da capacidade de campo — monitore e irrigue se não chover`
        : `Déficit crítico de umidade — irrigação imediata recomendada`

  return NextResponse.json({
    property: property.name,
    lat, lng,
    params: { FC, LP, K1, K2, rc, soilType, landUse, areaKm2 },
    days: simDays.slice(-60),   // last 60 days for chart
    summary: {
      deficitDays30d,
      avgSmPct30d,
      currentSmPct,
      currentSm: Math.round(currentSm),
      FC,
      totalPrecip30d,
      totalRunoffMm30d,
      irrigationStatus,
      irrigationNote,
    },
    updatedAt: new Date().toISOString(),
  })
}

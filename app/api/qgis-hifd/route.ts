import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

// Runoff coefficient by soil type
const SOIL_RC: Record<string, number> = {
  areia:           0.50,
  franco_arenoso:  0.40,
  franco:          0.35,
  franco_argiloso: 0.28,
  argiloso:        0.20,
}

// Drought intensity (0–4) derived from precipitation in last 30 days
function droughtIntensity(totalRain30d: number): number {
  if (totalRain30d > 120) return 0
  if (totalRain30d > 80)  return 1
  if (totalRain30d > 40)  return 2
  if (totalRain30d > 15)  return 3
  return 4
}

// Farm HIFD — inline TypeScript port of run_farm_hifd() from algorithms.py
function farmHIFD(
  runoffCoeff: number,
  storageM3: number,
  deficitDays30d: number,
  droughtLevel: number,
): { demandIndex: number; status: 'OK' | 'ALERTA' | 'CRÍTICO'; label: string; recommendation: string } {
  const capNorm = storageM3 / 1e9
  const hifdRaw = Math.min(80, Math.max(5,
    8 + Math.min(capNorm / 3, 15)
    + (1 - runoffCoeff) * 12
    + droughtLevel * 5
    + (1 - 2) * 3   // nc = 1 (single farm)
  ))
  const observedStress = (deficitDays30d / 30) * 20
  const demandIndex = Math.min(100, Math.round((hifdRaw + observedStress) * 10) / 10)

  let status: 'OK' | 'ALERTA' | 'CRÍTICO'
  let label: string
  let recommendation: string

  if (demandIndex < 30) {
    status = 'OK'; label = 'Baixa demanda'
    recommendation = 'Disponibilidade hídrica adequada — manutenção normal'
  } else if (demandIndex < 55) {
    status = 'ALERTA'; label = 'Demanda moderada'
    recommendation = 'Monitore o nível de reservatórios e o calendário de irrigação'
  } else {
    status = 'CRÍTICO'; label = 'Alta demanda'
    recommendation = 'Acione irrigação de emergência e reduza evapotranspiração com cobertura do solo'
  }

  return { demandIndex, status, label, recommendation }
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
        select: { id: true, name: true, lat: true, lng: true, sizeHectares: true, waterAnalysisData: true },
      },
    },
  })

  const property = dbUser?.properties[0]
  if (!property) return NextResponse.json({ error: 'Propriedade não encontrada' }, { status: 404 })
  if (!property.lat || !property.lng) return NextResponse.json({ error: 'SEM_COORDENADAS' }, { status: 422 })

  // Get soil type from vulnerability analysis
  const analysis = property.waterAnalysisData as Record<string, any> | null
  const soilType = analysis?.inputs?.solo ?? 'franco'
  const runoffCoeff = SOIL_RC[soilType] ?? 0.35

  // Fetch last 30 days precipitation from Open-Meteo
  const today = new Date()
  const d30 = new Date(today)
  d30.setDate(d30.getDate() - 30)
  const fmt = (d: Date) => d.toISOString().split('T')[0]
  const { lat, lng } = property

  const histUrl =
    `https://archive-api.open-meteo.com/v1/archive` +
    `?latitude=${lat}&longitude=${lng}` +
    `&start_date=${fmt(d30)}&end_date=${fmt(today)}` +
    `&daily=precipitation_sum` +
    `&timezone=America%2FSao_Paulo`

  let totalRain30d = 50 // fallback
  let deficitDays30d = 5 // fallback

  try {
    const res = await fetch(histUrl, { next: { revalidate: 3600 } })
    if (res.ok) {
      const hist = await res.json()
      const precips: number[] = hist.daily.precipitation_sum.map((v: number | null) => v ?? 0)
      totalRain30d = Math.round(precips.reduce((a, b) => a + b, 0) * 10) / 10
      // Estimate deficit days: days where daily precip < 2mm AND no buffer from previous days
      deficitDays30d = precips.filter(p => p < 2).length
    }
  } catch (_) {
    // use fallback values
  }

  // If QGIS microservice is configured, proxy to it
  const qgisUrl = process.env.QGIS_SERVICE_URL
  if (qgisUrl) {
    try {
      const body = {
        runoff_coeff: runoffCoeff,
        storage_capacity_m3: 0, // farm without known reservoir
        deficit_days_30d: deficitDays30d,
        drought_intensity: droughtIntensity(totalRain30d),
      }
      const proxyRes = await fetch(`${qgisUrl}/hifd/farm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(5000),
      })
      if (proxyRes.ok) {
        const data = await proxyRes.json()
        return NextResponse.json({
          ...data,
          source: 'qgis-microservice',
          meta: { soilType, runoffCoeff, totalRain30d, deficitDays30d },
        })
      }
    } catch (_) {
      // fall through to inline calculation
    }
  }

  // Inline TypeScript fallback
  const result = farmHIFD(
    runoffCoeff,
    0,
    deficitDays30d,
    droughtIntensity(totalRain30d),
  )

  return NextResponse.json({
    ...result,
    source: 'inline',
    meta: { soilType, runoffCoeff, totalRain30d, deficitDays30d },
  })
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

interface Scenario {
  id: string
  label: string
  description: string
  precipMultiplier: number
  tempDelta: number
  priceMultiplier: number
  icon: string
}

const SCENARIOS: Scenario[] = [
  { id: 'seca_leve', label: 'Seca Leve', description: 'Precipitação 20% abaixo da média', precipMultiplier: 0.80, tempDelta: +1.5, priceMultiplier: 1.0, icon: '🌤' },
  { id: 'seca_severa', label: 'Seca Severa', description: 'Precipitação 40% abaixo da média', precipMultiplier: 0.60, tempDelta: +3.0, priceMultiplier: 1.15, icon: '☀️' },
  { id: 'excesso_chuva', label: 'Excesso de Chuva', description: 'Precipitação 60% acima da média', precipMultiplier: 1.60, tempDelta: -0.5, priceMultiplier: 0.9, icon: '🌧' },
  { id: 'geada', label: 'Geada', description: 'Temperatura 5°C abaixo em floração', precipMultiplier: 0.95, tempDelta: -5.0, priceMultiplier: 1.2, icon: '❄️' },
  { id: 'choque_preco', label: 'Choque de Preço -20%', description: 'Queda brusca no preço da commodity', precipMultiplier: 1.0, tempDelta: 0, priceMultiplier: 0.80, icon: '📉' },
  { id: 'optimal', label: 'Clima Ideal', description: 'Condições perfeitas de temperatura e chuva', precipMultiplier: 1.10, tempDelta: -0.5, priceMultiplier: 1.05, icon: '🌱' },
]

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const scenarioId = req.nextUrl.searchParams.get('scenario') ?? 'seca_leve'
  const scenario = SCENARIOS.find(s => s.id === scenarioId) ?? SCENARIOS[0]

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: {
      properties: {
        take: 1,
        select: { id: true, name: true, lat: true, lng: true, sizeHectares: true },
      },
    },
  })

  const property = dbUser?.properties[0]
  if (!property) return NextResponse.json({ error: 'Propriedade não encontrada' }, { status: 404 })

  const lat = Number(property.lat ?? -15)
  const lng = Number(property.lng ?? -47)
  const ha = Number(property.sizeHectares ?? 50)
  const hasCoords = property.lat != null && property.lng != null

  // Baseline from Open-Meteo
  let basePrecipMm = 110
  let baseTempC = 24
  let baseNdvi = 0.52

  if (hasCoords) {
    try {
      const today = new Date()
      const d90 = new Date(today)
      d90.setDate(d90.getDate() - 90)
      const fmt = (d: Date) => d.toISOString().split('T')[0]
      const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lng}&start_date=${fmt(d90)}&end_date=${fmt(today)}&daily=precipitation_sum,et0_fao_evapotranspiration,temperature_2m_mean&timezone=America%2FSao_Paulo`
      const res = await fetch(url, { next: { revalidate: 3600 } })
      if (res.ok) {
        const raw = await res.json()
        const precips: number[] = (raw.daily?.precipitation_sum ?? []).map((v: number | null) => v ?? 0)
        const et0s: number[] = (raw.daily?.et0_fao_evapotranspiration ?? []).map((v: number | null) => v ?? 3)
        const temps: number[] = (raw.daily?.temperature_2m_mean ?? []).map((v: number | null) => v ?? 25)
        basePrecipMm = precips.reduce((a, b) => a + b, 0) / 3
        baseTempC = temps.reduce((a, b) => a + b, 0) / (temps.length || 1)
        const avgEt0 = et0s.reduce((a, b) => a + b, 0) / (et0s.length || 1)
        const ratio = avgEt0 > 0 ? Math.min(1, (basePrecipMm / 30) / avgEt0) : 0.5
        baseNdvi = parseFloat((0.15 + ratio * 0.55).toFixed(3))
      }
    } catch {}
  }

  // Apply scenario
  const simPrecip = parseFloat((basePrecipMm * scenario.precipMultiplier).toFixed(1))
  const simTemp = parseFloat((baseTempC + scenario.tempDelta).toFixed(1))

  // NDVI impact: precipMultiplier drives NDVI proportionally
  const ndviImpact = (scenario.precipMultiplier - 1) * 0.4 + (scenario.tempDelta < 0 && scenario.tempDelta > -3 ? 0.03 : scenario.tempDelta < -3 ? -0.15 : scenario.tempDelta > 2 ? -0.1 : 0)
  const simNdvi = parseFloat(Math.max(0.05, Math.min(0.95, baseNdvi + ndviImpact)).toFixed(3))

  // Productivity impact
  const baseYieldTha = 3.2
  const yieldImpact = (simNdvi / baseNdvi - 1) * 0.7
  const simYieldTha = parseFloat(Math.max(0.1, baseYieldTha * (1 + yieldImpact)).toFixed(2))
  const baseRevenue = ha * baseYieldTha * 180
  const simRevenue = parseFloat((ha * simYieldTha * 180 * scenario.priceMultiplier).toFixed(2))
  const deltaRevenue = parseFloat((simRevenue - baseRevenue).toFixed(2))
  const deltaPct = parseFloat(((deltaRevenue / baseRevenue) * 100).toFixed(1))

  // Monthly projection (6 months)
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'].map((m, i) => {
    const seasonFactor = Math.sin((i / 6) * Math.PI) * 0.2 + 0.9
    return {
      month: m,
      baseline: parseFloat((basePrecipMm * seasonFactor).toFixed(1)),
      simulated: parseFloat((simPrecip * seasonFactor).toFixed(1)),
      ndviBaseline: parseFloat((baseNdvi * seasonFactor).toFixed(3)),
      ndviSimulated: parseFloat((simNdvi * seasonFactor).toFixed(3)),
    }
  })

  // Mitigation actions
  const mitigacoes: string[] = []
  if (scenario.precipMultiplier < 0.8) {
    mitigacoes.push('Irrigação suplementar — reduz impacto em 30-40%')
    mitigacoes.push('Variedades tolerantes à seca')
    mitigacoes.push('Cobertura de solo para retenção de umidade')
  }
  if (scenario.precipMultiplier > 1.3) {
    mitigacoes.push('Drenagem preventiva dos talhões')
    mitigacoes.push('Fungicida preventivo — risco de doenças fúngicas')
    mitigacoes.push('Colheita antecipada se grãos em maturação')
  }
  if (scenario.tempDelta < -3) {
    mitigacoes.push('Irrigação noturna como proteção contra geada')
    mitigacoes.push('Cobertura com telas de proteção térmica')
  }
  if (scenario.priceMultiplier < 0.9) {
    mitigacoes.push('Hedge no mercado futuro — fixar preço antecipado')
    mitigacoes.push('Diversificar cultura — reduzir dependência de uma commodity')
  }

  return NextResponse.json({
    property: { id: property.id, name: property.name, declaredHa: ha, hasCoords },
    scenarios: SCENARIOS.map(s => ({ id: s.id, label: s.label, description: s.description, icon: s.icon })),
    activeScenario: scenario,
    baseline: {
      precipMm: parseFloat(basePrecipMm.toFixed(1)),
      tempC: parseFloat(baseTempC.toFixed(1)),
      ndvi: baseNdvi,
      yieldTha: baseYieldTha,
      revenueBRL: parseFloat(baseRevenue.toFixed(2)),
    },
    simulation: {
      precipMm: simPrecip,
      tempC: simTemp,
      ndvi: simNdvi,
      yieldTha: simYieldTha,
      revenueBRL: simRevenue,
      deltaRevenueBRL: deltaRevenue,
      deltaPct,
    },
    months,
    mitigacoes,
    source: 'Open-Meteo + FTW Digital Twin Engine',
    generatedAt: new Date().toISOString(),
  })
}

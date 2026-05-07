import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

// ─── GLA Method — Simplified for Brazilian Producers ──────────────────────────
// Based on the German GLA groundwater vulnerability scoring system.
// Original: AWC (available water capacity) + GWR (groundwater recharge) + Lithology
// Adapted: soil type + recharge estimate + geology + depth to water + land use

// Each dimension returns a protection score: higher = more protected (less vulnerable)

const SOIL_SCORE: Record<string, number> = {
  areia:          1, // Sandy — very high permeability, low protection
  franco_arenoso: 2, // Sandy loam
  franco:         3, // Loam
  franco_argiloso:4, // Clay loam
  argiloso:       5, // Clay — low permeability, high protection
}

const RECHARGE_SCORE: Record<string, number> = {
  muito_alta: 1, // > 400 mm/year — high infiltration
  alta:       2, // 200–400 mm/year
  media:      3, // 100–200 mm/year
  baixa:      4, // < 100 mm/year — little recharge, aquifer more isolated
}

const GEOLOGY_SCORE: Record<string, number> = {
  areia_cascalho: 1, // Granular sediment — high permeability
  arenito:        2, // Sandstone — medium-high
  basalto:        3, // Basalt — fractured but denser
  cristalino:     4, // Crystalline bedrock — low permeability
  argila_silte:   5, // Clay/silt — high protection
}

const DEPTH_SCORE: Record<string, number> = {
  menos_5m:  1, // < 5 m — very shallow, highly exposed
  de_5_15m:  2, // 5–15 m
  de_15_30m: 3, // 15–30 m
  mais_30m:  4, // > 30 m — deep, well protected
}

const LANDUSE_SCORE: Record<string, number> = {
  agricultura_intensiva: 1, // Heavy pesticide/fertilizer use — highest risk
  pastagem:              2, // Pasture
  agricultura_organica:  3, // Organic/integrated farming
  reflorestamento:       4, // Reforestation
  mata_nativa:           5, // Native forest — best protection
}

// Score thresholds — sum of all 5 dimensions (min 5, max 23)
// Lower total = less protection = higher vulnerability
function classify(total: number): {
  level: string
  label: string
  color: string
  description: string
  agroRateImpact: number
} {
  if (total <= 8)  return { level: 'MUITO_ALTA', label: 'Muito Alta',  color: '#dc2626', description: 'Aquífero extremamente exposto. Alto risco de contaminação por agroquímicos, efluentes e lixo.',          agroRateImpact: -30 }
  if (total <= 11) return { level: 'ALTA',       label: 'Alta',        color: '#ea580c', description: 'Aquífero com baixa proteção natural. Práticas de uso do solo influenciam diretamente a qualidade da água.', agroRateImpact: -15 }
  if (total <= 15) return { level: 'MEDIA',      label: 'Média',       color: '#ca8a04', description: 'Proteção moderada. Risco relevante em condições de uso intensivo do solo.',                                   agroRateImpact:   0 }
  if (total <= 19) return { level: 'BAIXA',      label: 'Baixa',       color: '#16a34a', description: 'Boa proteção natural. Aquífero relativamente seguro sob uso agrícola responsável.',                           agroRateImpact: +10 }
  return               { level: 'MUITO_BAIXA',   label: 'Muito Baixa', color: '#0891b2', description: 'Proteção natural elevada. Aquífero bem isolado — manutenção das condições atuais é suficiente.',              agroRateImpact: +20 }
}

async function getFirstProperty(supabaseId: string) {
  const user = await prisma.user.findUnique({
    where: { supabaseId },
    include: { properties: { take: 1, select: { id: true } } },
  })
  return user?.properties[0] ?? null
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const property = await getFirstProperty(user.id)
  if (!property) return NextResponse.json(null)

  const data = await prisma.property.findUnique({
    where: { id: property.id },
    select: { waterVulnerability: true, waterAnalysisData: true },
  })

  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const property = await getFirstProperty(user.id)
  if (!property) return NextResponse.json({ error: 'Propriedade não encontrada' }, { status: 404 })

  const { solo, recarga, geologia, profundidade, usoSolo } = await req.json()

  const scores = {
    solo:        SOIL_SCORE[solo]        ?? 3,
    recarga:     RECHARGE_SCORE[recarga] ?? 3,
    geologia:    GEOLOGY_SCORE[geologia] ?? 3,
    profundidade:DEPTH_SCORE[profundidade] ?? 3,
    usoSolo:     LANDUSE_SCORE[usoSolo]  ?? 3,
  }

  const total = Object.values(scores).reduce((a, b) => a + b, 0)
  const result = classify(total)

  const analysisData = {
    inputs: { solo, recarga, geologia, profundidade, usoSolo },
    scores,
    total,
    ...result,
    calculatedAt: new Date().toISOString(),
  }

  await prisma.property.update({
    where: { id: property.id },
    data: {
      waterVulnerability: result.level,
      waterAnalysisData: analysisData,
    },
  })

  return NextResponse.json(analysisData)
}

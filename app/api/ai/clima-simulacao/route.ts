import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { groq } from '@/lib/groq'

// ── Hargreaves ET0 (FAO-56) ───────────────────────────────────────────────────
// ET0 [mm/day] = 0.0023 × (Tmean + 17.8) × (Tmax − Tmin)^0.5 × Ra
// Ra = extraterrestrial radiation [MJ/m²/day]

const GSC = 0.0820 // solar constant MJ/m²/min

function dayOfYear(dateStr: string): number {
  const d = new Date(dateStr + 'T12:00:00')
  const start = new Date(d.getFullYear(), 0, 0)
  return Math.floor((d.getTime() - start.getTime()) / 86400000)
}

function raExtrat(latDeg: number, J: number): number {
  const phi = latDeg * (Math.PI / 180)
  const dr = 1 + 0.033 * Math.cos((2 * Math.PI * J) / 365)
  const delta = 0.409 * Math.sin((2 * Math.PI * J) / 365 - 1.39)
  const ws = Math.acos(-Math.tan(phi) * Math.tan(delta))
  const Ra =
    ((24 * 60) / Math.PI) *
    GSC *
    dr *
    (ws * Math.sin(phi) * Math.sin(delta) + Math.cos(phi) * Math.cos(delta) * Math.sin(ws))
  return Math.max(0, Ra)
}

function hargreavesET0(tMax: number, tMin: number, Ra: number): number {
  const tMean = (tMax + tMin) / 2
  const et0 = 0.0023 * (tMean + 17.8) * Math.sqrt(Math.max(0, tMax - tMin)) * Ra * 0.408
  return Math.max(0, Math.round(et0 * 10) / 10)
}

// Coeficientes Kc simplificados por cultura (fase mid-season, FAO-56 Table 12)
const KC: Record<string, number> = {
  soja: 1.0, milho: 1.2, café: 0.95, cana: 1.25, feijão: 1.05,
  trigo: 1.1, algodão: 1.15, arroz: 1.2, pastagem: 0.85, default: 1.0,
}

function kcForCultura(cultura: string): number {
  const k = cultura?.toLowerCase()
  return KC[k] ?? KC.default
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const cultura = req.nextUrl.searchParams.get('cultura') ?? 'padrão'

    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      include: { properties: { take: 1, select: { name: true, lat: true, lng: true } } },
    })

    const property = dbUser?.properties[0]
    if (!property?.lat || !property?.lng) {
      return NextResponse.json({ error: 'Propriedade sem localização' }, { status: 422 })
    }

    const { lat, lng } = property

    // Open-Meteo: 7-day forecast
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=America%2FSao_Paulo&forecast_days=7`
    const res = await fetch(url, { next: { revalidate: 1800 } })
    if (!res.ok) return NextResponse.json({ error: 'Falha ao buscar clima' }, { status: 502 })

    const weather = await res.json()
    const Kc = kcForCultura(cultura)

    let cumulativeBalance = 0
    const dias = weather.daily.time.map((date: string, i: number) => {
      const tMax  = weather.daily.temperature_2m_max[i]
      const tMin  = weather.daily.temperature_2m_min[i]
      const precip = weather.daily.precipitation_sum[i] ?? 0
      const J     = dayOfYear(date)
      const Ra    = raExtrat(lat, J)
      const et0   = hargreavesET0(tMax, tMin, Ra)
      const etc   = Math.round(et0 * Kc * 10) / 10
      const balance = Math.round((precip - etc) * 10) / 10
      cumulativeBalance += balance

      return {
        date,
        tMax: Math.round(tMax),
        tMin: Math.round(tMin),
        precip: Math.round(precip * 10) / 10,
        et0,
        etc,
        balance,
        cumulativeBalance: Math.round(cumulativeBalance * 10) / 10,
        estresse: etc > precip && balance < -3 ? 'alto' : etc > precip ? 'moderado' : 'normal',
      }
    })

    const totalPrecip = dias.reduce((s: number, d: { precip: number }) => s + d.precip, 0)
    const totalEtc    = dias.reduce((s: number, d: { etc: number }) => s + d.etc, 0)
    const deficitTotal = Math.round((totalEtc - totalPrecip) * 10) / 10
    const diasEstresse = dias.filter((d: { estresse: string }) => d.estresse !== 'normal').length

    // NIM interpreta os resultados físicos
    const analise = await groq([{
      role: 'user',
      content: `Você é um agrônomo especialista em manejo de irrigação e fisiologia vegetal.
Analise os dados físicos abaixo e gere recomendações práticas.

Propriedade: ${property.name} (lat: ${lat.toFixed(2)}, lng: ${lng.toFixed(2)})
Cultura atual: ${cultura} (Kc = ${Kc})

Simulação Hargreaves (7 dias):
${dias.map((d: any) => `${d.date}: Tmax ${d.tMax}°C, precip ${d.precip}mm, ET0 ${d.et0}mm, ETc ${d.etc}mm, balanço ${d.balance}mm (${d.estresse})`).join('\n')}

Resumo:
- Precipitação total 7d: ${totalPrecip.toFixed(1)} mm
- Evapotranspiração total 7d (ETc): ${totalEtc.toFixed(1)} mm
- Déficit hídrico acumulado: ${deficitTotal > 0 ? deficitTotal + ' mm' : 'Sem déficit'}
- Dias com estresse: ${diasEstresse}/7

Responda com:
1. Avaliação geral do balanço hídrico (2 frases)
2. Recomendação de irrigação para os próximos 7 dias (quando irrigar, quanto)
3. Alerta principal (se houver)`,
    }], 500)

    return NextResponse.json({
      cultura,
      kc: Kc,
      dias,
      resumo: { totalPrecip: Math.round(totalPrecip * 10) / 10, totalEtc: Math.round(totalEtc * 10) / 10, deficitTotal, diasEstresse },
      analiseIA: analise,
      modelo: 'Hargreaves-Samani ET0 (FAO-56) + NVIDIA NIM',
    })
  } catch (e: any) {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

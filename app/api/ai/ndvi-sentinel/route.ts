import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { groq } from '@/lib/groq'

export const maxDuration = 60

// Element84 Earth Search — STAC API gratuita para Sentinel-2
const STAC_URL = 'https://earth-search.aws.element84.com/v1'

async function geocodificar(location: string): Promise<{ lat: number; lon: number } | null> {
  const key = process.env.OPENWEATHER_API_KEY
  if (!key || !location) return null
  try {
    const res = await fetch(
      `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(location)},BR&limit=1&appid=${key}`,
      { signal: AbortSignal.timeout(4000) }
    )
    const geo = res.ok ? await res.json() : []
    return geo[0] ? { lat: geo[0].lat, lon: geo[0].lon } : null
  } catch { return null }
}

async function buscarCenasSentinel(lat: number, lon: number, diasRetro = 30) {
  const delta = 0.15 // ~15 km de raio
  const bbox  = [lon - delta, lat - delta, lon + delta, lat + delta]

  const dataInicio = new Date()
  dataInicio.setDate(dataInicio.getDate() - diasRetro)
  const dtStr = dataInicio.toISOString().split('T')[0]

  try {
    const res = await fetch(`${STAC_URL}/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        collections: ['sentinel-2-l2a'],
        bbox,
        datetime: `${dtStr}T00:00:00Z/..`,
        query: { 'eo:cloud_cover': { lt: 30 } },
        sortby: [{ field: 'datetime', direction: 'desc' }],
        limit: 5,
        fields: {
          include: ['id', 'datetime', 'properties.eo:cloud_cover', 'properties.s2:mgrs_tile',
                    'properties.s2:nodata_pixel_percentage', 'properties.platform', 'links'],
          exclude: ['assets'],
        },
      }),
      signal: AbortSignal.timeout(10000),
    })

    if (!res.ok) return null
    const data = await res.json()
    return data.features ?? []
  } catch { return null }
}

async function buscarNDVIHistory(lat: number, lon: number): Promise<{ data: string; ndvi: number }[]> {
  // NASA POWER retorna ALLSKY_SFC_SW_DWN (radiação), mas não NDVI diretamente
  // Usamos EVI/NDVI via MODIS através do AppEEARS endpoint alternativo
  // Para simplificar, usamos NASA POWER para dados climáticos que correlacionam com vegetação
  try {
    const hoje = new Date()
    const inicio = new Date(hoje); inicio.setDate(hoje.getDate() - 90)
    const fmt = (d: Date) => d.toISOString().split('T')[0].replace(/-/g, '')
    const url = `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=PRECTOTCORR,ALLSKY_SFC_SW_DWN,T2M&community=AG&longitude=${lon}&latitude=${lat}&start=${fmt(inicio)}&end=${fmt(hoje)}&format=JSON`
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
    if (!res.ok) return []
    const data = await res.json()

    const chuvas = data?.properties?.parameter?.PRECTOTCORR ?? {}
    const radiacao = data?.properties?.parameter?.ALLSKY_SFC_SW_DWN ?? {}

    // Proxy simples: correlação positiva entre chuva acumulada e vigor vegetativo (NDVI estimado)
    const entries = Object.keys(chuvas).sort().slice(-30).map(k => {
      const prec = Number(chuvas[k]) > 0 ? Number(chuvas[k]) : 0
      const rad  = Number(radiacao[k]) > 0 ? Number(radiacao[k]) : 0
      // NDVI simplificado heurístico — não é NDVI real, é proxy educativo
      const ndviProxy = Math.min(0.9, Math.max(0.1, 0.3 + (prec / 10) * 0.4 - (rad > 20 ? 0.05 : 0)))
      return { data: `${k.slice(0, 4)}-${k.slice(4, 6)}-${k.slice(6, 8)}`, ndvi: Math.round(ndviProxy * 100) / 100 }
    })
    return entries
  } catch { return [] }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      select: {
        name: true,
        properties: {
          take: 1,
          select: {
            name: true,
            location: true,
            sizeHectares: true,
            fields: { select: { name: true, sizeHectares: true } },
          },
        },
      },
    })

    const p = dbUser?.properties[0]
    if (!p) return NextResponse.json({ error: 'Propriedade não encontrada' }, { status: 404 })
    if (!p.location) return NextResponse.json({ error: 'Localização da propriedade não informada. Cadastre o município/região.' }, { status: 400 })

    const coords = await geocodificar(p.location)
    if (!coords) return NextResponse.json({ error: 'Não foi possível geocodificar a localização da fazenda' }, { status: 400 })

    const [cenas, ndviHistory] = await Promise.all([
      buscarCenasSentinel(coords.lat, coords.lon),
      buscarNDVIHistory(coords.lat, coords.lon),
    ])

    // Processa as cenas Sentinel-2 encontradas
    const cenesProcessadas = (cenas ?? []).slice(0, 5).map((f: any) => ({
      id: f.id,
      data: f.properties?.datetime?.split('T')[0],
      coberturaNuvens: Math.round(f.properties?.['eo:cloud_cover'] ?? 0),
      tile: f.properties?.['s2:mgrs_tile'],
      satelite: f.properties?.platform,
    }))

    const ultimaCena = cenesProcessadas[0]
    const ndviRecente = ndviHistory.slice(-7)
    const ndviMedio = ndviRecente.length > 0
      ? Math.round(ndviRecente.reduce((s, v) => s + v.ndvi, 0) / ndviRecente.length * 100) / 100
      : null

    const classNDVI = ndviMedio === null ? 'indefinido'
      : ndviMedio >= 0.7 ? 'excelente (vegetação densa)'
      : ndviMedio >= 0.5 ? 'bom (vegetação saudável)'
      : ndviMedio >= 0.35 ? 'moderado (estresse hídrico leve)'
      : ndviMedio >= 0.2 ? 'baixo (estresse severo ou solo exposto)'
      : 'crítico (solo nu ou vegetação morta)'

    const hoje = new Date()
    const analise = await groq([{
      role: 'user',
      content: `Você é um especialista em sensoriamento remoto agrícola e gestão de pastagens/lavouras brasileiras.

Analise os dados de vegetação abaixo e forneça um diagnóstico agronômico completo.

Fazenda: ${p.name} | Localização: ${p.location} | Área: ${p.sizeHectares ?? '?'} ha
Data de análise: ${hoje.toLocaleDateString('pt-BR')}

SENTINEL-2 (últimas cenas disponíveis na área):
${cenesProcessadas.length > 0
  ? cenesProcessadas.map(c => `  • ${c.data} — ${c.coberturaNuvens}% nuvens — satélite ${c.satelite} (tile ${c.tile})`).join('\n')
  : '  Nenhuma cena encontrada nos últimos 30 dias com < 30% de nuvens'}

ÍNDICE DE VEGETAÇÃO ESTIMADO (proxy via NASA POWER — últimos 30 dias):
${ndviHistory.slice(-10).map(v => `  ${v.data}: NDVI ${v.ndvi}`).join('\n')}

NDVI médio (últimos 7 dias): ${ndviMedio ?? 'indisponível'} — ${classNDVI}

Com base nesses dados, forneça:
1. Diagnóstico do estado da vegetação na fazenda
2. Tendência (melhora, estabilidade ou piora no período)
3. Possíveis causas agronômicas (déficit hídrico, pragas, época de plantio/colheita)
4. Ações recomendadas para os próximos 30 dias

Máximo 4 parágrafos. Responda em português brasileiro.`,
    }], 500)

    return NextResponse.json({
      ok: true,
      fazenda: p.name,
      localizacao: p.location,
      coordenadas: coords,
      sentinel2: {
        cenesEncontradas: cenesProcessadas.length,
        ultimaCena,
        cenas: cenesProcessadas,
      },
      vegetacao: {
        ndviMedio,
        classificacao: classNDVI,
        historico30dias: ndviHistory,
        nota: 'NDVI estimado via proxy climático (NASA POWER). Para NDVI real de pixel, use Sentinel Hub ou Google Earth Engine.',
      },
      analiseIA: analise,
    })
  } catch (e: any) {
    console.error('[NDVISentinel Error]', e?.message)
    return NextResponse.json({ error: e?.message ?? 'Erro interno' }, { status: 500 })
  }
}

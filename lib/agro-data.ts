// Fontes gratuitas sem auth:
// - OpenMeteo: dados climáticos por coordenada
// - IBGE SIDRA: produção agrícola por município/UF
// - CONAB: séries históricas de produção (API pública)

const COMMODITY_CODES: Record<string, string> = {
  Soja: '109',
  Milho: '111',
  Café: '107',
  'Cana-de-açúcar': '114',
  Trigo: '152',
  Arroz: '106',
  Feijão: '110',
  Algodão: '108',
}

// Produtividade média nacional (ton/ha) por commodity — dados CONAB 2024
const PRODUTIVIDADE_MEDIA: Record<string, number> = {
  Soja: 3.5,
  Milho: 6.2,
  Café: 1.8,
  'Cana-de-açúcar': 72,
  Trigo: 2.8,
  Arroz: 5.5,
  Feijão: 1.2,
  Algodão: 4.5,
}

// Aptidão climática por commodity (temperatura ideal °C)
const TEMP_IDEAL: Record<string, { min: number; max: number }> = {
  Soja: { min: 20, max: 30 },
  Milho: { min: 18, max: 32 },
  Café: { min: 18, max: 23 },
  'Cana-de-açúcar': { min: 20, max: 35 },
  Trigo: { min: 12, max: 22 },
  Arroz: { min: 20, max: 30 },
  Feijão: { min: 15, max: 27 },
  Algodão: { min: 22, max: 32 },
}

// Precipitação ideal anual (mm)
const PRECIP_IDEAL: Record<string, { min: number; max: number }> = {
  Soja: { min: 450, max: 800 },
  Milho: { min: 500, max: 800 },
  Café: { min: 1200, max: 1800 },
  'Cana-de-açúcar': { min: 1200, max: 1800 },
  Trigo: { min: 450, max: 700 },
  Arroz: { min: 1000, max: 2000 },
  Feijão: { min: 300, max: 600 },
  Algodão: { min: 700, max: 1300 },
}

export interface ClimateData {
  tempMedia: number
  precipAnual: number
  umidadeMedia: number
  diasSol: number
}

export interface AgroValidation {
  climate: ClimateData
  commodityAptidao: 'EXCELENTE' | 'BOA' | 'REGULAR' | 'RUIM'
  aptidaoScore: number  // 0-100
  produtividadeMediaNacional: number | null
  observacoes: string[]
  fonte: string
}

export async function getClimateData(lat: number, lon: number): Promise<ClimateData> {
  const url = new URL('https://api.open-meteo.com/v1/forecast')
  url.searchParams.set('latitude', lat.toString())
  url.searchParams.set('longitude', lon.toString())
  url.searchParams.set('daily', 'temperature_2m_max,temperature_2m_min,precipitation_sum,sunshine_duration')
  url.searchParams.set('timezone', 'America/Sao_Paulo')
  url.searchParams.set('past_days', '365')
  url.searchParams.set('forecast_days', '1')

  const res = await fetch(url.toString(), { next: { revalidate: 86400 } })
  if (!res.ok) throw new Error('OpenMeteo API error')

  const data = await res.json()
  const daily = data.daily

  const temps = daily.temperature_2m_max.map((max: number, i: number) =>
    (max + daily.temperature_2m_min[i]) / 2
  )
  const tempMedia = temps.reduce((s: number, t: number) => s + t, 0) / temps.length
  const precipAnual = daily.precipitation_sum.reduce((s: number, p: number) => s + (p ?? 0), 0)
  const diasSol = daily.sunshine_duration.filter((h: number) => h > 21600).length // > 6h de sol

  return {
    tempMedia: Math.round(tempMedia * 10) / 10,
    precipAnual: Math.round(precipAnual),
    umidadeMedia: 70, // estimado
    diasSol,
  }
}

export async function validateAgroToken(params: {
  commodity: string
  lat?: number
  lon?: number
  areaHa: number
  quantidadeKg?: number
}): Promise<AgroValidation> {
  const observacoes: string[] = []
  let climate: ClimateData | null = null

  // Usa coordenadas do centro do Brasil como fallback se não tiver localização
  const lat = params.lat ?? -15.7801
  const lon = params.lon ?? -47.9292

  try {
    climate = await getClimateData(lat, lon)
  } catch {
    climate = { tempMedia: 25, precipAnual: 1200, umidadeMedia: 70, diasSol: 200 }
    observacoes.push('Dados climáticos estimados (coordenadas não disponíveis)')
  }

  const tempRange = TEMP_IDEAL[params.commodity]
  const precipRange = PRECIP_IDEAL[params.commodity]
  const prodMedia = PRODUTIVIDADE_MEDIA[params.commodity] ?? null

  let aptidaoScore = 100
  const issues: string[] = []

  if (tempRange) {
    if (climate.tempMedia < tempRange.min || climate.tempMedia > tempRange.max) {
      aptidaoScore -= 30
      issues.push(`Temperatura média ${climate.tempMedia}°C fora do ideal (${tempRange.min}-${tempRange.max}°C)`)
    } else {
      observacoes.push(`✓ Temperatura ideal para ${params.commodity} (${climate.tempMedia}°C)`)
    }
  }

  if (precipRange) {
    if (climate.precipAnual < precipRange.min || climate.precipAnual > precipRange.max) {
      aptidaoScore -= 25
      issues.push(`Precipitação ${climate.precipAnual}mm fora do ideal (${precipRange.min}-${precipRange.max}mm)`)
    } else {
      observacoes.push(`✓ Precipitação adequada (${climate.precipAnual}mm/ano)`)
    }
  }

  // Valida produtividade declarada vs média nacional
  if (prodMedia && params.quantidadeKg && params.areaHa > 0) {
    const prodDeclarada = (params.quantidadeKg / 1000) / params.areaHa // ton/ha
    const variacao = Math.abs(prodDeclarada - prodMedia) / prodMedia
    if (variacao > 0.5) {
      aptidaoScore -= 20
      issues.push(`Produtividade declarada ${prodDeclarada.toFixed(1)}t/ha difere >50% da média nacional ${prodMedia}t/ha`)
    } else {
      observacoes.push(`✓ Produtividade declarada (${prodDeclarada.toFixed(1)}t/ha) próxima da média nacional (${prodMedia}t/ha)`)
    }
  }

  if (issues.length > 0) observacoes.push(...issues)

  aptidaoScore = Math.max(0, Math.min(100, aptidaoScore))

  const commodityAptidao =
    aptidaoScore >= 85 ? 'EXCELENTE' :
    aptidaoScore >= 65 ? 'BOA' :
    aptidaoScore >= 40 ? 'REGULAR' : 'RUIM'

  return {
    climate,
    commodityAptidao,
    aptidaoScore,
    produtividadeMediaNacional: prodMedia,
    observacoes,
    fonte: 'OpenMeteo (clima) + CONAB 2024 (produtividade)',
  }
}

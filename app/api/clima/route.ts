import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

const WMO_CODE: Record<number, { label: string; icon: string }> = {
  0:  { label: 'Céu limpo',            icon: '☀️' },
  1:  { label: 'Predominantemente limpo', icon: '🌤️' },
  2:  { label: 'Parcialmente nublado', icon: '⛅' },
  3:  { label: 'Nublado',              icon: '☁️' },
  45: { label: 'Nevoeiro',             icon: '🌫️' },
  48: { label: 'Nevoeiro com geada',   icon: '🌫️' },
  51: { label: 'Garoa leve',           icon: '🌦️' },
  53: { label: 'Garoa moderada',       icon: '🌦️' },
  55: { label: 'Garoa intensa',        icon: '🌧️' },
  61: { label: 'Chuva leve',           icon: '🌧️' },
  63: { label: 'Chuva moderada',       icon: '🌧️' },
  65: { label: 'Chuva forte',          icon: '⛈️' },
  80: { label: 'Pancadas de chuva',    icon: '🌦️' },
  81: { label: 'Pancadas moderadas',   icon: '🌧️' },
  82: { label: 'Pancadas fortes',      icon: '⛈️' },
  95: { label: 'Tempestade',           icon: '⛈️' },
  96: { label: 'Tempestade com granizo', icon: '⛈️' },
  99: { label: 'Tempestade forte',     icon: '⛈️' },
}

function wmo(code: number) {
  return WMO_CODE[code] ?? { label: 'Variável', icon: '🌡️' }
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: { properties: { take: 1, select: { id: true, name: true, lat: true, lng: true } } },
  })

  const property = dbUser?.properties[0]
  if (!property) return NextResponse.json({ error: 'Propriedade não encontrada' }, { status: 404 })

  if (!property.lat || !property.lng) {
    return NextResponse.json({ error: 'SEM_COORDENADAS' }, { status: 422 })
  }

  const { lat, lng } = property

  // Forecast (7 days)
  const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,weathercode&current_weather=true&hourly=relativehumidity_2m,windspeed_10m&timezone=America%2FSao_Paulo&forecast_days=7`

  // Historical rainfall (last 30 days)
  const today = new Date()
  const d30 = new Date(today)
  d30.setDate(d30.getDate() - 30)
  const fmt = (d: Date) => d.toISOString().split('T')[0]
  const histUrl = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lng}&start_date=${fmt(d30)}&end_date=${fmt(today)}&daily=precipitation_sum,temperature_2m_max,temperature_2m_min&timezone=America%2FSao_Paulo`

  const [forecastRes, histRes] = await Promise.all([
    fetch(forecastUrl, { next: { revalidate: 1800 } }), // cache 30 min
    fetch(histUrl,     { next: { revalidate: 3600 } }), // cache 1h
  ])

  if (!forecastRes.ok) return NextResponse.json({ error: 'Falha ao buscar previsão' }, { status: 502 })

  const forecast = await forecastRes.json()
  const hist = histRes.ok ? await histRes.json() : null

  // Build daily forecast
  const days = forecast.daily.time.map((date: string, i: number) => ({
    date,
    tMax:    Math.round(forecast.daily.temperature_2m_max[i]),
    tMin:    Math.round(forecast.daily.temperature_2m_min[i]),
    precip:  Math.round((forecast.daily.precipitation_sum[i] ?? 0) * 10) / 10,
    rainPct: forecast.daily.precipitation_probability_max[i] ?? 0,
    code:    forecast.daily.weathercode[i],
    ...wmo(forecast.daily.weathercode[i]),
  }))

  // Current conditions (first hourly data point matching current hour)
  const current = forecast.current_weather
  const humidity = forecast.hourly?.relativehumidity_2m?.[0] ?? null
  const windspeed = current.windspeed

  // Historical precipitation (last 30 days)
  const history = hist ? hist.daily.time.map((date: string, i: number) => ({
    date,
    precip: Math.round((hist.daily.precipitation_sum[i] ?? 0) * 10) / 10,
    tMax:   Math.round(hist.daily.temperature_2m_max[i]),
    tMin:   Math.round(hist.daily.temperature_2m_min[i]),
  })) : []

  const totalRain30d = history.reduce((s: number, d: { precip: number }) => s + d.precip, 0)
  const rainDays30d  = history.filter((d: { precip: number }) => d.precip > 1).length

  // Agro insights
  const insights: { type: 'warning' | 'info' | 'ok'; text: string }[] = []
  const nextRain = days.find((d: { rainPct: number; date: string }) => d.rainPct >= 60 && d.date !== days[0]?.date)
  if (nextRain) insights.push({ type: 'info', text: `Chuva prevista em ${new Date(nextRain.date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long' })} (${nextRain.rainPct}% probabilidade)` })
  if (days[0]?.tMax >= 35) insights.push({ type: 'warning', text: 'Temperatura elevada hoje — aumente a frequência de irrigação' })
  if (days[0]?.tMin <= 5) insights.push({ type: 'warning', text: 'Risco de geada esta noite — proteja culturas sensíveis' })
  if (totalRain30d < 30) insights.push({ type: 'warning', text: `Déficit hídrico: apenas ${totalRain30d.toFixed(0)} mm nos últimos 30 dias` })
  if (totalRain30d > 200) insights.push({ type: 'info', text: `Precipitação elevada no mês: ${totalRain30d.toFixed(0)} mm — verifique drenagem` })
  if (insights.length === 0) insights.push({ type: 'ok', text: 'Condições climáticas favoráveis para as atividades agrícolas' })

  return NextResponse.json({
    property: property.name,
    lat, lng,
    current: {
      temp:     Math.round(current.temperature),
      windspeed: Math.round(windspeed),
      humidity,
      code:     current.weathercode,
      ...wmo(current.weathercode),
    },
    days,
    history,
    summary: { totalRain30d: Math.round(totalRain30d * 10) / 10, rainDays30d },
    insights,
    updatedAt: new Date().toISOString(),
  })
}

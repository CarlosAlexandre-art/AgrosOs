import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { groq } from '@/lib/groq'

export const maxDuration = 60

async function buscarClimaOpenWeather(lat: number, lon: number): Promise<Record<string, unknown> | null> {
  const key = process.env.OPENWEATHER_API_KEY
  if (!key) return null
  try {
    const [currentRes, forecastRes] = await Promise.all([
      fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${key}&units=metric&lang=pt_br`),
      fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${key}&units=metric&lang=pt_br&cnt=16`),
    ])
    const current = currentRes.ok ? await currentRes.json() : null
    const forecast = forecastRes.ok ? await forecastRes.json() : null
    return { current, forecast }
  } catch {
    return null
  }
}

async function buscarNasaPower(lat: number, lon: number): Promise<Record<string, unknown> | null> {
  try {
    const today = new Date()
    const start = new Date(today); start.setDate(today.getDate() - 30)
    const fmt = (d: Date) => d.toISOString().split('T')[0].replace(/-/g, '')
    const url = `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=PRECTOTCORR,T2M_MAX,T2M_MIN,ALLSKY_SFC_SW_DWN&community=AG&longitude=${lon}&latitude=${lat}&start=${fmt(start)}&end=${fmt(today)}&format=JSON`
    const res = await fetch(url, { signal: AbortSignal.timeout(3000) })
    if (!res.ok) return null
    const data = await res.json()
    return data?.properties?.parameter ?? null
  } catch {
    return null
  }
}

async function processarClima(req: NextRequest): Promise<NextResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  // Busca propriedade; activities pode não existir em produção — try/catch separado
  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    select: {
      properties: {
        take: 1,
        select: { id: true, name: true, location: true },
      },
    },
  })

  const property = dbUser?.properties[0]
  if (!property) return NextResponse.json({ error: 'Propriedade não encontrada' }, { status: 404 })

  // Atividades são opcionais
  let atividades = ''
  try {
    const acts = await (prisma as any).activity.findMany({
      where: { propertyId: property.id, status: { in: ['PENDING', 'IN_PROGRESS'] } },
      orderBy: { startDate: 'asc' },
      take: 10,
      select: { type: true, description: true, status: true, startDate: true },
    })
    atividades = acts.map((a: any) =>
      `${a.type} — ${a.description || ''} (${a.status}, início: ${new Date(a.startDate).toLocaleDateString('pt-BR')})`
    ).join('\n')
  } catch {}

  // Geocodificação + dados climáticos
  let lat: number | null = null
  let lon: number | null = null
  if (property.location && process.env.OPENWEATHER_API_KEY) {
    try {
      const geoRes = await fetch(
        `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(property.location)},BR&limit=1&appid=${process.env.OPENWEATHER_API_KEY}`,
        { signal: AbortSignal.timeout(3000) }
      )
      const geo = geoRes.ok ? await geoRes.json() : []
      if (geo[0]) { lat = geo[0].lat; lon = geo[0].lon }
    } catch {}
  }

  const [clima, nasa] = await Promise.all([
    lat && lon ? buscarClimaOpenWeather(lat, lon) : Promise.resolve(null),
    lat && lon ? buscarNasaPower(lat, lon) : Promise.resolve(null),
  ])

  const hoje = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })

  let contextoClima = 'Dados climáticos não disponíveis para esta localidade.'
  if (clima?.current) {
    const c = clima.current as any
    contextoClima = `Clima atual: ${c.weather?.[0]?.description}, ${Math.round(c.main?.temp)}°C, umidade ${c.main?.humidity}%, vento ${Math.round((c.wind?.speed ?? 0) * 3.6)} km/h`
    if (clima.forecast) {
      const f = clima.forecast as any
      const proximo = f.list?.slice(0, 6).map((item: any) =>
        `${new Date(item.dt * 1000).toLocaleString('pt-BR', { weekday: 'short', hour: '2-digit' })}: ${Math.round(item.main.temp)}°C, chuva ${item.pop ? Math.round(item.pop * 100) : 0}%`
      ).join(' | ')
      contextoClima += `\nPrevisão: ${proximo}`
    }
  }

  if (nasa) {
    const n = nasa as any
    const chuvas = Object.values(n.PRECTOTCORR || {}).slice(-7).map(Number)
    const totalChuva = chuvas.reduce((s: number, v) => s + v, 0)
    contextoClima += `\nNASA POWER — chuva acumulada 7d: ${totalChuva.toFixed(1)} mm`
  }

  const prompt = `Agrometeorologista especializado no Brasil. Analise e responda APENAS em JSON válido sem markdown.

Fazenda: ${property.name}${property.location ? ` — ${property.location}` : ''}
Hoje: ${hoje}
${contextoClima}
Atividades: ${atividades || 'Nenhuma'}

{"resumoClimatico":"...","riscosIdentificados":[{"tipo":"...","nivel":"baixo|medio|alto","descricao":"...","janela":"..."}],"impactoAtividades":[{"atividade":"...","impacto":"favoravel|desfavoravel|critico","recomendacao":"..."}],"janelaIdeal":"...","alertas":["..."],"recomendacoesPraticas":["..."],"condicaoGeral":"otima|boa|atencao|critica"}`

  const resultado = await groq([{ role: 'user', content: prompt }], 700)

  let analise: Record<string, unknown>
  try {
    const jsonMatch = resultado.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error()
    analise = JSON.parse(jsonMatch[0])
  } catch {
    return NextResponse.json({ error: 'Não foi possível estruturar a análise climática' })
  }

  return NextResponse.json({
    ok: true,
    localidade: property.location || property.name,
    dadosBrutos: { openweather: !!clima, nasa: !!nasa },
    analise,
  })
}

export async function POST(req: NextRequest) {
  // Timeout interno: garante JSON antes do Vercel matar a função (10s hobby / 60s pro)
  const timeout = new Promise<NextResponse>(resolve =>
    setTimeout(() => resolve(
      NextResponse.json({ error: 'Análise demorou demais. Tente novamente.' })
    ), 8500)
  )

  try {
    return await Promise.race([processarClima(req), timeout])
  } catch (e: any) {
    console.error('[ClimaInteligente]', e?.message)
    return NextResponse.json({ error: e?.message ?? 'Erro interno' }, { status: 500 })
  }
}

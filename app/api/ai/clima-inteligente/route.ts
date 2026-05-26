import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { groq } from '@/lib/groq'

export const maxDuration = 60

// Coleta todos os dados externos com timeout único de 3.5s
async function coletarDadosExternos(location: string | null): Promise<{ contextoClima: string; temOpenWeather: boolean; temNasa: boolean }> {
  const key = process.env.OPENWEATHER_API_KEY
  const vazio = { contextoClima: 'Dados climáticos não disponíveis.', temOpenWeather: false, temNasa: false }

  if (!key || !location) return vazio

  const trabalho = async () => {
    // Geocodifica
    const geoRes = await fetch(
      `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(location)},BR&limit=1&appid=${key}`,
      { signal: AbortSignal.timeout(2000) }
    ).catch(() => null)
    const geo = geoRes?.ok ? await geoRes.json().catch(() => []) : []
    if (!geo[0]) return vazio
    const { lat, lon } = geo[0]

    // OpenWeather + NASA em paralelo
    const [owRes, nasaRes] = await Promise.all([
      fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${key}&units=metric&lang=pt_br`)
        .catch(() => null),
      (async () => {
        const today = new Date()
        const s = new Date(today); s.setDate(today.getDate() - 7)
        const fmt = (d: Date) => d.toISOString().split('T')[0].replace(/-/g, '')
        const url = `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=PRECTOTCORR&community=AG&longitude=${lon}&latitude=${lat}&start=${fmt(s)}&end=${fmt(today)}&format=JSON`
        return fetch(url, { signal: AbortSignal.timeout(2000) }).catch(() => null)
      })(),
    ])

    const ow = owRes?.ok ? await owRes.json().catch(() => null) : null
    const nasaData = nasaRes?.ok ? await nasaRes.json().catch(() => null) : null

    let ctx = vazio.contextoClima
    let temOw = false, temNasa = false
    if (ow?.main) {
      temOw = true
      ctx = `Clima atual em ${location}: ${ow.weather?.[0]?.description ?? ''}, ${Math.round(ow.main.temp)}°C, umidade ${ow.main.humidity}%, vento ${Math.round((ow.wind?.speed ?? 0) * 3.6)} km/h`
    }
    if (nasaData?.properties?.parameter?.PRECTOTCORR) {
      temNasa = true
      const chuvas = Object.values(nasaData.properties.parameter.PRECTOTCORR as Record<string, number>)
      const total = chuvas.reduce((s, v) => s + v, 0)
      ctx += `\nChuva acumulada 7d (NASA): ${total.toFixed(1)} mm`
    }
    return { contextoClima: ctx, temOpenWeather: temOw, temNasa }
  }

  // Timeout global de 3.5s para toda a coleta de dados externos
  return Promise.race([
    trabalho().catch(() => vazio),
    new Promise<typeof vazio>(r => setTimeout(() => r(vazio), 3500)),
  ])
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

  // Dados externos e atividades em paralelo, com limite total de 3.5s
  const [dadosExternos, atividades] = await Promise.all([
    coletarDadosExternos(property.location ?? null),
    (async () => {
      try {
        const acts = await (prisma as any).activity.findMany({
          where: { propertyId: property.id, status: { in: ['PENDING', 'IN_PROGRESS'] } },
          orderBy: { startDate: 'asc' },
          take: 8,
          select: { type: true, description: true, status: true, startDate: true },
        })
        return acts.map((a: any) => `${a.type}: ${a.description || a.status}`).join(', ')
      } catch { return '' }
    })(),
  ])

  const hoje = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })

  const prompt = `Você é um agrometeorologista brasileiro. Analise os dados abaixo e retorne SOMENTE um objeto JSON, sem texto adicional, sem markdown, sem explicações.

Fazenda: ${property.name}${property.location ? ` (${property.location})` : ''}
Data: ${hoje}
Clima: ${dadosExternos.contextoClima}
Atividades: ${atividades || 'Nenhuma cadastrada'}

Retorne exatamente neste formato JSON:
{
  "resumoClimatico": "string",
  "riscosIdentificados": [{"tipo": "string", "nivel": "baixo", "descricao": "string", "janela": "string"}],
  "impactoAtividades": [{"atividade": "string", "impacto": "favoravel", "recomendacao": "string"}],
  "janelaIdeal": "string",
  "alertas": ["string"],
  "recomendacoesPraticas": ["string"],
  "condicaoGeral": "boa"
}`

  const resultado = await groq([{ role: 'user', content: prompt }], 600, 'llama-3.1-8b-instant')

  let analise: Record<string, unknown>
  try {
    // Remove markdown code fences e extrai o JSON
    const limpo = resultado
      .replace(/```(?:json)?/gi, '')
      .replace(/```/g, '')
      .trim()
    const jsonMatch = limpo.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error(`Sem JSON na resposta: ${limpo.slice(0, 100)}`)
    analise = JSON.parse(jsonMatch[0])
  } catch (parseErr: any) {
    console.error('[ClimaInteligente] parse falhou:', parseErr?.message)
    return NextResponse.json({ error: 'Não foi possível estruturar a análise climática' })
  }

  return NextResponse.json({
    ok: true,
    localidade: property.location || property.name,
    dadosBrutos: { openweather: dadosExternos.temOpenWeather, nasa: dadosExternos.temNasa },
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

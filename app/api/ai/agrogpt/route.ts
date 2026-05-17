import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { groqStream, Msg } from '@/lib/groq'

export const maxDuration = 60

async function geocodificar(location: string): Promise<{ lat: number; lon: number } | null> {
  const key = process.env.OPENWEATHER_API_KEY
  if (!key || !location) return null
  try {
    const res = await fetch(
      `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(location)},BR&limit=1&appid=${key}`,
      { signal: AbortSignal.timeout(3000) }
    )
    const geo = res.ok ? await res.json() : []
    return geo[0] ? { lat: geo[0].lat, lon: geo[0].lon } : null
  } catch { return null }
}

async function buscarClimaAtual(lat: number, lon: number): Promise<string> {
  const key = process.env.OPENWEATHER_API_KEY
  if (!key) return ''
  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${key}&units=metric&lang=pt_br`,
      { signal: AbortSignal.timeout(4000) }
    )
    if (!res.ok) return ''
    const d = await res.json()
    const chuvaProx = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${key}&units=metric&lang=pt_br&cnt=8`,
      { signal: AbortSignal.timeout(4000) }
    )
    let previsao = ''
    if (chuvaProx.ok) {
      const fp = await chuvaProx.json()
      const temChuva = (fp.list || []).some((i: any) => i.pop > 0.3)
      const maxTemp = Math.max(...(fp.list || []).map((i: any) => i.main.temp_max))
      previsao = ` | Próx 24h: ${temChuva ? '🌧 chuva esperada' : '☀️ sem chuva'}, máx ${Math.round(maxTemp)}°C`
    }
    return `\nCLIMA AGORA: ${d.weather?.[0]?.description}, ${Math.round(d.main?.temp)}°C (sens. ${Math.round(d.main?.feels_like)}°C), umidade ${d.main?.humidity}%, vento ${Math.round((d.wind?.speed || 0) * 3.6)} km/h${previsao}`
  } catch { return '' }
}

async function buscarNasaUltimosDias(lat: number, lon: number): Promise<string> {
  try {
    const hoje = new Date()
    const inicio = new Date(hoje); inicio.setDate(hoje.getDate() - 14)
    const fmt = (d: Date) => d.toISOString().split('T')[0].replace(/-/g, '')
    const url = `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=PRECTOTCORR,T2M_MAX,T2M_MIN&community=AG&longitude=${lon}&latitude=${lat}&start=${fmt(inicio)}&end=${fmt(hoje)}&format=JSON`
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) })
    if (!res.ok) return ''
    const data = await res.json()
    const chuvas = Object.values(data?.properties?.parameter?.PRECTOTCORR || {}).map(Number)
    const totalChuva = chuvas.reduce((s: number, v) => s + (v > 0 ? v : 0), 0)
    const maxT = Math.max(...Object.values(data?.properties?.parameter?.T2M_MAX || {}).map(Number))
    const minT = Math.min(...Object.values(data?.properties?.parameter?.T2M_MIN || {}).map(Number))
    return `\nNASA POWER (14 dias): chuva acumulada ${totalChuva.toFixed(1)} mm | temp máx ${maxT.toFixed(1)}°C / mín ${minT.toFixed(1)}°C`
  } catch { return '' }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return new Response('Não autenticado', { status: 401 })

    const { messages }: { messages: Msg[] } = await req.json()

    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      select: {
        name: true,
        properties: {
          take: 1,
          select: {
            name: true,
            sizeHectares: true,
            location: true,
            activities: {
              orderBy: { startDate: 'desc' },
              take: 20,
              select: { type: true, status: true, startDate: true, endDate: true, description: true },
            },
            costs: {
              orderBy: { date: 'desc' },
              take: 20,
              select: { amount: true, category: true, date: true, description: true },
            },
            revenues: {
              orderBy: { date: 'desc' },
              take: 15,
              select: { amount: true, category: true, date: true },
            },
            goals: {
              where: { isCompleted: false },
              select: { title: true, type: true, targetValue: true, currentValue: true },
            },
            teamMembers: { select: { name: true, role: true } },
            fields: { select: { name: true, sizeHectares: true } },
            alerts: {
              where: { read: false },
              orderBy: { createdAt: 'desc' },
              take: 5,
              select: { message: true, type: true },
            },
          },
        },
      },
    })

    const p = dbUser?.properties[0]
    if (!p) return new Response('Propriedade não encontrada', { status: 404 })

    // Dados climáticos em background (não bloqueia se falhar)
    const coords = p.location ? await geocodificar(p.location) : null
    const [climaStr, nasaStr] = coords
      ? await Promise.all([buscarClimaAtual(coords.lat, coords.lon), buscarNasaUltimosDias(coords.lat, coords.lon)])
      : ['', '']

    const totalCosts = p.costs.reduce((s, c) => s + Number(c.amount), 0)
    const totalRevenues = (p.revenues as any[]).reduce((s: number, r: any) => s + Number(r.amount), 0)
    const resultado = totalRevenues - totalCosts
    const sizeHa = Number(p.sizeHectares ?? 0)

    const late = p.activities.filter(a => a.status === 'LATE')
    const inProgress = p.activities.filter(a => a.status === 'IN_PROGRESS')
    const pending = p.activities.filter(a => a.status === 'PENDING')
    const done = p.activities.filter(a => a.status === 'DONE')

    const costsByCategory = p.costs.reduce((acc, c) => {
      acc[c.category] = (acc[c.category] || 0) + Number(c.amount)
      return acc
    }, {} as Record<string, number>)
    const topCosts = Object.entries(costsByCategory)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([cat, val]) => `${cat}: R$${val.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`)
      .join(', ')

    const systemPrompt = `Você é o AgroGPT, copiloto de inteligência agrícola do SmartAgroOS da OryonAG. Responda SEMPRE em português brasileiro. Seja direto, prático e use linguagem acessível para o produtor rural. Máximo 5 parágrafos. Use dados concretos da fazenda ao responder.

PRODUTOR: ${dbUser?.name || 'Produtor'} | Hoje: ${new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}

FAZENDA: ${p.name}${p.location ? ` | ${p.location}` : ''} | ${sizeHa > 0 ? sizeHa + ' ha' : 'área não informada'} | ${p.fields.length} talhões${p.fields.length > 0 ? ` (${p.fields.slice(0, 3).map((f: any) => f.name + (f.sizeHectares ? ` ${f.sizeHectares}ha` : '')).join(', ')})` : ''} | ${p.teamMembers.length} membros de equipe

OPERACIONAL: ${inProgress.length} em andamento, ${pending.length} pendentes, ${late.length} atrasadas, ${done.length} concluídas
${late.length > 0 ? '⚠️ ATRASADAS: ' + late.slice(0, 5).map(a => a.type).join(', ') : ''}
${inProgress.length > 0 ? 'Em andamento: ' + inProgress.slice(0, 3).map(a => a.type).join(', ') : ''}

FINANCEIRO: Receita R$${totalRevenues.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} | Custo R$${totalCosts.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} | Resultado ${resultado >= 0 ? '+' : ''}R$${resultado.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}${sizeHa > 0 ? ` | R$${Math.round(totalCosts / sizeHa)}/ha` : ''}
${topCosts ? 'Maiores custos: ' + topCosts : ''}

METAS ATIVAS: ${p.goals.length > 0 ? p.goals.map(g => `${g.title} (${Math.round((Number(g.currentValue) / Number(g.targetValue)) * 100)}%)`).join(', ') : 'nenhuma'}
${(p.alerts as any[]).length > 0 ? '🔔 ALERTAS NÃO LIDOS: ' + (p.alerts as any[]).slice(0, 3).map((a: any) => a.message).join(' | ') : ''}${climaStr}${nasaStr}`

    const stream = await groqStream([
      { role: 'system', content: systemPrompt },
      ...messages,
    ])

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (e: any) {
    console.error('[AgroGPT Error]', e?.message)
    return new Response(JSON.stringify({ error: e?.message ?? 'Erro interno' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

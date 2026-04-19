import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { groqStream, Msg } from '@/lib/groq'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return new Response('Unauthorized', { status: 401 })

    const { messages }: { messages: Msg[] } = await req.json()

    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      include: {
        properties: {
          include: {
            activities: { orderBy: { startDate: 'desc' }, take: 30 },
            costs: { orderBy: { date: 'desc' }, take: 30 },
            revenues: { orderBy: { date: 'desc' }, take: 20 },
            goals: { where: { isCompleted: false } },
            teamMembers: true,
            fields: true,
          },
        },
      },
    })

    const p = dbUser?.properties[0]
    if (!p) return new Response('Propriedade não encontrada', { status: 404 })

    const totalCosts = p.costs.reduce((s, c) => s + Number(c.amount), 0)
    const totalRevenues = (p as any).revenues?.reduce((s: number, r: any) => s + Number(r.amount), 0) ?? 0
    const resultado = totalRevenues - totalCosts
    const sizeHa = Number(p.sizeHectares ?? 0)
    const acts = p.activities as any[]
    const late = acts.filter(a => a.status === 'LATE')
    const inProgress = acts.filter(a => a.status === 'IN_PROGRESS')
    const pending = acts.filter(a => a.status === 'PENDING')

    const costsMonth = p.costs.filter((c: any) => {
      const d = new Date(c.date)
      const now = new Date()
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    })

    const systemPrompt = `Você é o Assistente IA do AgroOS — sistema operacional para produtores rurais brasileiros.
Responda SEMPRE em português brasileiro. Seja direto, prático, use linguagem simples que um produtor rural entenda.
Máximo 4 parágrafos curtos. Use listas quando ajudar na clareza. Nunca invente dados que não estão abaixo.

━━━ FAZENDA: ${p.name} ━━━
Área: ${sizeHa > 0 ? sizeHa + ' ha' : 'não informada'}
Talhões: ${p.fields.length} (${p.fields.map((f: any) => f.name).join(', ') || 'nenhum'})
Equipe: ${p.teamMembers.length} membros (${p.teamMembers.map((m: any) => `${m.name} - ${m.role}`).join(', ') || 'nenhum'})

━━━ OPERACIONAL ━━━
Em andamento: ${inProgress.length} — ${inProgress.slice(0, 3).map((a: any) => a.type).join(', ') || 'nenhuma'}
Pendentes: ${pending.length} — ${pending.slice(0, 3).map((a: any) => a.type).join(', ') || 'nenhuma'}
Atrasadas: ${late.length} — ${late.slice(0, 3).map((a: any) => `${a.type} (iniciou ${new Date(a.startDate).toLocaleDateString('pt-BR')})`).join(', ') || 'nenhuma'}
Concluídas (total): ${acts.filter(a => a.status === 'DONE').length}

━━━ FINANCEIRO ━━━
Receita total: R$ ${totalRevenues.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
Custo total: R$ ${totalCosts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
Resultado: ${resultado >= 0 ? '+' : ''}R$ ${resultado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
${sizeHa > 0 ? `Custo/ha: R$ ${(totalCosts / sizeHa).toFixed(0)} | Receita/ha: R$ ${(totalRevenues / sizeHa).toFixed(0)}` : ''}
Gastos este mês: R$ ${costsMonth.reduce((s, c) => s + Number(c.amount), 0).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
Categorias de custo: ${(() => {
  const byCat: Record<string, number> = {}
  p.costs.forEach((c: any) => { byCat[c.category] = (byCat[c.category] || 0) + Number(c.amount) })
  return Object.entries(byCat).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}: R$${v.toFixed(0)}`).join(', ')
})()}

━━━ METAS ATIVAS ━━━
${(p as any).goals?.length > 0
  ? (p as any).goals.map((g: any) => {
    const pct = Number(g.targetValue) > 0 ? Math.round((Number(g.currentValue) / Number(g.targetValue)) * 100) : 0
    return `${g.title} (${g.type}) — ${pct}% de R$${Number(g.targetValue).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`
  }).join('\n')
  : 'Nenhuma meta cadastrada'}

Hoje: ${new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`

    const stream = await groqStream([
      { role: 'system', content: systemPrompt },
      ...messages,
    ])

    // Transform Groq SSE to plain text stream (client reads token by token)
    const encoder = new TextEncoder()
    const decoder = new TextDecoder()
    let buffer = ''

    const transformed = new ReadableStream({
      async start(controller) {
        const reader = stream.getReader()
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')
            buffer = lines.pop() ?? ''
            for (const line of lines) {
              if (!line.startsWith('data: ')) continue
              const data = line.slice(6).trim()
              if (data === '[DONE]') { controller.close(); return }
              try {
                const parsed = JSON.parse(data)
                const token = parsed.choices?.[0]?.delta?.content
                if (token) controller.enqueue(encoder.encode(token))
              } catch { /* skip */ }
            }
          }
          controller.close()
        } catch (e) {
          controller.error(e)
        }
      },
    })

    return new Response(transformed, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-cache' },
    })
  } catch (e: any) {
    console.error('AI chat error:', e)
    return new Response(e.message || 'Erro interno', { status: 500 })
  }
}

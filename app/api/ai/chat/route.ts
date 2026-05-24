import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { groq, Msg } from '@/lib/groq'
import { rateLimit } from '@/lib/rate-limit'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    // Rate limit: 30 mensagens por hora por usuário
    const { allowed } = rateLimit(`ai-chat:${user.id}`, 30, 3600_000)
    if (!allowed) {
      return NextResponse.json({ error: 'Limite de mensagens atingido. Tente novamente em 1 hora.' }, { status: 429 })
    }

    const { messages }: { messages: Msg[] } = await req.json()

    // Query mínima para reduzir latência
    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      select: {
        properties: {
          take: 1,
          select: {
            name: true,
            sizeHectares: true,
            activities: {
              orderBy: { startDate: 'desc' },
              take: 15,
              select: { type: true, status: true, startDate: true },
            },
            costs: {
              orderBy: { date: 'desc' },
              take: 15,
              select: { amount: true, category: true, date: true },
            },
            revenues: {
              orderBy: { date: 'desc' },
              take: 10,
              select: { amount: true },
            },
            goals: {
              where: { isCompleted: false },
              select: { title: true, type: true, targetValue: true, currentValue: true },
            },
            teamMembers: { select: { name: true, role: true } },
            fields: { select: { name: true } },
          },
        },
      },
    })

    const p = dbUser?.properties[0]
    if (!p) return NextResponse.json({ error: 'Propriedade não encontrada' }, { status: 404 })

    const totalCosts = p.costs.reduce((s, c) => s + Number(c.amount), 0)
    const totalRevenues = (p.revenues as any[]).reduce((s: number, r: any) => s + Number(r.amount), 0)
    const sizeHa = Number(p.sizeHectares ?? 0)
    const acts = p.activities
    const late = acts.filter(a => a.status === 'LATE')
    const inProgress = acts.filter(a => a.status === 'IN_PROGRESS')
    const pending = acts.filter(a => a.status === 'PENDING')
    const done = acts.filter(a => a.status === 'DONE')

    const systemPrompt = `Você é o Assistente IA do SmartAgroOS. Responda SEMPRE em português brasileiro. Seja direto e prático. Máximo 4 parágrafos curtos.

FAZENDA: ${p.name} | ${sizeHa > 0 ? sizeHa + ' ha' : 'área não informada'} | ${p.fields.length} talhões | ${p.teamMembers.length} membros

OPERACIONAL: ${inProgress.length} em andamento, ${pending.length} pendentes, ${late.length} atrasadas, ${done.length} concluídas
${late.length > 0 ? 'Atrasadas: ' + late.slice(0, 3).map(a => a.type).join(', ') : ''}

FINANCEIRO: Receita R$${totalRevenues.toLocaleString('pt-BR', { minimumFractionDigits: 0 })} | Custo R$${totalCosts.toLocaleString('pt-BR', { minimumFractionDigits: 0 })} | Resultado ${totalRevenues - totalCosts >= 0 ? '+' : ''}R$${(totalRevenues - totalCosts).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}${sizeHa > 0 ? ` | R$${Math.round(totalCosts / sizeHa)}/ha` : ''}

METAS ATIVAS: ${p.goals.length > 0 ? p.goals.map(g => `${g.title} (${Math.round((Number(g.currentValue) / Number(g.targetValue)) * 100)}%)`).join(', ') : 'nenhuma'}

Hoje: ${new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`

    const text = await groq([
      { role: 'system', content: systemPrompt },
      ...messages,
    ], 800)

    return NextResponse.json({ text })
  } catch (e: any) {
    console.error('[AI Chat Error]', e?.message, e?.code)
    return NextResponse.json({ error: e?.message ?? 'Erro interno' }, { status: 500 })
  }
}

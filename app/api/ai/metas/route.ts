import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { groq } from '@/lib/groq'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      include: { properties: { include: { goals: true, revenues: true, costs: true, activities: true } } },
    })
    const p = dbUser?.properties[0]
    if (!p) return NextResponse.json({ error: 'Sem propriedade' }, { status: 404 })

    const activeGoals = (p as any).goals?.filter((g: any) => !g.isCompleted) ?? []
    if (activeGoals.length === 0) return NextResponse.json({ conselho: 'Nenhuma meta ativa. Crie metas na página de Metas para receber análises personalizadas.' })

    const totalRevenues = (p as any).revenues?.reduce((s: number, r: any) => s + Number(r.amount), 0) ?? 0
    const totalCosts = p.costs.reduce((s, c) => s + Number(c.amount), 0)
    const doneActivities = (p.activities as any[]).filter(a => a.status === 'DONE').length

    const goalsText = activeGoals.map((g: any) => {
      let current = Number(g.currentValue)
      if (g.type === 'REVENUE') current = Math.max(current, totalRevenues)
      if (g.type === 'COST') current = Math.max(current, totalCosts)
      if (g.type === 'ACTIVITIES') current = Math.max(current, doneActivities)
      const pct = Number(g.targetValue) > 0 ? Math.round((current / Number(g.targetValue)) * 100) : 0
      return `Meta: ${g.title} | Tipo: ${g.type} | Progresso: ${pct}% | Prazo: ${g.deadline ? new Date(g.deadline).toLocaleDateString('pt-BR') : 'sem prazo'}`
    }).join('\n')

    const text = await groq([{
      role: 'user',
      content: `Como consultor agrícola, analise as metas ativas desta fazenda e dê um conselho estratégico.
Máximo 2 parágrafos. Seja específico com os números.

${goalsText}

Contexto financeiro atual:
- Receita acumulada: R$ ${totalRevenues.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
- Custo acumulado: R$ ${totalCosts.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
- Atividades concluídas: ${doneActivities}`
    }], 400)

    return NextResponse.json({ conselho: text })
  } catch (e: any) {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

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
      include: { properties: { include: { activities: true, costs: true, revenues: true, teamMembers: true } } },
    })
    const p = dbUser?.properties[0]
    if (!p) return NextResponse.json({ error: 'Sem propriedade' }, { status: 404 })

    const now = new Date()
    const mes = now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    const acts = p.activities as any[]
    const mesActs = acts.filter(a => {
      const d = new Date(a.startDate)
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    })
    const mesCosts = p.costs.filter((c: any) => {
      const d = new Date(c.date)
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    })
    const mesRevenues = ((p as any).revenues ?? []).filter((r: any) => {
      const d = new Date(r.date)
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    })

    const text = await groq([{
      role: 'user',
      content: `Escreva um relatório executivo mensal para ${mes} da fazenda "${p.name}".
Use linguagem profissional mas acessível. Máximo 3 parágrafos.

Dados do mês:
- Atividades realizadas: ${mesActs.filter((a: any) => a.status === 'DONE').length} concluídas, ${mesActs.filter((a: any) => a.status === 'LATE').length} atrasadas
- Custos do mês: R$ ${mesCosts.reduce((s, c) => s + Number(c.amount), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
- Receitas do mês: R$ ${mesRevenues.reduce((s: number, r: any) => s + Number(r.amount), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
- Equipe: ${p.teamMembers.length} membros
- Principais atividades: ${mesActs.slice(0, 5).map((a: any) => a.type).join(', ') || 'nenhuma'}

O relatório deve cobrir: resumo operacional, situação financeira e recomendações para o próximo mês.`
    }], 600)

    return NextResponse.json({ relatorio: text, mes })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

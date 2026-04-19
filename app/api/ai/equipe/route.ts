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
      include: {
        properties: {
          include: {
            teamMembers: { include: { activities: { orderBy: { createdAt: 'desc' }, take: 10 } } },
            activities: { where: { status: { in: ['PENDING', 'LATE'] } }, take: 20 },
          },
        },
      },
    })
    const p = dbUser?.properties[0]
    if (!p) return NextResponse.json({ error: 'Sem propriedade' }, { status: 404 })

    if (p.teamMembers.length === 0) return NextResponse.json({ analise: 'Nenhum membro de equipe cadastrado ainda. Adicione membros em Equipe para receber análises de otimização.' })

    const teamInfo = p.teamMembers.map((m: any) => {
      const done = m.activities.filter((a: any) => a.status === 'DONE').length
      const late = m.activities.filter((a: any) => a.status === 'LATE').length
      const current = m.activities.filter((a: any) => a.status === 'IN_PROGRESS').length
      return `${m.name} (${m.role}): ${done} concluídas, ${current} em andamento, ${late} atrasadas`
    }).join('\n')

    const pendentes = (p.activities as any[]).slice(0, 10).map((a: any) => `${a.type} (${a.status})`).join(', ')

    const text = await groq([{
      role: 'user',
      content: `Analise a equipe desta fazenda e sugira otimização de alocação de tarefas.
Máximo 3 recomendações práticas. Seja específico com nomes.

Equipe:
${teamInfo}

Atividades pendentes/atrasadas: ${pendentes || 'nenhuma'}

Responda em texto corrido, em português, com recomendações numeradas.`
    }], 400)

    return NextResponse.json({ analise: text })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

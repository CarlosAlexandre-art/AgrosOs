import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { groq } from '@/lib/groq'
import { NextResponse } from 'next/server'

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

function diasAtraso(endDate: Date | null): number {
  if (!endDate) return 0
  const diff = Date.now() - new Date(endDate).getTime()
  return diff > 0 ? Math.floor(diff / 86400000) : 0
}

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
            teamMembers: {
              include: {
                activities: {
                  orderBy: { createdAt: 'desc' },
                  take: 30,
                  select: { type: true, status: true, startDate: true, endDate: true },
                },
              },
            },
            activities: {
              where: { status: { in: ['PENDING', 'LATE', 'IN_PROGRESS'] } },
              orderBy: { startDate: 'asc' },
              take: 30,
              select: { type: true, status: true, startDate: true, endDate: true, assignedToId: true },
            },
          },
        },
      },
    })

    const p = dbUser?.properties[0]
    if (!p) return NextResponse.json({ error: 'Sem propriedade' }, { status: 404 })

    if (p.teamMembers.length === 0) {
      return NextResponse.json({ analise: 'Nenhum membro de equipe cadastrado ainda. Adicione membros em Equipe para receber análises de otimização.' })
    }

    const mesAtual = MESES[new Date().getMonth()]
    const totalPendentes = p.activities.length

    // Constrói perfil detalhado por membro
    const perfilEquipe = p.teamMembers.map((m: any) => {
      const ativs = m.activities as any[]
      const done      = ativs.filter(a => a.status === 'DONE').length
      const late      = ativs.filter(a => a.status === 'LATE').length
      const progress  = ativs.filter(a => a.status === 'IN_PROGRESS').length
      const total     = ativs.length
      const taxaConclusao = total > 0 ? Math.round((done / total) * 100) : 0
      const taxaAtraso    = (done + late) > 0 ? Math.round((late / (done + late)) * 100) : 0

      // Tipos de atividade mais realizados
      const tiposCount: Record<string, number> = {}
      for (const a of ativs.filter(a => a.status === 'DONE')) {
        tiposCount[a.type] = (tiposCount[a.type] ?? 0) + 1
      }
      const especialidades = Object.entries(tiposCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([t]) => t)
        .join(', ') || 'sem histórico'

      // Atividades atrasadas com dias de atraso
      const atrasadasDetalhe = ativs
        .filter(a => a.status === 'LATE')
        .map(a => `${a.type} (${diasAtraso(a.endDate)}d atraso)`)
        .join(', ') || 'nenhuma'

      // Carga atual na propriedade (pendentes atribuídas a este membro)
      const cargaAtual = p.activities.filter((a: any) => a.assignedToId === m.id).length

      return `• ${m.name} (${m.role})
  Taxa de conclusão: ${taxaConclusao}% | Taxa de atraso: ${taxaAtraso}%
  Carga atual (pendentes): ${cargaAtual} tarefa(s) | Em andamento: ${progress}
  Especializações: ${especialidades}
  Atrasadas: ${atrasadasDetalhe}`
    }).join('\n\n')

    // Atividades sem responsável
    const semResponsavel = p.activities.filter((a: any) => !a.assignedToId).length
    const maisUrgentes = p.activities
      .filter((a: any) => a.status === 'LATE')
      .slice(0, 5)
      .map((a: any) => `${a.type} (${diasAtraso(a.endDate)}d atraso)`)
      .join(', ') || 'nenhuma urgente'

    const text = await groq([{
      role: 'user',
      content: `Você é um consultor especialista em gestão de equipes rurais no Brasil.
Analise a equipe abaixo e gere recomendações de otimização baseadas em dados reais.

Mês atual: ${mesAtual} (considere a sazonalidade agrícola brasileira)
Total de tarefas pendentes/atrasadas na fazenda: ${totalPendentes}
Tarefas sem responsável designado: ${semResponsavel}
Tarefas mais urgentes: ${maisUrgentes}

Perfil da equipe:
${perfilEquipe}

Gere exatamente 3 recomendações práticas e específicas com nomes reais dos membros.
Considere sazonalidade do mês de ${mesAtual}, taxa de atraso de cada membro e especialidades.
Formato: recomendações numeradas em texto corrido, em português.`
    }], 600)

    return NextResponse.json({ analise: text })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

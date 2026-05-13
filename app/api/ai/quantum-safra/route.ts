import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { groq } from '@/lib/groq'
import { solveQUBO, type Phase, type Member } from '@/lib/quantum-annealing'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { cultura, area, dataInicio, estado } = await req.json()
    if (!cultura || !area) return NextResponse.json({ error: 'Cultura e área obrigatórias' }, { status: 400 })

    // Carrega dados reais da fazenda para a otimização
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
                  select: { type: true, status: true },
                },
              },
            },
          },
        },
      },
    })

    const property = dbUser?.properties[0]

    // Gera cronograma base via LLM (NIM ou Groq)
    const llmText = await groq([{
      role: 'user',
      content: `Crie um cronograma completo de safra para:
- Cultura: ${cultura}
- Área: ${area} hectares
- Data de início: ${dataInicio || new Date().toLocaleDateString('pt-BR')}
- Estado/Região: ${estado || 'Brasil (Centro-Oeste/Sudeste)'}

Responda EXATAMENTE neste JSON (sem markdown):
{
  "cultura": "${cultura}",
  "area": ${area},
  "duracao_dias": <número total de dias da safra>,
  "fases": [
    {
      "nome": "<nome da fase>",
      "tipo": "<tipo de atividade>",
      "inicio_dia": <dia relativo ao início, ex: 1>,
      "duracao_dias": <duração em dias>,
      "descricao": "<descrição prática de 1 frase>",
      "insumos": "<principais insumos ou null>",
      "prioridade": "alta" | "media" | "baixa"
    }
  ],
  "observacoes": "<2 observações importantes sobre essa cultura nessa época>"
}`,
    }], 1500)

    const clean = llmText.replace(/```json\n?|\n?```/g, '').trim()
    const safra = JSON.parse(clean)

    // Prepara fases para o solver QUBO
    const phases: Phase[] = (safra.fases as any[]).map((f: any, i: number) => ({
      index: i,
      tipo: f.tipo,
      inicio_dia: f.inicio_dia,
      duracao_dias: f.duracao_dias,
      prioridade: f.prioridade,
    }))

    // Prepara membros da equipe com perfil de produtividade
    const members: Member[] = (property?.teamMembers ?? []).map((m: any) => {
      const ativs = m.activities as { type: string; status: string }[]
      const done = ativs.filter(a => a.status === 'DONE').length
      const total = ativs.length
      const currentLoad = ativs.filter(a => ['PENDING', 'IN_PROGRESS'].includes(a.status)).length

      const tiposCount: Record<string, number> = {}
      for (const a of ativs.filter(a => a.status === 'DONE')) {
        tiposCount[a.type] = (tiposCount[a.type] ?? 0) + 1
      }
      const specializations = Object.entries(tiposCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([t]) => t)

      return {
        id: m.id,
        name: m.name,
        role: m.role,
        currentLoad,
        completionRate: total > 0 ? done / total : 0.5,
        specializations,
      }
    })

    // Executa otimização quântica (simulated annealing / QUBO)
    const quboResult = solveQUBO(phases, members)

    // Enriquece as fases com os responsáveis otimizados
    const fasesOtimizadas = safra.fases.map((fase: any, i: number) => {
      const assignment = quboResult.assignments.find(a => a.phaseIndex === i)
      return {
        ...fase,
        responsavel: assignment?.memberName ?? null,
        responsavelId: assignment?.memberId ?? null,
      }
    })

    return NextResponse.json({
      ...safra,
      fases: fasesOtimizadas,
      quantum: {
        solver: 'Simulated Annealing (QUBO)',
        iterations: quboResult.iterations,
        energy: quboResult.totalEnergy,
        convergence: quboResult.convergence,
        membersAnalyzed: members.length,
        optimized: members.length > 0,
      },
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

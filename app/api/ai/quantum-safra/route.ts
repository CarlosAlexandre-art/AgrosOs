import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { groq } from '@/lib/groq'
import { solveQUBO, type Phase, type Member } from '@/lib/quantum-annealing'
import { solveQUBOWithCIQuanta } from '@/lib/ciquanta'

export const maxDuration = 60

// Constrói matriz QUBO para otimização de prioridade de fases da safra.
// x_i = 1 → fase i entra na "janela acelerada" (recursos extras)
// Objetivo: maximizar fases de alta prioridade selecionadas,
// penalizando sobreposições temporais (conflito de recursos).
function buildSafraQUBO(phases: Phase[]): number[][] {
  const n = phases.length
  const Q: number[][] = Array.from({ length: n }, () => new Array(n).fill(0))

  const priorityReward: Record<string, number> = { alta: -2.0, media: -1.0, baixa: 0.5 }

  for (let i = 0; i < n; i++) {
    Q[i][i] = priorityReward[phases[i].prioridade] ?? -0.5

    for (let j = i + 1; j < n; j++) {
      const startI = phases[i].inicio_dia
      const endI = startI + phases[i].duracao_dias
      const startJ = phases[j].inicio_dia
      const endJ = startJ + phases[j].duracao_dias
      const overlap = Math.max(0, Math.min(endI, endJ) - Math.max(startI, startJ))
      if (overlap > 0) {
        // Penalidade proporcional à sobreposição — ambas na janela acelerada cria conflito
        Q[i][j] = overlap * 0.3
      }
    }
  }

  return Q
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { cultura, area, dataInicio, estado } = await req.json()
    if (!cultura || !area) return NextResponse.json({ error: 'Cultura e área obrigatórias' }, { status: 400 })

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
    let safra: any
    try {
      safra = JSON.parse(clean)
    } catch {
      return NextResponse.json({ error: 'A IA não retornou um cronograma válido. Tente novamente.' }, { status: 502 })
    }

    const phases: Phase[] = (safra.fases as any[]).map((f: any, i: number) => ({
      index: i,
      tipo: f.tipo,
      inicio_dia: f.inicio_dia,
      duracao_dias: f.duracao_dias,
      prioridade: f.prioridade,
    }))

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

    // Tenta CIQuanta (hardware quântico real) para fases ≤ 20 qubits
    let quantumInfo: Record<string, unknown>
    let priorityMask: number[] | null = null

    const useCIQuanta = process.env.CIQUANTA_API_KEY && phases.length <= 20

    if (useCIQuanta) {
      try {
        const Q = buildSafraQUBO(phases)
        const cqResult = await solveQUBOWithCIQuanta(Q, `safra-${cultura}`)
        priorityMask = cqResult.solution
        quantumInfo = {
          solver: `CIQuanta — ${process.env.CIQUANTA_BACKEND ?? 'Jiuyuan'}`,
          backend: 'hardware_quantum',
          jobId: cqResult.jobId,
          energy: cqResult.energy,
          qubits: phases.length,
          optimized: true,
        }
      } catch {
        // Fallback para SA local se CIQuanta falhar
        const quboResult = solveQUBO(phases, members)
        priorityMask = null
        quantumInfo = {
          solver: 'Simulated Annealing (QUBO) — fallback',
          backend: 'classical_simulation',
          iterations: quboResult.iterations,
          energy: quboResult.totalEnergy,
          convergence: quboResult.convergence,
          membersAnalyzed: members.length,
          optimized: members.length > 0,
        }
      }
    } else {
      const quboResult = solveQUBO(phases, members)
      quantumInfo = {
        solver: 'Simulated Annealing (QUBO)',
        backend: 'classical_simulation',
        iterations: quboResult.iterations,
        energy: quboResult.totalEnergy,
        convergence: quboResult.convergence,
        membersAnalyzed: members.length,
        optimized: members.length > 0,
      }
    }

    // Atribui responsáveis: usa SA local para member assignment,
    // mas aplica a máscara de prioridade do CIQuanta na ordenação
    const quboResult = solveQUBO(phases, members)

    const fasesOtimizadas = safra.fases.map((fase: any, i: number) => {
      const assignment = quboResult.assignments.find(a => a.phaseIndex === i)
      return {
        ...fase,
        responsavel: assignment?.memberName ?? null,
        responsavelId: assignment?.memberId ?? null,
        acelerada: priorityMask ? priorityMask[i] === 1 : null,
      }
    })

    return NextResponse.json({
      ...safra,
      fases: fasesOtimizadas,
      quantum: quantumInfo,
    })
  } catch (e: any) {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

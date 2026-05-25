import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { groq } from '@/lib/groq'
import { solveQUBO, type Phase, type Member } from '@/lib/quantum-annealing'

export const maxDuration = 60

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      include: { properties: { take: 1 } },
    })
    const property = dbUser?.properties[0]
    if (!property) return NextResponse.json({ error: 'Sem propriedade' }, { status: 404 })

    // Busca dados de saúde e reprodução
    const [protocolos, eventos, animais, statusRepro] = await Promise.all([
      (prisma as any).protocoloVacinal.findMany({
        where: { propertyId: property.id },
        orderBy: { createdAt: 'asc' },
        take: 20,
      }),
      (prisma as any).eventoReprodutivo.findMany({
        where: { animal: { propertyId: property.id } },
        orderBy: { data: 'desc' },
        take: 30,
        include: { animal: { select: { identificacao: true } } },
      }),
      (prisma as any).animal.findMany({
        where: { propertyId: property.id, ativo: true },
        select: { id: true, identificacao: true, sexo: true },
        take: 50,
      }),
      (prisma as any).statusReprodutivo.findMany({
        where: { animal: { propertyId: property.id } },
        include: { animal: { select: { identificacao: true } } },
        take: 30,
      }),
    ])

    const prenhas = statusRepro.filter((s: any) => s.status === 'PRENHA').length
    const vacinasPendentes = protocolos.filter((p: any) => p.ativo).length

    const totalAnimais = animais.length
    const femeas = animais.filter((a: any) => a.sexo === 'FEMEA').length
    const eventosUlt30dias = eventos.filter((e: any) => {
      const dias = Math.ceil((Date.now() - new Date(e.data).getTime()) / 86400000)
      return dias <= 30
    }).length

    // Análise IA via Groq/NIM
    const prompt = `Análise veterinária e reprodutiva do rebanho:
- Total animais ativos: ${totalAnimais} (${femeas} fêmeas)
- Vacas prenhes: ${prenhas}
- Vacinas vencendo em 14 dias: ${vacinasPendentes}
- Protocolos ativos: ${protocolos.length}
- Eventos reprodutivos (últimos 30 dias): ${eventosUlt30dias}
- Tipos de eventos recentes: ${[...new Set(eventos.slice(0, 10).map((e: any) => e.tipo))].join(', ') || 'nenhum'}

Responda EXATAMENTE neste JSON (sem markdown):
{
  "nivel_alerta": "verde" | "amarelo" | "vermelho",
  "diagnostico": "Diagnóstico direto do status sanitário em 1 frase (max 20 palavras)",
  "acao_prioritaria": "Ação mais urgente que o produtor deve tomar agora (max 25 palavras)",
  "previsao_partos": "Estimativa de partos nas próximas 4 semanas com base nos dados (max 20 palavras)",
  "risco_sanitario": "Principal risco sanitário identificado ou null",
  "dica_reproducao": "Dica prática para melhorar a taxa de prenhez (max 20 palavras)"
}`

    const text = await groq([{ role: 'user', content: prompt }], 400)
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('IA não retornou JSON válido')
    const analise = JSON.parse(jsonMatch[0])

    // QUBO: otimizar agendamento de protocolos vacinais
    // Fases = protocolos ordenados por urgência
    // Membros = grupos de animais (lotes)
    const fasesVacina: Phase[] = protocolos.slice(0, 10).map((p: any, i: number) => ({
      index: i,
      tipo: p.doenca || 'vacina',
      inicio_dia: 7,
      duracao_dias: 1,
      prioridade: 'media' as const,
    }))

    // Grupos de animais como "membros" disponíveis para receber vacinas
    const gruposAnimais: Member[] = [
      { id: 'lote-vacas', name: 'Vacas em Lactação', role: 'femea', currentLoad: prenhas, completionRate: 0.9, specializations: ['vacina', 'reprodutiva'] },
      { id: 'lote-novilhas', name: 'Novilhas', role: 'femea', currentLoad: 0, completionRate: 0.95, specializations: ['vacina', 'crescimento'] },
      { id: 'lote-bezerros', name: 'Bezerros/Terneiros', role: 'cria', currentLoad: 0, completionRate: 0.85, specializations: ['vacina', 'manejo'] },
      { id: 'lote-touros', name: 'Touros/Machos', role: 'macho', currentLoad: 0, completionRate: 0.9, specializations: ['vacina', 'reproducao'] },
    ]

    const quboResult = fasesVacina.length > 0 ? solveQUBO(fasesVacina, gruposAnimais) : null

    const agenda = quboResult ? protocolos.slice(0, 10).map((p: any, i: number) => {
      const assignment = quboResult.assignments.find(a => a.phaseIndex === i)
      return {
        protocolo: p.nome,
        doenca: p.doenca,
        proximaAplicacao: p.proximaAplicacao,
        grupoOtimizado: assignment?.memberName ?? 'A definir',
        prioridade: fasesVacina[i]?.prioridade ?? 'media',
      }
    }) : []

    return NextResponse.json({
      ...analise,
      kpis: { prenhas, vacinasPendentes, totalAnimais, femeas, eventosUlt30dias },
      agendaOtimizada: agenda,
      quantum: quboResult ? {
        solver: 'QUBO Simulated Annealing',
        iterations: quboResult.iterations,
        convergencia: quboResult.convergence,
        protocolosOtimizados: fasesVacina.length,
      } : null,
    })
  } catch (e: any) {
    console.error('[agrovet-analise]', e?.message)
    return NextResponse.json({ error: e?.message ?? 'Erro interno do servidor' }, { status: 500 })
  }
}

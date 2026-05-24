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

    const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id }, include: { properties: true } })
    if (!['pro', 'enterprise', 'admin'].includes(dbUser?.plan ?? '')) {
      return NextResponse.json({ error: 'UPGRADE_REQUIRED', plan: 'pro', mensagem: 'Análise com IA disponível no plano Pro ou superior' }, { status: 403 })
    }
    const property = dbUser?.properties[0]
    if (!property) return NextResponse.json({ error: 'Sem propriedade' }, { status: 404 })

    const [leite, carcacas, animais] = await Promise.all([
      (prisma as any).producaoLeite.findMany({
        where: { animal: { propertyId: property.id } },
        orderBy: { data: 'desc' },
        take: 60,
        include: { animal: { select: { id: true, identificacao: true, pesoAtual: true } } },
      }),
      (prisma as any).controleCarcaca.findMany({
        where: { animal: { propertyId: property.id } },
        orderBy: { dataAbate: 'desc' },
        take: 20,
        include: { animal: { select: { identificacao: true } } },
      }),
      (prisma as any).animal.findMany({
        where: { propertyId: property.id, ativo: true },
        select: { id: true, identificacao: true, pesoAtual: true, dataNascimento: true, sexo: true },
        take: 100,
      }),
    ])

    const mediaLeite = leite.length > 0
      ? leite.reduce((acc: number, r: any) => acc + Number(r.totalLitros), 0) / leite.length
      : 0

    const mediaCCS = leite.filter((r: any) => r.ccs).length > 0
      ? leite.filter((r: any) => r.ccs).reduce((acc: number, r: any) => acc + Number(r.ccs), 0) / leite.filter((r: any) => r.ccs).length
      : 0

    const mediaRendCarcaca = carcacas.filter((c: any) => c.rendimentoCarcaca).length > 0
      ? carcacas.filter((c: any) => c.rendimentoCarcaca).reduce((acc: number, c: any) => acc + Number(c.rendimentoCarcaca), 0) / carcacas.filter((c: any) => c.rendimentoCarcaca).length
      : 0

    const receitaCarcacas = carcacas.reduce((acc: number, c: any) => acc + Number(c.receitaTotal ?? 0), 0)

    const animaisParaAbate = animais.filter((a: any) => {
      const peso = Number(a.pesoAtual ?? 0)
      const idadeMeses = a.dataNascimento
        ? Math.floor((Date.now() - new Date(a.dataNascimento).getTime()) / (30 * 86400000))
        : 0
      return peso >= 400 && idadeMeses >= 24
    }).length

    // Análise IA
    const prompt = `Análise de produção e qualidade do rebanho leiteiro e de corte:
- Registros de leite analisados: ${leite.length}
- Média de produção por ordenha: ${mediaLeite.toFixed(1)} litros
- CCS médio: ${(mediaCCS / 1000).toFixed(0)}k células/mL ${mediaCCS > 400000 ? '(ATENÇÃO: acima do limite)' : '(dentro do padrão)'}
- Rendimento médio de carcaça: ${mediaRendCarcaca.toFixed(1)}%
- Receita total com abates: R$ ${receitaCarcacas.toFixed(0)}
- Animais aptos para abate (≥400kg e ≥24 meses): ${animaisParaAbate}
- Total animais ativos: ${animais.length}

Responda EXATAMENTE neste JSON (sem markdown):
{
  "nivel_alerta": "verde" | "amarelo" | "vermelho",
  "diagnostico": "Diagnóstico direto da qualidade de produção (max 20 palavras)",
  "acao_prioritaria": "Ação mais urgente para melhorar produção agora (max 25 palavras)",
  "qualidade_leite": "Avaliação da qualidade do leite com CCS e gordura (max 20 palavras)",
  "oportunidade_abate": "Melhor momento/estratégia para os próximos abates (max 20 palavras)",
  "melhoria_rend": "Como aumentar o rendimento de carcaça (max 20 palavras)"
}`

    const text = await groq([{ role: 'user', content: prompt }], 400)
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('IA não retornou JSON válido')
    const analise = JSON.parse(jsonMatch[0])

    // QUBO: seleção ótima de animais para abate
    // Fases = candidatos ao abate (score por peso/idade)
    // Membros = janelas de mercado / frigoríficos (simplificado: alta/média/baixa demanda)
    const candidatos = animais.filter((a: any) => Number(a.pesoAtual ?? 0) >= 350).slice(0, 15)

    const fasesAbate: Phase[] = candidatos.map((a: any, i: number) => {
      const peso = Number(a.pesoAtual ?? 0)
      const idadeMeses = a.dataNascimento
        ? Math.floor((Date.now() - new Date(a.dataNascimento).getTime()) / (30 * 86400000))
        : 30
      const diasOtimo = peso >= 480 ? 0 : Math.ceil((480 - peso) / 0.8)
      return {
        index: i,
        tipo: a.sexo || 'bovino',
        inicio_dia: diasOtimo,
        duracao_dias: 1,
        prioridade: peso >= 480 && idadeMeses >= 30 ? 'alta' : peso >= 420 ? 'media' : 'baixa',
      }
    })

    const janelasMercado: Member[] = [
      { id: 'imediato', name: 'Abate Imediato (esta semana)', role: 'mercado', currentLoad: 2, completionRate: 0.95, specializations: ['alta', 'bovino', 'peso'] },
      { id: 'curto', name: 'Abate Curto Prazo (2-4 semanas)', role: 'mercado', currentLoad: 1, completionRate: 0.88, specializations: ['media', 'bovino', 'crescimento'] },
      { id: 'medio', name: 'Manter e Engordar (1-3 meses)', role: 'mercado', currentLoad: 0, completionRate: 0.75, specializations: ['baixa', 'bovino', 'engorda'] },
    ]

    const quboResult = fasesAbate.length > 0 ? solveQUBO(fasesAbate, janelasMercado) : null

    const selecaoAbate = quboResult ? candidatos.map((a: any, i: number) => {
      const assignment = quboResult.assignments.find(x => x.phaseIndex === i)
      return {
        animal: a.identificacao,
        peso: Number(a.pesoAtual ?? 0),
        recomendacao: assignment?.memberName ?? 'A definir',
        prioridade: fasesAbate[i]?.prioridade ?? 'baixa',
      }
    }).sort((a: any, b: any) => {
      const ord: Record<string, number> = { 'alta': 0, 'media': 1, 'baixa': 2 }
      return ord[a.prioridade] - ord[b.prioridade]
    }) : []

    return NextResponse.json({
      ...analise,
      kpis: { mediaLeite: Math.round(mediaLeite * 10) / 10, mediaCCS: Math.round(mediaCCS), mediaRendCarcaca: Math.round(mediaRendCarcaca * 10) / 10, receitaCarcacas: Math.round(receitaCarcacas), animaisParaAbate, totalAnimais: animais.length },
      selecaoAbate: selecaoAbate.slice(0, 8),
      quantum: quboResult ? {
        solver: 'QUBO Seleção Abate',
        iterations: quboResult.iterations,
        convergencia: quboResult.convergence,
        candidatosAnalisados: fasesAbate.length,
      } : null,
    })
  } catch (e: any) {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

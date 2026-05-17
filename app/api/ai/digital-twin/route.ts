import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { groq } from '@/lib/groq'

export const maxDuration = 60

// Cenários disponíveis para simulação
type Cenario =
  | 'seca_moderada'
  | 'seca_severa'
  | 'chuva_excessiva'
  | 'alta_commodity'
  | 'baixa_commodity'
  | 'aumento_insumos'
  | 'expansao_area'
  | 'novo_cultivo'
  | 'credito_moderfrota'

const CENARIO_PARAMS: Record<Cenario, { label: string; impactoReceita: number; impactoCusto: number; descricao: string }> = {
  seca_moderada:       { label: 'Seca Moderada',         impactoReceita: -0.25, impactoCusto:  0.05, descricao: 'Redução de 25% na produção, +5% em irrigação' },
  seca_severa:         { label: 'Seca Severa',           impactoReceita: -0.50, impactoCusto:  0.15, descricao: 'Redução de 50% na produção, perdas severas' },
  chuva_excessiva:     { label: 'Chuva Excessiva',       impactoReceita: -0.15, impactoCusto:  0.10, descricao: 'Perdas por alagamento e doenças fúngicas' },
  alta_commodity:      { label: 'Alta de Commodity +30%', impactoReceita:  0.30, impactoCusto:  0.03, descricao: 'Preço de venda 30% acima da média' },
  baixa_commodity:     { label: 'Baixa de Commodity -20%', impactoReceita: -0.20, impactoCusto: -0.02, descricao: 'Preço de venda 20% abaixo da média' },
  aumento_insumos:     { label: 'Insumos +40%',           impactoReceita:  0.00, impactoCusto:  0.40, descricao: 'Alta de fertilizantes e defensivos' },
  expansao_area:       { label: 'Expansão de 30% da Área', impactoReceita:  0.28, impactoCusto:  0.35, descricao: 'Abertura de nova área — custo inicial alto' },
  novo_cultivo:        { label: 'Diversificação de Cultivo', impactoReceita:  0.15, impactoCusto:  0.12, descricao: 'Segundo cultivo complementar' },
  credito_moderfrota:  { label: 'Crédito Moderfrota',     impactoReceita:  0.08, impactoCusto: -0.05, descricao: 'Maquinário novo reduz custo operacional' },
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const body = await req.json()
    const cenarios: Cenario[] = body.cenarios ?? ['seca_moderada', 'alta_commodity', 'aumento_insumos']

    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      select: {
        name: true,
        properties: {
          take: 1,
          select: {
            name: true,
            location: true,
            sizeHectares: true,
            fields: { select: { name: true, sizeHectares: true } },
            revenues: {
              orderBy: { date: 'desc' },
              take: 12,
              select: { amount: true, category: true, date: true },
            },
            costs: {
              orderBy: { date: 'desc' },
              take: 12,
              select: { amount: true, category: true, date: true },
            },
            activities: {
              where: { status: 'DONE' },
              orderBy: { updatedAt: 'desc' },
              take: 20,
              select: { type: true, updatedAt: true },
            },
            goals: {
              where: { isCompleted: false },
              select: { title: true, type: true, targetValue: true, currentValue: true },
            },
          },
        },
      },
    })

    const p = dbUser?.properties[0]
    if (!p) return NextResponse.json({ error: 'Propriedade não encontrada' }, { status: 404 })

    const receitaBase = p.revenues.reduce((s, r) => s + Number(r.amount), 0)
    const custoBase   = p.costs.reduce((s, c) => s + Number(c.amount), 0)
    const resultadoBase = receitaBase - custoBase
    const margemBase    = receitaBase > 0 ? (resultadoBase / receitaBase) * 100 : 0
    const areaHa        = Number(p.sizeHectares ?? 0)

    // Simula cada cenário matematicamente
    const simulacoes = cenarios
      .filter(c => CENARIO_PARAMS[c])
      .map(c => {
        const params = CENARIO_PARAMS[c]
        const receitaSim = receitaBase * (1 + params.impactoReceita)
        const custoSim   = custoBase   * (1 + params.impactoCusto)
        const resultado  = receitaSim - custoSim
        const margem     = receitaSim > 0 ? (resultado / receitaSim) * 100 : 0
        const deltaResultado = resultado - resultadoBase
        const breakEven  = custoSim > 0 ? custoSim : 0

        return {
          cenario: c,
          label: params.label,
          descricao: params.descricao,
          receita:    Math.round(receitaSim),
          custo:      Math.round(custoSim),
          resultado:  Math.round(resultado),
          margem:     Math.round(margem * 10) / 10,
          deltaResultado: Math.round(deltaResultado),
          deltaPercent:   Math.round((deltaResultado / Math.abs(resultadoBase || 1)) * 100),
          breakEven:  Math.round(breakEven),
          viavel:     resultado > 0,
          risco:      deltaResultado < -resultadoBase * 0.3 ? 'alto' : deltaResultado < 0 ? 'medio' : 'baixo',
        }
      })

    // LLM interpreta os resultados e dá recomendações estratégicas
    const prompt = `Você é um consultor de gestão agrícola especializado em análise de cenários e planejamento estratégico para fazendas brasileiras.

FAZENDA: ${p.name}${p.location ? ` — ${p.location}` : ''} | Área: ${areaHa > 0 ? areaHa + ' ha' : 'não informada'} | ${p.fields.length} talhões

LINHA DE BASE (dados históricos):
- Receita: R$${receitaBase.toFixed(0)} | Custo: R$${custoBase.toFixed(0)} | Resultado: R$${resultadoBase.toFixed(0)} | Margem: ${margemBase.toFixed(1)}%

SIMULAÇÕES DE CENÁRIO:
${JSON.stringify(simulacoes, null, 2)}

METAS ATIVAS: ${p.goals.map(g => `${g.title} (${Math.round((Number(g.currentValue) / Number(g.targetValue)) * 100)}%)`).join(', ') || 'nenhuma'}

Com base nas simulações acima, forneça:
1. Diagnóstico de resiliência da fazenda (qual é o cenário limite antes da inviabilidade?)
2. Recomendação para o cenário de maior risco identificado
3. Estratégia de hedge e diversificação para reduzir volatilidade
4. Meta financeira realista para os próximos 12 meses

Máximo 4 parágrafos. Seja direto e prático. Responda em português brasileiro.`

    const analiseIA = await groq([{ role: 'user', content: prompt }], 600)

    return NextResponse.json({
      ok: true,
      fazenda: p.name,
      linhaDeBase: {
        receita: Math.round(receitaBase),
        custo: Math.round(custoBase),
        resultado: Math.round(resultadoBase),
        margemPercent: Math.round(margemBase * 10) / 10,
        areaHa,
      },
      simulacoes,
      cenariosMaisRisco: simulacoes
        .sort((a, b) => a.deltaResultado - b.deltaResultado)
        .slice(0, 2)
        .map(s => s.label),
      analiseIA,
    })
  } catch (e: any) {
    console.error('[DigitalTwin Error]', e?.message)
    return NextResponse.json({ error: e?.message ?? 'Erro interno' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    cenarios: Object.entries(CENARIO_PARAMS).map(([key, val]) => ({
      id: key,
      label: val.label,
      descricao: val.descricao,
      impactoReceita: `${val.impactoReceita >= 0 ? '+' : ''}${(val.impactoReceita * 100).toFixed(0)}%`,
      impactoCusto:   `${val.impactoCusto >= 0 ? '+' : ''}${(val.impactoCusto * 100).toFixed(0)}%`,
    })),
  })
}

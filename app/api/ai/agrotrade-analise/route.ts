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

    const [transacoes, valuations, animais] = await Promise.all([
      (prisma as any).transacaoGado.findMany({
        where: { propertyId: property.id },
        orderBy: { data: 'desc' },
        take: 30,
      }),
      (prisma as any).valuationRebanho.findMany({
        where: { propertyId: property.id },
        orderBy: { data: 'desc' },
        take: 6,
      }),
      (prisma as any).animal.findMany({
        where: { propertyId: property.id, ativo: true },
        select: { id: true, pesoAtual: true, sexo: true, dataNascimento: true },
        take: 200,
      }),
    ])

    const receitas = transacoes.filter((t: any) => t.tipo === 'VENDA').reduce((acc: number, t: any) => acc + Number(t.valorTotal ?? 0), 0)
    const custos = transacoes.filter((t: any) => ['COMPRA', 'INSUMO', 'SERVICO', 'VETERINARIO'].includes(t.tipo)).reduce((acc: number, t: any) => acc + Number(t.valorTotal ?? 0), 0)
    const margem = receitas > 0 ? ((receitas - custos) / receitas * 100) : 0

    const ultimoValuation = valuations[0]
    const valuacaoAtual = Number(ultimoValuation?.valorTotalEstimado ?? 0)
    const valuacaoAnterior = Number(valuations[1]?.valorTotalEstimado ?? 0)
    const variacaoValuation = valuacaoAnterior > 0 ? ((valuacaoAtual - valuacaoAnterior) / valuacaoAnterior * 100) : 0

    const pesoTotal = animais.reduce((acc: number, a: any) => acc + Number(a.pesoAtual ?? 0), 0)
    const arrobasTotal = pesoTotal / 15
    const categorias = animais.reduce((acc: Record<string, number>, a: any) => {
      acc[a.sexo || 'OUTRO'] = (acc[a.sexo || 'OUTRO'] || 0) + 1
      return acc
    }, {})

    // Análise IA
    const prompt = `Análise financeira e de mercado do rebanho:
- Receitas com vendas: R$ ${receitas.toFixed(0)}
- Custos (compras + insumos + serviços): R$ ${custos.toFixed(0)}
- Margem bruta: ${margem.toFixed(1)}%
- Valoração atual do rebanho: R$ ${valuacaoAtual.toFixed(0)}
- Variação da valoração: ${variacaoValuation >= 0 ? '+' : ''}${variacaoValuation.toFixed(1)}%
- Total de arrobas no rebanho: ${arrobasTotal.toFixed(0)} @
- Composição do rebanho: ${Object.entries(categorias).map(([k, v]) => `${v} ${k}`).join(', ')}
- Transações (últimas 30): ${transacoes.length} operações

Responda EXATAMENTE neste JSON (sem markdown):
{
  "nivel_alerta": "verde" | "amarelo" | "vermelho",
  "diagnostico": "Diagnóstico financeiro direto da pecuária (max 20 palavras)",
  "acao_prioritaria": "Decisão financeira mais urgente agora (max 25 palavras)",
  "timing_mercado": "Melhor momento para venda baseado nos dados atuais (max 20 palavras)",
  "otimizacao_rebanho": "Como otimizar a composição para maximizar retorno (max 20 palavras)",
  "alerta_fluxo": "Risco de caixa ou oportunidade financeira identificada (max 20 palavras)"
}`

    const text = await groq([{ role: 'user', content: prompt }], 400)
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('IA não retornou JSON válido')
    const analise = JSON.parse(jsonMatch[0])

    // QUBO: otimização de portfolio pecuário (Markowitz-inspired)
    // Fases = oportunidades de investimento/desinvestimento por categoria
    // Membros = estratégias de alocação de capital
    const categoriasArr = Object.entries(categorias)
    const fasesPortfolio: Phase[] = categoriasArr.map(([cat], i) => {
      const rentabilidade = cat === 'VACA_LEITE' ? 0.9 : cat === 'TOURO' ? 0.6 : cat === 'NOVILHA' ? 0.85 : 0.75
      return {
        index: i,
        tipo: cat,
        inicio_dia: i * 7,
        duracao_dias: 30,
        prioridade: rentabilidade > 0.8 ? 'alta' : rentabilidade > 0.65 ? 'media' : 'baixa',
      }
    })

    const estrategias: Member[] = [
      { id: 'retencao', name: 'Reter e Valorizar', role: 'estrategia', currentLoad: 1, completionRate: 0.85, specializations: ['VACA_LEITE', 'NOVILHA', 'BEZERRO'] },
      { id: 'venda-parcial', name: 'Venda Parcial Estratégica', role: 'estrategia', currentLoad: 0, completionRate: 0.9, specializations: ['TOURO', 'BOI', 'NOVILHA'] },
      { id: 'reinvestimento', name: 'Reinvestir em Genética', role: 'estrategia', currentLoad: 0, completionRate: 0.75, specializations: ['TOURO', 'VACA_LEITE'] },
      { id: 'liquidacao', name: 'Liquidar e Reduzir Rebanho', role: 'estrategia', currentLoad: 2, completionRate: 0.7, specializations: ['BOI', 'DESCARTE'] },
    ]

    const quboResult = fasesPortfolio.length > 0 ? solveQUBO(fasesPortfolio, estrategias) : null

    const portfolioOtimizado = quboResult ? categoriasArr.map(([cat, qtd], i) => {
      const assignment = quboResult.assignments.find(a => a.phaseIndex === i)
      return {
        categoria: cat,
        quantidade: qtd,
        estrategiaRecomendada: assignment?.memberName ?? 'A definir',
        prioridade: fasesPortfolio[i]?.prioridade ?? 'media',
      }
    }) : []

    return NextResponse.json({
      ...analise,
      kpis: { receitas: Math.round(receitas), custos: Math.round(custos), margem: Math.round(margem * 10) / 10, valuacaoAtual: Math.round(valuacaoAtual), variacaoValuation: Math.round(variacaoValuation * 10) / 10, arrobasTotal: Math.round(arrobasTotal), totalAnimais: animais.length },
      portfolioOtimizado,
      quantum: quboResult ? {
        solver: 'QUBO Portfolio Markowitz',
        iterations: quboResult.iterations,
        convergencia: quboResult.convergence,
        categoriasAnalisadas: fasesPortfolio.length,
      } : null,
    })
  } catch (e: any) {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

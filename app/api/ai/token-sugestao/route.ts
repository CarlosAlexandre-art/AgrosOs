import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { groq } from '@/lib/groq'

// Níveis de preço candidatos para o QUBO
const PRICE_LEVELS = [50, 100, 200, 500, 1000]

// Benchmark de retorno por tipo de token (% anual esperado)
const RETORNO_BENCH: Record<string, { min: number; max: number; periodo: number }> = {
  SAFRA:      { min: 12, max: 22, periodo: 9 },
  MATERIAL:   { min: 8,  max: 15, periodo: 6 },
  MAQUINARIO: { min: 6,  max: 12, periodo: 24 },
  IMOVEL:     { min: 5,  max: 10, periodo: 36 },
}

// Função de liquidez: probabilidade de venda completa dado preço e score do produtor
// Tokens mais baratos = mais acessíveis = maior liquidez
function liquidityScore(price: number, totalValue: number, agroScore: number): number {
  const qtd = totalValue / price
  // Penaliza muito poucos tokens (< 20) — pouca divisibilidade
  // Penaliza muitos tokens (> 100k) — diluição
  const qtdScore = qtd < 20 ? 0.3 : qtd > 100000 ? 0.4 : 1.0
  // Preço mais baixo = mais acessível para investidores pequenos
  const priceScore = Math.max(0.2, 1 - (price - 50) / 2000)
  // Score do produtor: melhor score = mais confiança do mercado = melhor liquidez para qualquer preço
  const trustMult = 0.5 + (agroScore / 1000) * 0.5
  return Math.min(1, qtdScore * priceScore * trustMult)
}

// Simulated Annealing sobre espaço discreto de preços
function solveQUBOPrice(
  totalValue: number,
  agroScore: number,
  targetReturn: number,
  tolerance: number = 0.15
): { preco: number; score: number; qtdTokens: number } {
  const T_INIT = 5
  const T_MIN  = 0.01
  const COOLING = 0.85

  let current = PRICE_LEVELS[1] // começa em R$100
  let energy = -liquidityScore(current, totalValue, agroScore)
  let best = current
  let bestEnergy = energy

  let T = T_INIT
  while (T > T_MIN) {
    const neighbor = PRICE_LEVELS[Math.floor(Math.random() * PRICE_LEVELS.length)]
    const qtd = totalValue / neighbor
    // Penalidade extra se qtd de tokens não for razoável
    const penalty = qtd < 10 ? 3 : qtd > 500000 ? 2 : 0
    const newEnergy = -liquidityScore(neighbor, totalValue, agroScore) + penalty
    const delta = newEnergy - energy
    if (delta < 0 || Math.random() < Math.exp(-delta / T)) {
      current = neighbor
      energy = newEnergy
      if (energy < bestEnergy) { best = current; bestEnergy = energy }
    }
    T *= COOLING
  }

  return {
    preco: best,
    score: Math.round((1 + bestEnergy) * 100),
    qtdTokens: Math.floor(totalValue / best),
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const tipo = req.nextUrl.searchParams.get('tipo') ?? 'SAFRA'

    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      include: {
        properties: {
          include: {
            revenues:  { orderBy: { date: 'desc' }, take: 24, select: { amount: true, date: true } },
            costs:     { orderBy: { date: 'desc' }, take: 24, select: { amount: true, date: true } },
            fields:    { select: { sizeHectares: true } },
            agroRate:  { select: { score: true, category: true, totalRevenue: true, marginRate: true } },
            agroTokens: { where: { status: { in: ['ACTIVE', 'FUNDED'] } }, select: { totalValue: true, type: true } },
          },
          take: 1,
        },
      },
    })

    if (!dbUser) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    const property = dbUser.properties[0]
    if (!property) return NextResponse.json({ error: 'Nenhuma propriedade' }, { status: 404 })

    const agroScore   = property.agroRate?.score ?? 400
    const totalAreaHa = property.fields.reduce((s: number, f: any) => s + Number(f.sizeHectares), 0)
    const totalRev12m = property.revenues.reduce((s: number, r: any) => s + Number(r.amount), 0)
    const totalCost   = property.costs.reduce((s: number, c: any) => s + Number(c.amount), 0)
    const margem      = totalRev12m > 0 ? (totalRev12m - totalCost) / totalRev12m : 0.2

    // Valor total sugerido: receita ajustada pela margem e score de confiança
    const factorScore = 0.5 + (agroScore / 1000) * 0.5
    const valorSugerido = Math.round((totalRev12m * 0.6 * factorScore) / 10000) * 10000 || 200000
    const bench = RETORNO_BENCH[tipo] ?? RETORNO_BENCH.SAFRA

    // QUBO: preço ótimo de token
    const qubo = solveQUBOPrice(valorSugerido, agroScore, bench.min, 0.05)

    // NIM gera título, descrição, commodity e justificativa
    const sugestao = await groq([{
      role: 'user',
      content: `Você é um especialista em tokenização de ativos agrícolas no Brasil.
Gere uma sugestão completa de token para este produtor.

Tipo de token: ${tipo}
Área total: ${totalAreaHa.toFixed(1)} ha
Receita 12m: R$ ${totalRev12m.toLocaleString('pt-BR')}
Margem: ${Math.round(margem * 100)}%
AgroRate Score: ${agroScore} (${property.agroRate?.category ?? 'N/A'})
Valor sugerido: R$ ${valorSugerido.toLocaleString('pt-BR')}
Preço por token otimizado (QUBO): R$ ${qubo.preco} (${qubo.qtdTokens} tokens)
Retorno esperado benchmark: ${bench.min}–${bench.max}% a.a. | Prazo: ${bench.periodo} meses

Responda SOMENTE com um JSON válido no seguinte formato (sem markdown, sem explicações):
{
  "titulo": "título comercial atrativo do token (máx 60 chars)",
  "descricao": "descrição profissional de 2-3 frases explicando o ativo e garantias",
  "commodity": "nome da principal commodity ou material (soja/milho/café/etc ou null se não SAFRA)",
  "quantidadeKg": número estimado em kg baseado na área e benchmark de produtividade (null se não SAFRA),
  "retornoEsperado": número entre ${bench.min} e ${bench.max},
  "justificativa": "1 frase explicando por que esse preço e retorno são ideais para o perfil do produtor"
}`,
    }], 400)

    // Parse JSON da resposta NIM
    let parsed: any = {}
    try {
      const jsonMatch = sugestao.match(/\{[\s\S]*\}/)
      if (jsonMatch) parsed = JSON.parse(jsonMatch[0])
    } catch { parsed = {} }

    return NextResponse.json({
      tipo,
      valorTotal: valorSugerido,
      precoToken: qubo.preco,
      totalTokens: qubo.qtdTokens,
      liquidityScore: qubo.score,
      retornoEsperado: parsed.retornoEsperado ?? bench.min,
      periodoMeses: bench.periodo,
      titulo: parsed.titulo ?? '',
      descricao: parsed.descricao ?? '',
      commodity: parsed.commodity ?? null,
      quantidadeKg: parsed.quantidadeKg ?? null,
      justificativa: parsed.justificativa ?? '',
      contexto: {
        agroScore,
        totalAreaHa: Math.round(totalAreaHa * 10) / 10,
        totalRev12m: Math.round(totalRev12m),
        margem: Math.round(margem * 100),
      },
      modelo: 'QUBO Simulated Annealing + NVIDIA NIM llama-3.3-70b',
      geradoEm: new Date().toISOString(),
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

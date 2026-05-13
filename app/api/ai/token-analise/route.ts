import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { groq } from '@/lib/groq'

// Benchmarks de produtividade por commodity (toneladas/hectare, Brasil)
const BENCH: Record<string, { minTha: number; maxTha: number; label: string }> = {
  soja:      { minTha: 2.5, maxTha: 4.5, label: 'Soja' },
  milho:     { minTha: 5.0, maxTha: 12.0, label: 'Milho' },
  café:      { minTha: 1.5, maxTha: 4.0, label: 'Café' },
  cana:      { minTha: 60, maxTha: 120, label: 'Cana-de-açúcar' },
  algodão:   { minTha: 1.5, maxTha: 4.0, label: 'Algodão' },
  trigo:     { minTha: 2.0, maxTha: 4.0, label: 'Trigo' },
  arroz:     { minTha: 3.0, maxTha: 7.0, label: 'Arroz' },
  feijão:    { minTha: 0.8, maxTha: 2.0, label: 'Feijão' },
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const tokenId = req.nextUrl.searchParams.get('tokenId')
    if (!tokenId) return NextResponse.json({ error: 'tokenId obrigatório' }, { status: 400 })

    const token = await prisma.agroToken.findUnique({
      where: { id: tokenId },
      include: {
        property: {
          include: {
            user: {
              include: {
                agroRate: { select: { score: true, category: true, productionScore: true, efficiencyScore: true } },
              },
            },
            revenues: { orderBy: { date: 'desc' }, take: 12, select: { amount: true, date: true } },
            activities: { where: { status: 'DONE' }, select: { type: true } },
            fields: { select: { sizeHectares: true } },
          },
        },
        transactions: { select: { totalAmount: true, type: true } },
      },
    })

    if (!token) return NextResponse.json({ error: 'Token não encontrado' }, { status: 404 })

    const property = token.property
    const agroRate = property.user.agroRate
    const totalAreaHa = property.fields.reduce((s: any, f: any) => s + Number(f.sizeHectares), 0)
    const totalRevenue12m = property.revenues.reduce((s: any, r: any) => s + Number(r.amount), 0)
    const activityCount = property.activities.length
    const totalInvested = token.transactions.filter((t: any) => t.type === 'BUY').reduce((s: any, t: any) => s + Number(t.totalAmount), 0)
    const pctSold = token.totalTokens > 0 ? Math.round((token.soldTokens / token.totalTokens) * 100) : 0

    // Viabilidade da produção (apenas para SAFRA)
    let viabilidadeFisica = 'N/A'
    let flagProducao = false
    if (token.type === 'SAFRA' && token.commodity && token.quantityKg && totalAreaHa > 0) {
      const commodityKey = token.commodity.toLowerCase().split(' ')[0]
      const bench = BENCH[commodityKey]
      if (bench) {
        const thaDeclarado = Number(token.quantityKg) / 1000 / totalAreaHa
        const minEsperado = bench.minTha * totalAreaHa
        const maxEsperado = bench.maxTha * totalAreaHa * 1000 // kg
        if (Number(token.quantityKg) > maxEsperado * 1.2) {
          viabilidadeFisica = `⚠️ ACIMA do benchmark (declarado ${(thaDeclarado).toFixed(1)}t/ha, max esperado ${bench.maxTha}t/ha)`
          flagProducao = true
        } else if (Number(token.quantityKg) < minEsperado * 1000 * 0.8) {
          viabilidadeFisica = `ℹ️ Abaixo da média (${thaDeclarado.toFixed(1)}t/ha vs min ${bench.minTha}t/ha)`
        } else {
          viabilidadeFisica = `✅ Dentro do benchmark (${thaDeclarado.toFixed(1)}t/ha)`
        }
      }
    }

    // Score de risco composto (0-100, menor = mais seguro)
    let risco = 0
    if (!agroRate) risco += 30
    else if (agroRate.score < 450) risco += 25
    else if (agroRate.score < 600) risco += 15
    else if (agroRate.score >= 750) risco -= 10

    if (!token.carNumber) risco += 20
    if (!token.contractUrl && !token.clicksignDocKey) risco += 15
    if (flagProducao) risco += 20
    if (activityCount < 3) risco += 15
    if (totalRevenue12m < Number(token.totalValue) * 0.3) risco += 10
    if (totalAreaHa < 5) risco += 10

    const riscoFinal = Math.max(0, Math.min(100, risco))
    const nivel = riscoFinal >= 60 ? 'ALTO' : riscoFinal >= 30 ? 'MÉDIO' : 'BAIXO'

    // NIM gera laudo completo
    const laudo = await groq([{
      role: 'user',
      content: `Você é um analista de crédito rural especialista em tokenização de ativos agrícolas no Brasil.
Gere um laudo de due diligence conciso para este token.

Token: ${token.title} (${token.type})
Valor total: R$ ${Number(token.totalValue).toLocaleString('pt-BR')}
Preço por token: R$ ${Number(token.tokenPrice)}
Retorno esperado: ${token.expectedReturn ? Number(token.expectedReturn) + '%' : 'não informado'}
Prazo: ${token.periodMonths ? token.periodMonths + ' meses' : 'não informado'}
Commodity: ${token.commodity ?? 'N/A'} | Qtd: ${token.quantityKg ? Number(token.quantityKg).toLocaleString() + ' kg' : 'N/A'}
Viabilidade física: ${viabilidadeFisica}

Produtor:
- Área total: ${totalAreaHa.toFixed(1)} ha
- Receita 12 meses: R$ ${totalRevenue12m.toLocaleString('pt-BR')}
- Atividades concluídas: ${activityCount}
- AgroRate Score: ${agroRate?.score ?? 'não calculado'} (${agroRate?.category ?? 'N/A'})
- CAR registrado: ${token.carNumber ? 'Sim' : 'Não'}
- Contrato/Assinatura: ${(token.contractUrl || token.clicksignDocKey) ? 'Sim' : 'Pendente'}

Score de risco calculado: ${riscoFinal}/100 (${nivel})

Gere em 3 seções curtas:
1. Diagnóstico (2 frases sobre viabilidade geral)
2. Pontos de atenção (lista de até 3 itens, ou "Nenhum" se risco baixo)
3. Recomendação para investidor (1 frase direta)`,
    }], 500)

    return NextResponse.json({
      tokenId,
      titulo: token.title,
      tipo: token.type,
      status: token.status,
      risco: {
        score: riscoFinal,
        nivel,
        flagProducaoAnomala: flagProducao,
      },
      viabilidadeFisica,
      produtor: {
        agroRateScore: agroRate?.score ?? null,
        agroRateCategoria: agroRate?.category ?? null,
        areaHa: Math.round(totalAreaHa * 10) / 10,
        receita12m: Math.round(totalRevenue12m),
        atividadesConcluidas: activityCount,
        temCAR: !!token.carNumber,
        temContrato: !!(token.contractUrl || token.clicksignDocKey),
      },
      mercado: { pctSold, totalInvested: Math.round(totalInvested) },
      laudo,
      modelo: 'NVIDIA NIM llama-3.3-70b + benchmarks CONAB/IBGE',
      geradoEm: new Date().toISOString(),
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

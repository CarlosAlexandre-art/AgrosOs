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
    const property = dbUser?.properties[0]
    if (!property) return NextResponse.json({ error: 'Sem propriedade' }, { status: 404 })

    const [planos, pastagens, lotes, animais] = await Promise.all([
      (prisma as any).planoNutricional.findMany({
        where: { propertyId: property.id, ativo: true },
        include: { lote: { include: { animals: { select: { id: true } } } } },
        take: 20,
      }),
      (prisma as any).pastagem.findMany({
        where: { propertyId: property.id },
        include: { rotacoes: { where: { saida: null }, take: 1 } },
        take: 20,
      }),
      (prisma as any).lote.findMany({
        where: { propertyId: property.id },
        include: { animals: { select: { id: true, pesoAtual: true } } },
        take: 20,
      }),
      (prisma as any).animal.findMany({
        where: { propertyId: property.id, ativo: true },
        select: { id: true, pesoAtual: true, categoria: true },
        take: 100,
      }),
    ])

    const custoTotal = planos.reduce((acc: number, p: any) => {
      const cabecas = p.lote?.animals?.length ?? 0
      return acc + (Number(p.racaoKgDia ?? 0) * Number(p.custoKgRacao ?? 0) * cabecas * 30)
    }, 0)

    const pastagensOcupadas = pastagens.filter((p: any) => p.status === 'OCUPADA').length
    const pastagensDescanso = pastagens.filter((p: any) => p.status === 'DESCANSO').length
    const totalPastagens = pastagens.length
    const totalCabecas = animais.length

    const pesoMedio = animais.length > 0
      ? animais.reduce((acc: number, a: any) => acc + Number(a.pesoAtual ?? 0), 0) / animais.length
      : 0

    const ganhoPesoPrevisto = planos.reduce((acc: number, p: any) => acc + Number(p.ganhoEsperadoKgDia ?? 0), 0) / Math.max(planos.length, 1)

    // Análise IA
    const prompt = `Análise nutricional e de pastagem do rebanho:
- Total de animais: ${totalCabecas} (peso médio: ${pesoMedio.toFixed(0)} kg)
- Planos nutricionais ativos: ${planos.length}
- Custo nutricional mensal estimado: R$ ${custoTotal.toFixed(0)}
- Pastagens: ${totalPastagens} (${pastagensOcupadas} ocupadas, ${pastagensDescanso} em descanso)
- Ganho de peso médio esperado: ${ganhoPesoPrevisto.toFixed(3)} kg/dia/animal
- Lotes gerenciados: ${lotes.length}

Responda EXATAMENTE neste JSON (sem markdown):
{
  "nivel_alerta": "verde" | "amarelo" | "vermelho",
  "diagnostico": "Status nutricional do rebanho em 1 frase direta (max 20 palavras)",
  "acao_prioritaria": "Ação nutricional mais urgente agora (max 25 palavras)",
  "eficiencia_pastagem": "Avaliação da rotação atual das pastagens (max 20 palavras)",
  "custo_oportunidade": "Onde está sendo desperdiçado mais dinheiro na nutrição (max 20 palavras)",
  "sugestao_dieta": "Sugestão prática para melhorar conversão alimentar (max 20 palavras)"
}`

    const text = await groq([{ role: 'user', content: prompt }], 400)
    const clean = text.replace(/```json\n?|\n?```/g, '').trim()
    const analise = JSON.parse(clean)

    // QUBO: otimizar rotação de pastagens (TSP-like)
    // Fases = sequências de ocupação de pastagem
    // Membros = lotes de animais a serem distribuídos
    const fasesPastagem: Phase[] = pastagens.slice(0, 12).map((p: any, i: number) => {
      const diasDescansoIdeal = 21
      const diasDesde = p.ultimaEntrada
        ? Math.ceil((Date.now() - new Date(p.ultimaEntrada).getTime()) / 86400000)
        : diasDescansoIdeal
      const prontoParaUso = diasDesde >= diasDescansoIdeal
      return {
        index: i,
        tipo: p.tipoForrageira || 'pastagem',
        inicio_dia: prontoParaUso ? 0 : diasDescansoIdeal - diasDesde,
        duracao_dias: p.capacidadeUa ? Math.ceil(p.areaHa / p.capacidadeUa * 7) : 7,
        prioridade: p.status === 'DESCANSO' && prontoParaUso ? 'alta' : p.status === 'OCUPADA' ? 'baixa' : 'media',
      }
    })

    const membrosLotes: Member[] = lotes.slice(0, 8).map((l: any) => {
      const cabecas = l.animals?.length ?? 0
      const pesoLote = l.animals?.reduce((a: number, x: any) => a + Number(x.pesoAtual ?? 0), 0) ?? 0
      const ua = pesoLote / 450 // UA = 450 kg
      return {
        id: l.id,
        name: l.nome || `Lote ${l.id.slice(-4)}`,
        role: 'lote',
        currentLoad: ua,
        completionRate: cabecas > 0 ? 0.8 : 0.5,
        specializations: [l.tipo || 'gado', 'pastagem'],
      }
    })

    if (membrosLotes.length === 0) {
      membrosLotes.push({ id: 'rebanho', name: 'Rebanho Geral', role: 'lote', currentLoad: totalCabecas / 10, completionRate: 0.8, specializations: ['pastagem'] })
    }

    const quboResult = fasesPastagem.length > 0 ? solveQUBO(fasesPastagem, membrosLotes) : null

    const rotacaoOtimizada = quboResult ? pastagens.slice(0, 12).map((p: any, i: number) => {
      const assignment = quboResult.assignments.find(a => a.phaseIndex === i)
      return {
        pastagem: p.nome,
        area: p.areaHa,
        status: p.status,
        loteIndicado: assignment?.memberName ?? 'A definir',
        diasParaEntrada: fasesPastagem[i]?.inicio_dia ?? 0,
        prioridade: fasesPastagem[i]?.prioridade ?? 'media',
      }
    }) : []

    return NextResponse.json({
      ...analise,
      kpis: { totalCabecas, pesoMedio: Math.round(pesoMedio), custoTotal: Math.round(custoTotal), pastagensOcupadas, pastagensDescanso, totalPastagens, ganhoPesoPrevisto: Math.round(ganhoPesoPrevisto * 1000) / 1000 },
      rotacaoOtimizada,
      quantum: quboResult ? {
        solver: 'QUBO TSP-Pastagem',
        iterations: quboResult.iterations,
        convergencia: quboResult.convergence,
        pastagensAnalisadas: fasesPastagem.length,
        lotesConsiderados: membrosLotes.length,
      } : null,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

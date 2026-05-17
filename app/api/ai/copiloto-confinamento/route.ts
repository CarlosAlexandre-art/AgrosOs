import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { groqStream, Msg } from '@/lib/groq'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return new Response('Não autenticado', { status: 401 })

    const { messages, loteId }: { messages: Msg[]; loteId?: string } = await req.json()

    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      select: {
        name: true,
        properties: {
          take: 1,
          select: {
            name: true,
            lotes: {
              where: loteId ? { id: loteId } : { status: 'ATIVO' },
              take: loteId ? 1 : 5,
              select: {
                id: true,
                nome: true,
                cabecas: true,
                racaPredominante: true,
                idadeMediaMeses: true,
                pesoMedioEntrada: true,
                objetivo: true,
                pesoMetaAbate: true,
                dataEntrada: true,
                dataSaidaPrevista: true,
                custoTotal: true,
                status: true,
                registrosDiarios: {
                  orderBy: { data: 'desc' },
                  take: 14,
                  select: {
                    data: true,
                    pesoMedio: true,
                    consumoRacaoKg: true,
                    mortalidade: true,
                    custoDia: true,
                    custoRacaoDia: true,
                    observacoes: true,
                  },
                },
                planosNutricionais: {
                  where: { ativo: true },
                  take: 1,
                  select: {
                    nome: true,
                    racaoKgDia: true,
                    proteinaBruta: true,
                    mineralKgDia: true,
                    custoKgRacao: true,
                    custoKgMineral: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    const p = dbUser?.properties[0]
    if (!p || !p.lotes.length) return new Response('Nenhum lote encontrado', { status: 404 })

    const hoje = new Date()
    const lotesInfo = p.lotes.map(lote => {
      const dias = Math.floor((hoje.getTime() - new Date(lote.dataEntrada).getTime()) / (1000 * 60 * 60 * 24))
      const registros = lote.registrosDiarios
      const ultimoPeso = registros.find(r => r.pesoMedio)?.pesoMedio ?? lote.pesoMedioEntrada
      const gmd = dias > 0 ? ((ultimoPeso - lote.pesoMedioEntrada) / dias) : 0
      const consumoMedio = registros.filter(r => r.consumoRacaoKg).length > 0
        ? registros.filter(r => r.consumoRacaoKg).reduce((s, r) => s + (r.consumoRacaoKg ?? 0), 0) / registros.filter(r => r.consumoRacaoKg).length
        : 0
      const ca = gmd > 0 ? (consumoMedio / gmd).toFixed(2) : 'n/d'
      const pesoMeta = lote.pesoMetaAbate ?? 480
      const diasRestantes = gmd > 0 ? Math.ceil((pesoMeta - ultimoPeso) / gmd) : null
      const custoDiario = registros.find(r => r.custoDia)?.custoDia
        ?? (lote.planosNutricionais[0]?.custoKgRacao ?? 3.5) * (lote.planosNutricionais[0]?.racaoKgDia ?? 8)
      const projecaoCusto = diasRestantes ? (custoDiario * diasRestantes * lote.cabecas) : null

      return {
        lote: lote.nome,
        cabecas: lote.cabecas,
        raca: lote.racaPredominante || 'mista',
        diasConfinamento: dias,
        pesoEntrada: lote.pesoMedioEntrada,
        pesoAtual: ultimoPeso,
        gmd: gmd.toFixed(3),
        conversaoAlimentar: ca,
        consumoMedioRacao: consumoMedio.toFixed(1),
        custoDiarioCab: custoDiario.toFixed(2),
        custoAcumuladoTotal: lote.custoTotal.toFixed(2),
        diasAteMeta: diasRestantes,
        projecaoCustoFinal: projecaoCusto ? projecaoCusto.toFixed(2) : 'n/d',
        planoNutricional: lote.planosNutricionais[0] ? {
          racao: `${lote.planosNutricionais[0].racaoKgDia} kg/dia`,
          pb: `${lote.planosNutricionais[0].proteinaBruta}% PB`,
          custoKg: `R$${lote.planosNutricionais[0].custoKgRacao}/kg`,
        } : 'não definido',
        tendenciaGMD: registros.length >= 4 ? (
          (registros[0].pesoMedio ?? 0) > (registros[3].pesoMedio ?? 0) ? 'crescente' : 'decrescente'
        ) : 'dados insuficientes',
      }
    })

    const systemPrompt = `Você é o Copiloto de Confinamento IA do SmartAgroOS, assistente especializado em zootecnia e economia da pecuária bovina de corte. Responda SEMPRE em português brasileiro. Seja técnico mas acessível. Use dados concretos do lote ao responder. Máximo 4 parágrafos.

FAZENDA: ${p.name} | Produtor: ${dbUser?.name} | Hoje: ${hoje.toLocaleDateString('pt-BR')}

LOTES ATIVOS:
${JSON.stringify(lotesInfo, null, 2)}

Preços de referência (mercado atual aproximado):
- Arroba (@) boi gordo: R$280-320 (@)
- Milho: R$65-75/sc 60kg
- Farelo de soja: R$140-160/sc 60kg
- Premix mineral: R$150-200/sc 25kg`

    const stream = await groqStream([
      { role: 'system', content: systemPrompt },
      ...messages,
    ])

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (e: any) {
    console.error('[CopilotoConfinamento Error]', e?.message)
    return new Response(JSON.stringify({ error: e?.message ?? 'Erro interno' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    })
  }
}

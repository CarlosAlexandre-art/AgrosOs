import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { groqStream } from '@/lib/groq'
import { rateLimit } from '@/lib/rate-limit'

export const maxDuration = 60

type Msg = { role: 'user' | 'assistant'; content: string }

const ORYON_SYSTEM = `Você é o ORYON Pecuário, especialista em recria e engorda bovina no Brasil.
Seu foco é maximizar GMD, eficiência alimentar e retorno financeiro em sistemas de pasto e semiconfinamento.

BENCHMARKS DE REFERÊNCIA (Embrapa/CEPEA 2024):
- Nelore recria: GMD 600-700 g/dia | engorda: 700-800 g/dia | meta abate: 480-500 kg
- Angus/Brangus recria: GMD 700-800 g/dia | engorda: 850-1000 g/dia | meta abate: 500-520 kg
- Senepol recria: GMD 650-750 g/dia | engorda: 750-850 g/dia | meta abate: 480-500 kg
- Canchim: GMD 750-850 g/dia | engorda: 850-950 g/dia | meta abate: 490-510 kg

SUPLEMENTAÇÃO (pasto rotacionado):
- Recria: proteinado 30-40% PB, 100-200 g/cab/dia na seca; sal mineral ad libitum
- Engorda: energético 70-80% NDT, 0,3-0,5% PV/dia; sal mineral + monensina
- Transição recria→engorda: 15-21 dias adaptação gradual

DIMENSIONAMENTO DE PASTO:
- Brachiaria brizantha cv. Marandu: suporte 2-3 UA/ha (ano favorável)
- Piquetes (rotação): ocupação 7 dias | descanso 35 dias = 6 piquetes mínimo
- 1 UA = animal 450 kg; ajustar para animais em recria (0,5-0,8 UA)

Responda em português, seja objetivo e prático. Cite dados do lote quando disponíveis.`

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { allowed } = rateLimit(`ai-re:${user.id}`, 30, 3_600_000)
  if (!allowed) return NextResponse.json({ error: 'Limite de 30 análises/hora atingido.' }, { status: 429 })

  const body = await req.json()
  const { messages, loteId }: { messages: Msg[]; loteId?: string } = body

  let loteContext = ''
  if (loteId) {
    try {
      const lote = await prisma.lote.findFirst({
        where: { id: loteId, property: { user: { supabaseId: user.id } } },
        include: { registrosDiarios: { orderBy: { data: 'desc' }, take: 14 } },
      })
      if (lote) {
        const diarios = lote.registrosDiarios
        const ultimoPeso = diarios.find(d => d.pesoMedio)?.pesoMedio ?? lote.pesoMedioEntrada
        const gmds = diarios
          .filter(d => d.pesoMedio)
          .map((d, i, arr) => i < arr.length - 1 && arr[i + 1].pesoMedio
            ? ((d.pesoMedio! - arr[i + 1].pesoMedio!) / Math.max(1,
              (new Date(d.data).getTime() - new Date(arr[i + 1].data).getTime()) / 86400000)) * 1000
            : null
          ).filter(Boolean) as number[]
        const gmdMedio = gmds.length ? (gmds.reduce((a, b) => a + b, 0) / gmds.length).toFixed(0) : 'N/D'

        loteContext = `\n\nDADOS DO LOTE ATUAL:
Nome: ${lote.nome}
Raça: ${lote.racaPredominante ?? 'N/D'}
Cabeças: ${lote.cabecas}
Fase: ${lote.faseAtual ?? 'N/D'}
Peso entrada: ${lote.pesoMedioEntrada} kg
Peso atual estimado: ${ultimoPeso} kg
Meta GMD: ${lote.metaGMD ? lote.metaGMD + ' g/dia' : 'N/D'}
GMD médio (últimos registros): ${gmdMedio} g/dia
Meta abate: ${lote.pesoMetaAbate ? lote.pesoMetaAbate + ' kg' : 'N/D'}
Sistema: ${lote.sistemaProducao ?? 'N/D'}
Área: ${lote.areaHectares ? lote.areaHectares + ' ha' : 'N/D'}
Piquetes: ${lote.numPiquetes ?? 'N/D'}
Região: ${lote.regiao ?? 'N/D'}
Custo acumulado: R$ ${lote.custoTotal.toFixed(2)}`
      }
    } catch {
      // lote context is optional
    }
  }

  const systemWithContext = ORYON_SYSTEM + loteContext

  const stream = await groqStream([
    { role: 'system', content: systemWithContext },
    ...messages,
  ])

  return new Response(stream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}

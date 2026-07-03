import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

async function getProperty(supabaseId: string) {
  const dbUser = await prisma.user.findUnique({
    where: { supabaseId },
    include: { properties: { take: 1 } },
  })
  return dbUser?.properties[0] ?? null
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const property = await getProperty(session.user.id)
    if (!property) return NextResponse.json({ error: 'Propriedade não encontrada' }, { status: 404 })

    const [lotes, producoes] = await Promise.all([
      (prisma as any).aveLote.findMany({
        where: { propertyId: property.id, status: 'ATIVO' },
        select: { id: true, nome: true, especie: true, quantidadeAtual: true, faseProducao: true },
        orderBy: { nome: 'asc' },
      }),
      (prisma as any).aveProducaoOvos.findMany({
        where: { lote: { propertyId: property.id } },
        include: { lote: { select: { nome: true, especie: true, quantidadeAtual: true } } },
        orderBy: { data: 'desc' },
        take: 100,
      }),
    ])

    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    const producoesHoje = producoes.filter((p: any) => new Date(p.data) >= hoje)
    const ovosHoje = producoesHoje.reduce((acc: number, p: any) => acc + p.ovosColetados, 0)

    const ultimas7 = producoes.slice(0, 7)
    const taxaMedia = ultimas7.length
      ? ultimas7.reduce((acc: number, p: any) => acc + (p.lote.quantidadeAtual > 0 ? (p.ovosColetados / p.lote.quantidadeAtual) * 100 : 0), 0) / ultimas7.length
      : 0

    const kpis = {
      ovosHoje,
      taxaPosturaMedia: Number(taxaMedia.toFixed(1)),
      lotesEmPostura: lotes.filter((l: any) => l.faseProducao === 'POSTURA').length,
    }

    return NextResponse.json({ lotes, producoes, kpis })
  } catch (e: any) {
    console.error('[aves-postura GET]', e.message)
    return NextResponse.json({ error: 'Erro ao carregar dados' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const property = await getProperty(session.user.id)
    if (!property) return NextResponse.json({ error: 'Propriedade não encontrada' }, { status: 404 })

    const body = await req.json()
    const {
      loteId, data, ovosColetados, ovosQuebrados, ovosSujos,
      ovosDescartados, pesoMedioG, horasLuz, observacao,
    } = body

    if (!loteId || ovosColetados === undefined || ovosColetados === null) {
      return NextResponse.json({ error: 'Lote e ovos coletados são obrigatórios' }, { status: 400 })
    }

    const producao = await (prisma as any).aveProducaoOvos.create({
      data: {
        loteId,
        data: data ? new Date(data) : new Date(),
        ovosColetados: Number(ovosColetados),
        ovosQuebrados: ovosQuebrados ? Number(ovosQuebrados) : null,
        ovosSujos: ovosSujos ? Number(ovosSujos) : null,
        ovosDescartados: ovosDescartados ? Number(ovosDescartados) : null,
        pesoMedioG: pesoMedioG ? Number(pesoMedioG) : null,
        horasLuz: horasLuz ? Number(horasLuz) : null,
        observacao: observacao || null,
      },
    })
    return NextResponse.json(producao, { status: 201 })
  } catch (e: any) {
    console.error('[aves-postura POST]', e.message)
    return NextResponse.json({ error: 'Erro ao salvar' }, { status: 500 })
  }
}

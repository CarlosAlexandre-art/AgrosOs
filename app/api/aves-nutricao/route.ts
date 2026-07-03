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

    const [lotes, arracoamentos] = await Promise.all([
      (prisma as any).aveLote.findMany({
        where: { propertyId: property.id, status: 'ATIVO' },
        select: { id: true, nome: true, especie: true, quantidadeAtual: true, faseProducao: true },
        orderBy: { nome: 'asc' },
      }),
      (prisma as any).aveArracoamento.findMany({
        where: { lote: { propertyId: property.id } },
        include: { lote: { select: { nome: true, especie: true, quantidadeAtual: true } } },
        orderBy: { data: 'desc' },
        take: 100,
      }),
    ])

    const ultimos7 = arracoamentos.slice(0, 7)
    const consumoMedioAveG = ultimos7.length
      ? ultimos7.reduce((acc: number, a: any) => {
          const consumoPorAve = a.lote.quantidadeAtual > 0 ? (a.quantidadeKg * 1000) / a.lote.quantidadeAtual : 0
          return acc + consumoPorAve
        }, 0) / ultimos7.length
      : 0

    const custoTotal7dias = ultimos7.reduce((acc: number, a: any) => acc + (a.custoKg ? a.quantidadeKg * a.custoKg : 0), 0)

    const kpis = {
      consumoMedioAveG: Number(consumoMedioAveG.toFixed(1)),
      custoTotal7dias: Number(custoTotal7dias.toFixed(2)),
      lotesAtivos: lotes.length,
    }

    return NextResponse.json({ lotes, arracoamentos, kpis })
  } catch (e: any) {
    console.error('[aves-nutricao GET]', e.message)
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
    const { loteId, data, tipoRacao, faseAlimentar, quantidadeKg, custoKg, aguaConsumidaL, observacao } = body

    if (!loteId || !quantidadeKg) {
      return NextResponse.json({ error: 'Lote e quantidade de ração são obrigatórios' }, { status: 400 })
    }

    const arracoamento = await (prisma as any).aveArracoamento.create({
      data: {
        loteId,
        data: data ? new Date(data) : new Date(),
        tipoRacao: tipoRacao || null,
        faseAlimentar: faseAlimentar || null,
        quantidadeKg: Number(quantidadeKg),
        custoKg: custoKg ? Number(custoKg) : null,
        aguaConsumidaL: aguaConsumidaL ? Number(aguaConsumidaL) : null,
        observacao: observacao || null,
      },
    })
    return NextResponse.json(arracoamento, { status: 201 })
  } catch (e: any) {
    console.error('[aves-nutricao POST]', e.message)
    return NextResponse.json({ error: 'Erro ao salvar' }, { status: 500 })
  }
}

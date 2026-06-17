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

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const property = await getProperty(session.user.id)
    if (!property) return NextResponse.json({ error: 'Propriedade não encontrada' }, { status: 404 })

    const { searchParams } = new URL(req.url)
    const periodo = searchParams.get('periodo') || '30'
    const diasAtras = new Date()
    diasAtras.setDate(diasAtras.getDate() - Number(periodo))

    const [lotes, arracoamentos] = await Promise.all([
      (prisma as any).loteAqua.findMany({
        where: { propertyId: property.id, status: 'ATIVO' },
        select: { id: true, nome: true, especie: true, quantidadeAtual: true, tanque: { select: { nome: true } } },
      }),
      (prisma as any).arracoamentoDiario.findMany({
        where: {
          lote: { propertyId: property.id },
          data: { gte: diasAtras },
        },
        include: { lote: { select: { nome: true, especie: true, quantidadeAtual: true } } },
        orderBy: { data: 'desc' },
      }),
    ])

    const totalKgPeriodo = arracoamentos.reduce((a: number, r: any) => a + r.quantidadeKg, 0)
    const totalCustoPeriodo = arracoamentos.reduce((a: number, r: any) => a + (r.quantidadeKg * (r.custoKg || 0)), 0)

    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    const arracoamentosHoje = arracoamentos.filter((r: any) => new Date(r.data) >= hoje)
    const kgHoje = arracoamentosHoje.reduce((a: number, r: any) => a + r.quantidadeKg, 0)

    return NextResponse.json({ lotes, arracoamentos, kpis: { totalKgPeriodo, totalCustoPeriodo, kgHoje, totalRegistros: arracoamentos.length } })
  } catch (e: any) {
    console.error('[aqua-nutri GET]', e.message)
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

    const { loteId, tipoRacao, quantidadeKg, custoKg, data, observacao } = await req.json()
    if (!loteId || !quantidadeKg) return NextResponse.json({ error: 'Lote e quantidade são obrigatórios' }, { status: 400 })

    const registro = await (prisma as any).arracoamentoDiario.create({
      data: {
        loteId,
        tipoRacao: tipoRacao || null,
        quantidadeKg: Number(quantidadeKg),
        custoKg: custoKg ? Number(custoKg) : null,
        data: data ? new Date(data) : new Date(),
        observacao: observacao || null,
      },
    })

    return NextResponse.json(registro, { status: 201 })
  } catch (e: any) {
    console.error('[aqua-nutri POST]', e.message)
    return NextResponse.json({ error: 'Erro ao salvar' }, { status: 500 })
  }
}

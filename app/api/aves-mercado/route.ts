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

    const [lotes, vendas] = await Promise.all([
      (prisma as any).aveLote.findMany({
        where: { propertyId: property.id, status: 'ATIVO' },
        select: { id: true, nome: true, especie: true },
        orderBy: { nome: 'asc' },
      }),
      (prisma as any).aveVenda.findMany({
        where: { lote: { propertyId: property.id } },
        include: { lote: { select: { nome: true, especie: true } } },
        orderBy: { data: 'desc' },
        take: 100,
      }),
    ])

    const vendasOvos = vendas.filter((v: any) => v.tipo === 'OVOS')
    const receitaTotal = vendas.reduce((acc: number, v: any) => acc + v.total, 0)
    const precoMedioOvos = vendasOvos.length
      ? vendasOvos.reduce((acc: number, v: any) => acc + v.precoUnitario, 0) / vendasOvos.length
      : 0

    const kpis = {
      receitaTotal: Number(receitaTotal.toFixed(2)),
      totalVendas: vendas.length,
      precoMedioOvos: Number(precoMedioOvos.toFixed(2)),
    }

    return NextResponse.json({ lotes, vendas, kpis })
  } catch (e: any) {
    console.error('[aves-mercado GET]', e.message)
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
    const { loteId, data, tipo, quantidade, unidade, precoUnitario, comprador, canal, observacao } = body

    if (!loteId || !quantidade || precoUnitario === undefined) {
      return NextResponse.json({ error: 'Lote, quantidade e preço são obrigatórios' }, { status: 400 })
    }

    const total = Number(quantidade) * Number(precoUnitario)

    const venda = await (prisma as any).aveVenda.create({
      data: {
        loteId,
        data: data ? new Date(data) : new Date(),
        tipo: tipo || 'OVOS',
        quantidade: Number(quantidade),
        unidade: unidade || null,
        precoUnitario: Number(precoUnitario),
        total,
        comprador: comprador || null,
        canal: canal || null,
        observacao: observacao || null,
      },
    })
    return NextResponse.json(venda, { status: 201 })
  } catch (e: any) {
    console.error('[aves-mercado POST]', e.message)
    return NextResponse.json({ error: 'Erro ao salvar' }, { status: 500 })
  }
}

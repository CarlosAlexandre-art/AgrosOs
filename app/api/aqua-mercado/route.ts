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
    const periodo = Number(searchParams.get('periodo') || '90')
    const desde = new Date()
    desde.setDate(desde.getDate() - periodo)

    const [lotes, vendas] = await Promise.all([
      (prisma as any).loteAqua.findMany({
        where: { propertyId: property.id, status: 'ATIVO' },
        select: { id: true, nome: true, especie: true, quantidadeAtual: true },
      }),
      (prisma as any).vendaAqua.findMany({
        where: { lote: { propertyId: property.id }, data: { gte: desde } },
        include: { lote: { select: { nome: true, especie: true } } },
        orderBy: { data: 'desc' },
        take: 200,
      }),
    ])

    const totalKg = vendas.reduce((a: number, v: any) => a + v.pesoKg, 0)
    const totalReceita = vendas.reduce((a: number, v: any) => a + v.total, 0)
    const precoMedioKg = totalKg > 0 ? totalReceita / totalKg : 0

    const porCanal = vendas.reduce((acc: Record<string, number>, v: any) => {
      const canal = v.canal || 'Direto'
      acc[canal] = (acc[canal] || 0) + v.total
      return acc
    }, {})

    const porEspecie = vendas.reduce((acc: Record<string, { kg: number; receita: number }>, v: any) => {
      const esp = v.especie
      if (!acc[esp]) acc[esp] = { kg: 0, receita: 0 }
      acc[esp].kg += v.pesoKg
      acc[esp].receita += v.total
      return acc
    }, {})

    return NextResponse.json({ lotes, vendas, kpis: { totalKg, totalReceita, precoMedioKg, totalVendas: vendas.length }, porCanal, porEspecie })
  } catch (e: any) {
    console.error('[aqua-mercado GET]', e.message)
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

    const { loteId, especie, pesoKg, precoKg, comprador, canal, data, observacao } = await req.json()
    if (!loteId || !especie || !pesoKg || !precoKg) {
      return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 })
    }

    const total = Number(pesoKg) * Number(precoKg)
    const venda = await (prisma as any).vendaAqua.create({
      data: {
        loteId,
        especie,
        pesoKg: Number(pesoKg),
        precoKg: Number(precoKg),
        total,
        comprador: comprador || null,
        canal: canal || null,
        data: data ? new Date(data) : new Date(),
        observacao: observacao || null,
      },
    })

    return NextResponse.json(venda, { status: 201 })
  } catch (e: any) {
    console.error('[aqua-mercado POST]', e.message)
    return NextResponse.json({ error: 'Erro ao salvar' }, { status: 500 })
  }
}

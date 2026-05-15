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

    const [transacoes, ultimoValuation, animais] = await Promise.all([
      (prisma as any).transacaoGado.findMany({
        where: { propertyId: property.id },
        orderBy: { data: 'desc' },
        take: 50,
      }),
      (prisma as any).valuationRebanho.findFirst({
        where: { propertyId: property.id },
        orderBy: { data: 'desc' },
      }),
      (prisma as any).animal.findMany({
        where: { propertyId: property.id, ativo: true },
        select: { id: true, pesoAtual: true, identificacao: true },
      }),
    ])

    const receitas = transacoes.filter((t: any) => t.tipo === 'VENDA' || t.tipo === 'LEILAO_VENDA').reduce((s: number, t: any) => s + t.valorTotal, 0)
    const custos = transacoes.filter((t: any) => t.tipo === 'COMPRA' || t.tipo === 'LEILAO_COMPRA').reduce((s: number, t: any) => s + t.valorTotal, 0)
    const margem = receitas - custos

    return NextResponse.json({ transacoes, ultimoValuation, kpis: { receitas, custos, margem, totalAnimais: animais.length } })
  } catch (e: any) {
    console.error('[financeiro-pecuario GET]', e.message)
    return NextResponse.json({ error: e.message || 'Erro ao carregar dados financeiros' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const property = await getProperty(session.user.id)
    if (!property) return NextResponse.json({ error: 'Propriedade não encontrada. Complete o cadastro em /onboarding.' }, { status: 404 })

    const body = await req.json()

    if (body._type === 'valuation') {
      const { valorArrobaRef } = body
      const animais = await (prisma as any).animal.findMany({
        where: { propertyId: property.id, ativo: true },
        select: { pesoAtual: true },
      })
      const pesoTotal = animais.reduce((s: number, a: any) => s + (a.pesoAtual ?? 0), 0)
      const arrobaRef = valorArrobaRef ? Number(valorArrobaRef) : 320
      const totalArrobas = pesoTotal / 15
      const valorEstimado = totalArrobas * arrobaRef
      const valuation = await (prisma as any).valuationRebanho.create({
        data: {
          propertyId: property.id,
          totalAnimais: animais.length,
          pesoTotalKg: pesoTotal,
          valorArrobaRef: arrobaRef,
          totalArrobas,
          valorTotalEstimado: valorEstimado,
        },
      })
      return NextResponse.json(valuation, { status: 201 })
    }

    const { tipo, data, cabecas, pesoTotal, valorArroba, valorTotal, contraparte, gta, comissao, observacao } = body
    if (!tipo || !cabecas || !valorTotal) return NextResponse.json({ error: 'tipo, cabecas e valorTotal são obrigatórios' }, { status: 400 })

    const transacao = await (prisma as any).transacaoGado.create({
      data: {
        propertyId: property.id,
        tipo,
        data: data ? new Date(data) : new Date(),
        cabecas: Number(cabecas),
        pesoTotal: pesoTotal ? Number(pesoTotal) : null,
        valorArroba: valorArroba ? Number(valorArroba) : null,
        valorTotal: Number(valorTotal),
        contraparte: contraparte || null,
        gta: gta || null,
        comissao: comissao ? Number(comissao) : 0,
        observacao: observacao || null,
      },
    })
    return NextResponse.json(transacao, { status: 201 })
  } catch (e: any) {
    console.error('[financeiro-pecuario POST]', e.message)
    return NextResponse.json({ error: e.message || 'Erro ao salvar' }, { status: 500 })
  }
}

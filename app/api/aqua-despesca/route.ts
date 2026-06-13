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

    const [lotes, despescas] = await Promise.all([
      (prisma as any).loteAqua.findMany({
        where: { propertyId: property.id },
        select: { id: true, nome: true, especie: true, quantidadeAtual: true, status: true, dataDespescaPrev: true, tanque: { select: { nome: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      (prisma as any).despescaAqua.findMany({
        where: { lote: { propertyId: property.id } },
        include: { lote: { select: { nome: true, especie: true, tanque: { select: { nome: true } } } } },
        orderBy: { data: 'desc' },
        take: 50,
      }),
    ])

    const totalKgColhido = despescas.reduce((a: number, d: any) => a + d.pesoTotalKg, 0)
    const totalReceita = despescas.reduce((a: number, d: any) => a + (d.receita ?? 0), 0)
    const hoje = new Date()
    const proximas = lotes.filter((l: any) => l.status === 'ATIVO' && l.dataDespescaPrev && new Date(l.dataDespescaPrev) <= new Date(hoje.getTime() + 30 * 86400000))

    return NextResponse.json({ lotes, despescas, kpis: { totalKgColhido, totalReceita, proximasDespescas: proximas.length } })
  } catch (e: any) {
    console.error('[aqua-despesca GET]', e.message)
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

    const { loteId, quantidadePeixe, pesoTotalKg, pesoMedioG, rendimentoPerc, destinoVenda, precoKg, data, observacao, encerrarLote } = await req.json()
    if (!loteId || !quantidadePeixe || !pesoTotalKg) {
      return NextResponse.json({ error: 'Lote, quantidade e peso total são obrigatórios' }, { status: 400 })
    }

    const receitaCalc = precoKg ? Number(pesoTotalKg) * Number(precoKg) : null

    const [desp] = await Promise.all([
      (prisma as any).despescaAqua.create({
        data: {
          loteId,
          quantidadePeixe: Number(quantidadePeixe),
          pesoTotalKg: Number(pesoTotalKg),
          pesoMedioG: pesoMedioG ? Number(pesoMedioG) : null,
          rendimentoPerc: rendimentoPerc ? Number(rendimentoPerc) : null,
          destinoVenda: destinoVenda || null,
          precoKg: precoKg ? Number(precoKg) : null,
          receita: receitaCalc,
          data: data ? new Date(data) : new Date(),
          observacao: observacao || null,
        },
      }),
      encerrarLote
        ? (prisma as any).loteAqua.update({ where: { id: loteId }, data: { status: 'ENCERRADO', dataEncerramento: new Date() } })
        : (prisma as any).loteAqua.update({ where: { id: loteId }, data: { quantidadeAtual: { decrement: Number(quantidadePeixe) } } }),
    ])

    return NextResponse.json(desp, { status: 201 })
  } catch (e: any) {
    console.error('[aqua-despesca POST]', e.message)
    return NextResponse.json({ error: 'Erro ao salvar' }, { status: 500 })
  }
}

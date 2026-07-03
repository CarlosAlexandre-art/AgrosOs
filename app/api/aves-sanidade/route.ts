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

    const [lotes, mortalidades, sanidades] = await Promise.all([
      (prisma as any).aveLote.findMany({
        where: { propertyId: property.id, status: 'ATIVO' },
        select: { id: true, nome: true, especie: true, quantidadeAtual: true, quantidadeInicial: true },
        orderBy: { nome: 'asc' },
      }),
      (prisma as any).aveMortalidade.findMany({
        where: { lote: { propertyId: property.id } },
        include: { lote: { select: { nome: true, especie: true } } },
        orderBy: { data: 'desc' },
        take: 100,
      }),
      (prisma as any).aveSanidade.findMany({
        where: { lote: { propertyId: property.id } },
        include: { lote: { select: { nome: true, especie: true } } },
        orderBy: { data: 'desc' },
        take: 100,
      }),
    ])

    const totalMortalidade = mortalidades.reduce((acc: number, m: any) => acc + m.quantidade, 0)
    const totalInicial = lotes.reduce((acc: number, l: any) => acc + l.quantidadeInicial, 0)
    const taxaMortalidade = totalInicial > 0 ? (totalMortalidade / totalInicial) * 100 : 0

    const hoje = new Date()
    const proximasAplicacoes = sanidades.filter((s: any) => s.proximaAplicacao && new Date(s.proximaAplicacao) >= hoje)
    const emCarencia = sanidades.filter((s: any) => {
      if (!s.carenciaDias) return false
      const fim = new Date(s.data)
      fim.setDate(fim.getDate() + s.carenciaDias)
      return fim > hoje
    })

    const kpis = {
      totalMortalidade,
      taxaMortalidade: Number(taxaMortalidade.toFixed(2)),
      proximasAplicacoes: proximasAplicacoes.length,
      emCarencia: emCarencia.length,
    }

    return NextResponse.json({ lotes, mortalidades, sanidades, kpis })
  } catch (e: any) {
    console.error('[aves-sanidade GET]', e.message)
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
    const { action } = body

    if (action === 'mortalidade') {
      const { loteId, quantidade, causaSuspeita, data, observacao } = body
      if (!loteId || !quantidade) return NextResponse.json({ error: 'Lote e quantidade são obrigatórios' }, { status: 400 })

      const [mort] = await Promise.all([
        (prisma as any).aveMortalidade.create({
          data: {
            loteId,
            quantidade: Number(quantidade),
            causaSuspeita: causaSuspeita || null,
            data: data ? new Date(data) : new Date(),
            observacao: observacao || null,
          },
        }),
        (prisma as any).aveLote.update({
          where: { id: loteId },
          data: { quantidadeAtual: { decrement: Number(quantidade) } },
        }),
      ])
      return NextResponse.json(mort, { status: 201 })
    }

    if (action === 'sanidade') {
      const { loteId, tipo, produto, dosagem, viaAplicacao, carenciaDias, proximaAplicacao, data, observacao } = body
      if (!loteId || !produto) return NextResponse.json({ error: 'Lote e produto são obrigatórios' }, { status: 400 })
      const registro = await (prisma as any).aveSanidade.create({
        data: {
          loteId,
          tipo: tipo || 'VACINA',
          produto,
          dosagem: dosagem || null,
          viaAplicacao: viaAplicacao || null,
          carenciaDias: carenciaDias ? Number(carenciaDias) : null,
          proximaAplicacao: proximaAplicacao ? new Date(proximaAplicacao) : null,
          data: data ? new Date(data) : new Date(),
          observacao: observacao || null,
        },
      })
      return NextResponse.json(registro, { status: 201 })
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
  } catch (e: any) {
    console.error('[aves-sanidade POST]', e.message)
    return NextResponse.json({ error: 'Erro ao salvar' }, { status: 500 })
  }
}

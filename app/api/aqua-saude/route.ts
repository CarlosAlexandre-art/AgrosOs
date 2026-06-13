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

    const [lotes, mortalidades, tratamentos] = await Promise.all([
      (prisma as any).loteAqua.findMany({
        where: { propertyId: property.id, status: 'ATIVO' },
        select: { id: true, nome: true, especie: true, quantidadeAtual: true, tanque: { select: { nome: true } } },
      }),
      (prisma as any).mortalidadeAqua.findMany({
        where: { lote: { propertyId: property.id } },
        include: { lote: { select: { nome: true, especie: true } } },
        orderBy: { data: 'desc' },
        take: 100,
      }),
      (prisma as any).tratamentoAqua.findMany({
        where: { lote: { propertyId: property.id } },
        include: { lote: { select: { nome: true, especie: true } } },
        orderBy: { data: 'desc' },
        take: 100,
      }),
    ])

    const totalMortalidade = mortalidades.reduce((a: number, m: any) => a + m.quantidade, 0)

    const hoje = new Date()
    const tratamentosEmCarencia = tratamentos.filter((t: any) => {
      if (!t.carenciaDias) return false
      const fim = new Date(t.data)
      fim.setDate(fim.getDate() + t.carenciaDias)
      return fim > hoje
    })

    return NextResponse.json({ lotes, mortalidades, tratamentos, kpis: { totalMortalidade, tratamentosEmCarencia: tratamentosEmCarencia.length } })
  } catch (e: any) {
    console.error('[aqua-saude GET]', e.message)
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
      const { loteId, quantidade, causaSuspeita, tratamento, data, observacao } = body
      if (!loteId || !quantidade) return NextResponse.json({ error: 'Lote e quantidade obrigatórios' }, { status: 400 })

      const [mort] = await Promise.all([
        (prisma as any).mortalidadeAqua.create({
          data: {
            loteId,
            quantidade: Number(quantidade),
            causaSuspeita: causaSuspeita || null,
            tratamento: tratamento || null,
            data: data ? new Date(data) : new Date(),
            observacao: observacao || null,
          },
        }),
        (prisma as any).loteAqua.update({
          where: { id: loteId },
          data: { quantidadeAtual: { decrement: Number(quantidade) } },
        }),
      ])
      return NextResponse.json(mort, { status: 201 })
    }

    if (action === 'tratamento') {
      const { loteId, medicamento, dosagem, carenciaDias, motivoCID, data, observacao } = body
      if (!loteId || !medicamento) return NextResponse.json({ error: 'Lote e medicamento obrigatórios' }, { status: 400 })
      const trat = await (prisma as any).tratamentoAqua.create({
        data: {
          loteId,
          medicamento,
          dosagem: dosagem || null,
          carenciaDias: carenciaDias ? Number(carenciaDias) : null,
          motivoCID: motivoCID || null,
          data: data ? new Date(data) : new Date(),
          observacao: observacao || null,
        },
      })
      return NextResponse.json(trat, { status: 201 })
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
  } catch (e: any) {
    console.error('[aqua-saude POST]', e.message)
    return NextResponse.json({ error: 'Erro ao salvar' }, { status: 500 })
  }
}

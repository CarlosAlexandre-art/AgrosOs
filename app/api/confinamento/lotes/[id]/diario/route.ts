import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: loteId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: { properties: { take: 1 } },
  })
  const property = dbUser?.properties[0]
  if (!property) return NextResponse.json({ error: 'Propriedade não encontrada' }, { status: 404 })

  const lote = await prisma.lote.findFirst({ where: { id: loteId, propertyId: property.id } })
  if (!lote) return NextResponse.json({ error: 'Lote não encontrado' }, { status: 404 })

  const body = await req.json()
  const { consumoRacaoKg, consumoAguaL, pesoMedio, mortalidade, medicacao, observacoes, custoRacaoDia, custoDia } = body

  const registro = await prisma.loteDiario.create({
    data: {
      loteId,
      consumoRacaoKg: consumoRacaoKg ? Number(consumoRacaoKg) : null,
      consumoAguaL: consumoAguaL ? Number(consumoAguaL) : null,
      pesoMedio: pesoMedio ? Number(pesoMedio) : null,
      mortalidade: Number(mortalidade ?? 0),
      medicacao: medicacao || null,
      observacoes: observacoes || null,
      custoRacaoDia: custoRacaoDia ? Number(custoRacaoDia) : null,
      custoDia: custoDia ? Number(custoDia) : null,
    },
  })

  // Atualizar custo total do lote
  if (custoDia) {
    await prisma.lote.update({
      where: { id: loteId },
      data: { custoTotal: { increment: Number(custoDia) * lote.cabecas } },
    })
  }

  return NextResponse.json(registro, { status: 201 })
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: loteId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const registros = await prisma.loteDiario.findMany({
    where: { loteId },
    orderBy: { data: 'desc' },
    take: 30,
  })

  return NextResponse.json(registros)
}

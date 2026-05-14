import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { calcularKpisLote, calcularTendenciaPeso } from '@/lib/confinamento'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: { properties: { take: 1 } },
  })
  const property = dbUser?.properties[0]
  if (!property) return NextResponse.json({ error: 'Propriedade não encontrada' }, { status: 404 })

  const lote = await prisma.lote.findFirst({
    where: { id, propertyId: property.id },
    include: {
      registrosDiarios: { orderBy: { data: 'asc' } },
      animais: { select: { id: true, identificacao: true, raca: true, sexo: true, pesoAtual: true } },
    },
  })
  if (!lote) return NextResponse.json({ error: 'Lote não encontrado' }, { status: 404 })

  const ultimoRegistro = lote.registrosDiarios.at(-1)
  const diasConfinamento = Math.floor((Date.now() - new Date(lote.dataEntrada).getTime()) / 86_400_000)
  const consumoTotal = lote.registrosDiarios.reduce((s, r) => s + (r.consumoRacaoKg ?? 0), 0)

  const kpis = calcularKpisLote({
    pesoMedioEntrada: lote.pesoMedioEntrada,
    pesoAtual: ultimoRegistro?.pesoMedio ?? lote.pesoMedioEntrada,
    diasConfinamento,
    consumoRacaoKgTotal: consumoTotal,
    custoTotalReais: lote.custoTotal,
    cabecas: lote.cabecas,
    pesoMetaAbate: lote.pesoMetaAbate ?? undefined,
  })

  const tendencia = calcularTendenciaPeso(
    lote.registrosDiarios
      .filter(r => r.pesoMedio !== null)
      .map(r => ({ data: r.data, pesoMedio: r.pesoMedio! }))
  )

  return NextResponse.json({ lote, kpis, tendencia, diasConfinamento })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: { properties: { take: 1 } },
  })
  const property = dbUser?.properties[0]
  if (!property) return NextResponse.json({ error: 'Propriedade não encontrada' }, { status: 404 })

  const body = await req.json()
  const lote = await prisma.lote.updateMany({
    where: { id, propertyId: property.id },
    data: body,
  })

  return NextResponse.json(lote)
}

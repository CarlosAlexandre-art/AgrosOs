import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: { properties: { take: 1 } },
  })
  const property = dbUser?.properties[0]
  if (!property) return NextResponse.json({ error: 'Propriedade não encontrada' }, { status: 404 })

  const lotes = await prisma.lote.findMany({
    where: { propertyId: property.id },
    include: {
      registrosDiarios: { orderBy: { data: 'desc' }, take: 1 },
      _count: { select: { animais: true, registrosDiarios: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(lotes)
}

export async function POST(req: NextRequest) {
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
  const { nome, cabecas, racaPredominante, idadeMediaMeses, pesoMedioEntrada, objetivo, pesoMetaAbate, dataSaidaPrevista } = body

  if (!nome || !cabecas || !pesoMedioEntrada)
    return NextResponse.json({ error: 'nome, cabecas e pesoMedioEntrada são obrigatórios' }, { status: 400 })

  const lote = await prisma.lote.create({
    data: {
      propertyId: property.id,
      nome,
      cabecas: Number(cabecas),
      racaPredominante: racaPredominante || null,
      idadeMediaMeses: idadeMediaMeses ? Number(idadeMediaMeses) : null,
      pesoMedioEntrada: Number(pesoMedioEntrada),
      objetivo: objetivo || 'ABATE',
      pesoMetaAbate: pesoMetaAbate ? Number(pesoMetaAbate) : null,
      dataSaidaPrevista: dataSaidaPrevista ? new Date(dataSaidaPrevista) : null,
    },
  })

  return NextResponse.json(lote, { status: 201 })
}

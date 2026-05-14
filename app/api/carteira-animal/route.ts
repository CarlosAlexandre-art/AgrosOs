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

  const animais = await prisma.animal.findMany({
    where: { propertyId: property.id, ativo: true },
    include: {
      lote: { select: { nome: true, objetivo: true } },
      _count: { select: { saude: true, movimentos: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(animais)
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
  const { identificacao, sexo, raca, brincoEletronico, sisbovId, rfid, dataNascimento, pesoAtual, pesoNascimento, loteId, origemFazenda, gtaOrigem } = body

  if (!identificacao || !sexo)
    return NextResponse.json({ error: 'identificacao e sexo são obrigatórios' }, { status: 400 })

  const animal = await prisma.animal.create({
    data: {
      propertyId: property.id,
      identificacao,
      sexo,
      raca: raca || null,
      brincoEletronico: brincoEletronico || null,
      sisbovId: sisbovId || null,
      rfid: rfid || null,
      dataNascimento: dataNascimento ? new Date(dataNascimento) : null,
      pesoAtual: pesoAtual ? Number(pesoAtual) : null,
      pesoNascimento: pesoNascimento ? Number(pesoNascimento) : null,
      loteId: loteId || null,
      origemFazenda: origemFazenda || null,
      gtaOrigem: gtaOrigem || null,
    },
  })

  // Registrar movimento de entrada
  await prisma.animalMovimento.create({
    data: {
      animalId: animal.id,
      tipo: 'ENTRADA',
      origem: origemFazenda || null,
      destino: property.name,
      peso: pesoAtual ? Number(pesoAtual) : null,
      gta: gtaOrigem || null,
    },
  })

  return NextResponse.json(animal, { status: 201 })
}

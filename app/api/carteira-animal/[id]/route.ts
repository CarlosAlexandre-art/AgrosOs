import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { calcularIdadeTexto, resumoSaude } from '@/lib/passaporte'

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

  const animal = await prisma.animal.findFirst({
    where: { id, propertyId: property.id },
    include: {
      lote: { select: { nome: true, objetivo: true, status: true } },
      saude: { orderBy: { dataRegistro: 'desc' } },
      movimentos: { orderBy: { data: 'desc' } },
    },
  })
  if (!animal) return NextResponse.json({ error: 'Animal não encontrado' }, { status: 404 })

  const idadeTexto = calcularIdadeTexto(animal.dataNascimento)
  const resumo = resumoSaude(animal.saude)

  return NextResponse.json({ animal, idadeTexto, resumoSaude: resumo, propriedade: property.name })
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
  const animal = await prisma.animal.updateMany({
    where: { id, propertyId: property.id },
    data: body,
  })

  return NextResponse.json(animal)
}

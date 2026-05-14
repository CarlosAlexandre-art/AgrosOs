import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json()
  const { animalId, tipo, descricao, produto, dose, veterinario, proximaDose } = body

  if (!animalId || !descricao)
    return NextResponse.json({ error: 'animalId e descricao são obrigatórios' }, { status: 400 })

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: { properties: { take: 1 } },
  })
  const property = dbUser?.properties[0]
  if (!property) return NextResponse.json({ error: 'Propriedade não encontrada' }, { status: 404 })

  const animal = await prisma.animal.findFirst({ where: { id: animalId, propertyId: property.id } })
  if (!animal) return NextResponse.json({ error: 'Animal não encontrado' }, { status: 404 })

  const registro = await prisma.animalSaude.create({
    data: {
      animalId,
      tipo: tipo || 'OBSERVACAO',
      descricao,
      produto: produto || null,
      dose: dose || null,
      veterinario: veterinario || null,
      proximaDose: proximaDose ? new Date(proximaDose) : null,
    },
  })

  return NextResponse.json(registro, { status: 201 })
}

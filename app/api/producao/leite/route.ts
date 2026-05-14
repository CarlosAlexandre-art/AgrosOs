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
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const property = await getProperty(user.id)
  if (!property) return NextResponse.json({ error: 'Propriedade não encontrada' }, { status: 404 })

  const registros = await prisma.producaoLeite.findMany({
    where: { animal: { propertyId: property.id } },
    include: { animal: { select: { identificacao: true, raca: true } } },
    orderBy: { data: 'desc' },
    take: 100,
  })

  const hoje = registros.filter(r => {
    const d = new Date(r.data)
    const now = new Date()
    return d.toDateString() === now.toDateString()
  })

  const totalHoje = hoje.reduce((s, r) => s + r.totalLitros, 0)
  const mediaAnimal = hoje.length > 0 ? totalHoje / hoje.length : 0

  return NextResponse.json({ registros, kpis: { totalHoje, mediaAnimal, animaisOrdenha: hoje.length } })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const property = await getProperty(user.id)
  if (!property) return NextResponse.json({ error: 'Propriedade não encontrada' }, { status: 404 })

  const { animalId, litrosManha, litrosTarde, ccs, gordura, proteina, data } = await req.json()
  if (!animalId) return NextResponse.json({ error: 'animalId é obrigatório' }, { status: 400 })

  const animal = await prisma.animal.findFirst({ where: { id: animalId, propertyId: property.id } })
  if (!animal) return NextResponse.json({ error: 'Animal não encontrado' }, { status: 404 })

  const manha = Number(litrosManha ?? 0)
  const tarde = Number(litrosTarde ?? 0)
  const registro = await prisma.producaoLeite.create({
    data: {
      animalId,
      data: data ? new Date(data) : new Date(),
      litrosManha: manha,
      litrosTarde: tarde,
      totalLitros: manha + tarde,
      ccs: ccs ? Number(ccs) : null,
      gordura: gordura ? Number(gordura) : null,
      proteina: proteina ? Number(proteina) : null,
    },
  })
  return NextResponse.json(registro, { status: 201 })
}

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

  const registros = await prisma.controleCarcaca.findMany({
    where: { animal: { propertyId: property.id } },
    include: { animal: { select: { identificacao: true, raca: true } } },
    orderBy: { dataAbate: 'desc' },
  })

  const rendMedio = registros.length > 0
    ? registros.filter(r => r.rendimentoCarcaca).reduce((s, r) => s + (r.rendimentoCarcaca ?? 0), 0) / registros.filter(r => r.rendimentoCarcaca).length
    : 0
  const receitaTotal = registros.reduce((s, r) => s + (r.receitaTotal ?? 0), 0)

  return NextResponse.json({ registros, kpis: { rendMedio, receitaTotal, total: registros.length } })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const property = await getProperty(user.id)
  if (!property) return NextResponse.json({ error: 'Propriedade não encontrada' }, { status: 404 })

  const { animalId, dataAbate, pesoVivo, pesoCarcaca, classificacao, tipificacao, frigorificoNome, valorArroba, observacao } = await req.json()
  if (!animalId || !pesoVivo) return NextResponse.json({ error: 'animalId e pesoVivo são obrigatórios' }, { status: 400 })

  const animal = await prisma.animal.findFirst({ where: { id: animalId, propertyId: property.id } })
  if (!animal) return NextResponse.json({ error: 'Animal não encontrado' }, { status: 404 })

  const pv = Number(pesoVivo)
  const pc = pesoCarcaca ? Number(pesoCarcaca) : null
  const rend = pc ? (pc / pv) * 100 : null
  const arroba = valorArroba ? Number(valorArroba) : null
  const receita = pc && arroba ? (pc / 15) * arroba : null

  const registro = await prisma.controleCarcaca.create({
    data: {
      animalId,
      dataAbate: dataAbate ? new Date(dataAbate) : new Date(),
      pesoVivo: pv,
      pesoCarcaca: pc,
      rendimentoCarcaca: rend,
      classificacao: classificacao || null,
      tipificacao: tipificacao || null,
      frigorificoNome: frigorificoNome || null,
      valorArroba: arroba,
      receitaTotal: receita,
      observacao: observacao || null,
    },
  })

  // Marcar animal como inativo
  await prisma.animal.update({ where: { id: animalId }, data: { ativo: false } })
  // Registrar movimento de abate
  await prisma.animalMovimento.create({
    data: { animalId, tipo: 'ABATE', destino: frigorificoNome || 'Frigorífico', peso: pv },
  })

  return NextResponse.json(registro, { status: 201 })
}

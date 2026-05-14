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

  const [planos, lotes] = await Promise.all([
    prisma.planoNutricional.findMany({
      where: { propertyId: property.id },
      include: { lote: { select: { nome: true, cabecas: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.lote.findMany({
      where: { propertyId: property.id, status: 'ATIVO' },
      select: { id: true, nome: true, cabecas: true },
    }),
  ])

  // Custo diário total estimado
  const custoTotal = planos
    .filter(p => p.ativo)
    .reduce((acc, p) => {
      const cabecas = p.lote?.cabecas ?? 0
      const custoRacao = (p.racaoKgDia ?? 0) * (p.custoKgRacao ?? 0) * cabecas
      const custoMineral = (p.mineralKgDia ?? 0) * (p.custoKgMineral ?? 0) * cabecas
      return acc + custoRacao + custoMineral
    }, 0)

  return NextResponse.json({ planos, lotes, kpis: { custoTotal } })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const property = await getProperty(user.id)
  if (!property) return NextResponse.json({ error: 'Propriedade não encontrada' }, { status: 404 })

  const { nome, objetivo, loteId, racaoKgDia, proteinaBruta, mineralKgDia, custoKgRacao, custoKgMineral } = await req.json()
  if (!nome) return NextResponse.json({ error: 'nome é obrigatório' }, { status: 400 })

  const plano = await prisma.planoNutricional.create({
    data: {
      propertyId: property.id,
      loteId: loteId || null,
      nome,
      objetivo: objetivo || 'GANHO_PESO',
      racaoKgDia: racaoKgDia ? Number(racaoKgDia) : null,
      proteinaBruta: proteinaBruta ? Number(proteinaBruta) : null,
      mineralKgDia: mineralKgDia ? Number(mineralKgDia) : null,
      custoKgRacao: custoKgRacao ? Number(custoKgRacao) : null,
      custoKgMineral: custoKgMineral ? Number(custoKgMineral) : null,
    },
  })
  return NextResponse.json(plano, { status: 201 })
}

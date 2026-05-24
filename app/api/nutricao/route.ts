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

    const [planos, lotes] = await Promise.all([
      (prisma as any).planoNutricional.findMany({
        where: { propertyId: property.id },
        include: { lote: { select: { nome: true, cabecas: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      (prisma as any).lote.findMany({
        where: { propertyId: property.id, status: 'ATIVO' },
        select: { id: true, nome: true, cabecas: true },
      }),
    ])

    const custoTotal = planos
      .filter((p: any) => p.ativo)
      .reduce((acc: number, p: any) => {
        const cabecas = p.lote?.cabecas ?? 0
        const custoRacao = (p.racaoKgDia ?? 0) * (p.custoKgRacao ?? 0) * cabecas
        const custoMineral = (p.mineralKgDia ?? 0) * (p.custoKgMineral ?? 0) * cabecas
        return acc + custoRacao + custoMineral
      }, 0)

    return NextResponse.json({ planos, lotes, kpis: { custoTotal } })
  } catch (e: any) {
    console.error('[nutricao GET]', e.message)
    return NextResponse.json({ error: 'Erro ao carregar planos' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const property = await getProperty(session.user.id)
    if (!property) return NextResponse.json({ error: 'Propriedade não encontrada. Complete o cadastro em /onboarding.' }, { status: 404 })

    const { nome, objetivo, loteId, racaoKgDia, proteinaBruta, mineralKgDia, custoKgRacao, custoKgMineral } = await req.json()
    if (!nome) return NextResponse.json({ error: 'nome é obrigatório' }, { status: 400 })

    const plano = await (prisma as any).planoNutricional.create({
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
  } catch (e: any) {
    console.error('[nutricao POST]', e.message)
    return NextResponse.json({ error: 'Erro ao salvar plano' }, { status: 500 })
  }
}

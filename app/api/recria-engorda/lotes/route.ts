import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

async function getOrCreateProperty(supabaseId: string, userEmail?: string) {
  let dbUser = await prisma.user.findUnique({
    where: { supabaseId },
    include: { properties: { take: 1 } },
  })
  if (!dbUser && userEmail) {
    dbUser = await prisma.user.findUnique({
      where: { email: userEmail },
      include: { properties: { take: 1 } },
    })
    if (dbUser) {
      await prisma.user.update({ where: { id: dbUser.id }, data: { supabaseId } })
    }
  }
  if (!dbUser) {
    dbUser = await prisma.user.create({
      data: { supabaseId, email: userEmail ?? supabaseId, name: userEmail?.split('@')[0] ?? 'Usuário' },
      include: { properties: { take: 1 } },
    })
  }
  if (dbUser.properties.length > 0) return dbUser.properties[0]
  return prisma.property.create({ data: { userId: dbUser.id, name: 'Minha Propriedade' } })
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  try {
    const property = await getOrCreateProperty(user.id, user.email ?? undefined)

    const lotes = await prisma.lote.findMany({
      where: {
        propertyId: property.id,
        objetivo: { in: ['RECRIA_ENGORDA', 'ENGORDA', 'RECRIA'] },
      },
      include: {
        registrosDiarios: { orderBy: { data: 'desc' }, take: 7 },
        _count: { select: { registrosDiarios: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(lotes)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro interno'
    console.error('[recria-engorda/lotes GET]', msg)
    return NextResponse.json({ error: 'Módulo ainda não migrado. Execute prisma/migrations/recria_engorda/migration.sql no Supabase.' }, { status: 503 })
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  try {
    const property = await getOrCreateProperty(user.id, user.email ?? undefined)
    const body = await req.json()
    const {
      nome, cabecas, racaPredominante, idadeMediaMeses, pesoMedioEntrada,
      objetivo, pesoMetaAbate, dataSaidaPrevista,
      faseAtual, metaGMD, sistemaProducao, numPiquetes, areaHectares, regiao,
    } = body

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
        objetivo: objetivo || 'RECRIA_ENGORDA',
        pesoMetaAbate: pesoMetaAbate ? Number(pesoMetaAbate) : null,
        dataSaidaPrevista: dataSaidaPrevista ? new Date(dataSaidaPrevista) : null,
        faseAtual: faseAtual || 'RECRIA',
        metaGMD: metaGMD ? Number(metaGMD) : null,
        sistemaProducao: sistemaProducao || null,
        numPiquetes: numPiquetes ? Number(numPiquetes) : null,
        areaHectares: areaHectares ? Number(areaHectares) : null,
        regiao: regiao || null,
      },
    })

    return NextResponse.json(lote, { status: 201 })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro interno'
    console.error('[recria-engorda/lotes POST]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

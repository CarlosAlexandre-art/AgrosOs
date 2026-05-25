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
  return prisma.property.create({
    data: { userId: dbUser.id, name: 'Minha Propriedade' },
  })
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  try {
    const property = await getOrCreateProperty(user.id, user.email ?? undefined)

    const lotes = await prisma.lote.findMany({
      where: { propertyId: property.id },
      include: {
        registrosDiarios: { orderBy: { data: 'desc' }, take: 1 },
        _count: { select: { registrosDiarios: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(lotes)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro interno'
    console.error('[confinamento/lotes GET]', msg)
    return NextResponse.json({ error: 'Tabela de confinamento ainda não foi criada no banco. Aplique a migration todos_modulos_pecuaria.sql no Supabase.' }, { status: 503 })
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  try {
    const property = await getOrCreateProperty(user.id, user.email ?? undefined)

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
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro interno'
    console.error('[confinamento/lotes POST]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

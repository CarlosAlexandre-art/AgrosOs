import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params

  try {
    const lote = await prisma.lote.findFirst({
      where: { id, property: { user: { supabaseId: user.id } } },
      include: {
        registrosDiarios: { orderBy: { data: 'desc' }, take: 90 },
        animais: { where: { ativo: true }, select: { id: true, identificacao: true, pesoAtual: true, raca: true, sexo: true } },
        _count: { select: { animais: true, registrosDiarios: true } },
      },
    })

    if (!lote) return NextResponse.json({ error: 'Lote não encontrado' }, { status: 404 })

    return NextResponse.json(lote)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro interno'
    console.error('[recria-engorda/lotes/[id] GET]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params

  try {
    const existing = await prisma.lote.findFirst({
      where: { id, property: { user: { supabaseId: user.id } } },
    })
    if (!existing) return NextResponse.json({ error: 'Lote não encontrado' }, { status: 404 })

    const body = await req.json()
    const {
      nome, cabecas, status, pesoMetaAbate, dataSaidaPrevista,
      faseAtual, metaGMD, pesoInicioEngorda, dataInicioEngorda,
      sistemaProducao, numPiquetes, areaHectares, regiao,
    } = body

    const updated = await prisma.lote.update({
      where: { id },
      data: {
        ...(nome !== undefined && { nome }),
        ...(cabecas !== undefined && { cabecas: Number(cabecas) }),
        ...(status !== undefined && { status }),
        ...(pesoMetaAbate !== undefined && { pesoMetaAbate: pesoMetaAbate ? Number(pesoMetaAbate) : null }),
        ...(dataSaidaPrevista !== undefined && { dataSaidaPrevista: dataSaidaPrevista ? new Date(dataSaidaPrevista) : null }),
        ...(faseAtual !== undefined && { faseAtual }),
        ...(metaGMD !== undefined && { metaGMD: metaGMD ? Number(metaGMD) : null }),
        ...(pesoInicioEngorda !== undefined && { pesoInicioEngorda: pesoInicioEngorda ? Number(pesoInicioEngorda) : null }),
        ...(dataInicioEngorda !== undefined && { dataInicioEngorda: dataInicioEngorda ? new Date(dataInicioEngorda) : null }),
        ...(sistemaProducao !== undefined && { sistemaProducao }),
        ...(numPiquetes !== undefined && { numPiquetes: numPiquetes ? Number(numPiquetes) : null }),
        ...(areaHectares !== undefined && { areaHectares: areaHectares ? Number(areaHectares) : null }),
        ...(regiao !== undefined && { regiao }),
      },
    })

    return NextResponse.json(updated)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro interno'
    console.error('[recria-engorda/lotes/[id] PATCH]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

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

  const pastagens = await prisma.pastagem.findMany({
    where: { propertyId: property.id },
    include: {
      rotacoes: {
        where: { saida: null },
        include: { lote: { select: { nome: true, cabecas: true } } },
        take: 1,
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const totalArea = pastagens.reduce((s, p) => s + p.areaHectares, 0)
  const disponiveis = pastagens.filter(p => p.status === 'DISPONIVEL').length

  return NextResponse.json({ pastagens, kpis: { totalArea, disponiveis, total: pastagens.length } })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const property = await getProperty(user.id)
  if (!property) return NextResponse.json({ error: 'Propriedade não encontrada' }, { status: 404 })

  const body = await req.json()

  if (body._type === 'rotacao') {
    const { pastagemId, loteId, cabecas } = body
    if (!pastagemId) return NextResponse.json({ error: 'pastagemId é obrigatório' }, { status: 400 })
    // Fechar rotação anterior se existir
    await prisma.rotacaoPastagem.updateMany({
      where: { pastagemId, saida: null },
      data: { saida: new Date() },
    })
    const rotacao = await prisma.rotacaoPastagem.create({
      data: { pastagemId, loteId: loteId || null, cabecas: cabecas ? Number(cabecas) : null },
    })
    await prisma.pastagem.update({ where: { id: pastagemId }, data: { status: 'OCUPADA' } })
    return NextResponse.json(rotacao, { status: 201 })
  }

  if (body._type === 'liberar') {
    const { pastagemId } = body
    await prisma.rotacaoPastagem.updateMany({
      where: { pastagemId, saida: null },
      data: { saida: new Date() },
    })
    await prisma.pastagem.update({ where: { id: pastagemId }, data: { status: 'DESCANSO' } })
    return NextResponse.json({ ok: true })
  }

  const { nome, areaHectares, forrageira, capacidadeUA, cicloDescanso } = body
  if (!nome || !areaHectares) return NextResponse.json({ error: 'nome e areaHectares são obrigatórios' }, { status: 400 })

  const pastagem = await prisma.pastagem.create({
    data: {
      propertyId: property.id,
      nome,
      areaHectares: Number(areaHectares),
      forrageira: forrageira || null,
      capacidadeUA: capacidadeUA ? Number(capacidadeUA) : null,
      cicloDescanso: cicloDescanso ? Number(cicloDescanso) : null,
    },
  })
  return NextResponse.json(pastagem, { status: 201 })
}

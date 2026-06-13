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

    const [tanques, lotes] = await Promise.all([
      (prisma as any).tanqueAqua.findMany({
        where: { propertyId: property.id },
        include: {
          lotesAqua: {
            where: { status: 'ATIVO' },
            select: { id: true, nome: true, especie: true, quantidadeAtual: true, dataDespescaPrev: true },
          },
          _count: { select: { qualidadeAgua: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      (prisma as any).loteAqua.findMany({
        where: { propertyId: property.id, status: 'ATIVO' },
        include: {
          tanque: { select: { nome: true, tipo: true } },
          biometrias: { orderBy: { data: 'desc' }, take: 1 },
          _count: { select: { arracoamentos: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ])

    const kpis = {
      totalTanques: tanques.length,
      tanquesAtivos: tanques.filter((t: any) => t.ativo).length,
      lotesAtivos: lotes.length,
      biomasseTotal: lotes.reduce((acc: number, l: any) => {
        const bio = l.biometrias[0]?.biomasseKg ?? 0
        return acc + bio
      }, 0),
    }

    return NextResponse.json({ tanques, lotes, kpis })
  } catch (e: any) {
    console.error('[aqua-gestao GET]', e.message)
    return NextResponse.json({ error: 'Erro ao carregar dados' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const property = await getProperty(session.user.id)
    if (!property) return NextResponse.json({ error: 'Propriedade não encontrada' }, { status: 404 })

    const body = await req.json()
    const { action } = body

    if (action === 'tanque') {
      const { nome, tipo, areaM2, volumeM3, profundidadeM, localizacao } = body
      if (!nome) return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
      const tanque = await (prisma as any).tanqueAqua.create({
        data: {
          propertyId: property.id,
          nome,
          tipo: tipo || 'ESCAVADO',
          areaM2: areaM2 ? Number(areaM2) : null,
          volumeM3: volumeM3 ? Number(volumeM3) : null,
          profundidadeM: profundidadeM ? Number(profundidadeM) : null,
          localizacao: localizacao || null,
        },
      })
      return NextResponse.json(tanque, { status: 201 })
    }

    if (action === 'lote') {
      const { tanqueId, nome, especie, quantidadeInicial, pesoMedioEntradaG, dataPovamento, dataDespescaPrev, observacao } = body
      if (!tanqueId || !nome || !especie || !quantidadeInicial) {
        return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 })
      }
      const lote = await (prisma as any).loteAqua.create({
        data: {
          propertyId: property.id,
          tanqueId,
          nome,
          especie,
          quantidadeInicial: Number(quantidadeInicial),
          quantidadeAtual: Number(quantidadeInicial),
          pesoMedioEntradaG: pesoMedioEntradaG ? Number(pesoMedioEntradaG) : null,
          dataPovamento: dataPovamento ? new Date(dataPovamento) : new Date(),
          dataDespescaPrev: dataDespescaPrev ? new Date(dataDespescaPrev) : null,
          observacao: observacao || null,
        },
      })
      return NextResponse.json(lote, { status: 201 })
    }

    if (action === 'encerrar_lote') {
      const { loteId } = body
      const lote = await (prisma as any).loteAqua.update({
        where: { id: loteId },
        data: { status: 'ENCERRADO', dataEncerramento: new Date() },
      })
      return NextResponse.json(lote)
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
  } catch (e: any) {
    console.error('[aqua-gestao POST]', e.message)
    return NextResponse.json({ error: 'Erro ao salvar' }, { status: 500 })
  }
}

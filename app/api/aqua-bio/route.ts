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

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const property = await getProperty(session.user.id)
    if (!property) return NextResponse.json({ error: 'Propriedade não encontrada' }, { status: 404 })

    const { searchParams } = new URL(req.url)
    const loteId = searchParams.get('loteId')

    const [lotes, biometrias] = await Promise.all([
      (prisma as any).loteAqua.findMany({
        where: { propertyId: property.id, status: 'ATIVO' },
        select: { id: true, nome: true, especie: true, quantidadeAtual: true, dataPovamento: true, dataDespescaPrev: true, tanque: { select: { nome: true } } },
      }),
      (prisma as any).biometriaAqua.findMany({
        where: {
          lote: { propertyId: property.id },
          ...(loteId ? { loteId } : {}),
        },
        include: { lote: { select: { nome: true, especie: true, quantidadeAtual: true } } },
        orderBy: { data: 'desc' },
        take: 200,
      }),
    ])

    const biomasseTotal = lotes.reduce((acc: number, l: any) => {
      const ultima = biometrias.find((b: any) => b.loteId === l.id)
      return acc + (ultima?.biomasseKg ?? 0)
    }, 0)

    const pesoMedioGeral = biometrias.length > 0
      ? biometrias.slice(0, lotes.length).reduce((a: number, b: any) => a + b.pesoMedioG, 0) / Math.max(1, Math.min(lotes.length, biometrias.length))
      : 0

    return NextResponse.json({ lotes, biometrias, kpis: { biomasseTotal, pesoMedioGeral, totalBiometrias: biometrias.length } })
  } catch (e: any) {
    console.error('[aqua-bio GET]', e.message)
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

    const { loteId, amostragem, pesoMedioG, comprimentoCm, data, observacao } = await req.json()
    if (!loteId || !amostragem || !pesoMedioG) {
      return NextResponse.json({ error: 'Lote, amostragem e peso médio são obrigatórios' }, { status: 400 })
    }

    const lote = await (prisma as any).loteAqua.findUnique({ where: { id: loteId } })
    const biomasseKg = lote ? (lote.quantidadeAtual * Number(pesoMedioG)) / 1000 : null

    const bio = await (prisma as any).biometriaAqua.create({
      data: {
        loteId,
        amostragem: Number(amostragem),
        pesoMedioG: Number(pesoMedioG),
        comprimentoCm: comprimentoCm ? Number(comprimentoCm) : null,
        biomasseKg,
        data: data ? new Date(data) : new Date(),
        observacao: observacao || null,
      },
    })

    return NextResponse.json(bio, { status: 201 })
  } catch (e: any) {
    console.error('[aqua-bio POST]', e.message)
    return NextResponse.json({ error: 'Erro ao salvar' }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

const CONSUMO_LH = 18 // litros/hora (trator médio 100 HP)

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id }, select: { id: true } })
    if (!dbUser) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })

    const body = await req.json()
    const { fieldId, tipo, larguraM, anguloGraus, velocidadeKmh, areaHa, passadas,
            comprimentoKm, tempoEstHoras, tempoRealMin, modoGps, serviceId } = body

    if (!fieldId || !tipo) {
      return NextResponse.json({ error: 'fieldId e tipo são obrigatórios' }, { status: 400 })
    }

    // Verifica que o talhão pertence ao usuário
    const field = await prisma.field.findFirst({
      where: { id: fieldId, property: { userId: dbUser.id } },
    })
    if (!field) return NextResponse.json({ error: 'Talhão não encontrado' }, { status: 404 })

    const combustivelL = tempoEstHoras ? parseFloat((tempoEstHoras * CONSUMO_LH).toFixed(1)) : null

    const op = await prisma.fieldOperation.create({
      data: {
        fieldId,
        userId: dbUser.id,
        tipo,
        larguraM: parseFloat(larguraM),
        anguloGraus: parseFloat(anguloGraus),
        velocidadeKmh: parseFloat(velocidadeKmh),
        areaHa: parseFloat(areaHa),
        passadas: parseInt(passadas),
        comprimentoKm: parseFloat(comprimentoKm),
        tempoEstHoras: parseFloat(tempoEstHoras),
        tempoRealMin: tempoRealMin ? parseFloat(tempoRealMin) : null,
        combustivelL,
        modoGps: Boolean(modoGps),
        serviceId: serviceId || null,
        completedAt: new Date(),
      },
    })

    return NextResponse.json({ ok: true, operacao: op })
  } catch (err) {
    console.error('[agronav/operacoes POST]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id }, select: { id: true } })
    if (!dbUser) return NextResponse.json({ operacoes: [] })

    const { searchParams } = new URL(req.url)
    const fieldId = searchParams.get('fieldId')

    const where = fieldId
      ? { userId: dbUser.id, fieldId }
      : { userId: dbUser.id }

    const operacoes = await prisma.fieldOperation.findMany({
      where,
      include: { field: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return NextResponse.json({ operacoes })
  } catch (err) {
    console.error('[agronav/operacoes GET]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

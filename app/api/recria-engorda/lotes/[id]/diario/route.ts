import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params

  try {
    const lote = await prisma.lote.findFirst({
      where: { id, property: { user: { supabaseId: user.id } } },
    })
    if (!lote) return NextResponse.json({ error: 'Lote não encontrado' }, { status: 404 })

    const body = await req.json()
    const { pesoMedio, consumoRacaoKg, consumoAguaL, mortalidade, medicacao, observacoes, custoRacaoDia, custoDia, data } = body

    const registro = await prisma.loteDiario.create({
      data: {
        loteId: id,
        data: data ? new Date(data) : new Date(),
        pesoMedio: pesoMedio ? Number(pesoMedio) : null,
        consumoRacaoKg: consumoRacaoKg ? Number(consumoRacaoKg) : null,
        consumoAguaL: consumoAguaL ? Number(consumoAguaL) : null,
        mortalidade: mortalidade ? Number(mortalidade) : 0,
        medicacao: medicacao || null,
        observacoes: observacoes || null,
        custoRacaoDia: custoRacaoDia ? Number(custoRacaoDia) : null,
        custoDia: custoDia ? Number(custoDia) : null,
      },
    })

    if (pesoMedio) {
      await prisma.lote.update({
        where: { id },
        data: { custoTotal: { increment: custoDia ? Number(custoDia) : 0 } },
      })
    }

    return NextResponse.json(registro, { status: 201 })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro interno'
    console.error('[recria-engorda/diario POST]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

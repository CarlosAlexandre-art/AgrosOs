import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET — slots disponíveis (futuros, não ocupados)
export async function GET() {
  try {
    const slots = await prisma.slotDisponivel.findMany({
      where: { ocupado: false, data: { gt: new Date() } },
      orderBy: { data: 'asc' },
    })
    return NextResponse.json(slots)
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar slots' }, { status: 500 })
  }
}

// POST — advogada cria slot disponível
// Body: { data: string (ISO), durMinutos?: number, modalidade?: 'ONLINE'|'PRESENCIAL', senha: string }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (body.senha !== process.env.ADVOGADA_SENHA) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    const slot = await prisma.slotDisponivel.create({
      data: {
        data: new Date(body.data),
        durMinutos: body.durMinutos ?? 60,
        modalidade: body.modalidade ?? 'ONLINE',
      },
    })
    return NextResponse.json(slot)
  } catch {
    return NextResponse.json({ error: 'Erro ao criar slot' }, { status: 500 })
  }
}

// DELETE — advogada remove slot
export async function DELETE(req: NextRequest) {
  try {
    const { id, senha } = await req.json()
    if (senha !== process.env.ADVOGADA_SENHA) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    await prisma.slotDisponivel.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Erro ao deletar slot' }, { status: 500 })
  }
}

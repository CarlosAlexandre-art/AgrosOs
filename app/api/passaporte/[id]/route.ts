import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calcularIdadeTexto, resumoSaude } from '@/lib/passaporte'

// Endpoint público — sem auth. Retorna dados de rastreabilidade do animal.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const animal = await (prisma as any).animal.findUnique({
      where: { id },
      include: {
        lote: { select: { nome: true, objetivo: true, status: true } },
        saude: { orderBy: { dataRegistro: 'desc' } },
        movimentos: { orderBy: { data: 'desc' } },
        property: { select: { name: true } },
      },
    })

    if (!animal || !animal.ativo) {
      return NextResponse.json({ error: 'Animal não encontrado' }, { status: 404 })
    }

    const idadeTexto = calcularIdadeTexto(animal.dataNascimento)
    const resumo = resumoSaude(animal.saude)

    return NextResponse.json({
      animal,
      idadeTexto,
      resumoSaude: resumo,
      propriedade: animal.property?.name ?? '—',
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erro ao buscar passaporte' }, { status: 500 })
  }
}

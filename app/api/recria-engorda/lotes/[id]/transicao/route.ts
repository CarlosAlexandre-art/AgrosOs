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

    if (lote.faseAtual !== 'RECRIA')
      return NextResponse.json({ error: 'Lote não está em fase de recria' }, { status: 400 })

    const body = await req.json()
    const { pesoTransicao, metaGMDEngorda } = body

    if (!pesoTransicao)
      return NextResponse.json({ error: 'pesoTransicao é obrigatório' }, { status: 400 })

    const updated = await prisma.lote.update({
      where: { id },
      data: {
        faseAtual: 'ENGORDA',
        pesoInicioEngorda: Number(pesoTransicao),
        dataInicioEngorda: new Date(),
        metaGMD: metaGMDEngorda ? Number(metaGMDEngorda) : lote.metaGMD,
      },
    })

    return NextResponse.json(updated)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro interno'
    console.error('[recria-engorda/transicao POST]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

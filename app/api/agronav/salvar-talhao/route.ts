import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { fieldId, geoJson, sizeHectares } = await req.json()
    if (!fieldId || !geoJson) {
      return NextResponse.json({ error: 'fieldId e geoJson são obrigatórios' }, { status: 400 })
    }

    // Verifica que o talhão pertence ao usuário
    const field = await prisma.field.findFirst({
      where: { id: fieldId, property: { userId: user.id } },
    })
    if (!field) return NextResponse.json({ error: 'Talhão não encontrado' }, { status: 404 })

    const updated = await prisma.field.update({
      where: { id: fieldId },
      data: {
        geoJson: typeof geoJson === 'string' ? geoJson : JSON.stringify(geoJson),
        ...(sizeHectares ? { sizeHectares } : {}),
      },
    })

    return NextResponse.json({ ok: true, field: { id: updated.id, geoJson: updated.geoJson } })
  } catch (err) {
    console.error('[agronav/salvar-talhao]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

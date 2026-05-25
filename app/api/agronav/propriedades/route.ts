import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const properties = await prisma.property.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        name: true,
        location: true,
        lat: true,
        lng: true,
        sizeHectares: true,
        fields: {
          select: { id: true, name: true, sizeHectares: true, lat: true, lng: true, geoJson: true }
        },
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ properties })
  } catch (err) {
    console.error('[agronav/propriedades]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

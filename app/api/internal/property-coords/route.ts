import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-internal-secret')
  if (!secret || secret !== process.env.AGROOS_INTERNAL_SECRET) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const supabaseId = searchParams.get('supabaseId')
  if (!supabaseId) {
    return NextResponse.json({ error: 'supabaseId obrigatório' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({
    where: { supabaseId },
    include: {
      properties: {
        take: 1,
        select: { lat: true, lng: true, sizeHectares: true },
        orderBy: { name: 'asc' },
      },
    },
  })

  const prop = user?.properties[0]
  if (!prop?.lat || !prop?.lng) {
    return NextResponse.json({ hasCoords: false })
  }

  return NextResponse.json({
    hasCoords: true,
    lat: prop.lat,
    lng: prop.lng,
    ha: Number(prop.sizeHectares),
  })
}

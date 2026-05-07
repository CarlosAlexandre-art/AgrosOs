import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

async function getFirstProperty(supabaseId: string) {
  const user = await prisma.user.findUnique({
    where: { supabaseId },
    include: { properties: { take: 1 } },
  })
  return user?.properties[0] ?? null
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const property = await getFirstProperty(user.id)
  if (!property) return NextResponse.json({ error: 'Propriedade não encontrada' }, { status: 404 })

  const data = await prisma.property.findUnique({
    where: { id: property.id },
    select: {
      id: true,
      name: true,
      lat: true,
      lng: true,
      sizeHectares: true,
      fields: {
        select: { id: true, name: true, sizeHectares: true, lat: true, lng: true, geoJson: true },
      },
    },
  })

  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const property = await getFirstProperty(user.id)
  if (!property) return NextResponse.json({ error: 'Propriedade não encontrada' }, { status: 404 })

  const body = await req.json()
  const { lat, lng, fieldId, geoJson } = body

  if (fieldId) {
    const updated = await prisma.field.update({
      where: { id: fieldId },
      data: {
        ...(lat != null ? { lat } : {}),
        ...(lng != null ? { lng } : {}),
        ...(geoJson !== undefined ? { geoJson } : {}),
      },
    })
    return NextResponse.json(updated)
  }

  const updated = await prisma.property.update({
    where: { id: property.id },
    data: { lat, lng },
  })
  return NextResponse.json(updated)
}

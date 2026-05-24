import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const property = await prisma.property.findFirst({
    where: { id, user: { supabaseId: user.id } },
    include: { fields: true, teamMembers: true }
  })
  if (!property) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(property)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const owned = await prisma.property.findFirst({
    where: { id, user: { supabaseId: user.id } },
    select: { id: true }
  })
  if (!owned) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { name, location, sizeHectares, coverUrl, lat, lng, fieldId, ...fieldLatLng } = await req.json()

  // Salvar coordenadas de um talhão específico
  if (fieldId && (fieldLatLng.lat !== undefined || lat !== undefined)) {
    const fieldOwned = await prisma.field.findFirst({
      where: { id: fieldId, propertyId: id },
      select: { id: true }
    })
    if (!fieldOwned) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const fLat = fieldLatLng.lat ?? lat
    const fLng = fieldLatLng.lng ?? lng
    const field = await prisma.field.update({
      where: { id: fieldId },
      data: { lat: fLat, lng: fLng },
    })
    return NextResponse.json(field)
  }

  const property = await prisma.property.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(location !== undefined && { location }),
      ...(sizeHectares !== undefined && { sizeHectares }),
      ...(coverUrl !== undefined && { coverUrl }),
      ...(lat !== undefined && { lat }),
      ...(lng !== undefined && { lng }),
    },
  })
  return NextResponse.json(property)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const owned = await prisma.property.findFirst({
    where: { id, user: { supabaseId: user.id } },
    select: { id: true }
  })
  if (!owned) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.property.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const property = await prisma.property.findUnique({ where: { id }, include: { fields: true, teamMembers: true } })
  if (!property) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(property)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, location, sizeHectares, coverUrl } = await req.json()
  const property = await prisma.property.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(location !== undefined && { location }),
      ...(sizeHectares !== undefined && { sizeHectares }),
      ...(coverUrl !== undefined && { coverUrl }),
    },
  })
  return NextResponse.json(property)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await prisma.property.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}

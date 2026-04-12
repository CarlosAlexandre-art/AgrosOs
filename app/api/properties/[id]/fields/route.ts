import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const fields = await prisma.field.findMany({ where: { propertyId: id }, include: { crop: true } })
  return NextResponse.json(fields)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { name, sizeHectares, cropId } = await req.json()
  if (!name) return NextResponse.json({ error: 'Nome obrigatório' }, { status: 400 })
  const field = await prisma.field.create({ data: { propertyId: id, name, sizeHectares: sizeHectares || 0, cropId: cropId || null } })
  return NextResponse.json(field, { status: 201 })
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const team = await prisma.teamMember.findMany({ where: { propertyId: id } })
  return NextResponse.json(team)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { name, role, phone } = await req.json()
  if (!name || !role) return NextResponse.json({ error: 'Nome e cargo obrigatórios' }, { status: 400 })
  const member = await prisma.teamMember.create({ data: { propertyId: id, name, role, phone: phone || null } })
  return NextResponse.json(member, { status: 201 })
}

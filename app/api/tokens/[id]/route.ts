import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

async function getAuthorizedToken(id: string, supabaseId: string) {
  const dbUser = await prisma.user.findUnique({ where: { supabaseId } })
  if (!dbUser) return null
  return prisma.agroToken.findFirst({
    where: { id, property: { userId: dbUser.id } },
    include: { property: { select: { name: true, fields: { select: { id: true, name: true } } } } },
  })
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const token = await getAuthorizedToken(id, user.id)
  if (!token) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(token)
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const token = await getAuthorizedToken(id, user.id)
  if (!token) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await request.json()
  const updated = await prisma.agroToken.update({
    where: { id },
    data: {
      status: body.status ?? token.status,
      soldTokens: body.soldTokens !== undefined ? parseInt(body.soldTokens) : token.soldTokens,
      blockchainTx: body.blockchainTx ?? token.blockchainTx,
      contractUrl: body.contractUrl ?? token.contractUrl,
    },
  })
  return NextResponse.json(updated)
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const token = await getAuthorizedToken(id, user.id)
  if (!token) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (token.status === 'ACTIVE') {
    return NextResponse.json({ error: 'Não é possível excluir um token ativo' }, { status: 400 })
  }

  await prisma.agroToken.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

const COMMISSION_RATE = 0.02

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } })
  if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const token = await prisma.agroToken.findUnique({ where: { id } })
  if (!token) return NextResponse.json({ error: 'Token não encontrado' }, { status: 404 })
  if (token.status !== 'ACTIVE') return NextResponse.json({ error: 'Token não está ativo' }, { status: 400 })

  const body = await request.json()
  const quantity = parseInt(body.quantity)
  if (!quantity || quantity < 1) return NextResponse.json({ error: 'Quantidade inválida' }, { status: 400 })

  const available = token.totalTokens - token.soldTokens
  if (quantity > available) {
    return NextResponse.json({ error: `Apenas ${available} tokens disponíveis` }, { status: 400 })
  }

  const pricePerToken = Number(token.tokenPrice)
  const totalAmount = quantity * pricePerToken
  const commission = totalAmount * COMMISSION_RATE

  const [transaction] = await prisma.$transaction([
    prisma.tokenTransaction.create({
      data: {
        tokenId: id,
        buyerId: dbUser.id,
        quantity,
        pricePerToken: token.tokenPrice,
        totalAmount,
        commission,
      },
    }),
    prisma.agroToken.update({
      where: { id },
      data: { soldTokens: { increment: quantity } },
    }),
  ])

  return NextResponse.json(transaction, { status: 201 })
}

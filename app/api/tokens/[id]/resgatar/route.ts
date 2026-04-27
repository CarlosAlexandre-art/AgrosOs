import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

const SUCESSO_RATE = 0.03

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } })
  if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const token = await prisma.agroToken.findFirst({
    where: { id, property: { userId: dbUser.id } },
  })
  if (!token) return NextResponse.json({ error: 'Token não encontrado' }, { status: 404 })
  if (token.status !== 'ACTIVE') return NextResponse.json({ error: 'Apenas tokens ativos podem ser resgatados' }, { status: 400 })

  const captado = token.soldTokens * Number(token.tokenPrice)
  const successFee = captado * SUCESSO_RATE

  const updated = await prisma.agroToken.update({
    where: { id },
    data: {
      status: 'REDEEMED',
      successFee,
      transactions: {
        create: {
          buyerId: dbUser.id,
          quantity: 0,
          pricePerToken: 0,
          totalAmount: captado,
          commission: successFee,
          type: 'SUCESSO',
        },
      },
    },
  })

  return NextResponse.json({ token: updated, successFee, captado })
}

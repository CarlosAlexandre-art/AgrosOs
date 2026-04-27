import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { stripe, PLATFORM_FEE_RATE } from '@/lib/stripe'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } })
  if (!dbUser) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })

  const token = await prisma.agroToken.findUnique({
    where: { id },
    include: { user: true },
  })
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
  const totalBRL = quantity * pricePerToken
  // Stripe usa centavos inteiros
  const totalCentavos = Math.round(totalBRL * 100)
  const feeCentavos = Math.round(totalCentavos * PLATFORM_FEE_RATE)

  const producerAccountId = (token.user as any).stripeAccountId as string | null

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://agros-os.vercel.app'

  const sessionData: Parameters<typeof stripe.checkout.sessions.create>[0] = {
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'brl',
          product_data: {
            name: token.title,
            description: `${quantity} token(s) AgroToken — ${token.type}`,
          },
          unit_amount: Math.round(pricePerToken * 100),
        },
        quantity,
      },
    ],
    success_url: `${appUrl}/dashboard/token/sucesso?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/dashboard/token/mercado`,
    metadata: {
      tokenId: id,
      buyerId: dbUser.id,
      quantity: String(quantity),
      totalAmount: String(totalBRL),
      commission: String(totalBRL * PLATFORM_FEE_RATE),
    },
  }

  // Se produtor tem conta Stripe conectada, ativa split automático
  if (producerAccountId) {
    sessionData.payment_intent_data = {
      application_fee_amount: feeCentavos,
      transfer_data: { destination: producerAccountId },
    }
  }

  const session = await stripe.checkout.sessions.create(sessionData)

  return NextResponse.json({ url: session.url, sessionId: session.id })
}

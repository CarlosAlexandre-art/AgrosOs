import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { transferTokensToInvestor } from '@/lib/wallet'
import { getStripe } from '@/lib/stripe'

export const runtime = 'nodejs'

const PRO_PRICE_ID = 'price_1TLVBkHOdd4LjuVT865UeWY0'
const ENTERPRISE_PRICE_ID = 'price_1TLVCSHOdd4LjuVTHZEme1gr'

function getPlanFromPriceId(priceId: string): string {
  if (priceId === PRO_PRICE_ID) return 'pro'
  if (priceId === ENTERPRISE_PRICE_ID) return 'enterprise'
  return 'starter'
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  let event: Stripe.Event

  try {
    event = getStripe().webhooks.constructEvent(body, sig, webhookSecret!)
  } catch {
    return NextResponse.json({ error: 'Webhook inválido' }, { status: 400 })
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const meta = session.metadata ?? {}

      // --- AgroToken purchase ---
      if (meta.tokenId && meta.buyerId) {
        const qty = parseInt(meta.quantity)
        const total = parseFloat(meta.totalAmount)
        const comm = parseFloat(meta.commission)
        await prisma.$transaction([
          prisma.tokenTransaction.create({
            data: {
              tokenId: meta.tokenId,
              buyerId: meta.buyerId,
              quantity: qty,
              pricePerToken: total / qty,
              totalAmount: total,
              commission: comm,
              type: 'BUY',
            },
          }),
          prisma.agroToken.update({
            where: { id: meta.tokenId },
            data: { soldTokens: { increment: qty } },
          }),
        ])

        // Transfere tokens on-chain para a wallet do investidor (falha silenciosa)
        transferTokensToInvestor({
          buyerUserId: meta.buyerId,
          agroTokenId: meta.tokenId,
          quantity: qty,
        }).catch(() => {})

        break
      }

      // --- Subscription / plan upgrade ---
      const userId = meta.userId
      const customerId = session.customer as string
      if (!userId) break

      let plan = 'pro'
      if (session.subscription) {
        const sub = await getStripe().subscriptions.retrieve(session.subscription as string)
        const priceId = sub.items.data[0]?.price.id
        plan = getPlanFromPriceId(priceId)
      }

      await prisma.user.updateMany({
        where: { supabaseId: userId },
        data: { plan, stripeCustomerId: customerId },
      })
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      const customerId = sub.customer as string

      await prisma.user.updateMany({
        where: { stripeCustomerId: customerId },
        data: { plan: 'starter' },
      })
      break
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const customerId = sub.customer as string
      const priceId = sub.items.data[0]?.price.id
      const plan = getPlanFromPriceId(priceId)

      await prisma.user.updateMany({
        where: { stripeCustomerId: customerId },
        data: { plan },
      })
      break
    }
  }

  return NextResponse.json({ received: true })
}

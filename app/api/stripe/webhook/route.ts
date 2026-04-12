import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

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
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret!)
  } catch {
    return NextResponse.json({ error: 'Webhook inválido' }, { status: 400 })
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.metadata?.userId
      const customerId = session.customer as string

      if (!userId) break

      // Buscar o priceId da assinatura
      let plan = 'pro'
      if (session.subscription) {
        const sub = await stripe.subscriptions.retrieve(session.subscription as string)
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

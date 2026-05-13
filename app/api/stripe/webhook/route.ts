import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { transferTokensToInvestor } from '@/lib/wallet'
import { getStripe } from '@/lib/stripe'
import { logSecurityEvent } from '@/lib/security'

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

    // ── Segurança: chargeback/disputa ────────────────────────────────────────
    case 'charge.dispute.created': {
      const dispute = event.data.object as Stripe.Dispute
      const chargeId = typeof dispute.charge === 'string' ? dispute.charge : dispute.charge?.id

      // Tenta encontrar a transação relacionada
      const charge = chargeId ? await getStripe().charges.retrieve(chargeId).catch(() => null) : null
      const meta = charge?.metadata ?? {}

      await logSecurityEvent({
        type: 'DISPUTE',
        severity: 'CRITICAL',
        userId: meta.buyerId,
        tokenId: meta.tokenId,
        stripeId: dispute.id,
        details: {
          amount: dispute.amount / 100,
          reason: dispute.reason,
          status: dispute.status,
          chargeId,
        },
      })
      break
    }

    // ── Segurança: pagamento falhou repetidamente ────────────────────────────
    case 'payment_intent.payment_failed': {
      const pi = event.data.object as Stripe.PaymentIntent
      const meta = pi.metadata ?? {}
      const errorMsg = pi.last_payment_error?.message ?? 'desconhecido'

      await logSecurityEvent({
        type: 'PAYMENT_FAILED',
        severity: 'MEDIUM',
        userId: meta.buyerId,
        tokenId: meta.tokenId,
        stripeId: pi.id,
        details: { amount: pi.amount / 100, error: errorMsg },
      })
      break
    }

    // ── Segurança: payout ao produtor falhou ────────────────────────────────
    case 'payout.failed': {
      const payout = event.data.object as Stripe.Payout
      await logSecurityEvent({
        type: 'TRANSFER_FAILED',
        severity: 'HIGH',
        stripeId: payout.id,
        details: {
          amount: payout.amount / 100,
          failure_code: payout.failure_code,
          failure_message: payout.failure_message,
        },
      })
      break
    }

    // ── Segurança: conta Connect do produtor suspensa ou desativada ──────────
    case 'account.updated': {
      const account = event.data.object as Stripe.Account
      if (account.requirements?.disabled_reason) {
        const dbUser = await prisma.user.findFirst({
          where: { stripeAccountId: account.id },
          select: { id: true },
        })
        await logSecurityEvent({
          type: 'ACCOUNT_SUSPENDED',
          severity: 'HIGH',
          userId: dbUser?.id,
          stripeId: account.id,
          details: {
            disabled_reason: account.requirements.disabled_reason,
            charges_enabled: account.charges_enabled,
            payouts_enabled: account.payouts_enabled,
          },
        })
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}

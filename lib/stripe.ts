import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia' as any,
})

export const PLATFORM_FEE_RATE = 0.02  // 2% de originação por compra

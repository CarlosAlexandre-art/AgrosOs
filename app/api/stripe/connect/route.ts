import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { getStripe } from '@/lib/stripe'

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://agroos.site'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    select: { stripeAccountId: true },
  })
  if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  if (!dbUser.stripeAccountId) {
    return NextResponse.json({ connected: false })
  }

  const account = await getStripe().accounts.retrieve(dbUser.stripeAccountId)
  return NextResponse.json({
    connected: account.charges_enabled,
    chargesEnabled: account.charges_enabled,
    payoutsEnabled: account.payouts_enabled,
    accountId: dbUser.stripeAccountId,
  })
}

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    select: { id: true, stripeAccountId: true, email: true },
  })
  if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  let accountId = dbUser.stripeAccountId

  if (!accountId) {
    const account = await getStripe().accounts.create({
      type: 'express',
      country: 'BR',
      email: dbUser.email,
      capabilities: { transfers: { requested: true } },
      business_type: 'individual',
      metadata: { userId: dbUser.id },
    })
    accountId = account.id
    await prisma.user.update({
      where: { id: dbUser.id },
      data: { stripeAccountId: accountId },
    })
  }

  const link = await getStripe().accountLinks.create({
    account: accountId,
    refresh_url: `${appUrl}/api/stripe/connect/return?refresh=true`,
    return_url: `${appUrl}/api/stripe/connect/return`,
    type: 'account_onboarding',
  })

  return NextResponse.json({ url: link.url })
}

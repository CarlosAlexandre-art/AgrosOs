import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { getStripe } from '@/lib/stripe'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } })
  if (!dbUser) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })

  // Se já tem conta Stripe, gera link de atualização
  let accountId = (dbUser as any).stripeAccountId as string | null

  if (!accountId) {
    const account = await getStripe().accounts.create({
      type: 'express',
      country: 'BR',
      email: dbUser.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: 'individual',
      metadata: { userId: dbUser.id },
    })
    accountId = account.id

    await prisma.$executeRaw`
      UPDATE "User" SET "stripeAccountId" = ${accountId} WHERE id = ${dbUser.id}
    `
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://agros-os.vercel.app'

  const link = await getStripe().accountLinks.create({
    account: accountId,
    refresh_url: `${appUrl}/dashboard/token?stripe=refresh`,
    return_url: `${appUrl}/dashboard/token?stripe=success`,
    type: 'account_onboarding',
  })

  return NextResponse.json({ url: link.url })
}

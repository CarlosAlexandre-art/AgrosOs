import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { getStripe } from '@/lib/stripe'

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://agroos.site'

export async function GET(req: NextRequest) {
  const refresh = req.nextUrl.searchParams.get('refresh')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(`${appUrl}/login`)

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    select: { id: true, stripeAccountId: true },
  })
  if (!dbUser?.stripeAccountId) {
    return NextResponse.redirect(`${appUrl}/dashboard/token?connect=error`)
  }

  if (refresh) {
    const link = await getStripe().accountLinks.create({
      account: dbUser.stripeAccountId,
      refresh_url: `${appUrl}/api/stripe/connect/return?refresh=true`,
      return_url: `${appUrl}/api/stripe/connect/return`,
      type: 'account_onboarding',
    })
    return NextResponse.redirect(link.url)
  }

  const account = await getStripe().accounts.retrieve(dbUser.stripeAccountId)

  if (account.charges_enabled) {
    return NextResponse.redirect(`${appUrl}/dashboard/token?connect=success`)
  }

  return NextResponse.redirect(`${appUrl}/dashboard/token?connect=pending`)
}

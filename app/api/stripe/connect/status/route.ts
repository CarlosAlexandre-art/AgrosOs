import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { getStripe } from '@/lib/stripe'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } })
  if (!dbUser) return NextResponse.json({ connected: false })

  const accountId = (dbUser as any).stripeAccountId as string | null
  if (!accountId) return NextResponse.json({ connected: false })

  try {
    const account = await getStripe().accounts.retrieve(accountId)
    const connected = account.charges_enabled && account.payouts_enabled
    return NextResponse.json({ connected, accountId, chargesEnabled: account.charges_enabled, payoutsEnabled: account.payouts_enabled })
  } catch {
    return NextResponse.json({ connected: false })
  }
}

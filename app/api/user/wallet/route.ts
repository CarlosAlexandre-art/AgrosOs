import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { deriveUserAddress } from '@/lib/wallet'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    select: { id: true },
  })
  if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const address = deriveUserAddress(dbUser.id)
  const network = process.env.BLOCKCHAIN_NETWORK ?? 'polygon'
  const explorerBase = network === 'amoy' ? 'https://amoy.polygonscan.com' : 'https://polygonscan.com'

  return NextResponse.json({
    address,
    explorerUrl: `${explorerBase}/address/${address}`,
    network,
  })
}

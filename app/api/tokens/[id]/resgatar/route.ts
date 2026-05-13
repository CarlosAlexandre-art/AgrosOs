import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { getStripe } from '@/lib/stripe'
import { checkResgateLock } from '@/lib/security'

const SUCESSO_RATE = 0.03

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    select: { id: true, stripeAccountId: true },
  })
  if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  if (!dbUser.stripeAccountId) {
    return NextResponse.json(
      { error: 'Conecte sua conta bancária via Stripe antes de resgatar.' },
      { status: 400 }
    )
  }

  const stripeAccount = await getStripe().accounts.retrieve(dbUser.stripeAccountId)
  if (!stripeAccount.charges_enabled) {
    return NextResponse.json(
      { error: 'Sua conta Stripe ainda não foi verificada. Conclua o cadastro bancário.' },
      { status: 400 }
    )
  }

  const token = await prisma.agroToken.findFirst({
    where: { id, property: { userId: dbUser.id } },
  })
  if (!token) return NextResponse.json({ error: 'Token não encontrado' }, { status: 404 })
  if (token.status !== 'ACTIVE') return NextResponse.json({ error: 'Apenas tokens ativos podem ser resgatados' }, { status: 400 })

  // Lock de 3 dias: evita resgate imediato após aprovação (anti pump-and-dump)
  const lock = await checkResgateLock(token.updatedAt)
  if (lock.blocked) {
    return NextResponse.json(
      { error: `Aguarde ${lock.daysLeft} dia(s) antes de resgatar. O token precisa ficar ativo por pelo menos 3 dias.` },
      { status: 400 }
    )
  }

  const captado = token.soldTokens * Number(token.tokenPrice)
  if (captado === 0) {
    return NextResponse.json({ error: 'Nenhum token vendido ainda — não há valor a resgatar.' }, { status: 400 })
  }

  const successFee = captado * SUCESSO_RATE
  const netAmount = captado - successFee
  const netCentavos = Math.round(netAmount * 100)

  // Transfere o valor líquido para a conta conectada do produtor
  const transfer = await getStripe().transfers.create({
    amount: netCentavos,
    currency: 'brl',
    destination: dbUser.stripeAccountId,
    description: `Resgate AgroToken — ${token.title}`,
    metadata: { tokenId: id, successFee: String(successFee) },
  })

  const updated = await prisma.agroToken.update({
    where: { id },
    data: {
      status: 'REDEEMED',
      successFee,
      transactions: {
        create: {
          buyerId: dbUser.id,
          quantity: 0,
          pricePerToken: 0,
          totalAmount: captado,
          commission: successFee,
          type: 'SUCESSO',
        },
      },
    },
  })

  return NextResponse.json({
    token: updated,
    captado,
    successFee,
    netAmount,
    transferId: transfer.id,
  })
}

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { createSignatureRequest, isClicksignConfigured } from '@/lib/clicksign'

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = await prisma.user.findUnique({ where: { supabaseId: user.id }, select: { role: true } })
  if (admin?.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  if (!isClicksignConfigured()) {
    return NextResponse.json({ error: 'Clicksign não configurado (CLICKSIGN_API_TOKEN ausente)' }, { status: 503 })
  }

  const token = await prisma.agroToken.findUnique({
    where: { id },
    include: {
      property: {
        include: { user: { select: { name: true, email: true, phone: true, cpf: true } } },
      },
    },
  })
  if (!token) return NextResponse.json({ error: 'Token não encontrado' }, { status: 404 })

  const producer = token.property.user
  const { docKey, signerKey, signatureUrl } = await createSignatureRequest({
    title: token.title,
    produtor: producer.name,
    cpf: producer.cpf ?? '',
    email: producer.email,
    phone: producer.phone ?? undefined,
    propriedade: token.property.name,
    tipoToken: token.type,
    valorTotal: Number(token.totalValue),
    totalTokens: token.totalTokens,
    tokenPrice: Number(token.tokenPrice),
    retorno: token.expectedReturn ? Number(token.expectedReturn) : undefined,
    prazoMeses: token.periodMonths ?? undefined,
  })

  await prisma.$executeRaw`
    UPDATE "AgroToken" SET "clicksignDocKey" = ${docKey}, "clicksignSignerKey" = ${signerKey}
    WHERE id = ${id}
  `

  return NextResponse.json({ docKey, signatureUrl, message: 'Email de assinatura enviado ao produtor' })
}

import { createHmac, timingSafeEqual } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function verifyClicksignSignature(body: string, headerSig: string | null): boolean {
  const secret = process.env.CLICKSIGN_WEBHOOK_SECRET
  if (!secret || !headerSig) return !secret // se não configurado, passa tudo
  const expected = createHmac('sha256', secret).update(body).digest('hex')
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(headerSig))
  } catch {
    return false
  }
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('x-clicksign-hmac-sha256')

  if (!verifyClicksignSignature(body, sig)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(body)
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }

  const docKeyFinal: string =
    (parsed?.document as { key?: string })?.key ??
    ((parsed?.event as { data?: { document?: { key?: string } } })?.data?.document?.key ?? '')
  const statusFinal: string =
    (parsed?.document as { status?: string })?.status ??
    ((parsed?.event as { data?: { document?: { status?: string } } })?.data?.document?.status ?? '')
  const finishedAtFinal: string | null =
    (parsed?.document as { finished_at?: string })?.finished_at ??
    (parsed?.event as { data?: { document?: { finished_at?: string } } })?.data?.document?.finished_at ??
    null

  if (!docKeyFinal) return NextResponse.json({ ok: true })

  if (statusFinal === 'closed' || statusFinal === 'finished') {
    await prisma.$executeRaw`
      UPDATE "AgroToken"
      SET "signedAt" = ${finishedAtFinal ? new Date(finishedAtFinal) : new Date()}
      WHERE "clicksignDocKey" = ${docKeyFinal}
    `
  }

  return NextResponse.json({ ok: true })
}

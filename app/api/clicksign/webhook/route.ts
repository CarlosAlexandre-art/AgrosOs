import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Bad request' }, { status: 400 })

  const docKey: string = body?.document?.key ?? body?.event?.data?.document?.key
  const status: string = body?.document?.status ?? body?.event?.data?.document?.status
  const finishedAt: string | null = body?.document?.finished_at ?? body?.event?.data?.document?.finished_at ?? null

  if (!docKey) return NextResponse.json({ ok: true })

  if (status === 'closed' || status === 'finished') {
    await prisma.$executeRaw`
      UPDATE "AgroToken"
      SET "signedAt" = ${finishedAt ? new Date(finishedAt) : new Date()}
      WHERE "clicksignDocKey" = ${docKey}
    `
  }

  return NextResponse.json({ ok: true })
}

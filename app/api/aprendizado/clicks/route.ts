import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const since = new Date(Date.now() - 60 * 60 * 1000)
    const rows = await prisma.learningClick.findMany({
      where: { clickedAt: { gte: since } },
      select: { moduleId: true },
    })

    const counts: Record<string, number> = {}
    for (const row of rows) {
      counts[row.moduleId] = (counts[row.moduleId] || 0) + 1
    }
    return NextResponse.json(counts)
  } catch {
    return NextResponse.json({})
  }
}

export async function POST(req: NextRequest) {
  try {
    const { moduleId } = await req.json()
    if (!moduleId) return NextResponse.json({ ok: false }, { status: 400 })
    await prisma.learningClick.create({ data: { moduleId } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}

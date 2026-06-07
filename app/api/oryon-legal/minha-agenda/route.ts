import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/oryon-legal/minha-agenda?telefone=85999...
export async function GET(req: NextRequest) {
  try {
    const telefone = req.nextUrl.searchParams.get('telefone')?.replace(/\D/g, '')
    if (!telefone || telefone.length < 8) {
      return NextResponse.json({ error: 'Telefone inválido' }, { status: 400 })
    }

    const leads = await prisma.oryonLegalLead.findMany({
      where: { telefone: { contains: telefone.slice(-8) } },
      include: {
        reunioes: {
          include: { slot: true },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    })

    return NextResponse.json(leads)
  } catch {
    return NextResponse.json([])
  }
}

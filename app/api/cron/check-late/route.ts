import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createAlert } from '@/lib/alerts'

export async function GET(req: NextRequest) {
  // Proteção: só Vercel Cron ou chamada interna
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const now = new Date()

  // Busca atividades com prazo vencido ainda não marcadas como LATE/DONE/CANCELLED
  const lateActivities = await prisma.activity.findMany({
    where: {
      endDate: { lt: now },
      status: { in: ['PENDING', 'IN_PROGRESS'] },
    },
    select: { id: true, type: true, propertyId: true, endDate: true },
  })

  let updated = 0
  for (const activity of lateActivities) {
    await prisma.activity.update({
      where: { id: activity.id },
      data: { status: 'LATE' },
    })

    await createAlert(activity.propertyId, {
      message: `Atividade "${activity.type}" está atrasada desde ${new Date(activity.endDate!).toLocaleDateString('pt-BR')}`,
      type: 'LATE',
      pushUrl: `/dashboard/operacoes/${activity.id}`,
    })

    updated++
  }

  return NextResponse.json({ ok: true, updated })
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Mapeia status do AgroCore → status da atividade no AgroOS
const STATUS_MAP: Record<string, string> = {
  PROCURANDO:          'IN_PROGRESS',
  AGUARDANDO_PROPOSTA: 'IN_PROGRESS',
  MATCH_ENCONTRADO:    'IN_PROGRESS',
  EM_ROTA:             'IN_PROGRESS',
  EXECUTANDO:          'IN_PROGRESS',
  CONCLUIDO:           'DONE',
  CANCELADO:           'CANCELLED',
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-internal-secret')
  if (secret !== process.env.AGROLINK_INTERNAL_SECRET) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { serviceId, status, prestadorNome } = await req.json()
  if (!serviceId || !status) {
    return NextResponse.json({ error: 'serviceId e status obrigatórios' }, { status: 400 })
  }

  const newStatus = STATUS_MAP[status]
  if (!newStatus) {
    return NextResponse.json({ ok: true, ignored: true })
  }

  // Busca a atividade pelo agrolinkServiceId
  const activity = await prisma.activity.findFirst({
    where: { agrolinkServiceId: serviceId },
  })

  if (!activity) {
    return NextResponse.json({ ok: true, notFound: true })
  }

  // Atualiza o status da atividade
  const updateData: Record<string, unknown> = { status: newStatus, agrolinkStatus: status }

  // Se concluído, registra data de término
  if (status === 'CONCLUIDO' && !activity.endDate) {
    updateData.endDate = new Date()
  }

  // Guarda o status do AgroCore na descrição se houver prestador
  if (prestadorNome && status === 'MATCH_ENCONTRADO') {
    updateData.description = activity.description
      ? `${activity.description}\n\n[AgroCore] Prestador: ${prestadorNome}`
      : `[AgroCore] Prestador: ${prestadorNome}`
  }

  await prisma.activity.update({
    where: { id: activity.id },
    data: updateData,
  })

  return NextResponse.json({ ok: true, activityId: activity.id, newStatus })
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendPushToUser } from '@/lib/push'
import { createAlert } from '@/lib/alerts'

// Mapeia status do AgroCore → status da atividade no SmartAgroOS
const STATUS_MAP: Record<string, string> = {
  PROCURANDO:          'IN_PROGRESS',
  AGUARDANDO_PROPOSTA: 'IN_PROGRESS',
  MATCH_ENCONTRADO:    'IN_PROGRESS',
  EM_ROTA:             'IN_PROGRESS',
  EXECUTANDO:          'IN_PROGRESS',
  CONCLUIDO:           'DONE',
  CANCELADO:           'CANCELLED',
}

const STATUS_NOTIF: Record<string, { title: string; body: string }> = {
  MATCH_ENCONTRADO: { title: '🤝 Prestador encontrado!',   body: 'Um prestador aceitou seu serviço no AgroCore.' },
  EM_ROTA:          { title: '🚜 Serviço confirmado!',     body: 'Pagamento confirmado. O prestador está a caminho.' },
  EXECUTANDO:       { title: '⚙️ Serviço em execução!',   body: 'O prestador está executando seu serviço.' },
  CONCLUIDO:        { title: '✅ Serviço concluído!',      body: 'Seu serviço foi concluído com sucesso.' },
  CANCELADO:        { title: '❌ Serviço cancelado',       body: 'O serviço foi cancelado no AgroCore.' },
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-internal-secret')
  if (secret !== process.env.AGROLINK_INTERNAL_SECRET) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { serviceId, status, prestadorNome, valor, tipo } = await req.json()
  if (!serviceId || !status) {
    return NextResponse.json({ error: 'serviceId e status obrigatórios' }, { status: 400 })
  }

  const newStatus = STATUS_MAP[status]
  if (!newStatus) {
    return NextResponse.json({ ok: true, ignored: true })
  }

  // Busca a atividade e o usuário dono
  const activity = await prisma.activity.findFirst({
    where: { agrolinkServiceId: serviceId },
    include: { property: { include: { user: true } } },
  })

  if (!activity) {
    return NextResponse.json({ ok: true, notFound: true })
  }

  // Atualiza o status da atividade
  const updateData: Record<string, unknown> = { status: newStatus, agrolinkStatus: status }

  if (status === 'CONCLUIDO' && !activity.endDate) {
    updateData.endDate = new Date()
  }

  if (prestadorNome && status === 'MATCH_ENCONTRADO') {
    updateData.description = activity.description
      ? `${activity.description}\n\n[AgroCore] Prestador: ${prestadorNome}`
      : `[AgroCore] Prestador: ${prestadorNome}`
  }

  await prisma.activity.update({
    where: { id: activity.id },
    data: updateData,
  })

  // Registrar custo quando serviço concluído
  if (status === 'CONCLUIDO' && valor && Number(valor) > 0) {
    await prisma.cost.create({
      data: {
        propertyId: activity.propertyId,
        activityId: activity.id,
        amount: Number(valor),
        category: 'AGROLINK',
        description: tipo ? `Serviço AgroCore: ${tipo}` : 'Serviço AgroCore',
      },
    }).catch(() => {})
  }

  // Push + alerta para o dono da propriedade
  const notif = STATUS_NOTIF[status]
  if (notif && activity.property?.user?.id) {
    const agrocoreUrl = process.env.AGROCORE_API_URL || 'https://agrolink-opal.vercel.app'
    const trackUrl = `${agrocoreUrl}/rastrear/${serviceId}`

    sendPushToUser(activity.property.user.id, {
      title: notif.title,
      body: notif.body,
      url: trackUrl,
    }).catch(() => {})

    createAlert(activity.propertyId, {
      message: `${notif.title} — ${activity.type}`,
      type: 'INFO',
      push: false, // já enviamos o push acima
      pushUrl: trackUrl,
    }).catch(() => {})
  }

  return NextResponse.json({ ok: true, activityId: activity.id, newStatus })
}

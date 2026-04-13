import { prisma } from '@/lib/prisma'
import { sendPushToProperty } from '@/lib/push'

export async function createAlert(propertyId: string, {
  message,
  type,
  push = true,
  pushUrl,
}: {
  message: string
  type: 'LATE' | 'COST' | 'WEATHER' | 'SYSTEM' | 'INFO'
  push?: boolean
  pushUrl?: string
}) {
  const alert = await prisma.alert.create({
    data: { propertyId, message, type },
  })

  if (push) {
    const icons: Record<string, string> = {
      LATE: '⏰', COST: '💰', WEATHER: '🌧️', SYSTEM: '⚙️', INFO: 'ℹ️',
    }
    sendPushToProperty(propertyId, {
      title: `${icons[type] || '⚠️'} ${type === 'LATE' ? 'Atividade atrasada' : type === 'COST' ? 'Alerta financeiro' : 'Alerta'}`,
      body: message,
      url: pushUrl || '/dashboard/alertas',
    }).catch(() => {})
  }

  return alert
}

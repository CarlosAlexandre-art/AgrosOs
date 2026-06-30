import webpush from 'web-push'
import { prisma } from '@/lib/prisma'

function initVapid() {
  const subject = process.env.VAPID_EMAIL ?? ''
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ''
  const priv = process.env.VAPID_PRIVATE_KEY ?? ''
  if (!subject || !pub || !priv) {
    console.warn('[push] VAPID keys não configuradas — push notifications desativadas')
    return false
  }
  try {
    webpush.setVapidDetails(
      subject.startsWith('mailto:') ? subject : `mailto:${subject}`,
      pub,
      priv
    )
    return true
  } catch (err) {
    console.error('[push] Falha ao configurar VAPID:', err)
    return false
  }
}

const vapidReady = initVapid()

export async function sendPushToUser(userId: string, payload: { title: string; body: string; url?: string }) {
  if (!vapidReady) {
    console.warn('[push] sendPushToUser ignorado — VAPID não configurado')
    return
  }

  const subscriptions = await prisma.pushSubscription.findMany({ where: { userId } })

  await Promise.allSettled(
    subscriptions.map(sub =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload)
      ).catch(async (err) => {
        if (err.statusCode === 410) {
          await prisma.pushSubscription.delete({ where: { endpoint: sub.endpoint } }).catch(() => {})
        } else {
          console.error('[push] Falha ao enviar notificação:', err.statusCode ?? err.message)
        }
      })
    )
  )
}

export async function sendPushToProperty(propertyId: string, payload: { title: string; body: string; url?: string }) {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    include: { user: true },
  })
  if (!property) return
  await sendPushToUser(property.user.id, payload)
}

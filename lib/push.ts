import webpush from 'web-push'
import { prisma } from '@/lib/prisma'

try {
  const subject = process.env.VAPID_EMAIL ?? ''
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ''
  const priv = process.env.VAPID_PRIVATE_KEY ?? ''
  if (subject && pub && priv) {
    webpush.setVapidDetails(
      subject.startsWith('mailto:') ? subject : `mailto:${subject}`,
      pub,
      priv
    )
  }
} catch {
  // push notifications indisponíveis se VAPID mal configurado
}

export async function sendPushToUser(userId: string, payload: { title: string; body: string; url?: string }) {
  const subscriptions = await prisma.pushSubscription.findMany({ where: { userId } })

  await Promise.allSettled(
    subscriptions.map(sub =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload)
      ).catch(async (err) => {
        // Remove subscriptions inválidas (410 = expirada)
        if (err.statusCode === 410) {
          await prisma.pushSubscription.delete({ where: { endpoint: sub.endpoint } }).catch(() => {})
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

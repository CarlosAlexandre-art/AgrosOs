import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

export const ACTIVE_PROPERTY_COOKIE = 'activePropertyId'

export async function getActivePropertyId(userId: string): Promise<string | null> {
  const cookieStore = await cookies()
  const cookieValue = cookieStore.get(ACTIVE_PROPERTY_COOKIE)?.value

  // Busca todas as propriedades do usuário
  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: userId },
    include: { properties: { select: { id: true } } },
  })

  const properties = dbUser?.properties || []
  if (properties.length === 0) return null

  // Se tem cookie válido, usa ele
  if (cookieValue && properties.some(p => p.id === cookieValue)) {
    return cookieValue
  }

  // Senão usa a primeira
  return properties[0].id
}

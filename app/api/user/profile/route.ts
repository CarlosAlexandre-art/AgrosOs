import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const profileSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  phone: z.string().max(20).nullable().optional(),
  cpf: z.string().regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/, 'CPF inválido').nullable().optional(),
  avatarUrl: z.string().url().max(500).nullable().optional(),
})

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const parsed = profileSchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos', details: parsed.error.flatten() }, { status: 400 })
  }

  const { name, phone, cpf, avatarUrl } = parsed.data

  const data: Record<string, string | null | undefined> = {}
  if (name !== undefined) data.name = name
  if (phone !== undefined) data.phone = phone
  if (cpf !== undefined) data.cpf = cpf
  if (avatarUrl !== undefined) data.avatarUrl = avatarUrl

  const updated = await prisma.user.update({ where: { supabaseId: user.id }, data })
  return NextResponse.json(updated)
}

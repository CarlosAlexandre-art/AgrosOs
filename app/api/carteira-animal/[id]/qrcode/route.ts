import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { gerarQrCodeBuffer } from '@/lib/passaporte'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: { properties: { take: 1 } },
  })
  const property = dbUser?.properties[0]
  if (!property) return NextResponse.json({ error: 'Propriedade não encontrada' }, { status: 404 })

  const animal = await (prisma as any).animal.findFirst({ where: { id, propertyId: property.id } })
  if (!animal) return NextResponse.json({ error: 'Animal não encontrado' }, { status: 404 })

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://agroos.site'
  const buffer = await gerarQrCodeBuffer(id, baseUrl)

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'image/png',
      'Content-Disposition': `inline; filename="passaporte-${animal.identificacao}.png"`,
      'Cache-Control': 'public, max-age=86400',
    },
  })
}

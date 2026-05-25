import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

async function getOrCreateProperty(supabaseId: string, userEmail?: string) {
  let dbUser = await prisma.user.findUnique({
    where: { supabaseId },
    include: { properties: { take: 1 } },
  })
  if (!dbUser && userEmail) {
    dbUser = await prisma.user.findUnique({
      where: { email: userEmail },
      include: { properties: { take: 1 } },
    })
    if (dbUser) await prisma.user.update({ where: { id: dbUser.id }, data: { supabaseId } })
  }
  if (!dbUser) {
    dbUser = await prisma.user.create({
      data: { supabaseId, email: userEmail ?? supabaseId, name: userEmail?.split('@')[0] ?? 'Usuário' },
      include: { properties: { take: 1 } },
    })
  }
  if (dbUser.properties.length > 0) return dbUser.properties[0]
  return prisma.property.create({ data: { userId: dbUser.id, name: 'Minha Propriedade' } })
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const property = await getOrCreateProperty(user.id, user.email ?? undefined)

    const { animais } = await req.json()
    if (!Array.isArray(animais) || animais.length === 0)
      return NextResponse.json({ error: 'Nenhum animal informado' }, { status: 400 })
    if (animais.length > 200)
      return NextResponse.json({ error: 'Máximo de 200 animais por importação' }, { status: 400 })

    const criados: string[] = []
    const erros: string[] = []

    for (const a of animais) {
      try {
        const animal = await (prisma as any).animal.create({
          data: {
            propertyId: property.id,
            identificacao: a.identificacao,
            sexo: a.sexo,
            raca: a.raca || null,
            dataNascimento: a.dataNascimento ? new Date(a.dataNascimento) : null,
            pesoAtual: a.pesoAtual ? Number(a.pesoAtual) : null,
            origemFazenda: a.origemFazenda || null,
            brincoEletronico: a.brincoEletronico || null,
            sisbovId: a.sisbovId || null,
            rfid: a.rfid || null,
          },
        })
        await (prisma as any).animalMovimento.create({
          data: {
            animalId: animal.id,
            tipo: 'ENTRADA',
            origem: a.origemFazenda || null,
            destino: property.name,
            peso: a.pesoAtual ? Number(a.pesoAtual) : null,
          },
        })
        criados.push(a.identificacao)
      } catch {
        erros.push(a.identificacao)
      }
    }

    return NextResponse.json({ criados: criados.length, erros, total: animais.length })
  } catch (e: any) {
    console.error('[bulk]', e.message)
    return NextResponse.json({ error: 'Erro ao importar animais' }, { status: 500 })
  }
}

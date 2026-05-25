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

async function gerarIdUnico(propertyId: string): Promise<string> {
  const existentes = await (prisma as any).animal.findMany({
    where: { propertyId, identificacao: { startsWith: '#' } },
    select: { identificacao: true },
  })
  const nums = new Set(
    existentes
      .map((a: any) => parseInt(a.identificacao.replace('#', ''), 10))
      .filter((n: number) => !isNaN(n))
  )
  let next = 1
  while (nums.has(next)) next++
  return `#${String(next).padStart(4, '0')}`
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const property = await getOrCreateProperty(user.id, user.email ?? undefined)

    try {
      const animais = await (prisma as any).animal.findMany({
        where: { propertyId: property.id, ativo: true },
        include: {
          lote: { select: { nome: true, objetivo: true } },
          _count: { select: { saude: true, movimentos: true } },
        },
        orderBy: { createdAt: 'desc' },
      })
      return NextResponse.json(animais)
    } catch {
      const animais = await (prisma as any).animal.findMany({
        where: { propertyId: property.id, ativo: true },
        orderBy: { createdAt: 'desc' },
      })
      return NextResponse.json(animais)
    }
  } catch (e) {
    console.error('[carteira-animal GET]', e)
    return NextResponse.json({ error: 'Erro ao buscar animais' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const property = await getOrCreateProperty(user.id, user.email ?? undefined)

    const body = await req.json()
    const { sexo, raca, brincoEletronico, sisbovId, rfid, dataNascimento, pesoAtual, pesoNascimento, loteId, origemFazenda, gtaOrigem } = body
    let { identificacao } = body

    if (!sexo) return NextResponse.json({ error: 'Sexo é obrigatório' }, { status: 400 })

    if (!identificacao?.trim()) {
      identificacao = await gerarIdUnico(property.id)
    }

    const animal = await (prisma as any).animal.create({
      data: {
        propertyId: property.id,
        identificacao,
        sexo,
        raca: raca || null,
        brincoEletronico: brincoEletronico || null,
        sisbovId: sisbovId || null,
        rfid: rfid || null,
        dataNascimento: dataNascimento ? new Date(dataNascimento) : null,
        pesoAtual: pesoAtual ? Number(pesoAtual) : null,
        pesoNascimento: pesoNascimento ? Number(pesoNascimento) : null,
        loteId: loteId || null,
        origemFazenda: origemFazenda || null,
        gtaOrigem: gtaOrigem || null,
      },
    })

    try {
      await (prisma as any).animalMovimento.create({
        data: {
          animalId: animal.id,
          tipo: 'ENTRADA',
          origem: origemFazenda || null,
          destino: property.name,
          peso: pesoAtual ? Number(pesoAtual) : null,
          gta: gtaOrigem || null,
        },
      })
    } catch {
      // Movimento é opcional
    }

    return NextResponse.json(animal, { status: 201 })
  } catch (e: any) {
    console.error('[carteira-animal POST]', e)
    const msg = e?.message?.includes('Unique constraint')
      ? 'Já existe um animal com esse código nesta fazenda'
      : 'Erro ao cadastrar animal'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

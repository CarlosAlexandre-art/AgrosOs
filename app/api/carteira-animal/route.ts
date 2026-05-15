import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

async function gerarIdUnico(propertyId: string): Promise<string> {
  // Busca todos os IDs no padrão #NNNN dessa propriedade
  const existentes = await (prisma as any).animal.findMany({
    where: { propertyId, identificacao: { startsWith: '#' } },
    select: { identificacao: true },
  })
  const nums = new Set(
    existentes
      .map((a: any) => parseInt(a.identificacao.replace('#', ''), 10))
      .filter((n: number) => !isNaN(n))
  )
  // Encontra o próximo número disponível (sem repetição)
  let next = 1
  while (nums.has(next)) next++
  return `#${String(next).padStart(4, '0')}`
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: session.user.id },
      include: { properties: { take: 1 } },
    })
    const property = dbUser?.properties[0]
    if (!property) return NextResponse.json({ error: 'Propriedade não encontrada' }, { status: 404 })

    // Tenta com lote; se falhar (tabela não existe ainda), retorna sem include
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
      // Fallback sem relações (caso Lote ainda não exista no banco)
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
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: session.user.id },
      include: { properties: { take: 1 } },
    })
    const property = dbUser?.properties[0]
    if (!property) return NextResponse.json({ error: 'Propriedade não encontrada' }, { status: 404 })

    const body = await req.json()
    const { sexo, raca, brincoEletronico, sisbovId, rfid, dataNascimento, pesoAtual, pesoNascimento, loteId, origemFazenda, gtaOrigem } = body
    let { identificacao } = body

    if (!sexo) return NextResponse.json({ error: 'Sexo é obrigatório' }, { status: 400 })

    // Auto-gera ID único no formato #0001 se não informado
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
      // Movimento é opcional — animal já foi criado com sucesso
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

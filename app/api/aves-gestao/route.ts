import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

async function getProperty(supabaseId: string) {
  const dbUser = await prisma.user.findUnique({
    where: { supabaseId },
    include: { properties: { take: 1 } },
  })
  return dbUser?.properties[0] ?? null
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const property = await getProperty(session.user.id)
    if (!property) return NextResponse.json({ error: 'Propriedade não encontrada' }, { status: 404 })

    const lotes = await (prisma as any).aveLote.findMany({
      where: { propertyId: property.id },
      include: {
        producoesOvos: { orderBy: { data: 'desc' }, take: 1 },
        _count: { select: { mortalidades: true, sanidades: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    const ativos = lotes.filter((l: any) => l.status === 'ATIVO')
    const kpis = {
      totalLotes: lotes.length,
      lotesAtivos: ativos.length,
      totalAves: ativos.reduce((acc: number, l: any) => acc + l.quantidadeAtual, 0),
      lotesEmPostura: ativos.filter((l: any) => l.faseProducao === 'POSTURA').length,
    }

    return NextResponse.json({ lotes, kpis })
  } catch (e: any) {
    console.error('[aves-gestao GET]', e.message)
    return NextResponse.json({ error: 'Erro ao carregar dados' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const property = await getProperty(session.user.id)
    if (!property) return NextResponse.json({ error: 'Propriedade não encontrada' }, { status: 404 })

    const body = await req.json()
    const { action } = body

    if (action === 'lote') {
      const {
        nome, especie, linhagem, instalacao, quantidadeInicial,
        idadeInicialDias, dataAlojamento, faseProducao, observacao,
      } = body
      if (!nome || !especie || !quantidadeInicial) {
        return NextResponse.json({ error: 'Nome, espécie e quantidade inicial são obrigatórios' }, { status: 400 })
      }
      const lote = await (prisma as any).aveLote.create({
        data: {
          propertyId: property.id,
          nome,
          especie,
          linhagem: linhagem || null,
          instalacao: instalacao || null,
          quantidadeInicial: Number(quantidadeInicial),
          quantidadeAtual: Number(quantidadeInicial),
          idadeInicialDias: idadeInicialDias ? Number(idadeInicialDias) : null,
          dataAlojamento: dataAlojamento ? new Date(dataAlojamento) : new Date(),
          faseProducao: faseProducao || 'CRIA',
          dataInicioPostura: faseProducao === 'POSTURA' ? new Date() : null,
          observacao: observacao || null,
        },
      })
      return NextResponse.json(lote, { status: 201 })
    }

    if (action === 'atualizar_fase') {
      const { loteId, faseProducao } = body
      if (!loteId || !faseProducao) return NextResponse.json({ error: 'Lote e fase são obrigatórios' }, { status: 400 })
      const lote = await (prisma as any).aveLote.update({
        where: { id: loteId },
        data: {
          faseProducao,
          dataInicioPostura: faseProducao === 'POSTURA' ? new Date() : undefined,
        },
      })
      return NextResponse.json(lote)
    }

    if (action === 'encerrar_lote') {
      const { loteId } = body
      const lote = await (prisma as any).aveLote.update({
        where: { id: loteId },
        data: { status: 'ENCERRADO', dataEncerramento: new Date() },
      })
      return NextResponse.json(lote)
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
  } catch (e: any) {
    console.error('[aves-gestao POST]', e.message)
    return NextResponse.json({ error: 'Erro ao salvar' }, { status: 500 })
  }
}

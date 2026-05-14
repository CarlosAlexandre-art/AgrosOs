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

// GET — dashboard: protocolos, eventos recentes, animais prenhes
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const property = await getProperty(user.id)
  if (!property) return NextResponse.json({ error: 'Propriedade não encontrada' }, { status: 404 })

  const [protocolos, eventosRecentes, statusReprodutivos, totalAnimais] = await Promise.all([
    prisma.protocoloVacinal.findMany({
      where: { propertyId: property.id, ativo: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.eventoReprodutivo.findMany({
      where: { animal: { propertyId: property.id } },
      include: { animal: { select: { identificacao: true, raca: true } } },
      orderBy: { data: 'desc' },
      take: 20,
    }),
    prisma.statusReprodutivo.findMany({
      where: { animal: { propertyId: property.id } },
      include: { animal: { select: { id: true, identificacao: true, raca: true } } },
    }),
    prisma.animal.count({ where: { propertyId: property.id, ativo: true } }),
  ])

  const prenhas = statusReprodutivos.filter(s => s.status === 'PRENHA').length
  const partosPrevistos = statusReprodutivos.filter(s => {
    if (!s.dataPrevistoParto) return false
    const dias = Math.ceil((new Date(s.dataPrevistoParto).getTime() - Date.now()) / 86400000)
    return dias >= 0 && dias <= 30
  }).length

  // Vacinas vencendo nos próximos 30 dias (simplificado: contagem de protocolos ativos)
  const vacinasPendentes = protocolos.length

  return NextResponse.json({
    protocolos,
    eventosRecentes,
    statusReprodutivos,
    kpis: { prenhas, partosPrevistos, vacinasPendentes, totalAnimais },
  })
}

// POST — criar protocolo vacinal ou evento reprodutivo
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const property = await getProperty(user.id)
  if (!property) return NextResponse.json({ error: 'Propriedade não encontrada' }, { status: 404 })

  const body = await req.json()

  if (body._type === 'protocolo') {
    const { nome, doenca, frequencia, produto, dose, mesesAplicar } = body
    if (!nome || !doenca) return NextResponse.json({ error: 'nome e doenca são obrigatórios' }, { status: 400 })
    const protocolo = await prisma.protocoloVacinal.create({
      data: { propertyId: property.id, nome, doenca, frequencia: frequencia || 'ANUAL', produto, dose, mesesAplicar: mesesAplicar || [3, 9] },
    })
    return NextResponse.json(protocolo, { status: 201 })
  }

  if (body._type === 'evento') {
    const { animalId, tipo, data, veterinario, resultado, pesoBezerro, observacao } = body
    if (!animalId || !tipo) return NextResponse.json({ error: 'animalId e tipo são obrigatórios' }, { status: 400 })

    const animal = await prisma.animal.findFirst({ where: { id: animalId, propertyId: property.id } })
    if (!animal) return NextResponse.json({ error: 'Animal não encontrado' }, { status: 404 })

    const evento = await prisma.eventoReprodutivo.create({
      data: { animalId, tipo, data: data ? new Date(data) : new Date(), veterinario, resultado, pesoBezerro: pesoBezerro ? Number(pesoBezerro) : null, observacao },
    })

    // Atualizar statusReprodutivo
    const statusMap: Record<string, string> = {
      INSEMINACAO_ARTIFICIAL: 'INCERTA',
      MONTA_NATURAL: 'INCERTA',
      CONFIRMACAO_PRENHEZ: 'PRENHA',
      PARTO: 'PARIDA',
      ABORTO: 'VAZIA',
      DESMAME: 'VAZIA',
      DESCARTE_REPRODUTIVO: 'VAZIA',
    }
    const novoStatus = statusMap[tipo]
    if (novoStatus) {
      const dataEvento = data ? new Date(data) : new Date()
      const update: Record<string, unknown> = { status: novoStatus, updatedAt: new Date() }
      if (tipo === 'INSEMINACAO_ARTIFICIAL' || tipo === 'MONTA_NATURAL') {
        update.dataInseminacao = dataEvento
        update.dataPrevistoParto = new Date(dataEvento.getTime() + 283 * 86400000) // 283 dias gestação bovina
      }
      if (tipo === 'PARTO') {
        update.dataPrevistoParto = null
        update.dataInseminacao = null
      }
      await prisma.statusReprodutivo.upsert({
        where: { animalId },
        update,
        create: { animalId, status: novoStatus as 'VAZIA' | 'PRENHA' | 'INCERTA' | 'PARIDA', ...update },
      })
      if (tipo === 'PARTO') {
        await prisma.statusReprodutivo.update({
          where: { animalId },
          data: { paricoes: { increment: 1 } },
        })
      }
    }

    return NextResponse.json(evento, { status: 201 })
  }

  return NextResponse.json({ error: 'Tipo inválido. Use _type: protocolo | evento' }, { status: 400 })
}

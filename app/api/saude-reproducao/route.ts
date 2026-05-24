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
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const property = await getProperty(session.user.id)
    if (!property) return NextResponse.json({ error: 'Propriedade não encontrada' }, { status: 404 })

    const [protocolos, eventosRecentes, statusReprodutivos, totalAnimais] = await Promise.all([
      (prisma as any).protocoloVacinal.findMany({
        where: { propertyId: property.id, ativo: true },
        orderBy: { createdAt: 'desc' },
      }),
      (prisma as any).eventoReprodutivo.findMany({
        where: { animal: { propertyId: property.id } },
        include: { animal: { select: { identificacao: true, raca: true } } },
        orderBy: { data: 'desc' },
        take: 20,
      }),
      (prisma as any).statusReprodutivo.findMany({
        where: { animal: { propertyId: property.id } },
        include: { animal: { select: { id: true, identificacao: true, raca: true } } },
      }),
      (prisma as any).animal.count({ where: { propertyId: property.id, ativo: true } }),
    ])

    const prenhas = statusReprodutivos.filter((s: any) => s.status === 'PRENHA').length
    const partosPrevistos = statusReprodutivos.filter((s: any) => {
      if (!s.dataPrevistoParto) return false
      const dias = Math.ceil((new Date(s.dataPrevistoParto).getTime() - Date.now()) / 86400000)
      return dias >= 0 && dias <= 30
    }).length

    const vacinasPendentes = protocolos.length

    return NextResponse.json({
      protocolos,
      eventosRecentes,
      statusReprodutivos,
      kpis: { prenhas, partosPrevistos, vacinasPendentes, totalAnimais },
    })
  } catch (e: any) {
    console.error('[saude-reproducao GET]', e.message)
    return NextResponse.json({ error: 'Erro ao carregar dados' }, { status: 500 })
  }
}

// POST — criar protocolo vacinal ou evento reprodutivo
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const property = await getProperty(session.user.id)
    if (!property) return NextResponse.json({ error: 'Propriedade não encontrada. Complete o cadastro da fazenda em /onboarding.' }, { status: 404 })

    const body = await req.json()

    if (body._type === 'protocolo') {
      const { nome, doenca, frequencia, produto, dose, mesesAplicar } = body
      if (!nome || !doenca) return NextResponse.json({ error: 'nome e doenca são obrigatórios' }, { status: 400 })
      const protocolo = await (prisma as any).protocoloVacinal.create({
        data: { propertyId: property.id, nome, doenca, frequencia: frequencia || 'ANUAL', produto, dose, mesesAplicar: mesesAplicar || [3, 9] },
      })
      return NextResponse.json(protocolo, { status: 201 })
    }

    if (body._type === 'evento') {
      const { animalIdentificacao, tipo, data, veterinario, resultado, pesoBezerro, observacao } = body
      if (!animalIdentificacao || !tipo) return NextResponse.json({ error: 'Identificação do animal e tipo são obrigatórios' }, { status: 400 })

      // Busca por identificacao (código visível) OU por id (UUID interno)
      const animal = await (prisma as any).animal.findFirst({
        where: {
          propertyId: property.id,
          OR: [
            { identificacao: animalIdentificacao },
            { id: animalIdentificacao },
            { brincoEletronico: animalIdentificacao },
            { sisbovId: animalIdentificacao },
            { rfid: animalIdentificacao },
          ],
        },
      })
      if (!animal) return NextResponse.json({
        error: `Animal "${animalIdentificacao}" não encontrado na sua fazenda. Verifique se o código está correto e se o animal foi cadastrado na Carteira Animal.`,
      }, { status: 404 })

      const evento = await (prisma as any).eventoReprodutivo.create({
        data: {
          animalId: animal.id,
          tipo,
          data: data ? new Date(data) : new Date(),
          veterinario: veterinario || null,
          resultado: resultado || null,
          pesoBezerro: pesoBezerro ? Number(pesoBezerro) : null,
          observacao: observacao || null,
        },
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
          update.dataPrevistoParto = new Date(dataEvento.getTime() + 283 * 86400000)
        }
        if (tipo === 'PARTO') {
          update.dataPrevistoParto = null
          update.dataInseminacao = null
        }
        await (prisma as any).statusReprodutivo.upsert({
          where: { animalId: animal.id },
          update,
          create: { animalId: animal.id, status: novoStatus, ...update },
        })
        if (tipo === 'PARTO') {
          await (prisma as any).statusReprodutivo.update({
            where: { animalId: animal.id },
            data: { paricoes: { increment: 1 } },
          })
        }
      }

      return NextResponse.json(evento, { status: 201 })
    }

    return NextResponse.json({ error: 'Tipo inválido. Use _type: protocolo | evento' }, { status: 400 })
  } catch (e: any) {
    console.error('[saude-reproducao POST]', e.message)
    return NextResponse.json({ error: 'Erro ao salvar' }, { status: 500 })
  }
}

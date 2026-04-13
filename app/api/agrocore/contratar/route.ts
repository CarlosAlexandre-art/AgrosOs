import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { getUserPlan, planoBloqueado } from '@/lib/planos'

const TIPO_MAP: Record<string, string> = {
  'Pulverização':   'PULVERIZACAO',
  'Plantio':        'PLANTIO',
  'Colheita':       'COLHEITA',
  'Irrigação':      'IRRIGACAO',
  'Adubação':       'APLICACAO_FERTILIZANTES',
  'Análise de solo':'ANALISE_SOLO',
  'Capina':         'CAPINA',
  'Transporte':     'TRANSPORTE',
  'Manutenção':     'MANUTENCAO_MAQUINAS',
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { plan, limites } = await getUserPlan(user.id)
    if (!limites.agrocore) return planoBloqueado('agrocore', plan)

    const { activityId } = await req.json()
    if (!activityId) return NextResponse.json({ error: 'activityId obrigatório' }, { status: 400 })

    const activity = await prisma.activity.findUnique({
      where: { id: activityId },
      include: { property: true },
    })
    if (!activity) return NextResponse.json({ error: 'Atividade não encontrada' }, { status: 404 })

    const serviceType = TIPO_MAP[activity.type] || 'OUTROS'
    const location = activity.property.location || activity.property.name

    const agrocoreRes = await fetch(
      `${process.env.AGROCORE_API_URL}/api/internal/servicos`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-secret': process.env.AGROLINK_INTERNAL_SECRET!,
        },
        body: JSON.stringify({
          userEmail: user.email,
          serviceType,
          description: activity.description || activity.type,
          location,
        }),
      }
    )

    const result = await agrocoreRes.json()

    if (!agrocoreRes.ok) {
      return NextResponse.json(
        { error: result.error || 'Erro ao criar pedido no AgroCore' },
        { status: agrocoreRes.status }
      )
    }

    // Salva o serviceId na atividade
    await prisma.activity.update({
      where: { id: activityId },
      data: { agrolinkServiceId: result.serviceId },
    })

    return NextResponse.json({ serviceId: result.serviceId, url: result.url })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro interno'
    console.error('[agrocore/contratar]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

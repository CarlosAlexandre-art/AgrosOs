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

const LIMITES: Record<string, { min: number; max: number; label: string }> = {
  ph: { min: 6.5, max: 8.5, label: 'pH' },
  oxigenioMgL: { min: 5, max: 14, label: 'Oxigênio Dissolvido' },
  temperaturaC: { min: 18, max: 32, label: 'Temperatura' },
  amoniaMgL: { min: 0, max: 0.5, label: 'Amônia' },
  nitritoMgL: { min: 0, max: 0.5, label: 'Nitrito' },
  turbidezNTU: { min: 20, max: 70, label: 'Turbidez' },
}

function verificarAlertas(dados: Record<string, number | null>) {
  const alertas: string[] = []
  for (const [param, limites] of Object.entries(LIMITES)) {
    const val = dados[param]
    if (val == null) continue
    if (val < limites.min) alertas.push(`${limites.label} baixo (${val})`)
    if (val > limites.max) alertas.push(`${limites.label} alto (${val})`)
  }
  return alertas
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const property = await getProperty(session.user.id)
    if (!property) return NextResponse.json({ error: 'Propriedade não encontrada' }, { status: 404 })

    const { searchParams } = new URL(req.url)
    const tanqueId = searchParams.get('tanqueId')

    const [tanques, registros] = await Promise.all([
      (prisma as any).tanqueAqua.findMany({
        where: { propertyId: property.id, ativo: true },
        select: { id: true, nome: true, tipo: true },
      }),
      (prisma as any).qualidadeAguaReg.findMany({
        where: {
          tanque: { propertyId: property.id },
          ...(tanqueId ? { tanqueId } : {}),
        },
        include: { tanque: { select: { nome: true } } },
        orderBy: { data: 'desc' },
        take: 100,
      }),
    ])

    const ultimoRegistro = registros[0]
    const alertasAtivos = registros
      .flatMap((r: any) => (r.alertas ? JSON.parse(r.alertas) : []))
      .slice(0, 10)

    return NextResponse.json({ tanques, registros, ultimoRegistro, alertasAtivos, limites: LIMITES })
  } catch (e: any) {
    console.error('[aqua-qualidade GET]', e.message)
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
    const { tanqueId, ph, oxigenioMgL, temperaturaC, amoniaMgL, nitritoMgL, turbidezNTU, alcalinidadeMgL, data, observacao } = body

    if (!tanqueId) return NextResponse.json({ error: 'Tanque é obrigatório' }, { status: 400 })

    const alertas = verificarAlertas({ ph, oxigenioMgL, temperaturaC, amoniaMgL, nitritoMgL, turbidezNTU })

    const registro = await (prisma as any).qualidadeAguaReg.create({
      data: {
        tanqueId,
        ph: ph != null ? Number(ph) : null,
        oxigenioMgL: oxigenioMgL != null ? Number(oxigenioMgL) : null,
        temperaturaC: temperaturaC != null ? Number(temperaturaC) : null,
        amoniaMgL: amoniaMgL != null ? Number(amoniaMgL) : null,
        nitritoMgL: nitritoMgL != null ? Number(nitritoMgL) : null,
        turbidezNTU: turbidezNTU != null ? Number(turbidezNTU) : null,
        alcalinidadeMgL: alcalinidadeMgL != null ? Number(alcalinidadeMgL) : null,
        data: data ? new Date(data) : new Date(),
        observacao: observacao || null,
        alertas: alertas.length > 0 ? JSON.stringify(alertas) : null,
      },
    })

    return NextResponse.json({ ...registro, alertas }, { status: 201 })
  } catch (e: any) {
    console.error('[aqua-qualidade POST]', e.message)
    return NextResponse.json({ error: 'Erro ao salvar' }, { status: 500 })
  }
}

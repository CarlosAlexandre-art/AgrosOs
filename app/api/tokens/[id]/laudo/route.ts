import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const token = await prisma.agroToken.findUnique({
    where: { id },
    include: {
      property: {
        include: {
          revenues: { where: { date: { gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) } } },
          costs: { where: { date: { gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) } } },
          activities: { where: { status: 'DONE', endDate: { gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) } } },
          fields: true,
          teamMembers: true,
          agroRate: { select: { score: true, category: true } },
          user: { select: { name: true, kycVerified: true, createdAt: true } },
        },
      },
    },
  })

  if (!token) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const p = token.property
  const receita = p.revenues.reduce((s, r) => s + Number(r.amount), 0)
  const custos = p.costs.reduce((s, c) => s + Number(c.amount), 0)
  const margem = receita > 0 ? ((receita - custos) / receita) * 100 : 0
  const atividadesConcluidas = p.activities.length
  const area = Number(p.sizeHectares)

  // Calcula score de confiança 0-100
  let confianca = 0
  if (receita > 0) confianca += 25
  if (margem > 10) confianca += 20
  if (atividadesConcluidas >= 5) confianca += 15
  if (area > 10) confianca += 10
  if (p.fields.length > 0) confianca += 10
  if (p.teamMembers.length > 0) confianca += 5
  if (p.agroRate?.score) confianca += Math.round((p.agroRate.score / 1000) * 15)
  if (p.user.kycVerified) confianca = Math.min(100, confianca + 10)

  const nivel = confianca >= 80 ? 'ALTO' : confianca >= 50 ? 'MÉDIO' : 'INICIAL'

  return NextResponse.json({
    produtor: p.user.name,
    kycVerificado: p.user.kycVerified,
    propriedade: p.name,
    areaHectares: area,
    talhoes: p.fields.length,
    equipe: p.teamMembers.length,
    receitaAnual: receita,
    custosAnual: custos,
    margemPct: Math.round(margem),
    atividadesConcluidas,
    agroRateScore: p.agroRate?.score ?? null,
    agroRateCategoria: p.agroRate?.category ?? null,
    scoreConfianca: confianca,
    nivelConfianca: nivel,
    emitidoEm: p.user.createdAt,
  })
}

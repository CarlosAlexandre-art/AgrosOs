import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { createAlert } from '@/lib/alerts'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: { properties: { include: { costs: { orderBy: { date: 'desc' }, include: { activity: true } } } } },
  })
  const costs = dbUser?.properties.flatMap((p: { costs: unknown[] }) => p.costs) || []
  return NextResponse.json(costs)
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { propertyId, activityId, amount, category, description, date } = await req.json()
  if (!propertyId || !amount) return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 })

  const cost = await prisma.cost.create({
    data: {
      propertyId,
      activityId: activityId || null,
      amount,
      category: category || 'OUTROS',
      description: description || null,
      date: date ? new Date(date) : new Date(),
    },
  })

  // Alerta + push para custo alto (acima de R$500)
  if (Number(amount) >= 500) {
    createAlert(propertyId, {
      message: `Custo de R$ ${Number(amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} registrado${description ? ' — ' + description : ''}`,
      type: 'COST',
      pushUrl: '/dashboard/financeiro',
    }).catch(() => {})
  }

  return NextResponse.json(cost, { status: 201 })
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export const maxDuration = 30

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id }, select: { id: true } })
  if (!dbUser) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })

  try {
    const agents = await (prisma as any).agentConfig.findMany({
      where: { userId: dbUser.id },
      include: {
        runs: {
          orderBy: { startedAt: 'desc' },
          take: 1,
          select: { status: true, startedAt: true, finishedAt: true, resultado: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    })
    return NextResponse.json({ agents })
  } catch (e: any) {
    console.error('[agents GET]', e?.message)
    return NextResponse.json({ error: e?.message ?? 'Erro ao buscar agentes' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id }, select: { id: true } })
  if (!dbUser) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })

  const body = await req.json()
  const { nome, descricao, role, tipo, tools, trigger, schedule, systemPrompt } = body

  if (!nome || !role) return NextResponse.json({ error: 'nome e role são obrigatórios' }, { status: 400 })

  try {
    const agent = await (prisma as any).agentConfig.create({
      data: {
        userId: dbUser.id,
        nome,
        descricao: descricao ?? null,
        role,
        tipo: tipo ?? 'PERSONALIZADO',
        tools: tools ?? [],
        trigger: trigger ?? 'MANUAL',
        schedule: schedule ?? null,
        systemPrompt: systemPrompt ?? null,
      },
    })
    return NextResponse.json({ agent }, { status: 201 })
  } catch (e: any) {
    console.error('[agents POST]', e?.message)
    return NextResponse.json({ error: e?.message ?? 'Erro ao criar agente' }, { status: 500 })
  }
}

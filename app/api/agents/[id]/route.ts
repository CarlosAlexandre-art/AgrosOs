import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export const maxDuration = 30

const db = prisma as any

async function getDbUser(supabaseId: string) {
  return prisma.user.findUnique({ where: { supabaseId }, select: { id: true } })
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const dbUser = await getDbUser(user.id)
  if (!dbUser) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })

  const agent = await db.agentConfig.findFirst({
    where: { id, userId: dbUser.id },
    include: {
      runs: {
        orderBy: { startedAt: 'desc' },
        take: 10,
        select: { id: true, status: true, startedAt: true, finishedAt: true, resultado: true, toolCalls: true, erro: true },
      },
    },
  })

  if (!agent) return NextResponse.json({ error: 'Agente não encontrado' }, { status: 404 })
  return NextResponse.json({ agent })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const dbUser = await getDbUser(user.id)
  if (!dbUser) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })

  const existing = await db.agentConfig.findFirst({ where: { id, userId: dbUser.id } })
  if (!existing) return NextResponse.json({ error: 'Agente não encontrado' }, { status: 404 })

  const body = await req.json()
  const agent = await db.agentConfig.update({
    where: { id },
    data: {
      nome: body.nome ?? existing.nome,
      descricao: body.descricao ?? existing.descricao,
      role: body.role ?? existing.role,
      tools: body.tools ?? existing.tools,
      trigger: body.trigger ?? existing.trigger,
      schedule: body.schedule ?? existing.schedule,
      systemPrompt: body.systemPrompt ?? existing.systemPrompt,
      ativo: body.ativo ?? existing.ativo,
    },
  })

  return NextResponse.json({ agent })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const dbUser = await getDbUser(user.id)
  if (!dbUser) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })

  const existing = await db.agentConfig.findFirst({ where: { id, userId: dbUser.id } })
  if (!existing) return NextResponse.json({ error: 'Agente não encontrado' }, { status: 404 })

  await db.agentConfig.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}

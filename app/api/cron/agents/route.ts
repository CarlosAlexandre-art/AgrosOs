import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { runAgent } from '@/lib/agent-engine'

export const maxDuration = 300

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const agentes = await (prisma as any).agentConfig.findMany({
    where: { ativo: true, trigger: 'CRON' },
    select: { id: true, userId: true, nome: true },
  })

  const resultados: { nome: string; status: string; erro?: string }[] = []

  for (const agente of agentes) {
    try {
      await runAgent(agente.id, agente.userId)
      resultados.push({ nome: agente.nome, status: 'COMPLETED' })
    } catch (err: any) {
      resultados.push({ nome: agente.nome, status: 'FAILED', erro: err?.message })
    }
  }

  return NextResponse.json({ ok: true, executados: resultados.length, resultados })
}

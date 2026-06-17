import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// ─── Limites por plano ───────────────────────────────────────────────────────

export const PLANO_LIMITES = {
  // SMARTAGROOS - Sistema Operacional da Fazenda
  starter: {
    nome: 'Gratuito',
    preco: 'R$ 0/mês',
    propriedades: 1,
    talhoesPorProp: 3,
    atividadesMes: 20,
    receitas: false,
    metas: false,
    push: false,
    agrocore: false,
    membrosEquipe: 2,
    exportacao: false,
    agroRate: false,
    iaAssistente: false,
    historico: false,
    notificacoesEmail: false,
  },
  pro: {
    nome: 'Profissional',
    preco: 'R$ 97/mês ou R$ 970/ano',
    propriedades: 3,
    talhoesPorProp: 9999,
    atividadesMes: 9999,
    receitas: true,
    metas: true,
    push: true,
    agrocore: true,
    membrosEquipe: 5,
    exportacao: true,
    agroRate: true,
    iaAssistente: true,
    historico: true,
    notificacoesEmail: true,
  },
  enterprise: {
    nome: 'Empresarial',
    preco: 'R$ 397/mês',
    propriedades: 9999,
    talhoesPorProp: 9999,
    atividadesMes: 9999,
    receitas: true,
    metas: true,
    push: true,
    agrocore: true,
    membrosEquipe: 9999,
    exportacao: true,
    agroRate: true,
    iaAssistente: true,
    historico: true,
    notificacoesEmail: true,
    agroToken: true,
    apiIntegracoes: true,
    suportePrioritario: true,
  },
  admin: {
    nome: 'Administrador',
    preco: 'Acesso total',
    propriedades: 9999,
    talhoesPorProp: 9999,
    atividadesMes: 9999,
    receitas: true,
    metas: true,
    push: true,
    agrocore: true,
    membrosEquipe: 9999,
    exportacao: true,
    agroRate: true,
    iaAssistente: true,
    historico: true,
    notificacoesEmail: true,
    agroToken: true,
    apiIntegracoes: true,
    suportePrioritario: true,
  },
}

export function getLimites(plan: string) {
  return PLANO_LIMITES[plan as keyof typeof PLANO_LIMITES] ?? PLANO_LIMITES.starter
}

// ─── Helper: busca usuário + plano ──────────────────────────────────────────

export async function getUserPlan(supabaseId: string) {
  const dbUser = await prisma.user.findUnique({ where: { supabaseId } })
  const plan = (dbUser as any)?.plan ?? 'starter'
  return { dbUser, plan, limites: getLimites(plan) }
}

// ─── Resposta padrão de bloqueio ─────────────────────────────────────────────

export function planoBloqueado(recurso: string, planoAtual: string) {
  return NextResponse.json(
    { error: 'PLAN_LIMIT', recurso, plano: planoAtual },
    { status: 403 }
  )
}

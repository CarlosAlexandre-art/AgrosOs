import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// ─── Limites por plano ───────────────────────────────────────────────────────

export const PLANO_LIMITES = {
  starter: {
    propriedades:      1,
    talhoesPorProp:    3,
    atividadesMes:     20,
    receitas:          false,
    metas:             false,
    push:              false,
    agrocore:          false,
    multiusuario:      false,
    exportacao:        false,
  },
  pro: {
    propriedades:      3,
    talhoesPorProp:    9999,
    atividadesMes:     9999,
    receitas:          true,
    metas:             true,
    push:              true,
    agrocore:          true,
    multiusuario:      false,
    exportacao:        true,
  },
  enterprise: {
    propriedades:      9999,
    talhoesPorProp:    9999,
    atividadesMes:     9999,
    receitas:          true,
    metas:             true,
    push:              true,
    agrocore:          true,
    multiusuario:      true,
    exportacao:        true,
  },
  admin: {
    propriedades:      9999,
    talhoesPorProp:    9999,
    atividadesMes:     9999,
    receitas:          true,
    metas:             true,
    push:              true,
    agrocore:          true,
    multiusuario:      true,
    exportacao:        true,
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

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { groq } from '@/lib/groq'

function stddev(values: number[]): number {
  if (values.length < 2) return 0
  const mean = values.reduce((s, v) => s + v, 0) / values.length
  return Math.sqrt(values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length)
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      include: {
        properties: {
          include: {
            revenues:    { orderBy: { date: 'asc' }, select: { amount: true, date: true, category: true } },
            costs:       { orderBy: { date: 'asc' }, select: { amount: true, date: true, category: true } },
            activities:  { select: { status: true, type: true, startDate: true, endDate: true, assignedTo: { select: { name: true } } } },
            alerts:      { select: { isRead: true, type: true, createdAt: true } },
            teamMembers: { select: { id: true, name: true, role: true, activities: { select: { status: true } } } },
            goals:       { select: { title: true, type: true, targetValue: true, currentValue: true, deadline: true, isCompleted: true } },
            energyRecords: { select: { month: true, year: true, source: true, consumption: true, production: true, cost: true } },
          },
          take: 1,
        },
      },
    })

    if (!dbUser) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    const property = dbUser.properties[0]
    if (!property) return NextResponse.json({ error: 'Nenhuma propriedade encontrada' }, { status: 404 })

    // ── Financeiro ──────────────────────────────────────────────────────────
    const revByMonth: Record<string, number> = {}
    const costByMonth: Record<string, number> = {}
    for (const r of property.revenues) {
      const k = monthKey(new Date(r.date))
      revByMonth[k] = (revByMonth[k] ?? 0) + Number(r.amount)
    }
    for (const c of property.costs) {
      const k = monthKey(new Date(c.date))
      costByMonth[k] = (costByMonth[k] ?? 0) + Number(c.amount)
    }
    const months = [...new Set([...Object.keys(revByMonth), ...Object.keys(costByMonth)])].sort()
    const revValues  = months.map(m => revByMonth[m] ?? 0)
    const costValues = months.map(m => costByMonth[m] ?? 0)
    const totalRev  = revValues.reduce((s, v) => s + v, 0)
    const totalCost = costValues.reduce((s, v) => s + v, 0)
    const margem    = totalRev > 0 ? Math.round(((totalRev - totalCost) / totalRev) * 100) : 0
    const revStd    = stddev(revValues)
    const revMean   = revValues.reduce((s, v) => s + v, 0) / (revValues.length || 1)
    const anomaliasMeses = months.filter((m, i) => Math.abs(revValues[i] - revMean) > 2 * revStd)

    // Cost by category
    const costByCat: Record<string, number> = {}
    for (const c of property.costs) costByCat[c.category] = (costByCat[c.category] ?? 0) + Number(c.amount)
    const topCostCat = Object.entries(costByCat).sort((a, b) => b[1] - a[1]).slice(0, 3)
      .map(([cat, val]) => ({ cat, val: Math.round(val), pct: totalCost > 0 ? Math.round((val / totalCost) * 100) : 0 }))

    // ── Operacional ─────────────────────────────────────────────────────────
    const acts = property.activities
    const actDone   = acts.filter((a: any) => a.status === 'DONE').length
    const actLate   = acts.filter((a: any) => a.status === 'LATE').length
    const actTotal  = acts.length
    const completionRate = actTotal > 0 ? Math.round((actDone / actTotal) * 100) : 0
    const lateRate       = actTotal > 0 ? Math.round((actLate / actTotal) * 100) : 0

    // Activity types distribution
    const actByType: Record<string, number> = {}
    for (const a of acts) actByType[a.type] = (actByType[a.type] ?? 0) + 1
    const topActTypes = Object.entries(actByType).sort((a, b) => b[1] - a[1]).slice(0, 3)
      .map(([type, count]) => ({ type, count }))

    // ── Equipe ──────────────────────────────────────────────────────────────
    const team = property.teamMembers
    const teamStats = team.map((m: any) => {
      const total = m.activities.length
      const done  = m.activities.filter((a: any) => a.status === 'DONE').length
      return { name: m.name, role: m.role, total, done, taxa: total > 0 ? Math.round((done / total) * 100) : 0 }
    })

    // ── Alertas ─────────────────────────────────────────────────────────────
    const alertas = property.alerts
    const alertasNaoLidos = alertas.filter((a: any) => !a.isRead).length
    const alertasByType: Record<string, number> = {}
    for (const a of alertas) alertasByType[a.type] = (alertasByType[a.type] ?? 0) + 1

    // ── Metas ───────────────────────────────────────────────────────────────
    const goals = property.goals
    const metasConcluidas = goals.filter((g: any) => g.isCompleted).length
    const metasEmRisco = goals.filter((g: any) => {
      if (g.isCompleted) return false
      const progress = Number(g.targetValue) > 0 ? Number(g.currentValue) / Number(g.targetValue) : 0
      const diasRestantes = g.deadline ? Math.ceil((new Date(g.deadline).getTime() - Date.now()) / 86400000) : 999
      return diasRestantes < 30 && progress < 0.5
    })
    const progressoMedio = goals.length > 0
      ? Math.round(goals.reduce((s: number, g: any) => s + Math.min(1, Number(g.currentValue) / Math.max(1, Number(g.targetValue))), 0) / goals.length * 100)
      : 0

    // ── Energia ─────────────────────────────────────────────────────────────
    const energia = property.energyRecords
    const totalConsumo   = energia.reduce((s: number, e: any) => s + e.consumption, 0)
    const totalProducao  = energia.reduce((s: number, e: any) => s + e.production, 0)
    const totalCustoEnergia = energia.reduce((s: number, e: any) => s + e.cost, 0)
    const autoSuficiencia = totalConsumo > 0 ? Math.round((totalProducao / totalConsumo) * 100) : 0

    // ── Score RAPIDS (0-100 por domínio) ────────────────────────────────────
    const scoreFinanceiro  = Math.min(100, Math.max(0, margem >= 0 ? 50 + margem / 2 : 50 + margem))
    const scoreOperacional = completionRate
    const scoreEquipe      = teamStats.length > 0 ? Math.round(teamStats.reduce((s: number, t: any) => s + t.taxa, 0) / teamStats.length) : 50
    const scoreMetas       = progressoMedio
    const scoreGeral       = Math.round((scoreFinanceiro + scoreOperacional + scoreEquipe + scoreMetas) / 4)

    // ── NIM — Relatório Executivo ───────────────────────────────────────────
    const relatorioIA = await groq([{
      role: 'user',
      content: `Você é um analista agroindustrial especialista em gestão de fazendas no Brasil.
Analise o pipeline de dados completo da propriedade e gere um relatório executivo.

FINANCEIRO
- Margem bruta: ${margem}% | Receita total: R$ ${totalRev.toLocaleString('pt-BR')} | Custo total: R$ ${totalCost.toLocaleString('pt-BR')}
- Meses analisados: ${months.length} | Volatilidade de receita: R$ ${Math.round(revStd).toLocaleString('pt-BR')} (desvio padrão)
- Meses anômalos (>2σ): ${anomaliasMeses.length > 0 ? anomaliasMeses.join(', ') : 'Nenhum'}
- Top categorias de custo: ${topCostCat.map(c => `${c.cat} (${c.pct}%)`).join(', ')}

OPERACIONAL
- Atividades: ${actTotal} total | ${actDone} concluídas (${completionRate}%) | ${actLate} em atraso (${lateRate}%)
- Tipos mais frequentes: ${topActTypes.map(t => `${t.type} (${t.count})`).join(', ')}

EQUIPE (${team.length} membros)
${teamStats.slice(0, 3).map((t: any) => `- ${t.name} (${t.role}): ${t.taxa}% de conclusão`).join('\n')}

METAS
- ${goals.length} metas | ${metasConcluidas} concluídas | ${metasEmRisco.length} em risco | Progresso médio: ${progressoMedio}%

ENERGIA
- Consumo: ${totalConsumo} kWh | Produção própria: ${totalProducao} kWh | Autossuficiência: ${autoSuficiencia}%
- Custo energético total: R$ ${totalCustoEnergia.toLocaleString('pt-BR')}

Score RAPIDS: Financeiro ${scoreFinanceiro}/100 | Operacional ${scoreOperacional}/100 | Equipe ${scoreEquipe}/100 | Metas ${scoreMetas}/100 | GERAL ${scoreGeral}/100

Gere em 4 seções concisas:
1. Saúde geral (1 parágrafo, baseado no score geral)
2. Pontos fortes (até 2 itens)
3. Pontos críticos (até 3 itens — priorize os de maior impacto financeiro)
4. Ação imediata recomendada (1 frase direta e específica)`,
    }], 700)

    return NextResponse.json({
      scoreGeral,
      scores: { financeiro: scoreFinanceiro, operacional: scoreOperacional, equipe: scoreEquipe, metas: scoreMetas },
      financeiro: { totalRev: Math.round(totalRev), totalCost: Math.round(totalCost), margem, mesesAnalisados: months.length, anomaliasMeses, topCostCat },
      operacional: { total: actTotal, concluidas: actDone, completionRate, atrasadas: actLate, lateRate, topActTypes },
      equipe: { membros: teamStats.length, mediaConlusao: scoreEquipe, top: teamStats.sort((a: any, b: any) => b.taxa - a.taxa).slice(0, 3) },
      alertas: { total: alertas.length, naoLidos: alertasNaoLidos, porTipo: alertasByType },
      metas: { total: goals.length, concluidas: metasConcluidas, emRisco: metasEmRisco.length, progressoMedio },
      energia: { consumo: Math.round(totalConsumo), producao: Math.round(totalProducao), custo: Math.round(totalCustoEnergia), autoSuficiencia },
      relatorioIA,
      modelo: 'RAPIDS Statistical Pipeline + NVIDIA NIM llama-3.3-70b',
      geradoEm: new Date().toISOString(),
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

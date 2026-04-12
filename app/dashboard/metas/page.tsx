import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import GoalActions from './GoalActions'

const TYPE_LABEL: Record<string, { label: string; icon: string; color: string }> = {
  REVENUE:      { label: 'Aumento de faturamento', icon: '📈', color: 'text-green-700 bg-green-50 border-green-200' },
  PRODUCTIVITY: { label: 'Produtividade', icon: '⚡', color: 'text-blue-700 bg-blue-50 border-blue-200' },
  COST:         { label: 'Redução de custos', icon: '💰', color: 'text-purple-700 bg-purple-50 border-purple-200' },
  ACTIVITIES:   { label: 'Atividades concluídas', icon: '✅', color: 'text-orange-700 bg-orange-50 border-orange-200' },
  CUSTOM:       { label: 'Meta personalizada', icon: '🎯', color: 'text-slate-700 bg-slate-50 border-slate-200' },
}

export default async function MetasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: {
      properties: {
        include: {
          goals: { orderBy: { createdAt: 'desc' } },
          costs: true,
          activities: true,
        },
      },
    },
  })

  const property = dbUser?.properties[0]
  const goals = property?.goals || []

  // Calcular valores atuais automaticamente
  const totalRevenue = property?.costs.reduce((acc: number, c) => acc + Number(c.amount), 0) || 0
  const doneActivities = property?.activities.filter((a: any) => a.status === 'DONE').length || 0

  const active = goals.filter((g: any) => !g.isCompleted)
  const completed = goals.filter((g: any) => g.isCompleted)

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Metas</h1>
          <p className="text-sm text-slate-500 mt-0.5">Acompanhe seus objetivos interligados à operação</p>
        </div>
        <Link href="/dashboard/metas/nova" className="flex items-center gap-1.5 bg-[#16a34a] text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-[#15803d] transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          Nova meta
        </Link>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Metas ativas', value: active.length, color: 'text-blue-700', bg: 'bg-blue-50' },
          { label: 'Concluídas', value: completed.length, color: 'text-green-700', bg: 'bg-green-50' },
          { label: 'Total de metas', value: goals.length, color: 'text-slate-700', bg: 'bg-slate-50' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-slate-400 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {goals.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-16 text-center">
          <div className="text-5xl mb-4">🎯</div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Nenhuma meta definida</h2>
          <p className="text-slate-500 text-sm mb-6 max-w-sm mx-auto">
            Defina objetivos claros — aumento de faturamento, produtividade, redução de custos — e acompanhe o progresso em tempo real.
          </p>
          <Link href="/dashboard/metas/nova" className="inline-flex items-center gap-2 bg-[#16a34a] text-white font-semibold px-6 py-3 rounded-xl hover:bg-[#15803d] transition-colors">
            Criar primeira meta
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {active.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Em andamento</div>
              <div className="space-y-4">
                {active.map((g: any) => {
                  const info = TYPE_LABEL[g.type] || TYPE_LABEL.CUSTOM
                  // Valor atual automático por tipo
                  let current = Number(g.currentValue)
                  if (g.type === 'REVENUE') current = Math.max(current, totalRevenue)
                  if (g.type === 'ACTIVITIES') current = Math.max(current, doneActivities)
                  const target = Number(g.targetValue)
                  const pct = target > 0 ? Math.min((current / target) * 100, 100) : 0
                  const isNear = pct >= 80

                  return (
                    <div key={g.id} className="bg-white rounded-2xl border border-slate-200 p-6">
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex items-start gap-3">
                          <div className="text-2xl">{info.icon}</div>
                          <div>
                            <h3 className="font-semibold text-slate-900">{g.title}</h3>
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${info.color}`}>{info.label}</span>
                            {g.description && <p className="text-sm text-slate-400 mt-1">{g.description}</p>}
                          </div>
                        </div>
                        <GoalActions goalId={g.id} />
                      </div>

                      {/* Barra de progresso */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500">
                            {g.type === 'ACTIVITIES'
                              ? `${current} de ${target} atividades`
                              : `R$ ${current.toLocaleString('pt-BR', { minimumFractionDigits: 0 })} de R$ ${target.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`
                            }
                          </span>
                          <span className={`font-bold ${isNear ? 'text-green-600' : 'text-slate-700'}`}>{pct.toFixed(0)}%</span>
                        </div>
                        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${isNear ? 'bg-green-500' : 'bg-[#16a34a]'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        {g.deadline && (
                          <div className="text-xs text-slate-400">
                            Prazo: {new Date(g.deadline).toLocaleDateString('pt-BR')}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {completed.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Concluídas</div>
              <div className="space-y-3">
                {completed.map((g: any) => {
                  const info = TYPE_LABEL[g.type] || TYPE_LABEL.CUSTOM
                  return (
                    <div key={g.id} className="bg-white rounded-2xl border border-slate-200 p-5 opacity-60 flex items-center gap-4">
                      <div className="text-xl">{info.icon}</div>
                      <div className="flex-1">
                        <div className="font-medium text-slate-900 flex items-center gap-2">
                          {g.title}
                          <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">✓ Concluída</span>
                        </div>
                        <div className="text-xs text-slate-400">{info.label}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import GoalActions from './GoalActions'
import MetasExport from '@/components/reports/MetasExport'
import ConselheirMetas from '@/components/ai/ConselheirMetas'

const TYPE_LABEL: Record<string, { label: string; icon: string; color: string }> = {
  REVENUE:      { label: 'Faturamento',         icon: '📈', color: 'text-green-700 bg-green-50 border-green-200' },
  PRODUCTIVITY: { label: 'Produtividade',        icon: '⚡', color: 'text-blue-700 bg-blue-50 border-blue-200' },
  COST:         { label: 'Redução de custos',    icon: '💰', color: 'text-purple-700 bg-purple-50 border-purple-200' },
  ACTIVITIES:   { label: 'Atividades concluídas',icon: '✅', color: 'text-orange-700 bg-orange-50 border-orange-200' },
  CUSTOM:       { label: 'Meta personalizada',   icon: '🎯', color: 'text-slate-700 bg-slate-50 border-slate-200' },
}

function gerarConselho(type: string, pct: number, mesesRestantes: number | null): string {
  if (pct >= 100) return 'Meta atingida! Considere elevar o objetivo para continuar crescendo.'
  if (type === 'REVENUE') {
    if (pct < 20) return 'Faturamento muito abaixo da meta. Avalie novos canais de venda ou diversificação de culturas.'
    if (pct < 50) return 'Ritmo abaixo do esperado. Registre todas as receitas para acompanhar o progresso real.'
    if (mesesRestantes !== null && mesesRestantes > 12) return 'No ritmo atual o prazo está apertado. Considere antecipar colheitas ou negociar contratos de venda.'
    return 'Bom progresso! Mantenha o registro de receitas atualizado para projeções precisas.'
  }
  if (type === 'COST') {
    if (pct > 80) return 'Custos próximos do limite definido. Revise contratos de insumos e mão de obra.'
    if (pct > 50) return 'Custos em nível moderado. Monitore categorias de maior impacto no financeiro.'
    return 'Custos controlados. Continue registrando todas as saídas para manter a precisão.'
  }
  if (type === 'ACTIVITIES') {
    if (pct < 30) return 'Poucas atividades concluídas. Verifique se há tarefas atrasadas na operação.'
    if (pct < 70) return 'Progresso moderado. Priorize atividades com prazo próximo para evitar atrasos.'
    return 'Excelente ritmo operacional! Mantenha o planejamento das próximas atividades.'
  }
  return 'Mantenha o registro atualizado para projeções mais precisas.'
}

function calcularProjecao(current: number, target: number, createdAt: Date, deadline: Date | null): { mesesParaAtingir: number | null; mesesRestantes: number | null; noRitmoAtual: boolean } {
  const now = new Date()
  const mesesDecorridos = Math.max(1, (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24 * 30))
  const taxaMensal = current / mesesDecorridos
  const restante = target - current
  const mesesParaAtingir = taxaMensal > 0 ? Math.ceil(restante / taxaMensal) : null

  let mesesRestantes: number | null = null
  let noRitmoAtual = false
  if (deadline) {
    mesesRestantes = Math.max(0, Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30)))
    noRitmoAtual = mesesParaAtingir !== null && mesesParaAtingir <= mesesRestantes
  }

  return { mesesParaAtingir, mesesRestantes, noRitmoAtual }
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
          goals: { orderBy: { createdAt: 'asc' } },
          costs: true,
          revenues: true,
          activities: true,
        },
      },
    },
  })

  const plan = (dbUser as any)?.plan ?? 'starter'
  const isPago = ['pro', 'enterprise', 'admin'].includes(plan)

  if (!isPago) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="text-5xl mb-4">🎯</div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Metas e projeções — recurso exclusivo Pro</h1>
          <p className="text-slate-500 text-sm mb-6 max-w-sm mx-auto">
            Defina objetivos sincronizados com dados reais e acompanhe projeções automáticas com o plano Pro ou Enterprise.
          </p>
          <Link href="/dashboard/planos" className="inline-flex items-center gap-2 bg-[#16a34a] text-white font-semibold px-6 py-3 rounded-xl hover:bg-[#15803d] transition-colors">
            Ver planos →
          </Link>
        </div>
      </div>
    )
  }

  const property = dbUser?.properties[0]
  const goals = property?.goals || []

  const totalCosts = property?.costs.reduce((acc: number, c: any) => acc + Number(c.amount), 0) || 0
  const totalRevenues = (property as any)?.revenues?.reduce((acc: number, r: any) => acc + Number(r.amount), 0) || 0
  const doneActivities = property?.activities.filter((a: any) => a.status === 'DONE').length || 0
  const sizeHa = Number(property?.sizeHectares || 0)

  const active = goals.filter((g: any) => !g.isCompleted)
  const completed = goals.filter((g: any) => g.isCompleted)

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Metas</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 hidden sm:block">Objetivos sincronizados com a operação real</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="hidden sm:block">
            <MetasExport
              propertyName={property?.name || 'Fazenda'}
              goals={goals.map((g: any) => ({
                title: g.title, type: g.type,
                targetValue: Number(g.targetValue), currentValue: Number(g.currentValue),
                isCompleted: g.isCompleted, deadline: g.deadline?.toISOString() || null,
              }))}
            />
          </div>
          <Link href="/dashboard/metas/nova" className="flex items-center gap-1.5 bg-[#16a34a] text-white text-sm font-semibold px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl hover:bg-[#15803d] transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            <span className="hidden sm:inline">Nova meta</span>
          </Link>
        </div>
      </div>

      {/* IA Metas */}
      <ConselheirMetas />

      {/* Resumo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Metas ativas', value: active.length, color: 'text-blue-700', bg: 'bg-blue-50' },
          { label: 'Concluídas', value: completed.length, color: 'text-green-700', bg: 'bg-green-50' },
          { label: 'Receita total', value: `R$ ${totalRevenues.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`, color: 'text-green-700', bg: 'bg-green-50' },
          { label: 'Atividades concluídas', value: doneActivities, color: 'text-orange-700', bg: 'bg-orange-50' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-200 p-4">
            <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-slate-400 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {goals.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-16 text-center">
          <div className="text-5xl mb-4">🎯</div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Nenhuma meta definida</h2>
          <p className="text-slate-500 text-sm mb-6 max-w-sm mx-auto">
            Defina objetivos claros e acompanhe o progresso automaticamente com base nos dados reais da sua operação.
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
                  const target = Number(g.targetValue)

                  // Sincroniza com dados reais
                  let current = Number(g.currentValue)
                  if (g.type === 'REVENUE') current = Math.max(current, totalRevenues)
                  if (g.type === 'COST') current = Math.max(current, totalCosts)
                  if (g.type === 'ACTIVITIES') current = Math.max(current, doneActivities)
                  if (g.type === 'PRODUCTIVITY' && sizeHa > 0) current = Math.max(current, doneActivities / sizeHa)

                  const pct = target > 0 ? Math.min((current / target) * 100, 100) : 0
                  const isNear = pct >= 80
                  const proj = calcularProjecao(current, target, new Date(g.createdAt), g.deadline ? new Date(g.deadline) : null)
                  const conselho = gerarConselho(g.type, pct, proj.mesesRestantes)

                  const formatVal = (v: number) => g.type === 'ACTIVITIES' || g.type === 'PRODUCTIVITY'
                    ? v.toFixed(g.type === 'PRODUCTIVITY' ? 1 : 0)
                    : `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`

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
                        <GoalActions goalId={g.id} goal={{ id: g.id, title: g.title, description: g.description, type: g.type, targetValue: Number(g.targetValue), deadline: g.deadline?.toISOString() ?? null, isCompleted: g.isCompleted }} />
                      </div>

                      {/* Barra de progresso */}
                      <div className="space-y-1.5 mb-4">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500">{formatVal(current)} de {formatVal(target)}</span>
                          <span className={`font-bold ${isNear ? 'text-green-600' : 'text-slate-700'}`}>{pct.toFixed(0)}%</span>
                        </div>
                        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${pct >= 100 ? 'bg-green-500' : isNear ? 'bg-green-400' : 'bg-[#16a34a]'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        {g.deadline && (
                          <div className="flex items-center justify-between text-xs text-slate-400">
                            <span>Prazo: {new Date(g.deadline).toLocaleDateString('pt-BR')}</span>
                            {proj.mesesParaAtingir !== null && (
                              <span className={proj.noRitmoAtual ? 'text-green-600 font-medium' : 'text-orange-600 font-medium'}>
                                {proj.noRitmoAtual ? '✓ No ritmo certo' : `Projeção: +${proj.mesesParaAtingir} meses`}
                              </span>
                            )}
                          </div>
                        )}
                        {!g.deadline && proj.mesesParaAtingir !== null && proj.mesesParaAtingir > 0 && (
                          <div className="text-xs text-slate-400">
                            No ritmo atual: <span className="font-medium text-slate-600">~{proj.mesesParaAtingir} {proj.mesesParaAtingir === 1 ? 'mês' : 'meses'}</span> para atingir a meta
                          </div>
                        )}
                      </div>

                      {/* Conselho */}
                      <div className="bg-slate-50 rounded-xl px-4 py-3 flex items-start gap-2">
                        <span className="text-sm">💡</span>
                        <p className="text-xs text-slate-600">{conselho}</p>
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
                      <GoalActions goalId={g.id} goal={{ id: g.id, title: g.title, description: g.description, type: g.type, targetValue: Number(g.targetValue), deadline: g.deadline?.toISOString() ?? null, isCompleted: g.isCompleted }} />
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

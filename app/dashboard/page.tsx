import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { ACTIVITY_STATUS as STATUS } from '@/lib/constants'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const include = {
    activities: { orderBy: { createdAt: 'desc' as const }, take: 8 },
    costs:      { orderBy: { date: 'desc' as const }, take: 50 },
    alerts:     { where: { isRead: false }, orderBy: { createdAt: 'desc' as const } },
    teamMembers: true,
    fields: true,
  }

  let dbUser: any = null
  try {
    dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      include: { properties: { include } },
    })

    if (!dbUser) {
      dbUser = await prisma.user.create({
        data: {
          supabaseId: user.id,
          name: user.user_metadata?.name || user.email!.split('@')[0],
          email: user.email!,
        },
        include: { properties: { include } },
      })
    }
  } catch (err) {
    console.error('[Dashboard] DB error:', err)
    // Tenta sem alerts (caso tabela ainda não exista)
    try {
      dbUser = await prisma.user.findUnique({
        where: { supabaseId: user.id },
        include: {
          properties: {
            include: {
              activities: { orderBy: { createdAt: 'desc' }, take: 8 },
              costs:      { orderBy: { date: 'desc' }, take: 50 },
              teamMembers: true,
              fields: true,
            },
          },
        },
      }) as any
      if (dbUser) (dbUser as any).properties = (dbUser as any).properties.map((p: any) => ({ ...p, alerts: [] }))
    } catch (err2) {
      console.error('[Dashboard] DB fallback error:', err2)
    }
  }

  if (!dbUser) return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
          </svg>
        </div>
        <h2 className="text-lg font-bold text-slate-900 mb-2">Erro ao carregar dados</h2>
        <p className="text-sm text-slate-500 mb-5">O banco de dados está temporariamente indisponível. Tente novamente em instantes.</p>
        <a href="/dashboard" className="inline-block bg-[#16a34a] text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-[#15803d] transition-colors text-sm">
          Tentar novamente
        </a>
      </div>
    </div>
  )

  const property = dbUser.properties[0]
  const allActivities = property?.activities || []
  const allCosts = property?.costs || []
  const alerts = property?.alerts || []

  const inProgress = allActivities.filter((a: any) => a.status === 'IN_PROGRESS').length
  const late = allActivities.filter((a: any) => a.status === 'LATE').length
  const done = allActivities.filter((a: any) => a.status === 'DONE').length
  const pending = allActivities.filter((a: any) => a.status === 'PENDING').length
  const totalCost = allCosts.reduce((acc: number, c: any) => acc + Number(c.amount), 0)
  const teamCount = property?.teamMembers?.length || 0
  const fieldCount = property?.fields?.length || 0

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Olá, {dbUser.name.split(' ')[0]} 👋
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        {alerts.length > 0 && (
          <Link href="/dashboard/alertas" className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm font-medium px-4 py-2 rounded-xl hover:bg-red-100 transition-colors">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            {alerts.length} alerta{alerts.length > 1 ? 's' : ''} novo{alerts.length > 1 ? 's' : ''}
          </Link>
        )}
      </div>

      {/* Sem propriedade */}
      {!property && (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-[#16a34a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Configure sua primeira propriedade</h2>
          <p className="text-slate-500 text-sm mb-6 max-w-sm mx-auto">Adicione sua fazenda para começar a registrar atividades, custos e gerenciar sua equipe.</p>
          <Link href="/dashboard/propriedades/nova" className="inline-flex items-center gap-2 bg-[#16a34a] text-white font-semibold px-6 py-3 rounded-xl hover:bg-[#15803d] transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Adicionar propriedade
          </Link>
        </div>
      )}

      {property && (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                label: 'Em andamento', value: inProgress, icon: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                ), color: 'text-blue-600', bg: 'bg-blue-50', href: '/dashboard/operacoes?status=IN_PROGRESS',
              },
              {
                label: 'Atrasadas', value: late, icon: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                ), color: 'text-red-600', bg: 'bg-red-50', href: '/dashboard/operacoes?status=LATE',
              },
              {
                label: 'Custo total', value: `R$ ${totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`, icon: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                ), color: 'text-purple-600', bg: 'bg-purple-50', href: '/dashboard/financeiro',
              },
              {
                label: 'Concluídas', value: done, icon: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                ), color: 'text-green-600', bg: 'bg-green-50', href: '/dashboard/operacoes?status=DONE',
              },
            ].map(card => (
              <Link key={card.label} href={card.href} className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-sm hover:border-slate-300 transition-all group">
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-xs font-semibold text-slate-500 uppercase tracking-wide`}>{card.label}</span>
                  <div className={`w-9 h-9 rounded-xl ${card.bg} ${card.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    {card.icon}
                  </div>
                </div>
                <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
              </Link>
            ))}
          </div>

          {/* Grid principal */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Atividades recentes */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="font-semibold text-slate-900">Atividades recentes</h2>
                <Link href="/dashboard/operacoes" className="text-sm text-[#16a34a] font-medium hover:underline flex items-center gap-1">
                  Ver todas
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="m9 18 6-6-6-6" /></svg>
                </Link>
              </div>
              {allActivities.length === 0 ? (
                <div className="py-16 text-center text-slate-400">
                  <svg className="w-10 h-10 mx-auto mb-3 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                  <p className="text-sm">Nenhuma atividade registrada.</p>
                  <Link href="/dashboard/operacoes/nova" className="mt-3 inline-block text-sm text-[#16a34a] font-medium hover:underline">Criar primeira atividade →</Link>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {allActivities.map((a: any) => {
                    const st = STATUS[a.status] || STATUS.CANCELLED
                    return (
                      <Link key={a.id} href={`/dashboard/operacoes/${a.id}`} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors group">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${st.dot}`} />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-slate-900 truncate group-hover:text-[#16a34a] transition-colors">{a.type}</div>
                          {a.description && <div className="text-xs text-slate-400 truncate mt-0.5">{a.description}</div>}
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className="text-xs text-slate-400">{new Date(a.startDate).toLocaleDateString('pt-BR')}</span>
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${st.pill}`}>{st.label}</span>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Coluna direita */}
            <div className="space-y-5">
              {/* Propriedade */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-slate-900 text-sm">Propriedade ativa</h3>
                  <Link href="/dashboard/propriedades" className="text-xs text-[#16a34a] hover:underline">Gerenciar</Link>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-[#16a34a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">{property.name}</div>
                    {property.location && <div className="text-xs text-slate-400 mt-0.5">{property.location}</div>}
                    <div className="flex gap-3 mt-2">
                      <span className="text-xs text-slate-500"><b className="text-slate-700">{fieldCount}</b> talhões</span>
                      <span className="text-xs text-slate-500"><b className="text-slate-700">{Number(property.sizeHectares)} ha</b></span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Resumo de status */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <h3 className="font-semibold text-slate-900 text-sm mb-4">Status das atividades</h3>
                <div className="space-y-2.5">
                  {[
                    { label: 'Em andamento', count: inProgress, total: allActivities.length, color: 'bg-blue-500' },
                    { label: 'Pendentes', count: pending, total: allActivities.length, color: 'bg-yellow-400' },
                    { label: 'Concluídas', count: done, total: allActivities.length, color: 'bg-green-500' },
                    { label: 'Atrasadas', count: late, total: allActivities.length, color: 'bg-red-500' },
                  ].map(s => (
                    <div key={s.label}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-slate-600">{s.label}</span>
                        <span className="font-semibold text-slate-900">{s.count}</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${s.color} rounded-full transition-all`}
                          style={{ width: s.total > 0 ? `${(s.count / s.total) * 100}%` : '0%' }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Equipe */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-slate-900 text-sm">Equipe</h3>
                  <Link href="/dashboard/equipe" className="text-xs text-[#16a34a] hover:underline">Ver todos</Link>
                </div>
                {teamCount === 0 ? (
                  <Link href="/dashboard/equipe/novo" className="flex items-center gap-2 text-sm text-slate-400 hover:text-[#16a34a] transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                    Adicionar membro
                  </Link>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      {property.teamMembers.slice(0, 4).map((m: any) => (
                        <div key={m.id} className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-xs font-bold text-slate-600" title={m.name}>
                          {m.name[0].toUpperCase()}
                        </div>
                      ))}
                    </div>
                    <span className="text-sm text-slate-500">{teamCount} membro{teamCount > 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Ações rápidas */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { href: '/dashboard/operacoes/nova', label: 'Nova atividade', icon: '📋', color: 'border-blue-200 hover:border-blue-400 hover:bg-blue-50' },
              { href: '/dashboard/financeiro/novo', label: 'Lançar custo', icon: '💰', color: 'border-purple-200 hover:border-purple-400 hover:bg-purple-50' },
              { href: '/dashboard/equipe/novo', label: 'Adicionar membro', icon: '👷', color: 'border-orange-200 hover:border-orange-400 hover:bg-orange-50' },
              { href: '/dashboard/propriedades/nova', label: 'Nova propriedade', icon: '🌾', color: 'border-green-200 hover:border-green-400 hover:bg-green-50' },
            ].map(action => (
              <Link key={action.href} href={action.href} className={`bg-white border-2 rounded-2xl p-4 flex items-center gap-3 transition-all ${action.color}`}>
                <span className="text-2xl">{action.icon}</span>
                <span className="text-sm font-medium text-slate-700">{action.label}</span>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

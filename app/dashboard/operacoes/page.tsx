import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import OperacoesExport from '@/components/reports/OperacoesExport'
import { ACTIVITY_STATUS as STATUS } from '@/lib/constants'

export default async function OperacoesPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { status: filterStatus } = await searchParams

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: { properties: { include: { activities: { orderBy: { startDate: 'desc' }, include: { field: true, assignedTo: true } } } } },
  })

  const property = dbUser?.properties[0]
  let activities = property?.activities || []
  if (filterStatus) activities = activities.filter((a: any) => a.status === filterStatus)

  const counts = {
    ALL: property?.activities.length || 0,
    IN_PROGRESS: property?.activities.filter((a: any) => a.status === 'IN_PROGRESS').length || 0,
    PENDING: property?.activities.filter((a: any) => a.status === 'PENDING').length || 0,
    LATE: property?.activities.filter((a: any) => a.status === 'LATE').length || 0,
    DONE: property?.activities.filter((a: any) => a.status === 'DONE').length || 0,
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Operacional</h1>
          <p className="text-sm text-slate-500 mt-0.5">Gerencie todas as atividades da sua fazenda</p>
        </div>
        <div className="flex items-center gap-3">
          <OperacoesExport
            propertyName={property?.name || 'Fazenda'}
            activities={(property?.activities || []).map((a: any) => ({
              type: a.type, status: a.status, startDate: a.startDate.toISOString(),
              endDate: a.endDate?.toISOString() || null, description: a.description, executor: a.executor,
            }))}
          />
          <Link href="/dashboard/operacoes/nova" className="flex items-center gap-1.5 bg-[#16a34a] text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-[#15803d] transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            Nova atividade
          </Link>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: '', label: 'Todas', count: counts.ALL },
          { key: 'IN_PROGRESS', label: 'Em andamento', count: counts.IN_PROGRESS },
          { key: 'PENDING', label: 'Pendentes', count: counts.PENDING },
          { key: 'LATE', label: 'Atrasadas', count: counts.LATE },
          { key: 'DONE', label: 'Concluídas', count: counts.DONE },
        ].map(f => {
          const active = (filterStatus || '') === f.key
          return (
            <Link
              key={f.key}
              href={f.key ? `/dashboard/operacoes?status=${f.key}` : '/dashboard/operacoes'}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                active
                  ? 'bg-[#16a34a] text-white border-[#16a34a]'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:text-slate-900'
              }`}
            >
              {f.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                {f.count}
              </span>
            </Link>
          )
        })}
      </div>

      {/* Lista */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {activities.length === 0 ? (
          <div className="py-20 text-center">
            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            </div>
            <p className="text-slate-400 text-sm">Nenhuma atividade encontrada.</p>
            <Link href="/dashboard/operacoes/nova" className="mt-3 inline-block text-sm text-[#16a34a] font-medium hover:underline">Criar atividade →</Link>
          </div>
        ) : (
          <>
            {/* Cabeçalho da tabela */}
            <div className="px-6 py-3 border-b border-slate-100 grid grid-cols-12 text-xs font-semibold text-slate-400 uppercase tracking-wide">
              <div className="col-span-4">Atividade</div>
              <div className="col-span-2 hidden md:block">Talhão</div>
              <div className="col-span-2 hidden md:block">Responsável</div>
              <div className="col-span-2">Data</div>
              <div className="col-span-2">Status</div>
            </div>
            <div className="divide-y divide-slate-50">
              {activities.map((a: any) => {
                const st = STATUS[a.status] || STATUS.CANCELLED
                return (
                  <Link key={a.id} href={`/dashboard/operacoes/${a.id}`} className="px-6 py-4 grid grid-cols-12 items-center hover:bg-slate-50 transition-colors group">
                    <div className="col-span-4 flex items-center gap-3 min-w-0">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${st.dot}`} />
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-slate-900 truncate group-hover:text-[#16a34a] transition-colors">{a.type}</div>
                        {a.description && <div className="text-xs text-slate-400 truncate">{a.description}</div>}
                      </div>
                    </div>
                    <div className="col-span-2 hidden md:block text-sm text-slate-500">{a.field?.name || '—'}</div>
                    <div className="col-span-2 hidden md:block text-sm text-slate-500">{a.assignedTo?.name || '—'}</div>
                    <div className="col-span-2 text-sm text-slate-500">{new Date(a.startDate).toLocaleDateString('pt-BR')}</div>
                    <div className="col-span-2">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${st.pill}`}>{st.label}</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

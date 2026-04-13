import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import ActivityActions from './ActivityActions'
import AgroCoreButton from '@/components/AgroCoreButton'
import { ACTIVITY_STATUS as STATUS } from '@/lib/constants'

export default async function AtividadeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const activity = await prisma.activity.findUnique({
    where: { id },
    include: { property: true, field: true, assignedTo: true, costs: true },
  })

  if (!activity) notFound()

  const st = STATUS[activity.status] || STATUS.CANCELLED
  const totalCost = activity.costs.reduce((acc: number, c) => acc + Number(c.amount), 0)

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/operacoes" className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-all">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="m15 19-7-7 7-7" /></svg>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-slate-900 truncate">{activity.type}</h1>
          <p className="text-sm text-slate-500">{activity.property.name}</p>
        </div>
        <span className={`text-sm font-medium px-3 py-1.5 rounded-full border flex-shrink-0 ${st.pill}`}>{st.label}</span>
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        {/* Detalhes */}
        <div className="md:col-span-2 space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="font-semibold text-slate-900 mb-4">Detalhes</h2>
            <dl className="space-y-3">
              {activity.description && (
                <div>
                  <dt className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Descrição</dt>
                  <dd className="text-sm text-slate-700 mt-1">{activity.description}</dd>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Início</dt>
                  <dd className="text-sm text-slate-700 mt-1">{new Date(activity.startDate).toLocaleDateString('pt-BR')}</dd>
                </div>
                {activity.endDate && (
                  <div>
                    <dt className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Término</dt>
                    <dd className="text-sm text-slate-700 mt-1">{new Date(activity.endDate).toLocaleDateString('pt-BR')}</dd>
                  </div>
                )}
              </div>
              {activity.field && (
                <div>
                  <dt className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Talhão</dt>
                  <dd className="text-sm text-slate-700 mt-1">{activity.field.name}</dd>
                </div>
              )}
              {activity.assignedTo && (
                <div>
                  <dt className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Responsável</dt>
                  <dd className="text-sm text-slate-700 mt-1">{activity.assignedTo.name} — {activity.assignedTo.role}</dd>
                </div>
              )}
              <div>
                <dt className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Executor</dt>
                <dd className="text-sm text-slate-700 mt-1">{activity.executor === 'INTERNAL' ? 'Equipe interna' : 'AgroCore'}</dd>
              </div>
            </dl>
          </div>

          {/* Custos desta atividade */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-900">Custos</h2>
              <Link href={`/dashboard/financeiro/novo?activityId=${activity.id}`} className="text-sm text-[#16a34a] font-medium hover:underline">+ Lançar custo</Link>
            </div>
            {activity.costs.length === 0 ? (
              <p className="text-sm text-slate-400">Nenhum custo registrado.</p>
            ) : (
              <div className="space-y-2">
                {activity.costs.map((c: any) => (
                  <div key={c.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                    <div>
                      <div className="text-sm font-medium text-slate-900">{c.description || c.category}</div>
                      <div className="text-xs text-slate-400">{new Date(c.date).toLocaleDateString('pt-BR')}</div>
                    </div>
                    <div className="text-sm font-semibold text-slate-900">R$ {Number(c.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                  </div>
                ))}
                <div className="pt-2 flex justify-between font-semibold text-sm">
                  <span className="text-slate-600">Total</span>
                  <span className="text-slate-900">R$ {totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Ações */}
        <div className="space-y-4">
          <ActivityActions activity={{ id: activity.id, status: activity.status }} />
          {activity.executor === 'AGROLINK' && (
            <AgroCoreButton
              activityId={activity.id}
              agrolinkServiceId={activity.agrolinkServiceId}
            />
          )}
        </div>
      </div>
    </div>
  )
}

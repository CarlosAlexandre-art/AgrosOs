import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { Suspense } from 'react'
import MarkReadButton from './MarkReadButton'
import MarkOneButton from './MarkOneButton'
import TabNav from './TabNav'

const ALERT_ICON: Record<string, string> = {
  LATE:    '⏰',
  COST:    '💰',
  WEATHER: '🌧️',
  SYSTEM:  '⚙️',
  INFO:    'ℹ️',
}

const ALERT_MEANING: Record<string, string> = {
  LATE:    'Atividade atrasada — tarefa não concluída após a data limite',
  COST:    'Custo registrado — novo lançamento financeiro na propriedade',
  WEATHER: 'Alerta climático — condição meteorológica relevante para a safra',
  SYSTEM:  'Sistema — atualização ou notificação da plataforma SmartAgroOS',
  INFO:    'Informação — comunicado geral sobre sua operação',
}

function fmtDate(d: Date | string) {
  return new Date(d).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default async function AlertasPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: {
      properties: {
        include: {
          alerts: { orderBy: { createdAt: 'desc' } },
        },
      },
    },
  })

  const property = dbUser?.properties[0]
  const alerts = property?.alerts ?? []
  const unread = alerts.filter((a: any) => !a.isRead)
  const tab = (await searchParams).tab ?? 'ativos'

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Alertas</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {unread.length > 0 ? `${unread.length} não lido${unread.length > 1 ? 's' : ''}` : 'Tudo em dia'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {unread.length > 0 && tab === 'ativos' && (
            <MarkReadButton propertyId={property?.id ?? ''} />
          )}
          <Suspense>
            <TabNav unreadCount={unread.length} />
          </Suspense>
        </div>
      </div>

      {tab === 'ativos' ? (
        <AbaAtivos alerts={alerts} />
      ) : (
        <AbaHistorico alerts={alerts} />
      )}
    </div>
  )
}

function AbaAtivos({ alerts }: { alerts: any[] }) {
  const unread = alerts.filter(a => !a.isRead)
  const read   = alerts.filter(a =>  a.isRead)

  if (alerts.length === 0) return <Empty />

  return (
    <div className="space-y-6">
      {unread.length > 0 && (
        <div>
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Não lidos</div>
          <div className="space-y-2">
            {unread.map((a: any) => (
              <div key={a.id} className="bg-white rounded-2xl border border-orange-200 p-5 flex items-start gap-4 shadow-sm">
                <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                  {ALERT_ICON[a.type] ?? '⚠️'}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">{a.message}</p>
                  <p className="text-xs text-slate-400 mt-1">{fmtDate(a.createdAt)}</p>
                  <div className="mt-2">
                    <MarkOneButton alertId={a.id} />
                  </div>
                </div>
                <span className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0 mt-1" />
              </div>
            ))}
          </div>
        </div>
      )}

      {read.length > 0 && (
        <div>
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Lidos</div>
          <div className="space-y-2">
            {read.map((a: any) => (
              <div key={a.id} className="bg-white rounded-2xl border border-slate-200 p-5 flex items-start gap-4 opacity-60">
                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                  {ALERT_ICON[a.type] ?? '⚠️'}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-slate-700">{a.message}</p>
                  <p className="text-xs text-slate-400 mt-1">{fmtDate(a.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function AbaHistorico({ alerts }: { alerts: any[] }) {
  if (alerts.length === 0) return <Empty />

  // Group by month
  const grouped: Record<string, any[]> = {}
  for (const a of alerts) {
    const key = new Date(a.createdAt).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(a)
  }

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([month, items]) => (
        <div key={month}>
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3 capitalize">{month}</div>
          <div className="space-y-2">
            {items.map((a: any) => (
              <div key={a.id} className="bg-white rounded-2xl border border-slate-100 p-4 flex items-start gap-4 shadow-sm">
                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                  {ALERT_ICON[a.type] ?? '⚠️'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-slate-900">{a.message}</p>
                    {!a.isRead && (
                      <span className="flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-600">Novo</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{fmtDate(a.createdAt)}</p>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed border-t border-slate-50 pt-1.5">
                    <span className="font-semibold">O que significa: </span>
                    {ALERT_MEANING[a.type] ?? 'Alerta da plataforma SmartAgroOS'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function Empty() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
      <div className="text-5xl mb-4">✅</div>
      <h2 className="text-lg font-semibold text-slate-900 mb-2">Nenhum alerta</h2>
      <p className="text-sm text-slate-400">Tudo está funcionando normalmente na sua operação.</p>
    </div>
  )
}

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import MarkReadButton from './MarkReadButton'

const ALERT_ICON: Record<string, string> = {
  LATE: '⏰',
  COST: '💰',
  WEATHER: '🌧️',
  SYSTEM: '⚙️',
  INFO: 'ℹ️',
}

export default async function AlertasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: { properties: { include: { alerts: { orderBy: { createdAt: 'desc' } } } } },
  })

  const property = dbUser?.properties[0]
  const alerts = property?.alerts || []
  const unread = alerts.filter((a: any) => !a.isRead)
  const read = alerts.filter((a: any) => a.isRead)

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Alertas</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {unread.length > 0 ? `${unread.length} não lido${unread.length > 1 ? 's' : ''}` : 'Tudo em dia'}
          </p>
        </div>
        {unread.length > 0 && (
          <MarkReadButton propertyId={property?.id || ''} />
        )}
      </div>

      {alerts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">Nenhum alerta</h2>
          <p className="text-sm text-slate-400">Tudo está funcionando normalmente na sua operação.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {unread.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Não lidos</div>
              <div className="space-y-2">
                {unread.map((a: any) => (
                  <div key={a.id} className="bg-white rounded-2xl border border-orange-200 p-5 flex items-start gap-4 shadow-sm">
                    <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                      {ALERT_ICON[a.type] || '⚠️'}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900">{a.message}</p>
                      <p className="text-xs text-slate-400 mt-1">{new Date(a.createdAt).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</p>
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
                      {ALERT_ICON[a.type] || '⚠️'}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-slate-700">{a.message}</p>
                      <p className="text-xs text-slate-400 mt-1">{new Date(a.createdAt).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

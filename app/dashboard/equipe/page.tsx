import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { getUserPlan } from '@/lib/planos'
import OtimizacaoEquipe from '@/components/ai/OtimizacaoEquipe'

function EquipeTabs({ active }: { active: 'membros' | 'agentes' }) {
  return (
    <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl w-fit">
      <Link
        href="/dashboard/equipe"
        className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${active === 'membros' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
      >
        Membros
      </Link>
      <Link
        href="/dashboard/equipe-ia"
        className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-1.5 ${active === 'agentes' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1 1 .03 2.798-1.442 2.798H4.24c-1.47 0-2.441-1.798-1.442-2.798L4.2 15.3" /></svg>
        Agentes IA
      </Link>
    </div>
  )
}

export default async function EquipePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { plan, limites } = await getUserPlan(user.id)
  const limite = limites.membrosEquipe
  const isEnterprise = plan === 'enterprise' || plan === 'admin'
  const isPago = ['pro', 'enterprise', 'admin'].includes(plan)

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: {
      properties: {
        include: {
          teamMembers: {
            include: {
              activities: {
                select: { id: true, status: true },
              },
            },
          },
        },
      },
    },
  })

  const property = dbUser?.properties[0]
  const team = property?.teamMembers || []
  const atLimite = team.length >= limite

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-6xl mx-auto">
      <EquipeTabs active="membros" />
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Equipe</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {team.length} de {isEnterprise ? 'ilimitados' : limite} membros
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {atLimite ? (
            <Link
              href="/dashboard/planos"
              className="flex items-center gap-1.5 border border-amber-300 text-amber-600 text-sm font-semibold px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl hover:bg-amber-50 transition-colors"
            >
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              <span className="hidden sm:inline">Limite atingido —</span> Upgrade
            </Link>
          ) : (
            <Link href="/dashboard/equipe/novo" className="flex items-center gap-1.5 bg-[#16a34a] text-white text-sm font-semibold px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl hover:bg-[#15803d] transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              <span className="hidden sm:inline">Adicionar membro</span>
            </Link>
          )}
        </div>
      </div>

      {/* Barra de uso */}
      {!isEnterprise && (
        <div className={`rounded-xl p-4 border flex items-center gap-4 ${atLimite ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200'}`}>
          <div className="flex-1">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className={`font-semibold ${atLimite ? 'text-amber-700' : 'text-slate-600'}`}>
                {team.length} de {limite} membros usados
              </span>
              <span className={`font-bold ${atLimite ? 'text-amber-600' : 'text-slate-500'}`}>
                {Math.round((team.length / limite) * 100)}%
              </span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${atLimite ? 'bg-amber-400' : 'bg-[#16a34a]'}`}
                style={{ width: `${Math.min((team.length / limite) * 100, 100)}%` }}
              />
            </div>
          </div>
          {atLimite && (
            <Link href="/dashboard/planos" className="text-xs font-semibold text-amber-600 hover:underline flex-shrink-0">
              {isPago ? 'Ver Enterprise →' : 'Ver planos →'}
            </Link>
          )}
        </div>
      )}

      {team.length > 0 && <OtimizacaoEquipe />}

      {team.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-16 text-center">
          <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Nenhum membro cadastrado</h2>
          <p className="text-slate-500 text-sm mb-6 max-w-sm mx-auto">Adicione os membros da sua equipe para atribuir atividades e acompanhar produtividade.</p>
          <Link href="/dashboard/equipe/novo" className="inline-flex items-center gap-2 bg-[#16a34a] text-white font-semibold px-6 py-3 rounded-xl hover:bg-[#15803d] transition-colors">
            Adicionar membro
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {team.map((m: any) => {
            const total = m.activities.length
            const done = m.activities.filter((a: any) => a.status === 'DONE').length
            const inProgress = m.activities.filter((a: any) => a.status === 'IN_PROGRESS').length
            const late = m.activities.filter((a: any) => a.status === 'LATE').length
            const pending = m.activities.filter((a: any) => a.status === 'PENDING').length
            return (
              <div key={m.id} className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-sm transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#16a34a] to-[#059669] text-white font-bold text-lg flex items-center justify-center flex-shrink-0">
                    {m.name[0].toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-slate-900 truncate">{m.name}</div>
                    <div className="text-xs text-slate-400">{m.role}</div>
                  </div>
                  {total > 0 && (
                    <div className="flex-shrink-0 text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                      {total} ativ.
                    </div>
                  )}
                </div>

                {m.phone && (
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                    {m.phone}
                  </div>
                )}

                <div className="grid grid-cols-4 gap-2 pt-3 border-t border-slate-100">
                  <div className="text-center">
                    <div className="text-lg font-bold text-slate-400">{pending}</div>
                    <div className="text-[10px] text-slate-400">Pendentes</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600">{inProgress}</div>
                    <div className="text-[10px] text-slate-400">Andamento</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">{done}</div>
                    <div className="text-[10px] text-slate-400">Concluídas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-red-500">{late}</div>
                    <div className="text-[10px] text-slate-400">Atrasadas</div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export default async function EquipePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: {
      properties: {
        include: {
          teamMembers: {
            include: { activities: { orderBy: { createdAt: 'desc' }, take: 3 } },
          },
        },
      },
    },
  })

  const property = dbUser?.properties[0]
  const team = property?.teamMembers || []

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Equipe</h1>
          <p className="text-sm text-slate-500 mt-0.5">{team.length} membro{team.length !== 1 ? 's' : ''} cadastrado{team.length !== 1 ? 's' : ''}</p>
        </div>
        <Link href="/dashboard/equipe/novo" className="flex items-center gap-1.5 bg-[#16a34a] text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-[#15803d] transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          Adicionar membro
        </Link>
      </div>

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
            const done = m.activities.filter((a: any) => a.status === 'DONE').length
            const inProgress = m.activities.filter((a: any) => a.status === 'IN_PROGRESS').length
            const late = m.activities.filter((a: any) => a.status === 'LATE').length
            return (
              <div key={m.id} className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-sm transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#16a34a] to-[#059669] text-white font-bold text-lg flex items-center justify-center flex-shrink-0">
                    {m.name[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-900 truncate">{m.name}</div>
                    <div className="text-xs text-slate-400">{m.role}</div>
                  </div>
                </div>

                {m.phone && (
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                    {m.phone}
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100">
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">{done}</div>
                    <div className="text-[10px] text-slate-400">Concluídas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600">{inProgress}</div>
                    <div className="text-[10px] text-slate-400">Em andamento</div>
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

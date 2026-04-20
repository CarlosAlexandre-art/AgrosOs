import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

// Fotos padrão de fazendas (Unsplash — gratuitas)
const COVER_DEFAULTS = [
  'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80',
  'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=800&q=80',
  'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800&q=80',
  'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800&q=80',
  'https://images.unsplash.com/photo-1560493676-04071c5f467b?w=800&q=80',
]

const PROP_LIMIT: Record<string, number> = {
  starter:    1,
  pro:        3,
  enterprise: 999,
  admin:      999,
}

export default async function PropriedadesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  let dbUser
  try {
    dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      include: {
        properties: {
          include: {
            fields: { include: { crop: true } },
            teamMembers: true,
            activities: true,
            costs: true,
          },
        },
      },
    })
  } catch (e) {
    return <pre style={{color:'red',padding:20,whiteSpace:'pre-wrap'}}>{String(e)}</pre>
  }

  const properties = dbUser?.properties || []
  const plan = (dbUser as any)?.plan ?? 'starter'
  const limite = PROP_LIMIT[plan] ?? 1
  const atingiuLimite = properties.length >= limite

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Propriedades</h1>
          <p className="text-sm text-slate-500 mt-0.5">Gerencie fazendas, talhões e culturas</p>
        </div>
        {atingiuLimite ? (
          <Link href="/dashboard/planos" className="flex items-center gap-1.5 bg-amber-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-amber-600 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            Limite atingido — Ver planos
          </Link>
        ) : (
          <Link href="/dashboard/propriedades/nova" className="flex items-center gap-1.5 bg-[#16a34a] text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-[#15803d] transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            Nova propriedade
          </Link>
        )}
      </div>

      {atingiuLimite && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 flex items-center justify-between gap-4">
          <div>
            <div className="text-sm font-semibold text-amber-800">
              Limite do plano {plan.charAt(0).toUpperCase() + plan.slice(1)} atingido
            </div>
            <div className="text-xs text-amber-600 mt-0.5">
              Seu plano permite até {limite} propriedade{limite > 1 ? 's' : ''}. Faça upgrade para adicionar mais.
            </div>
          </div>
          <Link href="/dashboard/planos" className="flex-shrink-0 text-xs font-bold bg-amber-500 text-white px-4 py-2 rounded-xl hover:bg-amber-600 transition-colors">
            Ver planos →
          </Link>
        </div>
      )}

      {properties.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-16 text-center">
          <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-[#16a34a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Nenhuma propriedade cadastrada</h2>
          <p className="text-slate-500 text-sm mb-6 max-w-sm mx-auto">Adicione sua primeira fazenda para começar a organizar talhões, atividades e custos.</p>
          <Link href="/dashboard/propriedades/nova" className="inline-flex items-center gap-2 bg-[#16a34a] text-white font-semibold px-6 py-3 rounded-xl hover:bg-[#15803d] transition-colors">
            Adicionar propriedade
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-5">
          {properties.map((p: any, idx: number) => {
            const totalCost = p.costs.reduce((acc: number, c: any) => acc + Number(c.amount), 0)
            const active = p.activities.filter((a: any) => a.status === 'IN_PROGRESS').length
            const cover = p.coverUrl || COVER_DEFAULTS[idx % COVER_DEFAULTS.length]
            return (
              <div key={p.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow group">
                {/* Foto de capa */}
                <div className="relative h-40 overflow-hidden">
                  <img
                    src={cover}
                    alt={p.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                  <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
                    <div>
                      <h2 className="font-bold text-white text-lg leading-tight">{p.name}</h2>
                      {p.location && <p className="text-white/70 text-xs mt-0.5">{p.location}</p>}
                    </div>
                    <span className="text-sm font-bold text-white bg-[#16a34a] px-2.5 py-1 rounded-lg">
                      {Number(p.sizeHectares)} ha
                    </span>
                  </div>
                  {/* Botão editar foto */}
                  <Link
                    href={`/dashboard/propriedades/${p.id}`}
                    className="absolute top-3 right-3 w-8 h-8 bg-black/40 hover:bg-black/60 rounded-lg flex items-center justify-center transition-colors"
                    title="Editar propriedade"
                  >
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </Link>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100">
                  {[
                    { label: 'Talhões', value: p.fields.length },
                    { label: 'Em andamento', value: active },
                    { label: 'Custo total', value: totalCost > 0 ? `R$ ${(totalCost / 1000).toFixed(0)}k` : 'R$ 0' },
                  ].map(s => (
                    <div key={s.label} className="px-4 py-3 text-center">
                      <div className="text-lg font-bold text-slate-900">{s.value}</div>
                      <div className="text-xs text-slate-400">{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Talhões + link */}
                <div className="p-4 flex items-center justify-between">
                  <div className="flex flex-wrap gap-1.5">
                    {p.fields.slice(0, 3).map((f: any) => (
                      <span key={f.id} className="text-xs font-medium bg-slate-50 border border-slate-200 text-slate-600 px-2 py-0.5 rounded-md">
                        {f.name}
                      </span>
                    ))}
                    {p.fields.length > 3 && (
                      <span className="text-xs text-slate-400 px-1 py-0.5">+{p.fields.length - 3}</span>
                    )}
                    {p.fields.length === 0 && (
                      <span className="text-xs text-slate-400">Nenhum talhão</span>
                    )}
                  </div>
                  <Link href={`/dashboard/propriedades/${p.id}`} className="text-xs font-semibold text-[#16a34a] hover:underline flex-shrink-0 ml-2">
                    Gerenciar →
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

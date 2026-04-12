import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import AddFieldForm from './AddFieldForm'

export default async function PropriedadeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const property = await prisma.property.findUnique({
    where: { id },
    include: { fields: { include: { crop: true } }, teamMembers: true, activities: { orderBy: { createdAt: 'desc' }, take: 5 } },
  })
  if (!property) notFound()

  const totalHa = property.fields.reduce((acc: number, f) => acc + Number(f.sizeHectares), 0)

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/propriedades" className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-all">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="m15 19-7-7 7-7" /></svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{property.name}</h1>
          {property.location && <p className="text-sm text-slate-400">{property.location} · {Number(property.sizeHectares)} ha</p>}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Talhões */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-slate-900">Talhões</h2>
              <p className="text-xs text-slate-400 mt-0.5">{property.fields.length} cadastrados · {totalHa.toFixed(1)} ha</p>
            </div>
          </div>

          <div className="p-5 space-y-3">
            {property.fields.length === 0 ? (
              <p className="text-sm text-slate-400 py-4 text-center">Nenhum talhão cadastrado.</p>
            ) : (
              <div className="space-y-2">
                {property.fields.map((f: any) => (
                  <div key={f.id} className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
                    <div>
                      <div className="font-medium text-sm text-slate-900">{f.name}</div>
                      {f.crop && <div className="text-xs text-slate-400">{f.crop.name} {f.crop.season ? `· ${f.crop.season}` : ''}</div>}
                    </div>
                    <span className="text-sm font-semibold text-[#16a34a]">
                      {Number(f.sizeHectares) > 0 ? `${f.sizeHectares} ha` : '—'}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <AddFieldForm propertyId={property.id} />
          </div>
        </div>

        {/* Equipe */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-slate-900">Equipe</h2>
              <p className="text-xs text-slate-400 mt-0.5">{property.teamMembers.length} membros</p>
            </div>
            <Link href="/dashboard/equipe" className="text-xs text-[#16a34a] hover:underline font-medium">Ver tudo →</Link>
          </div>
          <div className="p-5">
            {property.teamMembers.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">Nenhum membro cadastrado.</p>
            ) : (
              <div className="space-y-2">
                {property.teamMembers.map((m: any) => (
                  <div key={m.id} className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
                    <div className="w-9 h-9 rounded-lg bg-[#16a34a]/10 text-[#16a34a] font-bold text-sm flex items-center justify-center flex-shrink-0">
                      {m.name[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-sm text-slate-900">{m.name}</div>
                      <div className="text-xs text-slate-400">{m.role}</div>
                    </div>
                    {m.phone && <div className="ml-auto text-xs text-slate-400">{m.phone}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Atividades recentes */}
        <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Atividades recentes</h2>
            <Link href="/dashboard/operacoes" className="text-xs text-[#16a34a] hover:underline font-medium">Ver todas →</Link>
          </div>
          {property.activities.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-sm">Nenhuma atividade registrada.</div>
          ) : (
            <div className="divide-y divide-slate-50">
              {property.activities.map((a: any) => (
                <Link key={a.id} href={`/dashboard/operacoes/${a.id}`} className="flex items-center justify-between px-6 py-3.5 hover:bg-slate-50 transition-colors">
                  <span className="text-sm font-medium text-slate-900">{a.type}</span>
                  <span className="text-xs text-slate-400">{new Date(a.startDate).toLocaleDateString('pt-BR')}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

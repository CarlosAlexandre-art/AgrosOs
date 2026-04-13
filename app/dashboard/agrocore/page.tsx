import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

const SERVICOS = [
  { icon: '✈️', nome: 'Pulverização aérea', desc: 'Drones e aeronaves agrícolas' },
  { icon: '🚜', nome: 'Mecanização', desc: 'Plantio, colheita e solo' },
  { icon: '🚛', nome: 'Transporte', desc: 'Logística de grãos e insumos' },
  { icon: '🔬', nome: 'Análise de solo', desc: 'Laudos e recomendações' },
  { icon: '💧', nome: 'Irrigação', desc: 'Instalação e manutenção' },
  { icon: '🌱', nome: 'Consultoria', desc: 'Acompanhamento agronômico' },
]

export default async function AgroCoreInternalPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: {
      properties: {
        include: {
          activities: { where: { executor: 'AGROLINK' }, orderBy: { createdAt: 'desc' }, take: 5 },
        },
      },
    },
  })

  const property = dbUser?.properties[0]
  const agrocoreActivities = property?.activities || []

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">AgroCore</h1>
          <p className="text-sm text-slate-500 mt-0.5">Contrate serviços externos integrados à sua operação</p>
        </div>
        <a
          href="https://agrolink-opal.vercel.app"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 bg-[#16a34a] text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-[#15803d] transition-colors"
        >
          Acessar AgroCore
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
        </a>
      </div>

      {/* Banner integração */}
      <div className="bg-[#0f172a] rounded-2xl p-7 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{background: 'radial-gradient(ellipse 60% 80% at 100% 50%, rgba(22,163,74,0.15), transparent)'}} />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-xs font-bold text-green-400 uppercase tracking-wider">Integrado ao AgroOS</span>
            </div>
            <h2 className="text-xl font-bold text-white mb-1">Contrate sem sair do sistema</h2>
            <p className="text-slate-400 text-sm max-w-md">Solicite um serviço AgroCore e crie automaticamente a atividade na sua fazenda — com custo integrado ao financeiro.</p>
          </div>
          <Link href="/dashboard/operacoes/nova" className="flex-shrink-0 flex items-center gap-2 bg-[#16a34a] text-white font-semibold px-5 py-3 rounded-xl hover:bg-[#15803d] transition-colors text-sm">
            Criar atividade via AgroCore
          </Link>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Serviços */}
        <div className="lg:col-span-2">
          <h2 className="font-semibold text-slate-900 mb-4">Serviços disponíveis</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {SERVICOS.map(s => (
              <a
                key={s.nome}
                href="https://agrolink-opal.vercel.app"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white rounded-2xl border border-slate-200 p-4 hover:border-[#16a34a] hover:shadow-sm transition-all group cursor-pointer"
              >
                <div className="text-2xl mb-2">{s.icon}</div>
                <div className="font-semibold text-sm text-slate-900 group-hover:text-[#16a34a] transition-colors">{s.nome}</div>
                <div className="text-xs text-slate-400 mt-0.5">{s.desc}</div>
              </a>
            ))}
          </div>
        </div>

        {/* Atividades via AgroCore */}
        <div>
          <h2 className="font-semibold text-slate-900 mb-4">Serviços solicitados</h2>
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            {agrocoreActivities.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-3xl mb-2">🔗</div>
                <p className="text-sm text-slate-400">Nenhum serviço solicitado ainda.</p>
                <Link href="/dashboard/operacoes/nova" className="mt-3 inline-block text-xs text-[#16a34a] font-medium hover:underline">Solicitar serviço →</Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {agrocoreActivities.map((a: any) => (
                  <Link key={a.id} href={`/dashboard/operacoes/${a.id}`} className="flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 transition-colors">
                    <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center text-sm">🔗</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-900 truncate">{a.type}</div>
                      <div className="text-xs text-slate-400">{new Date(a.startDate).toLocaleDateString('pt-BR')}</div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Como funciona */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="font-semibold text-slate-900 mb-5">Como usar o AgroCore pelo AgroOS</h2>
        <div className="grid sm:grid-cols-4 gap-4">
          {[
            { num: '1', title: 'Crie uma atividade', desc: 'Acesse Operacional → Nova atividade' },
            { num: '2', title: 'Selecione Via AgroCore', desc: 'No campo "Executor"' },
            { num: '3', title: 'Acesse o AgroCore', desc: 'Finalize a contratação na plataforma' },
            { num: '4', title: 'Custo integrado', desc: 'Lance o valor no Financeiro' },
          ].map(s => (
            <div key={s.num} className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-[#16a34a] text-white text-xs font-black flex items-center justify-center flex-shrink-0">{s.num}</div>
              <div>
                <div className="text-sm font-semibold text-slate-900">{s.title}</div>
                <div className="text-xs text-slate-400 mt-0.5">{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

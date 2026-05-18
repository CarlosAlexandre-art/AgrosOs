import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getUserPlan } from '@/lib/planos'

export default async function EquipeIALayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { plan } = await getUserPlan(user.id)
  const isEnterprise = plan === 'enterprise' || plan === 'admin'

  if (!isEnterprise) {
    return (
      <div className="p-4 sm:p-6 max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center gap-6">
        <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center">
          <svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Equipe IA — Plano Empresas</h1>
          <p className="text-slate-500 text-sm max-w-sm">
            Agentes autônomos com inteligência artificial estão disponíveis exclusivamente no plano <strong>Empresas</strong>.
            Faça upgrade para automatizar análises, monitoramento e decisões na sua fazenda.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/dashboard/planos"
            className="bg-[#16a34a] text-white font-semibold px-6 py-3 rounded-xl hover:bg-[#15803d] transition-colors"
          >
            Ver plano Empresas
          </Link>
          <Link
            href="/dashboard/equipe"
            className="border border-slate-200 text-slate-600 font-semibold px-6 py-3 rounded-xl hover:bg-slate-50 transition-colors"
          >
            Voltar para Equipe
          </Link>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

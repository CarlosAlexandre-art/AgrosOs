import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export default async function SuportePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } })
  const plan = (dbUser as any)?.plan ?? 'starter'
  const isPago = ['pro', 'enterprise', 'admin'].includes(plan)

  if (!isPago) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Suporte exclusivo para planos pagos</h1>
          <p className="text-slate-500 text-sm mb-6 max-w-sm mx-auto">
            Assine o plano Pro ou Enterprise para ter acesso ao suporte direto via WhatsApp e e-mail.
          </p>
          <Link
            href="/dashboard/planos"
            className="inline-flex items-center gap-2 bg-[#16a34a] text-white font-semibold px-6 py-3 rounded-xl hover:bg-[#15803d] transition-colors"
          >
            Ver planos →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Suporte</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Estamos aqui para ajudar — resposta em até{' '}
          {plan === 'enterprise' || plan === 'admin' ? '2 horas' : '24 horas'}
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {/* WhatsApp */}
        <a
          href="https://wa.me/5585986027333"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-white rounded-2xl border border-slate-200 p-6 hover:border-green-300 hover:shadow-md transition-all group"
        >
          <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-green-100 transition-colors">
            <svg className="w-6 h-6 text-green-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
            </svg>
          </div>
          <div className="font-bold text-slate-900 mb-1">WhatsApp</div>
          <div className="text-sm text-slate-500 mb-3">Atendimento rápido e direto</div>
          <div className="text-sm font-semibold text-green-700">(85) 98602-7333</div>
          {(plan === 'enterprise' || plan === 'admin') && (
            <div className="mt-2 text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded-lg inline-block">
              24/7 — Prioridade Enterprise
            </div>
          )}
        </a>

        {/* E-mail */}
        <a
          href="mailto:alexandre@parceirosdeproposito.com"
          className="bg-white rounded-2xl border border-slate-200 p-6 hover:border-blue-300 hover:shadow-md transition-all group"
        >
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
            <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="font-bold text-slate-900 mb-1">E-mail</div>
          <div className="text-sm text-slate-500 mb-3">Para dúvidas e solicitações detalhadas</div>
          <div className="text-sm font-semibold text-blue-700 break-all">alexandre@parceirosdeproposito.com</div>
        </a>
      </div>

      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5">
        <div className="text-sm font-semibold text-slate-700 mb-1">Horário de atendimento</div>
        <div className="text-sm text-slate-500">
          {plan === 'enterprise' || plan === 'admin'
            ? 'WhatsApp 24/7 · E-mail respondido em até 2 horas'
            : 'Seg a Sex, 8h–18h · E-mail respondido em até 24 horas'}
        </div>
      </div>
    </div>
  )
}

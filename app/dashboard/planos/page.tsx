'use client'

import { useState, useEffect } from 'react'
// eslint-disable-next-line @typescript-eslint/no-unused-vars

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 'Grátis',
    priceNote: 'para sempre',
    color: 'border-slate-200',
    badge: null,
    desc: 'Para quem está começando a organizar a fazenda.',
    features: [
      { text: '1 propriedade', ok: true },
      { text: 'Até 3 talhões', ok: true },
      { text: 'Gestão de atividades (20/mês)', ok: true },
      { text: 'Controle financeiro básico', ok: true },
      { text: 'Notificações push', ok: false },
      { text: 'Alertas automáticos', ok: false },
      { text: 'Metas e projeções', ok: false },
      { text: 'Exportação PDF/Excel', ok: false },
      { text: 'Integração AgroCore', ok: false },
      { text: 'Suporte', ok: false },
    ],
    cta: 'Plano atual',
    ctaStyle: 'bg-slate-100 text-slate-500 cursor-default',
    priceId: null,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 'R$ 97',
    priceNote: '/mês',
    color: 'border-[#16a34a] ring-2 ring-[#16a34a]',
    badge: '🌿 Mais popular',
    desc: 'Para produtores que querem controle total da operação.',
    features: [
      { text: 'Até 3 propriedades', ok: true },
      { text: 'Talhões ilimitados', ok: true },
      { text: 'Atividades ilimitadas', ok: true },
      { text: 'Financeiro completo + receitas', ok: true },
      { text: 'Notificações push', ok: true },
      { text: 'Alertas automáticos', ok: true },
      { text: 'Metas com projeções', ok: true },
      { text: 'Exportação PDF/Excel premium', ok: true },
      { text: 'Integração AgroCore', ok: true },
      { text: 'Suporte por e-mail', ok: true },
    ],
    cta: 'Assinar Pro',
    ctaStyle: 'bg-[#16a34a] text-white hover:bg-[#15803d]',
    priceId: 'price_1TLVBkHOdd4LjuVT865UeWY0',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'R$ 297',
    priceNote: '/mês',
    color: 'border-slate-800',
    badge: '👑 Completo',
    desc: 'Para grandes operações e gestão profissional de múltiplas fazendas.',
    features: [
      { text: 'Propriedades ilimitadas', ok: true },
      { text: 'Talhões e tudo ilimitado', ok: true },
      { text: 'Multiusuário — acesso para equipe', ok: true },
      { text: 'Financeiro + cálculo por hectare avançado', ok: true },
      { text: 'Notificações + alertas inteligentes', ok: true },
      { text: 'Metas com IA e previsões estatísticas', ok: true },
      { text: 'Relatórios personalizados + exportação', ok: true },
      { text: 'Integração AgroCore prioritária', ok: true },
      { text: 'Dashboard executivo com KPIs', ok: true },
      { text: 'Suporte prioritário 24/7 via WhatsApp', ok: true },
    ],
    cta: 'Assinar Enterprise',
    ctaStyle: 'bg-slate-900 text-white hover:bg-slate-800',
    priceId: 'price_1TLVCSHOdd4LjuVTHZEme1gr',
  },
]

export default function PlanosPage() {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const [currentPlan, setCurrentPlan] = useState<string>('starter')

  useEffect(() => {
    fetch('/api/user/plan').then(r => r.json()).then(d => setCurrentPlan(d.plan || 'starter'))
  }, [])

  async function handleCheckout(plan: typeof PLANS[0]) {
    if (currentPlan === plan.id || !plan.priceId) return
    setLoadingPlan(plan.id)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId: plan.priceId }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch {
      setLoadingPlan(null)
    }
  }

  const isAdmin = currentPlan === 'admin'

  return (
    <div className="p-6 space-y-8 max-w-5xl mx-auto">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
          🌱 Planos SmartAgroOS
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Escolha o plano ideal</h1>
        <p className="text-slate-500 max-w-md mx-auto">
          Comece grátis e escale conforme sua operação cresce. Sem fidelidade — cancele quando quiser.
        </p>
        {isAdmin && (
          <div className="mt-3 inline-flex items-center gap-2 bg-purple-50 border border-purple-200 text-purple-700 text-xs font-semibold px-3 py-1.5 rounded-full">
            👑 Conta Admin — acesso completo ativo
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {PLANS.map(plan => {
          const isCurrent = currentPlan === plan.id || (isAdmin && plan.id === 'enterprise')
          return (
            <div key={plan.id} className={`relative bg-white rounded-2xl border p-6 flex flex-col transition-shadow hover:shadow-md ${plan.color}`}>
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className={`text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap ${plan.id === 'enterprise' ? 'bg-slate-800' : 'bg-[#16a34a]'}`}>
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className="mb-4">
                <h2 className="text-lg font-bold text-slate-900 mb-1">{plan.name}</h2>
                <p className="text-xs text-slate-400 mb-3">{plan.desc}</p>
                <div className="flex items-end gap-1">
                  <span className="text-3xl font-bold text-slate-900">{plan.price}</span>
                  <span className="text-sm text-slate-400 mb-0.5">{plan.priceNote}</span>
                </div>
              </div>

              <ul className="space-y-2.5 flex-1 mb-6">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm">
                    {f.ok ? (
                      <svg className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-slate-300 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                    <span className={f.ok ? 'text-slate-700' : 'text-slate-400'}>{f.text}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleCheckout(plan)}
                disabled={isCurrent || loadingPlan === plan.id}
                className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-60 ${isCurrent ? 'bg-slate-100 text-slate-500 cursor-default' : plan.ctaStyle}`}
              >
                {loadingPlan === plan.id ? 'Redirecionando...' : isCurrent ? '✓ Plano atual' : plan.cta}
              </button>
            </div>
          )
        })}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="font-bold text-slate-900 mb-5">Perguntas frequentes</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {[
            { q: 'Posso cancelar a qualquer momento?', a: 'Sim. Sem fidelidade. Cancele quando quiser — sem multas ou taxas.' },
            { q: 'O plano Starter tem limite de tempo?', a: 'Não. O plano Starter é gratuito para sempre, com as funcionalidades básicas sempre disponíveis.' },
            { q: 'Posso mudar de plano depois?', a: 'Sim, upgrade ou downgrade a qualquer momento. Cobranças são proporcionais ao período.' },
            { q: 'Como funciona o suporte Enterprise?', a: 'Suporte prioritário 24/7 com tempo de resposta em até 2 horas via WhatsApp e e-mail.' },
          ].map((item, i) => (
            <div key={i}>
              <div className="text-sm font-semibold text-slate-900 mb-1">{item.q}</div>
              <div className="text-sm text-slate-500">{item.a}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

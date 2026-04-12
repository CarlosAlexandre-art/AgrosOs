'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 'Grátis',
    priceNote: 'para sempre',
    color: 'border-slate-200',
    badge: null,
    features: [
      { text: '1 propriedade', ok: true },
      { text: 'Até 3 talhões', ok: true },
      { text: 'Gestão de atividades', ok: true },
      { text: 'Controle financeiro básico', ok: true },
      { text: 'Alertas automáticos', ok: false },
      { text: 'Metas e relatórios', ok: false },
      { text: 'Integração AgroCore', ok: false },
      { text: 'Suporte prioritário', ok: false },
    ],
    cta: 'Plano atual',
    ctaStyle: 'bg-slate-100 text-slate-500 cursor-default',
    priceId: null,
    current: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 'R$ 97',
    priceNote: '/mês',
    color: 'border-[#16a34a] ring-2 ring-[#16a34a]',
    badge: 'Mais popular',
    features: [
      { text: 'Propriedades ilimitadas', ok: true },
      { text: 'Talhões ilimitados', ok: true },
      { text: 'Gestão de atividades', ok: true },
      { text: 'Controle financeiro completo', ok: true },
      { text: 'Alertas automáticos', ok: true },
      { text: 'Metas e relatórios', ok: true },
      { text: 'Integração AgroCore', ok: true },
      { text: 'Suporte prioritário', ok: false },
    ],
    cta: 'Assinar Pro',
    ctaStyle: 'bg-[#16a34a] text-white hover:bg-[#15803d]',
    priceId: 'price_1TLVBkHOdd4LjuVT865UeWY0',
    current: false,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'R$ 297',
    priceNote: '/mês',
    color: 'border-slate-200',
    badge: null,
    features: [
      { text: 'Propriedades ilimitadas', ok: true },
      { text: 'Talhões ilimitados', ok: true },
      { text: 'Gestão de atividades', ok: true },
      { text: 'Controle financeiro completo', ok: true },
      { text: 'Alertas automáticos', ok: true },
      { text: 'Metas e relatórios avançados', ok: true },
      { text: 'Integração AgroCore completa', ok: true },
      { text: 'Suporte prioritário 24/7', ok: true },
    ],
    cta: 'Assinar Enterprise',
    ctaStyle: 'bg-slate-900 text-white hover:bg-slate-800',
    priceId: 'price_1TLVCSHOdd4LjuVTHZEme1gr',
    current: false,
  },
]

export default function PlanosPage() {
  const router = useRouter()
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)

  async function handleCheckout(plan: typeof PLANS[0]) {
    if (plan.current || !plan.priceId) return
    setLoadingPlan(plan.id)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId: plan.priceId }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch {
      setLoadingPlan(null)
    }
  }

  return (
    <div className="p-6 space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
          Planos AgroOS
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Escolha o plano ideal</h1>
        <p className="text-slate-500 max-w-md mx-auto">
          Comece grátis e escale conforme sua operação cresce. Cancele quando quiser.
        </p>
      </div>

      {/* Planos */}
      <div className="grid md:grid-cols-3 gap-6">
        {PLANS.map(plan => (
          <div key={plan.id} className={`relative bg-white rounded-2xl border p-6 flex flex-col ${plan.color}`}>
            {plan.badge && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-[#16a34a] text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                  {plan.badge}
                </span>
              </div>
            )}

            <div className="mb-6">
              <h2 className="text-lg font-bold text-slate-900 mb-1">{plan.name}</h2>
              <div className="flex items-end gap-1">
                <span className="text-3xl font-bold text-slate-900">{plan.price}</span>
                <span className="text-sm text-slate-400 mb-0.5">{plan.priceNote}</span>
              </div>
            </div>

            <ul className="space-y-3 flex-1 mb-6">
              {plan.features.map((f, i) => (
                <li key={i} className="flex items-center gap-2.5 text-sm">
                  {f.ok ? (
                    <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-slate-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                  <span className={f.ok ? 'text-slate-700' : 'text-slate-400'}>{f.text}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleCheckout(plan)}
              disabled={plan.current || loadingPlan === plan.id}
              className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-colors ${plan.ctaStyle} disabled:opacity-50`}
            >
              {loadingPlan === plan.id ? 'Redirecionando...' : plan.cta}
            </button>
          </div>
        ))}
      </div>

      {/* FAQ */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="font-bold text-slate-900 mb-5">Perguntas frequentes</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {[
            { q: 'Posso cancelar a qualquer momento?', a: 'Sim. Não há fidelidade. Cancele quando quiser pelo painel de configurações.' },
            { q: 'O plano Starter tem limite de tempo?', a: 'Não. O plano Starter é gratuito para sempre, com as funcionalidades básicas sempre disponíveis.' },
            { q: 'Posso migrar de plano depois?', a: 'Sim, você pode fazer upgrade ou downgrade a qualquer momento. Cobranças são proporcionais.' },
            { q: 'Como funciona o suporte?', a: 'Starter tem suporte por e-mail. Pro tem chat. Enterprise tem suporte prioritário 24/7 com WhatsApp.' },
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

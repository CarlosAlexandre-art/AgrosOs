'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    color: 'border-slate-200',
    badge: null,
    desc: 'Para quem está começando a organizar a fazenda.',
    price: 'Grátis',
    priceNote: 'para sempre',
    priceId: null as string | null,
    features: [
      { text: 'Dashboard + visão geral', ok: true },
      { text: 'Operações, financeiro e propriedades', ok: true },
      { text: 'Clima, alertas e defensivos (AGROFIT)', ok: true },
      { text: 'Mapa interativo', ok: true },
      { text: 'Inventário florestal e bovinos', ok: true },
      { text: 'Blog e aprendizado', ok: true },
      { text: 'Grade UTM, GPX, LiDAR, Satélite', ok: false },
      { text: 'Análise de Solo (Embrapa IA)', ok: false },
      { text: 'AgroToken + metas', ok: false },
      { text: 'Suporte', ok: false },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    color: 'border-[#16a34a] ring-2 ring-[#16a34a]',
    badge: '🌿 Mais popular',
    desc: 'Para produtores que querem controle total da operação.',
    price: 'R$ 97',
    priceNote: '/mês',
    priceId: process.env.NEXT_PUBLIC_AGROOS_PRO_MENSAL_PRICE_ID ?? 'price_1TLVBkHOdd4LjuVT865UeWY0',
    features: [
      { text: 'Tudo do Starter', ok: true },
      { text: 'Grade UTM georreferenciada', ok: true },
      { text: 'GPX Velocidade + Trajetória', ok: true },
      { text: 'Imagens Satélite + Perfil Elevação', ok: true },
      { text: 'LiDAR / Nuvem de Pontos', ok: true },
      { text: 'Índice Vegetal (NDVI)', ok: true },
      { text: 'Análise de Solo (Embrapa IA)', ok: true },
      { text: 'AgroToken + metas e projeções', ok: true },
      { text: 'Gestão de equipe + AgroCore', ok: true },
      { text: 'Suporte por e-mail', ok: true },
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    color: 'border-slate-800',
    badge: '👑 Completo',
    desc: 'Para grandes operações e gestão profissional de múltiplas fazendas.',
    price: 'R$ 297',
    priceNote: '/mês',
    priceId: process.env.NEXT_PUBLIC_AGROOS_ENTERPRISE_MENSAL_PRICE_ID ?? 'price_1TLVCSHOdd4LjuVTHZEme1gr',
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
      { text: 'Equipe IA com agentes autônomos', ok: true },
      { text: 'Suporte prioritário 24/7 via WhatsApp', ok: true },
    ],
  },
]

function PlanosContent() {
  const [currentPlan, setCurrentPlan] = useState<string>('starter')
  const [hasCustomer, setHasCustomer] = useState(false)
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const [loadingPortal, setLoadingPortal] = useState(false)
  const [erro, setErro] = useState('')
  const searchParams = useSearchParams()

  useEffect(() => {
    fetch('/api/user/plan')
      .then(r => r.json())
      .then(d => {
        const plan = d.plan || 'starter'
        setCurrentPlan(plan)
        setHasCustomer(plan !== 'starter' && plan !== 'admin')
      })
  }, [])

  async function handleCheckout(priceId: string, planId: string) {
    setLoadingPlan(planId)
    setErro('')
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else setErro(data.error || 'Erro ao iniciar checkout.')
    } catch {
      setErro('Erro de conexão. Tente novamente.')
    } finally {
      setLoadingPlan(null)
    }
  }

  async function handlePortal() {
    setLoadingPortal(true)
    setErro('')
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else setErro(data.error || 'Erro ao abrir portal.')
    } catch {
      setErro('Erro de conexão. Tente novamente.')
    } finally {
      setLoadingPortal(false)
    }
  }

  const isAdmin = currentPlan === 'admin'
  const sucesso = searchParams.get('plano') === 'ativado'

  return (
    <div className="p-4 sm:p-6 space-y-8 max-w-5xl mx-auto">

      {sucesso && (
        <div className="bg-green-50 border border-green-200 text-green-800 rounded-2xl px-5 py-4 flex items-center gap-3">
          <span className="text-2xl">🎉</span>
          <div>
            <div className="font-bold">Plano ativado!</div>
            <div className="text-sm text-green-700">Seu plano foi atualizado. Aproveite todos os benefícios.</div>
          </div>
        </div>
      )}

      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-full">
          🌱 Planos SmartAgroOS
        </div>
        <h1 className="text-3xl font-bold text-slate-900">Escolha o plano ideal</h1>
        <p className="text-slate-500 max-w-md mx-auto">
          Comece grátis e escale conforme sua operação cresce. Cancele quando quiser.
        </p>
        {isAdmin && (
          <div className="inline-flex items-center gap-2 bg-purple-50 border border-purple-200 text-purple-700 text-xs font-semibold px-3 py-1.5 rounded-full">
            👑 Conta Admin — acesso completo ativo
          </div>
        )}
      </div>

      {erro && (
        <div className="max-w-2xl mx-auto bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm font-medium">
          ⚠️ {erro}
        </div>
      )}

      {/* Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        {PLANS.map(plan => {
          const isCurrent = currentPlan === plan.id || (isAdmin && plan.id === 'enterprise')

          return (
            <div key={plan.id} className={`relative bg-white rounded-2xl border p-6 flex flex-col shadow-sm transition-shadow hover:shadow-md ${plan.color}`}>
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

              {isCurrent ? (
                <div className="w-full py-2.5 rounded-xl text-sm font-semibold text-center bg-slate-100 text-slate-500 cursor-default">
                  ✓ Plano atual
                </div>
              ) : plan.id === 'starter' ? (
                <div className="w-full py-2.5 rounded-xl text-sm font-semibold text-center bg-slate-100 text-slate-400 cursor-default">
                  Sempre gratuito
                </div>
              ) : (
                <button
                  onClick={() => plan.priceId && handleCheckout(plan.priceId, plan.id)}
                  disabled={!!loadingPlan}
                  className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 ${
                    plan.id === 'enterprise'
                      ? 'bg-slate-900 text-white hover:bg-slate-800'
                      : 'bg-[#16a34a] text-white hover:bg-[#15803d]'
                  }`}
                >
                  {loadingPlan === plan.id ? 'Redirecionando...' : `Assinar ${plan.name}`}
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Gerenciar / Cancelar assinatura */}
      {hasCustomer && !isAdmin && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 max-w-3xl mx-auto">
          <div>
            <div className="font-semibold text-slate-900">Gerenciar assinatura</div>
            <div className="text-sm text-slate-500">Altere método de pagamento, veja faturas ou cancele.</div>
          </div>
          <button
            onClick={handlePortal}
            disabled={loadingPortal}
            className="flex-shrink-0 px-4 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-800 transition disabled:opacity-50"
          >
            {loadingPortal ? 'Abrindo...' : 'Abrir portal →'}
          </button>
        </div>
      )}

      {/* FAQ */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-3xl mx-auto">
        <h2 className="font-bold text-slate-900 mb-5">Perguntas frequentes</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {[
            { q: 'Posso cancelar a qualquer momento?', a: 'Sim. Sem fidelidade. Clique em "Abrir portal" acima e cancele sem multas.' },
            { q: 'O plano Starter tem limite de tempo?', a: 'Não. É gratuito para sempre, com as funcionalidades básicas sempre disponíveis.' },
            { q: 'Posso mudar de plano depois?', a: 'Sim, upgrade ou downgrade a qualquer momento pelo portal de assinaturas.' },
            { q: 'Como funciona o suporte Enterprise?', a: 'Suporte prioritário 24/7 com resposta em até 2 horas via WhatsApp e e-mail.' },
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

export default function PlanosPage() {
  return (
    <Suspense>
      <PlanosContent />
    </Suspense>
  )
}

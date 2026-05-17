'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type HubData = {
  tokens: { pending: number; active: number; total: number; volumeBRL: number }
  comissoes: { totalGeral: number; tokensAtivos: number; tokensPendentes: number }
  monitoring: { status: 'OK' | 'WARNING' | 'CRITICAL'; critical24h: number; unresolved: number }
}

function StatusDot({ status }: { status: 'OK' | 'WARNING' | 'CRITICAL' }) {
  const c = status === 'OK' ? 'bg-green-500' : status === 'WARNING' ? 'bg-amber-500' : 'bg-red-500'
  return <span className={`inline-block w-2 h-2 rounded-full ${c} animate-pulse`} />
}

function fmt(v: number) {
  if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `R$ ${(v / 1_000).toFixed(0)}K`
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)
}

export default function AdminHubPage() {
  const [data, setData] = useState<HubData | null>(null)
  const [loading, setLoading] = useState(true)
  const now = new Date().toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/tokens').then(r => r.json()).catch(() => []),
      fetch('/api/admin/comissoes').then(r => r.json()).catch(() => null),
      fetch('/api/admin/monitoring').then(r => r.json()).catch(() => null),
    ]).then(([tokensArr, comissoes, monitor]) => {
      const tokens = Array.isArray(tokensArr) ? tokensArr : []
      setData({
        tokens: {
          pending: tokens.filter((t: any) => t.status === 'PENDING_REVIEW').length,
          active: tokens.filter((t: any) => t.status === 'ACTIVE').length,
          total: tokens.length,
          volumeBRL: tokens.reduce((s: number, t: any) => s + Number(t.totalValue || 0), 0),
        },
        comissoes: comissoes ?? { totalGeral: 0, tokensAtivos: 0, tokensPendentes: 0 },
        monitoring: monitor?.alerts ?? { status: 'OK', critical24h: 0, unresolved: 0 },
      })
      setLoading(false)
    })
  }, [])

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <div className="bg-[#020c05] text-white px-4 pt-safe-top pb-4">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between pt-4 pb-1">
            <div>
              <div className="text-[10px] text-green-400 font-semibold tracking-widest uppercase">OryonAG</div>
              <div className="text-xl font-black tracking-tight">Admin Hub</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-slate-400">Atualizado</div>
              <div className="text-xs text-slate-300 font-mono">{now}</div>
            </div>
          </div>
          {!loading && data && (
            <div className="flex items-center gap-2 mt-3">
              <StatusDot status={data.monitoring.status} />
              <span className="text-xs text-slate-300">
                Sistema {data.monitoring.status === 'OK' ? 'operacional' : data.monitoring.status === 'WARNING' ? 'atenção' : 'crítico'}
              </span>
              {data.tokens.pending > 0 && (
                <span className="ml-auto text-xs bg-amber-500 text-white font-bold px-2.5 py-0.5 rounded-full">
                  {data.tokens.pending} pendente{data.tokens.pending > 1 ? 's' : ''}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-5">

        {/* KPIs rápidos */}
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1,2,3,4].map(i => <div key={i} className="h-20 bg-white rounded-2xl animate-pulse border border-slate-100" />)}
          </div>
        ) : data && (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-2xl border border-slate-100 p-4">
              <div className="text-[10px] text-slate-400 uppercase tracking-wide mb-1">Volume tokens</div>
              <div className="text-xl font-black text-slate-900">{fmt(data.tokens.volumeBRL)}</div>
              <div className="text-xs text-slate-400 mt-0.5">{data.tokens.total} tokens total</div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 p-4">
              <div className="text-[10px] text-slate-400 uppercase tracking-wide mb-1">Comissões</div>
              <div className="text-xl font-black text-green-700">{fmt(data.comissoes.totalGeral)}</div>
              <div className="text-xs text-slate-400 mt-0.5">receita plataforma</div>
            </div>
            <div className={`rounded-2xl border p-4 ${data.tokens.pending > 0 ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-100'}`}>
              <div className="text-[10px] text-slate-400 uppercase tracking-wide mb-1">Aprovações</div>
              <div className={`text-xl font-black ${data.tokens.pending > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
                {data.tokens.pending}
              </div>
              <div className="text-xs text-slate-400 mt-0.5">aguardando revisão</div>
            </div>
            <div className={`rounded-2xl border p-4 ${data.monitoring.critical24h > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-slate-100'}`}>
              <div className="text-[10px] text-slate-400 uppercase tracking-wide mb-1">Alertas 24h</div>
              <div className={`text-xl font-black ${data.monitoring.critical24h > 0 ? 'text-red-600' : 'text-slate-900'}`}>
                {data.monitoring.critical24h + data.monitoring.unresolved}
              </div>
              <div className="text-xs text-slate-400 mt-0.5">{data.monitoring.unresolved} não resolvidos</div>
            </div>
          </div>
        )}

        {/* Ações rápidas — SmartAgroOS */}
        <div>
          <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest mb-2 px-1">SmartAgroOS</div>
          <div className="space-y-2">
            <Link href="/dashboard/admin/tokens"
              className="flex items-center gap-4 bg-white border border-slate-100 rounded-2xl px-4 py-4 active:bg-slate-50 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-lg shrink-0">🪙</div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-slate-900 text-sm">Tokens — Aprovações</div>
                <div className="text-xs text-slate-400 truncate">Revisar, aprovar e enviar acordos ClickSign</div>
              </div>
              {!loading && data && data.tokens.pending > 0 && (
                <span className="bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shrink-0">
                  {data.tokens.pending}
                </span>
              )}
              <svg className="w-4 h-4 text-slate-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m9 18 6-6-6-6" />
              </svg>
            </Link>

            <Link href="/dashboard/admin/comissoes"
              className="flex items-center gap-4 bg-white border border-slate-100 rounded-2xl px-4 py-4 active:bg-slate-50 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-lg shrink-0">💰</div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-slate-900 text-sm">Comissões</div>
                <div className="text-xs text-slate-400 truncate">Originação, transações e liquidações</div>
              </div>
              {!loading && data && (
                <span className="text-xs font-semibold text-green-700 shrink-0">{fmt(data.comissoes.totalGeral)}</span>
              )}
              <svg className="w-4 h-4 text-slate-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m9 18 6-6-6-6" />
              </svg>
            </Link>

            <Link href="/dashboard/admin/monitoring"
              className="flex items-center gap-4 bg-white border border-slate-100 rounded-2xl px-4 py-4 active:bg-slate-50 transition-colors">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${
                !loading && data && data.monitoring.status !== 'OK' ? 'bg-red-50' : 'bg-blue-50'
              }`}>🔍</div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-slate-900 text-sm">Monitoramento</div>
                <div className="text-xs text-slate-400 truncate">Segurança, alertas e eventos 24h</div>
              </div>
              {!loading && data && (
                <span className={`text-xs font-semibold shrink-0 ${
                  data.monitoring.status === 'OK' ? 'text-green-600' : data.monitoring.status === 'WARNING' ? 'text-amber-600' : 'text-red-600'
                }`}>{data.monitoring.status}</span>
              )}
              <svg className="w-4 h-4 text-slate-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m9 18 6-6-6-6" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Links externos — outros produtos */}
        <div>
          <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest mb-2 px-1">Outros produtos</div>
          <div className="space-y-2">
            <a href="https://agro-rate.vercel.app/admin" target="_blank" rel="noopener"
              className="flex items-center gap-4 bg-white border border-slate-100 rounded-2xl px-4 py-4 active:bg-slate-50 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-lg shrink-0">📊</div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-slate-900 text-sm">AgroRate Admin</div>
                <div className="text-xs text-slate-400 truncate">Scores, comissões, webhooks n8n</div>
              </div>
              <svg className="w-4 h-4 text-slate-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
            </a>

            <a href={`${process.env.NEXT_PUBLIC_AGROCORE_URL || 'https://agrocore.live'}/dashboard`} target="_blank" rel="noopener"
              className="flex items-center gap-4 bg-white border border-slate-100 rounded-2xl px-4 py-4 active:bg-slate-50 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center text-lg shrink-0">🤝</div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-slate-900 text-sm">AgroCore Dashboard</div>
                <div className="text-xs text-slate-400 truncate">Serviços, propostas, pagamentos</div>
              </div>
              <svg className="w-4 h-4 text-slate-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
            </a>
          </div>
        </div>

        {/* Intelligence Hub status */}
        <div>
          <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest mb-2 px-1">Intelligence Hub</div>
          <div className="bg-gradient-to-br from-violet-950 to-indigo-900 rounded-2xl p-4 text-white">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-base">⚛️</span>
              <span className="font-bold text-sm">ORYON Intelligence Hub</span>
              <span className="ml-auto text-[10px] bg-white/10 px-2 py-0.5 rounded-full font-mono">v1 · live</span>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                { label: 'Módulos', val: '11' },
                { label: 'Modelo', val: 'NIM' },
                { label: 'Algoritmos', val: 'QUBO+' },
              ].map(s => (
                <div key={s.label} className="bg-white/10 rounded-xl p-2 text-center">
                  <div className="text-base font-black">{s.val}</div>
                  <div className="text-[9px] text-white/60 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
            {/* 11 módulos agrupados por produto */}
            {[
              {
                product: 'SmartAgroOS',
                color: 'text-green-300',
                modules: [
                  { icon: '⚡', name: 'RAPIDS Pipeline', algo: 'StdDev anomaly · 6 domínios' },
                  { icon: '🪙', name: 'Due Diligence AgroToken', algo: 'Score 0-100 · NIM laudo' },
                  { icon: '⚛️', name: 'QUBO Token Pricing', algo: 'Simulated Annealing' },
                  { icon: '🌾', name: 'SafraPlanner QUBO', algo: 'SA por talhão · retorno/risco' },
                  { icon: '💧', name: 'ET₀ Hídrico', algo: 'Hargreaves-Samani FAO-56' },
                ],
              },
              {
                product: 'AgroCore',
                color: 'text-amber-300',
                modules: [
                  { icon: '📈', name: 'Previsão de Demanda', algo: 'OLS Regression · Haversine' },
                  { icon: '💰', name: 'Precificação Dinâmica', algo: 'Análise de mercado · NIM' },
                  { icon: '🤖', name: 'AgroBot Contextual', algo: 'NLP · contexto do usuário' },
                ],
              },
              {
                product: 'AgroRate',
                color: 'text-blue-300',
                modules: [
                  { icon: '🎯', name: 'Score Predição', algo: 'Logistic Regression P(default)' },
                  { icon: '📊', name: 'Portfolio Otimizador', algo: 'Markowitz Greedy · sigmoid' },
                  { icon: '🔍', name: 'Análise de Crédito', algo: 'NIM insights financeiros' },
                ],
              },
            ].map(group => (
              <div key={group.product} className="mb-3">
                <div className={`text-[9px] font-bold uppercase tracking-widest mb-1.5 ${group.color}`}>{group.product}</div>
                <div className="space-y-1">
                  {group.modules.map(m => (
                    <div key={m.name} className="flex items-center gap-2 bg-white/5 rounded-lg px-2 py-1.5">
                      <span className="text-xs">{m.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-semibold text-white/80 truncate">{m.name}</div>
                        <div className="text-[9px] text-white/40 font-mono truncate">{m.algo}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <Link href="/ecosistema" className="mt-3 flex items-center gap-1 text-xs text-violet-300 hover:text-white transition-colors">
              Ver página do ecossistema →
            </Link>
          </div>
        </div>

        {/* Atalho para dashboard */}
        <Link href="/dashboard"
          className="flex items-center justify-center gap-2 bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
          ← Voltar para o Dashboard
        </Link>
      </div>

      {/* Bottom nav mobile */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-2 pb-safe-bottom pt-2 z-50 flex justify-around">
        {[
          { href: '/dashboard/admin', icon: '⚡', label: 'Hub' },
          { href: '/dashboard/admin/tokens', icon: '🪙', label: 'Tokens' },
          { href: '/dashboard/admin/comissoes', icon: '💰', label: 'Comissões' },
          { href: '/dashboard/admin/monitoring', icon: '🔍', label: 'Monitor' },
          { href: '/dashboard', icon: '🏠', label: 'Dashboard' },
        ].map(item => (
          <Link key={item.href} href={item.href}
            className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl text-slate-500 hover:text-slate-900 transition-colors min-w-0">
            <span className="text-xl">{item.icon}</span>
            <span className="text-[9px] font-semibold truncate">{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  )
}

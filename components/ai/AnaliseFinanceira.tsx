'use client'

import { useState } from 'react'

type Analise = { situacao: 'positiva' | 'atencao' | 'critica'; insight: string; recomendacao: string; alerta: string | null }

const COR = {
  positiva: { bg: 'bg-green-50 border-green-200', icon: '📈', badge: 'text-green-700 bg-green-100', title: 'Situação positiva' },
  atencao: { bg: 'bg-amber-50 border-amber-200', icon: '⚠️', badge: 'text-amber-700 bg-amber-100', title: 'Atenção necessária' },
  critica: { bg: 'bg-red-50 border-red-200', icon: '🚨', badge: 'text-red-700 bg-red-100', title: 'Situação crítica' },
}

export default function AnaliseFinanceira() {
  const [analise, setAnalise] = useState<Analise | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function analisar() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/ai/financeiro')
      if (!res.ok) throw new Error('Erro ao analisar')
      setAnalise(await res.json())
    } catch {
      setError('Não foi possível gerar análise. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (!analise) {
    return (
      <div className="bg-gradient-to-br from-[#0f172a] to-[#1e293b] rounded-2xl p-5 flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <svg className="w-4 h-4 text-[#16a34a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
            <span className="text-xs font-bold text-[#16a34a] uppercase tracking-wide">IA Financeira</span>
          </div>
          <p className="text-sm text-slate-300">Diagnóstico inteligente baseado nos seus dados reais</p>
        </div>
        <button
          onClick={analisar}
          disabled={loading}
          className="flex-shrink-0 bg-[#16a34a] hover:bg-[#15803d] text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? (
            <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Analisando...</>
          ) : 'Analisar com IA'}
        </button>
      </div>
    )
  }

  const cor = COR[analise.situacao]
  return (
    <div className={`rounded-2xl border p-5 ${cor.bg}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{cor.icon}</span>
          <div>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cor.badge}`}>{cor.title}</span>
            <p className="text-sm font-semibold text-slate-900 mt-1">{analise.insight}</p>
          </div>
        </div>
        <button onClick={() => setAnalise(null)} className="text-slate-400 hover:text-slate-600 flex-shrink-0 text-xs">
          Refazer
        </button>
      </div>
      <div className="space-y-2">
        <div className="bg-white/60 rounded-xl px-4 py-2.5">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-0.5">Recomendação</div>
          <p className="text-sm text-slate-700">{analise.recomendacao}</p>
        </div>
        {analise.alerta && (
          <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-2.5 flex items-start gap-2">
            <span className="text-sm mt-0.5">🔴</span>
            <p className="text-xs text-red-700">{analise.alerta}</p>
          </div>
        )}
      </div>
      {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
    </div>
  )
}

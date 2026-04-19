'use client'

import { useState } from 'react'

export default function ConselheirMetas() {
  const [conselho, setConselho] = useState('')
  const [loading, setLoading] = useState(false)

  async function buscar() {
    setLoading(true)
    try {
      const res = await fetch('/api/ai/metas')
      const data = await res.json()
      setConselho(data.conselho || data.error || 'Não foi possível gerar conselho.')
    } catch {
      setConselho('Erro ao buscar análise.')
    } finally {
      setLoading(false)
    }
  }

  if (conselho) {
    return (
      <div className="bg-gradient-to-br from-[#0f172a] to-[#1e293b] rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <svg className="w-4 h-4 text-[#16a34a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
          </svg>
          <span className="text-xs font-bold text-[#16a34a] uppercase tracking-wide">Análise IA das suas metas</span>
          <button onClick={() => setConselho('')} className="ml-auto text-slate-500 hover:text-slate-300 text-xs">Fechar</button>
        </div>
        <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">{conselho}</p>
      </div>
    )
  }

  return (
    <button
      onClick={buscar}
      disabled={loading}
      className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#0f172a] to-[#1e293b] text-white text-sm font-semibold px-4 py-3 rounded-2xl border border-white/10 hover:border-[#16a34a]/50 transition-all disabled:opacity-50"
    >
      {loading ? (
        <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Analisando metas...</>
      ) : (
        <><svg className="w-4 h-4 text-[#16a34a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>Analisar minhas metas com IA</>
      )}
    </button>
  )
}

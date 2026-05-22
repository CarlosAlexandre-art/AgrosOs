'use client'

import { useState } from 'react'

export default function OtimizacaoEquipe() {
  const [analise, setAnalise] = useState('')
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)

  async function buscar() {
    setLoading(true)
    setErro('')
    try {
      const res = await fetch('/api/ai/equipe')
      const data = await res.json()
      if (data.error) {
        setErro(data.error)
      } else {
        setAnalise(data.analise || 'Sem análise disponível.')
      }
    } catch {
      setErro('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (erro) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
        <span className="text-lg flex-shrink-0">⚠️</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-red-700">{erro}</p>
        </div>
        <button onClick={() => setErro('')} className="text-red-400 hover:text-red-600 text-xs flex-shrink-0">Fechar</button>
      </div>
    )
  }

  if (analise) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <div className="flex items-center gap-2 mb-3">
          <svg className="w-4 h-4 text-[#16a34a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
          </svg>
          <span className="text-xs font-bold text-[#16a34a] uppercase tracking-wide">Otimização de equipe — IA</span>
          <button onClick={() => setAnalise('')} className="ml-auto text-slate-400 hover:text-slate-600 text-xs">Fechar</button>
        </div>
        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{analise}</p>
      </div>
    )
  }

  return (
    <button
      onClick={buscar}
      disabled={loading}
      className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 text-slate-500 text-sm font-semibold px-4 py-3 rounded-2xl hover:border-[#16a34a] hover:text-[#16a34a] transition-all disabled:opacity-50"
    >
      {loading ? (
        <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Analisando equipe...</>
      ) : (
        <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>Otimizar equipe com IA</>
      )}
    </button>
  )
}

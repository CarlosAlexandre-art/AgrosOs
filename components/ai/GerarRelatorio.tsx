'use client'

import { useState } from 'react'

export default function GerarRelatorio() {
  const [loading, setLoading] = useState(false)
  const [relatorio, setRelatorio] = useState<{ relatorio: string; mes: string } | null>(null)
  const [copied, setCopied] = useState(false)

  async function gerar() {
    setLoading(true)
    try {
      const res = await fetch('/api/ai/relatorio')
      if (!res.ok) throw new Error('Erro')
      setRelatorio(await res.json())
    } catch {
      alert('Não foi possível gerar o relatório.')
    } finally {
      setLoading(false)
    }
  }

  function copiar() {
    if (!relatorio) return
    navigator.clipboard.writeText(`Relatório Mensal — ${relatorio.mes}\n\n${relatorio.relatorio}`)
      .then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }

  return (
    <>
      <button
        onClick={gerar}
        disabled={loading}
        className="flex items-center gap-1.5 border border-slate-200 text-slate-600 text-sm font-semibold px-4 py-2.5 rounded-xl hover:border-[#16a34a] hover:text-[#16a34a] transition-colors disabled:opacity-50"
      >
        {loading ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            Gerando…
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
            Relatório com IA
          </>
        )}
      </button>

      {relatorio && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
              <div>
                <div className="text-xs font-bold text-[#16a34a] uppercase tracking-wide mb-0.5">Relatório com IA</div>
                <h3 className="font-bold text-slate-900">{relatorio.mes}</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={copiar}
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  {copied ? (
                    <>
                      <svg className="w-3.5 h-3.5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                      </svg>
                      Copiado!
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                      </svg>
                      Copiar
                    </>
                  )}
                </button>
                <button
                  onClick={() => setRelatorio(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Conteúdo com scroll */}
            <div className="overflow-y-auto p-6 flex-1">
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{relatorio.relatorio}</p>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-50 flex-shrink-0">
              <button
                onClick={() => setRelatorio(null)}
                className="w-full py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

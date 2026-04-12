'use client'

import { useEffect } from 'react'

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-8xl mb-6">⚠️</div>
        <h1 className="text-2xl font-bold text-slate-900 mb-3">Algo deu errado</h1>
        <p className="text-slate-500 mb-8">
          Ocorreu um erro inesperado. Tente novamente ou volte para o dashboard.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="bg-[#16a34a] text-white font-semibold px-6 py-3 rounded-xl hover:bg-[#15803d] transition-colors"
          >
            Tentar novamente
          </button>
          <a
            href="/dashboard"
            className="border-2 border-slate-200 text-slate-700 font-semibold px-6 py-3 rounded-xl hover:border-slate-300 transition-colors"
          >
            Ir para o dashboard
          </a>
        </div>
      </div>
    </div>
  )
}

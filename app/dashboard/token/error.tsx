'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function TokenError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[AgroToken error]', error)
  }, [error])

  return (
    <div className="p-8 max-w-md mx-auto text-center mt-16">
      <div className="text-5xl mb-4">⚠️</div>
      <h2 className="text-xl font-bold text-slate-900 mb-2">Erro na página AgroToken</h2>
      <p className="text-sm text-slate-500 mb-2">{error?.message || 'Ocorreu um erro inesperado.'}</p>
      {error?.digest && (
        <p className="text-xs text-slate-400 mb-6 font-mono">digest: {error.digest}</p>
      )}
      <div className="flex gap-3 justify-center">
        <button
          onClick={reset}
          className="bg-[#16a34a] text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-[#15803d] transition-colors text-sm"
        >
          Tentar novamente
        </button>
        <Link
          href="/dashboard/token"
          className="border border-gray-200 text-slate-700 font-semibold px-5 py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-sm"
        >
          Voltar ao hub
        </Link>
      </div>
    </div>
  )
}

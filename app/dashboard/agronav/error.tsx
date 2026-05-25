'use client'

import { useEffect } from 'react'

export default function AgroNavError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[AgroNav error]', error)
  }, [error])

  return (
    <div className="flex items-center justify-center h-full bg-slate-100 p-6">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-lg w-full">
        <div className="text-4xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Erro no AgroNav</h2>
        <p className="text-sm text-red-600 font-mono bg-red-50 rounded-xl p-3 mb-4 break-all">
          {error?.message || 'Erro desconhecido'}
        </p>
        {error?.digest && (
          <p className="text-xs text-slate-400 mb-4">digest: {error.digest}</p>
        )}
        <button
          onClick={reset}
          className="bg-green-600 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-green-700 transition-colors"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'

const AGROCORE_URL = 'https://agrolink-opal.vercel.app'

export default function AgroCoreButton({
  activityId,
  agrolinkServiceId,
}: {
  activityId: string
  agrolinkServiceId: string | null
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [serviceId, setServiceId] = useState(agrolinkServiceId)

  if (serviceId) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-green-600 text-lg">✅</span>
          <span className="font-semibold text-green-800">Pedido enviado ao AgroCore</span>
        </div>
        <p className="text-sm text-green-700">
          Seu pedido de serviço foi criado e prestadores já estão sendo notificados.
        </p>
        <a
          href={`${AGROCORE_URL}/servico/${serviceId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full bg-green-600 text-white font-semibold py-2.5 rounded-xl hover:bg-green-700 transition-colors text-sm"
        >
          Ver pedido no AgroCore
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>
    )
  }

  async function handleContratar() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/agrocore/contratar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activityId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao contratar')
      setServiceId(data.serviceId)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao contratar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-2xl">🌾</span>
        <div>
          <div className="font-semibold text-slate-900">Contratar via AgroCore</div>
          <div className="text-xs text-slate-400">Marketplace de serviços agrícolas</div>
        </div>
      </div>
      <p className="text-sm text-slate-500">
        Publique este serviço no AgroCore e receba propostas de prestadores qualificados na sua região.
      </p>
      {error && (
        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
      )}
      <button
        onClick={handleContratar}
        disabled={loading}
        className="w-full bg-[#16a34a] text-white font-semibold py-2.5 rounded-xl hover:bg-[#15803d] transition-colors disabled:opacity-50 text-sm"
      >
        {loading ? 'Enviando pedido...' : 'Publicar no AgroCore'}
      </button>
    </div>
  )
}

'use client'

import { useState } from 'react'

const AGROCORE_URL = 'https://agrolink-opal.vercel.app'

const STATUS_LABEL: Record<string, { label: string; icon: string; color: string }> = {
  PROCURANDO:          { label: 'Buscando prestador',    icon: '🔍', color: 'text-yellow-700 bg-yellow-50 border-yellow-200' },
  AGUARDANDO_PROPOSTA: { label: 'Aguardando proposta',   icon: '⏳', color: 'text-orange-700 bg-orange-50 border-orange-200' },
  MATCH_ENCONTRADO:    { label: 'Prestador encontrado!', icon: '🤝', color: 'text-blue-700 bg-blue-50 border-blue-200' },
  EM_ROTA:             { label: 'Prestador a caminho',   icon: '🚜', color: 'text-blue-700 bg-blue-50 border-blue-200' },
  EXECUTANDO:          { label: 'Em execução',           icon: '⚙️', color: 'text-purple-700 bg-purple-50 border-purple-200' },
  CONCLUIDO:           { label: 'Concluído',             icon: '✅', color: 'text-green-700 bg-green-50 border-green-200' },
  CANCELADO:           { label: 'Cancelado',             icon: '❌', color: 'text-red-700 bg-red-50 border-red-200' },
}

const TIMELINE = [
  { status: 'PROCURANDO',          label: 'Publicado' },
  { status: 'MATCH_ENCONTRADO',    label: 'Prestador aceito' },
  { status: 'EXECUTANDO',          label: 'Em execução' },
  { status: 'CONCLUIDO',           label: 'Concluído' },
]

const STATUS_ORDER = ['PROCURANDO', 'AGUARDANDO_PROPOSTA', 'MATCH_ENCONTRADO', 'EM_ROTA', 'EXECUTANDO', 'CONCLUIDO']

function getTimelineStep(agrocoreStatus: string | null) {
  if (!agrocoreStatus) return -1
  const idx = STATUS_ORDER.indexOf(agrocoreStatus)
  if (agrocoreStatus === 'CONCLUIDO') return 3
  if (idx >= 4) return 2
  if (idx >= 2) return 1
  if (idx >= 0) return 0
  return -1
}

export default function AgroCoreButton({
  activityId,
  agrolinkServiceId,
  agrocoreStatus,
}: {
  activityId: string
  agrolinkServiceId: string | null
  agrocoreStatus?: string | null
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [serviceId, setServiceId] = useState(agrolinkServiceId)
  const [currentStatus, setCurrentStatus] = useState(agrocoreStatus || (agrolinkServiceId ? 'PROCURANDO' : null))

  const statusInfo = currentStatus ? STATUS_LABEL[currentStatus] : null
  const timelineStep = getTimelineStep(currentStatus)

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
      setCurrentStatus('PROCURANDO')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao contratar')
    } finally {
      setLoading(false)
    }
  }

  if (!serviceId) {
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
          Publique este serviço e receba propostas de prestadores qualificados na sua região.
        </p>
        {error && (
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
        )}
        <button
          onClick={handleContratar}
          disabled={loading}
          className="w-full bg-[#16a34a] text-white font-semibold py-2.5 rounded-xl hover:bg-[#15803d] transition-colors disabled:opacity-50 text-sm"
        >
          {loading ? 'Publicando...' : 'Publicar no AgroCore'}
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">🌾</span>
          <span className="font-semibold text-slate-900">AgroCore</span>
        </div>
        {statusInfo && (
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${statusInfo.color}`}>
            {statusInfo.icon} {statusInfo.label}
          </span>
        )}
      </div>

      {/* Timeline */}
      <div className="flex items-center gap-1">
        {TIMELINE.map((step, i) => {
          const done = i <= timelineStep
          const active = i === timelineStep
          return (
            <div key={step.status} className="flex-1 flex flex-col items-center gap-1">
              <div className={`w-full h-1.5 rounded-full transition-all ${done ? 'bg-[#16a34a]' : 'bg-slate-100'}`} />
              <span className={`text-[10px] font-medium text-center leading-tight ${active ? 'text-[#16a34a]' : done ? 'text-slate-500' : 'text-slate-300'}`}>
                {step.label}
              </span>
            </div>
          )
        })}
      </div>

      {/* Link */}
      <a
        href={`${AGROCORE_URL}/servico/${serviceId}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full border-2 border-[#16a34a] text-[#16a34a] font-semibold py-2 rounded-xl hover:bg-green-50 transition-colors text-sm"
      >
        Acompanhar no AgroCore
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </a>
    </div>
  )
}

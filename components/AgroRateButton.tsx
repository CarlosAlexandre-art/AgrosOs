'use client'

import { useState } from 'react'
import Link from 'next/link'

interface AgroRateData {
  score: number
  category: string
  productionScore: number
  efficiencyScore: number
  behaviorScore: number
  operationalScore: number
}

const CATEGORY_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  ELITE:    { label: 'Elite',    color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  HIGH:     { label: 'Alto',     color: 'text-blue-600',    bg: 'bg-blue-50',    border: 'border-blue-200' },
  GOOD:     { label: 'Bom',      color: 'text-green-600',   bg: 'bg-green-50',   border: 'border-green-200' },
  REGULAR:  { label: 'Regular',  color: 'text-yellow-600',  bg: 'bg-yellow-50',  border: 'border-yellow-200' },
  LOW:      { label: 'Baixo',    color: 'text-orange-600',  bg: 'bg-orange-50',  border: 'border-orange-200' },
  CRITICAL: { label: 'Crítico',  color: 'text-red-600',     bg: 'bg-red-50',     border: 'border-red-200' },
}

interface AgroRateButtonProps {
  propertyId?: string
}

export default function AgroRateButton({ propertyId }: AgroRateButtonProps) {
  const [data, setData] = useState<AgroRateData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const config = data?.category ? CATEGORY_CONFIG[data.category] : CATEGORY_CONFIG.REGULAR

  async function handleRefresh() {
    if (!propertyId) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/agrorate/score?propertyId=${propertyId}`)
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Erro ao calcular')
      setData(result)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 750) return 'text-emerald-600'
    if (score >= 600) return 'text-blue-600'
    if (score >= 450) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (!propertyId) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">💰</span>
          <div>
            <div className="font-semibold text-slate-900">AgroRate</div>
            <div className="text-xs text-slate-400">Score de crédito do agro</div>
          </div>
        </div>
        <p className="text-sm text-slate-500">
          Configure sua propriedade para gerar seu score de crédito baseado em dados reais.
        </p>
        <Link
          href="/dashboard/agrorate"
          className="block w-full text-center bg-slate-900 text-white font-semibold py-2.5 rounded-xl hover:bg-slate-800 transition-colors text-sm"
        >
          Saiba mais
        </Link>
      </div>
    )
  }

  if (!data && !loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">💰</span>
          <div>
            <div className="font-semibold text-slate-900">AgroRate</div>
            <div className="text-xs text-slate-400">Score de crédito do agro</div>
          </div>
        </div>
        <p className="text-sm text-slate-500">
          Calcule seu score de crédito baseado na sua produção e comportamento financeiro.
        </p>
        {error && (
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
        )}
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="w-full bg-emerald-600 text-white font-semibold py-2.5 rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 text-sm"
        >
          {loading ? 'Calculando...' : 'Calcular Score'}
        </button>
      </div>
    )
  }

  return (
    <div className={`bg-white border-2 ${config.border} rounded-2xl p-5 space-y-4`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">💰</span>
          <span className="font-semibold text-slate-900">AgroRate</span>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${config.bg} ${config.color}`}>
          {config.label}
        </span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-6">
          <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
        </div>
      ) : data && (
        <>
          <div className="text-center py-2">
            <div className={`text-5xl font-black ${getScoreColor(data.score)}`}>
              {data.score}
            </div>
            <div className="text-xs text-slate-400 mt-1">/ 1000 pontos</div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className={`p-2 rounded-lg ${config.bg}`}>
              <div className="text-slate-500">Produção</div>
              <div className={`font-bold ${getScoreColor(data.productionScore)}`}>
                {data.productionScore}
              </div>
            </div>
            <div className={`p-2 rounded-lg ${config.bg}`}>
              <div className="text-slate-500">Eficiência</div>
              <div className={`font-bold ${getScoreColor(data.efficiencyScore)}`}>
                {data.efficiencyScore}
              </div>
            </div>
            <div className={`p-2 rounded-lg ${config.bg}`}>
              <div className="text-slate-500">Comportamento</div>
              <div className={`font-bold ${getScoreColor(data.behaviorScore)}`}>
                {data.behaviorScore}
              </div>
            </div>
            <div className={`p-2 rounded-lg ${config.bg}`}>
              <div className="text-slate-500">Operacional</div>
              <div className={`font-bold ${getScoreColor(data.operationalScore)}`}>
                {data.operationalScore}
              </div>
            </div>
          </div>

          <Link
            href="/dashboard/agrorate"
            className={`flex items-center justify-center gap-2 w-full border-2 ${config.border} ${config.color} font-semibold py-2 rounded-xl hover:${config.bg} transition-colors text-sm`}
          >
            Ver detalhes
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>

          <button
            onClick={handleRefresh}
            className="w-full text-slate-500 text-xs hover:text-slate-700 transition-colors"
          >
            Recalcular score
          </button>
        </>
      )}
    </div>
  )
}

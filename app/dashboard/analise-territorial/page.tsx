'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import ProPaywall from '../../../components/ProPaywall'
import { usePlan } from '../../../lib/hooks/usePlan'

interface AnaliseData {
  property: { name: string; declaredHa: number; fieldsCount: number; hasCoords: boolean }
  ndvi: {
    current: number; trend: 'alta' | 'estavel' | 'queda'; label: string; color: string
    months: { month: string; ndvi: number; precip: number }[]
  }
  ftw: { detectedFields: number; detectedHa: number; matchRatio: number; avgConf: number; source: string }
  climate: { precipMm: number; tempC: number; status: string; statusColor: string }
  soil: { index: number; label: string; color: string }
  productivity: { score: number; expansionPct: number; recommendation: string }
}

const MONTH_ABBR: Record<string, string> = {
  '01':'Jan','02':'Fev','03':'Mar','04':'Abr','05':'Mai','06':'Jun',
  '07':'Jul','08':'Ago','09':'Set','10':'Out','11':'Nov','12':'Dez',
}

function NdviSparkline({ months }: { months: { month: string; ndvi: number }[] }) {
  if (!months.length) return null
  const W = 240; const H = 60; const pad = 8
  const vals = months.map(m => m.ndvi)
  const min = Math.min(...vals) - 0.05
  const max = Math.max(...vals) + 0.05
  const x = (i: number) => pad + (i / (vals.length - 1)) * (W - pad * 2)
  const y = (v: number) => H - pad - ((v - min) / (max - min)) * (H - pad * 2)
  const pts = vals.map((v, i) => `${x(i)},${y(v)}`).join(' ')
  const areaPath = `M ${x(0)},${H} ${vals.map((v, i) => `L ${x(i)},${y(v)}`).join(' ')} L ${x(vals.length - 1)},${H} Z`

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 60 }}>
      <defs>
        <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#34d399" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#sg)" />
      <polyline points={pts} fill="none" stroke="#34d399" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      {vals.map((v, i) => (
        <circle key={i} cx={x(i)} cy={y(v)} r="3" fill="#34d399" />
      ))}
    </svg>
  )
}

function AnaliseContent() {
  const [data, setData] = useState<AnaliseData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/geo/analise')
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(setData)
      .catch(() => setError('Erro ao carregar análise.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64" style={{ background: '#020c14' }}>
      <div className="text-center">
        <div className="w-8 h-8 mx-auto mb-3 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: 'rgba(52,211,153,0.3)', borderTopColor: '#34d399' }} />
        <p className="text-xs" style={{ color: 'rgba(148,163,184,0.6)' }}>Analisando território...</p>
      </div>
    </div>
  )

  if (error || !data) return (
    <div className="flex items-center justify-center h-64" style={{ background: '#020c14' }}>
      <p className="text-sm text-red-400">{error || 'Nenhum dado disponível.'}</p>
    </div>
  )

  const ndviPct = Math.round(data.ndvi.current * 100)
  const trendIcon = data.ndvi.trend === 'alta' ? '↑' : data.ndvi.trend === 'queda' ? '↓' : '→'
  const trendColor = data.ndvi.trend === 'alta' ? '#34d399' : data.ndvi.trend === 'queda' ? '#f87171' : '#94a3b8'

  return (
    <div className="min-h-full" style={{
      background: 'linear-gradient(160deg, #020c14 0%, #041a0c 50%, #020c14 100%)',
      fontFamily: "'Inter', sans-serif",
    }}>
      {/* Grid overlay */}
      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(52,211,153,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(52,211,153,0.03) 1px, transparent 1px)',
        backgroundSize: '48px 48px',
      }} />

      <div className="relative z-10 p-5 max-w-5xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-start gap-4 pt-2">
          <div className="flex-1">
            <div className="text-xs font-bold tracking-widest mb-1" style={{ color: 'rgba(52,211,153,0.7)', letterSpacing: '0.15em' }}>
              ORYON GEO INTELLIGENCE · MÓDULO 3
            </div>
            <h1 className="text-2xl font-black tracking-tight" style={{
              background: 'linear-gradient(135deg, #a7f3d0 0%, #34d399 60%, #059669 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              Análise Territorial Agrícola
            </h1>
            <p className="text-sm mt-1" style={{ color: 'rgba(148,163,184,0.6)' }}>
              {data.property.name} · {data.property.declaredHa} ha declarados · {data.property.fieldsCount} talhões
            </p>
          </div>
          <div className="flex-shrink-0 text-center px-5 py-3 rounded-2xl border"
            style={{ background: 'rgba(52,211,153,0.08)', borderColor: 'rgba(52,211,153,0.2)' }}>
            <div className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'rgba(52,211,153,0.6)' }}>
              Score Produtivo
            </div>
            <div className="text-4xl font-black" style={{ color: '#34d399', textShadow: '0 0 20px rgba(52,211,153,0.4)' }}>
              {data.productivity.score}
            </div>
            <div className="text-xs mt-1" style={{ color: 'rgba(148,163,184,0.4)' }}>de 100</div>
          </div>
        </div>

        {/* No coords warning */}
        {!data.property.hasCoords && (
          <div className="rounded-2xl p-4 border flex items-center gap-3"
            style={{ background: 'rgba(251,191,36,0.08)', borderColor: 'rgba(251,191,36,0.2)' }}>
            <span className="text-lg">📍</span>
            <p className="text-sm text-amber-300">
              Configure a localização da propriedade no{' '}
              <Link href="/dashboard/mapa" className="underline">Mapa</Link>{' '}
              para análise baseada em dados climáticos reais do NDVI.
            </p>
          </div>
        )}

        {/* 4-quadrant metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* NDVI */}
          <div className="rounded-2xl p-4 border"
            style={{ background: 'rgba(255,255,255,0.03)', borderColor: `${data.ndvi.color}30` }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'rgba(148,163,184,0.5)' }}>NDVI</span>
              <span className="text-xs font-bold" style={{ color: trendColor }}>{trendIcon} {data.ndvi.trend}</span>
            </div>
            <div className="text-3xl font-black mb-1" style={{ color: data.ndvi.color }}>
              {data.ndvi.current.toFixed(2)}
            </div>
            <div className="text-xs font-semibold mb-2" style={{ color: data.ndvi.color }}>{data.ndvi.label}</div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
              <div className="h-full rounded-full" style={{ width: `${ndviPct}%`, background: data.ndvi.color }} />
            </div>
            <div className="text-[10px] mt-1" style={{ color: 'rgba(148,163,184,0.4)' }}>Sentinel-2 proxy</div>
          </div>

          {/* FTW Fields */}
          <div className="rounded-2xl p-4 border"
            style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(52,211,153,0.2)' }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'rgba(148,163,184,0.5)' }}>Campos FTW</span>
              <span className="text-[10px] font-bold" style={{ color: 'rgba(52,211,153,0.6)' }}>
                {(data.ftw.avgConf * 100).toFixed(0)}%
              </span>
            </div>
            <div className="text-3xl font-black mb-1" style={{ color: '#34d399' }}>
              {data.ftw.detectedFields}
            </div>
            <div className="text-xs mb-2" style={{ color: 'rgba(148,163,184,0.6)' }}>
              {data.ftw.detectedHa} ha detectados
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
              <div className="h-full rounded-full" style={{
                width: `${data.ftw.matchRatio * 100}%`,
                background: 'linear-gradient(90deg, #34d399, #6ee7b7)',
              }} />
            </div>
            <div className="text-[10px] mt-1" style={{ color: 'rgba(148,163,184,0.4)' }}>
              {(data.ftw.matchRatio * 100).toFixed(0)}% conformidade
            </div>
          </div>

          {/* Climate */}
          <div className="rounded-2xl p-4 border"
            style={{ background: 'rgba(255,255,255,0.03)', borderColor: `${data.climate.statusColor}30` }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'rgba(148,163,184,0.5)' }}>Clima</span>
              <span className="text-[10px] font-bold" style={{ color: data.climate.statusColor }}>
                {data.climate.status}
              </span>
            </div>
            <div className="text-3xl font-black mb-1" style={{ color: data.climate.statusColor }}>
              {data.climate.precipMm}
            </div>
            <div className="text-xs mb-2" style={{ color: 'rgba(148,163,184,0.6)' }}>
              mm chuva · {data.climate.tempC.toFixed(1)}°C
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
              <div className="h-full rounded-full" style={{
                width: `${Math.min(100, (data.climate.precipMm / 200) * 100)}%`,
                background: data.climate.statusColor,
              }} />
            </div>
            <div className="text-[10px] mt-1" style={{ color: 'rgba(148,163,184,0.4)' }}>Open-Meteo últimos 30d</div>
          </div>

          {/* Soil */}
          <div className="rounded-2xl p-4 border"
            style={{ background: 'rgba(255,255,255,0.03)', borderColor: `${data.soil.color}30` }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'rgba(148,163,184,0.5)' }}>Solo</span>
              <span className="text-[10px] font-bold" style={{ color: data.soil.color }}>{data.soil.label}</span>
            </div>
            <div className="text-3xl font-black mb-1" style={{ color: data.soil.color }}>
              {data.soil.index.toFixed(1)}
            </div>
            <div className="text-xs mb-2" style={{ color: 'rgba(148,163,184,0.6)' }}>
              índice / 10
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
              <div className="h-full rounded-full" style={{
                width: `${data.soil.index * 10}%`,
                background: data.soil.color,
              }} />
            </div>
            <div className="text-[10px] mt-1" style={{ color: 'rgba(148,163,184,0.4)' }}>estimativa cruzada</div>
          </div>
        </div>

        {/* NDVI Trend + Productivity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* NDVI sparkline */}
          <div className="rounded-2xl p-5 border"
            style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(52,211,153,0.15)' }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-sm font-bold text-white">Evolução NDVI</div>
                <div className="text-xs mt-0.5" style={{ color: 'rgba(148,163,184,0.5)' }}>últimos 6 meses</div>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
                style={{ background: `${trendColor}15`, border: `1px solid ${trendColor}30` }}>
                <span className="text-sm font-bold" style={{ color: trendColor }}>{trendIcon}</span>
                <span className="text-xs font-semibold capitalize" style={{ color: trendColor }}>{data.ndvi.trend}</span>
              </div>
            </div>
            {data.ndvi.months.length > 0 ? (
              <>
                <NdviSparkline months={data.ndvi.months} />
                <div className="flex justify-between mt-2">
                  {data.ndvi.months.map(m => (
                    <div key={m.month} className="text-center">
                      <div className="text-[9px]" style={{ color: 'rgba(148,163,184,0.4)' }}>
                        {MONTH_ABBR[m.month.slice(5)] ?? m.month.slice(5)}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="py-8 text-center text-xs" style={{ color: 'rgba(148,163,184,0.4)' }}>
                Configure coordenadas para ativar dados de NDVI.
              </div>
            )}
          </div>

          {/* Productivity breakdown */}
          <div className="rounded-2xl p-5 border"
            style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(96,165,250,0.15)' }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-sm font-bold text-white">Score Produtivo</div>
                <div className="text-xs mt-0.5" style={{ color: 'rgba(148,163,184,0.5)' }}>cruzamento NDVI × FTW × clima × solo</div>
              </div>
              <div className="text-3xl font-black" style={{ color: '#34d399' }}>{data.productivity.score}</div>
            </div>

            {/* Contribution bars */}
            {[
              { label: 'NDVI Vegetal', val: Math.min(35, Math.round(data.ndvi.current * 48)), max: 35, color: data.ndvi.color },
              { label: 'Hídrico', val: data.climate.precipMm >= 40 && data.climate.precipMm <= 200 ? 25 : data.climate.precipMm > 0 ? 15 : 5, max: 25, color: data.climate.statusColor },
              { label: 'Qualidade Solo', val: Math.min(20, Math.round(data.soil.index * 2)), max: 20, color: data.soil.color },
              { label: 'Confiança FTW', val: Math.min(10, Math.round(data.ftw.avgConf * 11)), max: 10, color: '#34d399' },
              { label: 'Densidade Campos', val: Math.min(10, data.ftw.detectedFields >= 3 ? 10 : data.ftw.detectedFields * 3), max: 10, color: '#6ee7b7' },
            ].map(item => (
              <div key={item.label} className="mb-2.5">
                <div className="flex justify-between mb-1">
                  <span className="text-[11px]" style={{ color: 'rgba(148,163,184,0.7)' }}>{item.label}</span>
                  <span className="text-[11px] font-bold" style={{ color: item.color }}>
                    {item.val}/{item.max}
                  </span>
                </div>
                <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${(item.val / item.max) * 100}%`, background: item.color }} />
                </div>
              </div>
            ))}

            {data.productivity.expansionPct > 5 && (
              <div className="mt-3 text-xs px-3 py-2 rounded-xl"
                style={{ background: 'rgba(52,211,153,0.08)', color: '#34d399', border: '1px solid rgba(52,211,153,0.2)' }}>
                {data.productivity.expansionPct}% da área com potencial de ativação
              </div>
            )}
          </div>
        </div>

        {/* Recommendation */}
        <div className="rounded-2xl p-5 border"
          style={{ background: 'rgba(52,211,153,0.05)', borderColor: 'rgba(52,211,153,0.15)' }}>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.3)' }}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="#34d399" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#34d399' }}>
                Recomendação IA
              </div>
              <p className="text-sm text-slate-300">{data.productivity.recommendation}</p>
              <div className="mt-2 text-[10px]" style={{ color: 'rgba(148,163,184,0.4)' }}>
                Fonte: FTW Sentinel-2 · Open-Meteo · OryonAG GEO Module 3
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3 pb-4">
          <Link href="/dashboard/geo-inteligencia"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{ background: 'rgba(52,211,153,0.12)', color: '#34d399', border: '1px solid rgba(52,211,153,0.25)' }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="11" cy="11" r="4"/><path strokeLinecap="round" d="M11 7V4M11 18v-3M7 11H4M18 11h-3" />
            </svg>
            Ver Mapa de Campos FTW
          </Link>
          <Link href="/dashboard/vegetacao"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{ background: 'rgba(255,255,255,0.04)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.08)' }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-.5 2-2 2h-1c-1 0-1 .008-1 1.031V21" />
            </svg>
            Histórico NDVI Completo
          </Link>
          <Link href="/dashboard/imagens-satelite"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{ background: 'rgba(255,255,255,0.04)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.08)' }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909" />
            </svg>
            Imagens Satélite
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function AnaliseTerritorialPage() {
  const { loading, isPro } = usePlan()
  if (loading) return (
    <div className="flex items-center justify-center h-64" style={{ background: '#020c14' }}>
      <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
        style={{ borderColor: 'rgba(52,211,153,0.3)', borderTopColor: '#34d399' }} />
    </div>
  )
  if (!isPro) return (
    <ProPaywall
      icon="🌱"
      feature="Análise Territorial Agrícola"
      desc="Cruzamento de NDVI Sentinel-2 + detecção de campos FTW + clima + solo para análise produtiva completa do território."
    />
  )
  return <AnaliseContent />
}

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePlan } from '@/lib/hooks/usePlan'
import ProPaywall from '@/components/ProPaywall'

interface PipelineStage {
  id: string; label: string; descricao: string
  status: 'ativo' | 'standby' | 'sem_coords' | 'sem_chave'
  latencia: string; dados: string
}
interface EngineData {
  property: { id: string; name: string; declaredHa: number; hasCoords: boolean }
  engineScore: number
  pipeline: PipelineStage[]
  metricas: { ndvi: number; ndviLabel: string; precipMm: number; tempC: number; ftwFields: number; ftwHa: number; ftwConf: number; fieldsRegistrados: number }
  insight: string
  source: string
  generatedAt: string
}

function PipelineArrow() {
  return (
    <div className="hidden md:flex items-center justify-center px-1">
      <svg className="w-5 h-5 text-emerald-400/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </div>
  )
}

export default function GeoAIEngine() {
  const { loading: planLoading, isPro } = usePlan()
  const [data, setData] = useState<EngineData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = async (refresh = false) => {
    if (refresh) setRefreshing(true)
    try {
      const r = await fetch('/api/geo/engine' + (refresh ? `?t=${Date.now()}` : ''))
      setData(await r.json())
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { load() }, [])

  if (planLoading) return null
  if (!isPro) return <ProPaywall feature="ORYON GEO AI Engine" />

  const statusCfg = {
    ativo: { color: '#34d399', label: 'Ativo', dot: 'bg-emerald-400' },
    standby: { color: '#f59e0b', label: 'Standby', dot: 'bg-amber-400' },
    sem_coords: { color: '#94a3b8', label: 'Sem coords', dot: 'bg-slate-500' },
    sem_chave: { color: '#94a3b8', label: 'Sem API key', dot: 'bg-slate-500' },
  }

  const scoreColor = (s: number) => s >= 80 ? '#34d399' : s >= 60 ? '#a3e635' : s >= 40 ? '#f59e0b' : '#f87171'

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #020c14 0%, #030e0b 100%)' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Exo+2:wght@300;400;500;600&display=swap');
        .engine-page { font-family: 'Exo 2', sans-serif; }
        .engine-title { font-family: 'Orbitron', sans-serif; }
        .grid-bg { background-image: linear-gradient(rgba(52,211,153,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(52,211,153,.04) 1px, transparent 1px); background-size: 24px 24px; }
        .card { background: rgba(255,255,255,.025); border: 1px solid rgba(52,211,153,.12); border-radius: 16px; }
        .pipeline-card { background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.08); border-radius: 12px; padding: 14px; transition: border-color .2s; }
        .pipeline-card:hover { border-color: rgba(52,211,153,.3); }
        .insight-card { background: linear-gradient(135deg, rgba(52,211,153,.06), rgba(96,165,250,.04)); border: 1px solid rgba(52,211,153,.18); border-radius: 16px; }
        @keyframes engine-pulse { 0%, 100% { opacity: .8; } 50% { opacity: 1; } }
        .engine-glow { animation: engine-pulse 3s ease-in-out infinite; filter: drop-shadow(0 0 8px #34d399); }
      `}</style>

      <div className="engine-page grid-bg min-h-screen">
        <div className="max-w-6xl mx-auto px-6 py-8">

          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style={{ background: 'rgba(52,211,153,.15)', border: '1px solid rgba(52,211,153,.3)' }}>⚙️</div>
                <div>
                  <h1 className="text-2xl font-bold text-white engine-title tracking-wide">GEO AI ENGINE</h1>
                  <p className="text-xs text-slate-500 mt-0.5">Sentinel-2 · FTW · Open-Meteo · YOLOv8 · LLaMA 4</p>
                </div>
              </div>
              {data && <p className="text-xs text-slate-600">{data.property.name} · {data.property.declaredHa} ha</p>}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => load(true)}
                disabled={refreshing}
                className="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1.5"
              >
                <svg className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {refreshing ? 'Atualizando...' : 'Atualizar'}
              </button>
              <Link href="/dashboard/geo-inteligencia" className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                GEO Intelligence
              </Link>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="w-12 h-12 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto mb-3 engine-glow" />
                <p className="text-slate-400 text-sm engine-title tracking-widest text-xs">INICIALIZANDO ENGINE</p>
              </div>
            </div>
          ) : data ? (
            <>
              {/* Engine score + metrics */}
              <div className="grid md:grid-cols-4 gap-4 mb-6">
                {/* Score */}
                <div className="md:col-span-1 card p-6 flex flex-col items-center justify-center text-center">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-3 engine-title">Engine Score</p>
                  <div className="relative w-24 h-24 mb-3">
                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                      <circle cx="50" cy="50" r="38" fill="none" stroke="rgba(255,255,255,.06)" strokeWidth="10" />
                      <circle cx="50" cy="50" r="38" fill="none" strokeWidth="10"
                        stroke={scoreColor(data.engineScore)}
                        strokeDasharray={`${2 * Math.PI * 38 * data.engineScore / 100} ${2 * Math.PI * 38}`}
                        strokeLinecap="round" style={{ transition: 'stroke-dasharray 1s' }} />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-bold text-white engine-title" style={{ color: scoreColor(data.engineScore) }}>{data.engineScore}</span>
                    </div>
                  </div>
                  <div className="text-xs" style={{ color: scoreColor(data.engineScore) }}>
                    {data.engineScore >= 80 ? 'Excelente' : data.engineScore >= 60 ? 'Bom' : data.engineScore >= 40 ? 'Moderado' : 'Baixo'}
                  </div>
                </div>

                {/* Metrics */}
                {[
                  { label: 'NDVI', value: data.metricas.ndvi.toFixed(2), sub: data.metricas.ndviLabel, color: data.metricas.ndvi >= 0.5 ? '#34d399' : '#f59e0b' },
                  { label: 'Campos FTW', value: data.metricas.ftwFields.toString(), sub: `${data.metricas.ftwHa.toFixed(0)} ha · ${(data.metricas.ftwConf * 100).toFixed(0)}% conf.`, color: '#60a5fa' },
                  { label: 'Clima (30d)', value: `${data.metricas.precipMm.toFixed(0)} mm`, sub: `${data.metricas.tempC.toFixed(1)}°C média`, color: '#a78bfa' },
                ].map(m => (
                  <div key={m.label} className="card p-5 flex flex-col justify-center">
                    <div className="text-xs text-slate-500 mb-2 uppercase tracking-wider">{m.label}</div>
                    <div className="text-3xl font-bold engine-title" style={{ color: m.color }}>{m.value}</div>
                    <div className="text-xs text-slate-500 mt-1">{m.sub}</div>
                  </div>
                ))}
              </div>

              {/* Pipeline */}
              <div className="card p-5 mb-5">
                <h2 className="text-sm font-bold text-white mb-4 engine-title tracking-wider">Pipeline de Dados</h2>
                <div className="flex flex-col md:flex-row items-start md:items-center gap-2">
                  {data.pipeline.map((stage, i) => {
                    const cfg = statusCfg[stage.status]
                    return (
                      <>
                        <div key={stage.id} className="pipeline-card flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <div className={`w-2 h-2 rounded-full ${cfg.dot} flex-shrink-0`} />
                            <span className="text-xs font-bold text-white engine-title tracking-wide">{stage.label}</span>
                            <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: `${cfg.color}22`, color: cfg.color }}>{cfg.label}</span>
                          </div>
                          <p className="text-xs text-slate-500 mb-2 leading-relaxed">{stage.descricao}</p>
                          <p className="text-xs font-medium text-slate-300 truncate">{stage.dados}</p>
                          <p className="text-[10px] text-slate-600 mt-1">Latência: {stage.latencia}</p>
                        </div>
                        {i < data.pipeline.length - 1 && <PipelineArrow />}
                      </>
                    )
                  })}
                </div>
              </div>

              {/* AI Insight */}
              <div className="insight-card p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base engine-glow" style={{ background: 'rgba(52,211,153,.15)' }}>🧠</div>
                  <div>
                    <h2 className="text-sm font-bold text-white engine-title tracking-wider">Insight Territorial — LLaMA 4 Scout</h2>
                    <p className="text-xs text-slate-500">Análise integrada com contexto geoespacial</p>
                  </div>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">{data.insight}</p>
              </div>

              {/* Nav shortcuts */}
              <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { href: '/dashboard/geo-inteligencia', label: 'Mapa FTW', icon: '🗺' },
                  { href: '/dashboard/segmentacao-lavouras', label: 'Segmentação', icon: '🌾' },
                  { href: '/dashboard/digital-twin-rural', label: 'Digital Twin', icon: '🔬' },
                  { href: '/dashboard/ia-territorial', label: 'IA Autônoma', icon: '🤖' },
                ].map(n => (
                  <Link key={n.href} href={n.href} className="card p-3 flex items-center gap-3 hover:border-emerald-400/30 transition-all group">
                    <span className="text-base">{n.icon}</span>
                    <span className="text-xs text-slate-400 group-hover:text-white transition-colors">{n.label}</span>
                    <svg className="w-3.5 h-3.5 text-slate-600 group-hover:text-emerald-400 ml-auto transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                  </Link>
                ))}
              </div>

              <div className="mt-5 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 engine-glow" />
                <span className="text-xs text-slate-600">{data.source}</span>
                <span className="text-xs text-slate-700">· {new Date(data.generatedAt).toLocaleString('pt-BR')}</span>
              </div>
            </>
          ) : (
            <div className="card p-8 text-center">
              <p className="text-slate-400">Erro ao inicializar GEO AI Engine.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

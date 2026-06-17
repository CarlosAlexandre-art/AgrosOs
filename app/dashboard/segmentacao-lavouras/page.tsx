'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePlan } from '@/lib/hooks/usePlan'
import ProPaywall from '@/components/ProPaywall'
import VideoAnaliseIA from '@/components/VideoAnaliseIA'

interface Campo {
  id: string
  nome: string
  ha: number
  cultura: string
  culturaId: string
  culturaColor: string
  ndvi: number
  ndviLabel: string
  estagio: string
  confianca: number
  prodEstimadaTha: number
  alerta: string | null
}

interface Distribuicao {
  culturaId: string
  label: string
  ha: number
  pct: number
  count: number
  color: string
}

interface SegData {
  property: { id: string; name: string; declaredHa: number; hasCoords: boolean }
  resumo: { totalCampos: number; totalHa: number; ndviMedio: number; prodTotalEstimada: number; camposEmAlerta: number; dominanteCultura: string; precipMm: number }
  campos: Campo[]
  distribuicao: Distribuicao[]
  source: string
  generatedAt: string
}

function NdviBar({ value, color }: { value: number; color: string }) {
  const pct = Math.round(value * 100)
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-xs text-slate-400 w-10 text-right">{value.toFixed(2)}</span>
    </div>
  )
}

export default function SegmentacaoLavouras() {
  const { loading: planLoading, isPro } = usePlan()
  const [data, setData] = useState<SegData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedCultura, setSelectedCultura] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/geo/segmentacao')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (planLoading) return null
  if (!isPro) return <ProPaywall feature="Segmentação de Lavouras" />

  const ndviColor = (v: number) => v >= 0.7 ? '#4ade80' : v >= 0.5 ? '#a3e635' : v >= 0.35 ? '#facc15' : v >= 0.2 ? '#fb923c' : '#f87171'

  const campos = data?.campos.filter(c => !selectedCultura || c.culturaId === selectedCultura) ?? []

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #020c14 0%, #040d0a 60%, #020c14 100%)' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=DM+Sans:wght@300;400;500;600&display=swap');
        .seg-page { font-family: 'DM Sans', sans-serif; }
        .seg-mono { font-family: 'Space Mono', monospace; }
        .grid-bg { background-image: linear-gradient(rgba(52,211,153,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(52,211,153,.04) 1px, transparent 1px); background-size: 32px 32px; }
        .card-glass { background: rgba(255,255,255,.03); border: 1px solid rgba(52,211,153,.12); backdrop-filter: blur(12px); border-radius: 16px; }
        .badge-cultura { display: inline-flex; align-items: center; gap: 4px; padding: 2px 10px; border-radius: 99px; font-size: 11px; font-weight: 600; }
        .estagio-chip { padding: 1px 8px; border-radius: 6px; font-size: 10px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; background: rgba(255,255,255,.07); color: #94a3b8; }
      `}</style>

      <div className="seg-page grid-bg min-h-screen">
        <div className="max-w-6xl mx-auto px-6 py-8">

          {/* Header */}
          <div className="mb-8 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style={{ background: 'rgba(52,211,153,.15)', border: '1px solid rgba(52,211,153,.3)' }}>🌾</div>
                <div>
                  <h1 className="text-2xl font-bold text-white seg-mono">Segmentação de Lavouras</h1>
                  <p className="text-xs text-slate-500 mt-0.5">Classificação automática de culturas via FTW + Sentinel-2</p>
                </div>
              </div>
              {data && <p className="text-xs text-slate-600">{data.property.name} · {data.property.declaredHa} ha declarados</p>}
            </div>
            <Link href="/dashboard/geo-inteligencia" className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              GEO Intelligence
            </Link>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="w-10 h-10 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-slate-400 text-sm">Classificando lavouras com IA...</p>
              </div>
            </div>
          ) : data ? (
            <>
              {/* Summary cards */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                {[
                  { label: 'Campos', value: data.resumo.totalCampos.toString(), sub: 'detectados', color: '#34d399' },
                  { label: 'Área Total', value: `${data.resumo.totalHa} ha`, sub: 'classificada', color: '#60a5fa' },
                  { label: 'NDVI Médio', value: data.resumo.ndviMedio.toFixed(2), sub: data.resumo.ndviMedio >= 0.5 ? 'Bom' : 'Moderado', color: ndviColor(data.resumo.ndviMedio) },
                  { label: 'Produção Est.', value: `${(data.resumo.prodTotalEstimada / 1000).toFixed(0)}k t`, sub: 'estimada', color: '#f59e0b' },
                  { label: 'Em Alerta', value: data.resumo.camposEmAlerta.toString(), sub: 'campos', color: data.resumo.camposEmAlerta > 0 ? '#f87171' : '#34d399' },
                ].map(m => (
                  <div key={m.label} className="card-glass p-4">
                    <div className="text-xs text-slate-500 mb-1">{m.label}</div>
                    <div className="text-xl font-bold seg-mono" style={{ color: m.color }}>{m.value}</div>
                    <div className="text-xs text-slate-600 mt-0.5">{m.sub}</div>
                  </div>
                ))}
              </div>

              <div className="grid md:grid-cols-3 gap-5">
                {/* Distribuição de culturas */}
                <div className="card-glass p-5">
                  <h2 className="text-sm font-bold text-white mb-4">Distribuição por Cultura</h2>
                  <div className="space-y-3">
                    {data.distribuicao.map(d => (
                      <button
                        key={d.culturaId}
                        onClick={() => setSelectedCultura(selectedCultura === d.culturaId ? null : d.culturaId)}
                        className={`w-full text-left transition-all rounded-xl p-3 ${selectedCultura === d.culturaId ? 'ring-1 ring-emerald-400/50 bg-white/5' : 'hover:bg-white/3'}`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: d.color }} />
                            <span className="text-sm text-white font-medium">{d.label}</span>
                          </div>
                          <span className="text-xs text-slate-400">{d.ha} ha</span>
                        </div>
                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${d.pct}%`, background: d.color }} />
                        </div>
                        <div className="flex justify-between mt-1">
                          <span className="text-xs text-slate-500">{d.count} campo{d.count > 1 ? 's' : ''}</span>
                          <span className="text-xs font-bold" style={{ color: d.color }}>{d.pct}%</span>
                        </div>
                      </button>
                    ))}
                  </div>
                  {selectedCultura && (
                    <button onClick={() => setSelectedCultura(null)} className="mt-3 w-full text-xs text-slate-500 hover:text-white transition-colors text-center">
                      Limpar filtro
                    </button>
                  )}
                </div>

                {/* Lista de campos */}
                <div className="md:col-span-2 card-glass p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-bold text-white">Talhões Classificados</h2>
                    <span className="text-xs text-slate-500">{campos.length} de {data.campos.length}</span>
                  </div>
                  <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                    {campos.map(c => (
                      <div key={c.id} className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.06)' }}>
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-bold text-white">{c.nome}</span>
                              {c.alerta && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/20">⚠</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="badge-cultura" style={{ background: `${c.culturaColor}22`, color: c.culturaColor, border: `1px solid ${c.culturaColor}44` }}>
                                {c.cultura}
                              </span>
                              <span className="estagio-chip">{c.estagio}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold text-white seg-mono">{c.ha} ha</div>
                            <div className="text-xs text-slate-500">{c.prodEstimadaTha} t/ha</div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <div className="text-xs text-slate-500 mb-1">NDVI — {c.ndviLabel}</div>
                            <NdviBar value={c.ndvi} color={ndviColor(c.ndvi)} />
                          </div>
                          <div>
                            <div className="text-xs text-slate-500 mb-1">Confiança FTW</div>
                            <NdviBar value={c.confianca} color="#60a5fa" />
                          </div>
                        </div>
                        {c.alerta && (
                          <div className="mt-2 text-xs text-red-400 flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
                            {c.alerta}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Source */}
              <div className="mt-6 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-xs text-slate-600">{data.source}</span>
                <span className="text-xs text-slate-700">· {new Date(data.generatedAt).toLocaleString('pt-BR')}</span>
              </div>

              {/* AgroVision — Análise de Drone */}
              <div className="mt-8">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-px flex-1 bg-white/5" />
                  <span className="text-xs text-slate-600 font-medium px-3">AgroVision IA</span>
                  <div className="h-px flex-1 bg-white/5" />
                </div>
                <VideoAnaliseIA
                  modo="drone"
                  titulo="Análise de Vídeo de Drone"
                  descricao="Envie um vídeo ou imagem aérea da lavoura para análise automática por IA"
                />
              </div>
            </>
          ) : (
            <div className="card-glass p-8 text-center">
              <p className="text-slate-400">Erro ao carregar dados de segmentação.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

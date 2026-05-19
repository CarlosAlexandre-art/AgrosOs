'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePlan } from '@/lib/hooks/usePlan'
import ProPaywall from '@/components/ProPaywall'

interface Compliance { id: string; label: string; status: 'regular' | 'pendente' | 'irregular'; peso: number }
interface Zona { id: string; label: string; ha: number; ndviAtual: number; potencial: 'Alto' | 'Médio' | 'Baixo'; restricao: string | null }
interface ExpData {
  property: { id: string; name: string; declaredHa: number; hasCoords: boolean }
  expansao: { haDisponivel: number; zonas: Zona[] }
  uso: { consolidadaPct: number; reservaLegalPct: number; appPct: number; consolidadaHa: number; reservaLegalHa: number; appHa: number }
  esg: {
    creditoVerdeScore: number; complianceScore: number
    compliance: Compliance[]
    carbono: { tCO2: number; creditosCarbono: number; valorEstimadoBRL: number; metodologia: string }
  }
  ndviHistorico: number[]
  alertas: { tipo: string; msg: string }[]
  source: string
  generatedAt: string
}

function NdviSparkline({ data }: { data: number[] }) {
  if (!data.length) return null
  const w = 200, h = 48
  const min = 0, max = 1
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / (max - min)) * h}`)
  const area = `M${pts[0]} ${pts.slice(1).map(p => `L${p}`).join(' ')} L${w},${h} L0,${h} Z`
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-12">
      <defs>
        <linearGradient id="ndviGrad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#34d399" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#ndviGrad)" />
      <polyline points={pts.join(' ')} fill="none" stroke="#34d399" strokeWidth="1.5" />
      {data.map((v, i) => <circle key={i} cx={(i / (data.length - 1)) * w} cy={h - ((v - min) / (max - min)) * h} r="2" fill="#34d399" />)}
    </svg>
  )
}

export default function ExpansaoAgricola() {
  const { loading: planLoading, isPro } = usePlan()
  const [data, setData] = useState<ExpData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/geo/expansao')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (planLoading) return null
  if (!isPro) return <ProPaywall feature="Monitoramento de Expansão Agrícola" />

  const statusColor = (s: string) => s === 'regular' ? '#34d399' : s === 'pendente' ? '#f59e0b' : '#f87171'
  const statusLabel = (s: string) => s === 'regular' ? 'Regular' : s === 'pendente' ? 'Pendente' : 'Irregular'
  const potencialColor = (p: string) => p === 'Alto' ? '#34d399' : p === 'Médio' ? '#f59e0b' : '#94a3b8'

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #020c14 0%, #030e0b 60%, #020c14 100%)' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');
        .exp-page { font-family: 'Outfit', sans-serif; }
        .grid-bg { background-image: linear-gradient(rgba(52,211,153,.03) 1px, transparent 1px), linear-gradient(90deg, rgba(52,211,153,.03) 1px, transparent 1px); background-size: 40px 40px; }
        .card { background: rgba(255,255,255,.025); border: 1px solid rgba(52,211,153,.1); border-radius: 16px; }
        .score-ring { border-radius: 50%; display: flex; align-items: center; justify-content: center; }
      `}</style>

      <div className="exp-page grid-bg min-h-screen">
        <div className="max-w-6xl mx-auto px-6 py-8">

          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style={{ background: 'rgba(52,211,153,.15)', border: '1px solid rgba(52,211,153,.3)' }}>🌍</div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Monitoramento de Expansão</h1>
                  <p className="text-xs text-slate-500 mt-0.5">ESG · Crédito Verde · Compliance Ambiental · Carbono</p>
                </div>
              </div>
              {data && <p className="text-xs text-slate-600">{data.property.name} · {data.property.declaredHa} ha</p>}
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
                <p className="text-slate-400 text-sm">Analisando território e compliance...</p>
              </div>
            </div>
          ) : data ? (
            <>
              {/* Alertas */}
              {data.alertas.length > 0 && (
                <div className="mb-5 space-y-2">
                  {data.alertas.map((a, i) => (
                    <div key={i} className={`flex items-start gap-3 p-3.5 rounded-xl text-sm ${a.tipo === 'error' ? 'bg-red-500/10 border border-red-500/20 text-red-300' : 'bg-amber-500/10 border border-amber-500/20 text-amber-300'}`}>
                      <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
                      {a.msg}
                    </div>
                  ))}
                </div>
              )}

              <div className="grid md:grid-cols-3 gap-5">
                {/* ESG Score */}
                <div className="card p-6 flex flex-col items-center text-center">
                  <p className="text-xs text-slate-500 mb-4 uppercase tracking-wider">Score Crédito Verde</p>
                  <div className="relative w-28 h-28 mb-4">
                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                      <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,.07)" strokeWidth="10" />
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#34d399" strokeWidth="10"
                        strokeDasharray={`${2 * Math.PI * 40 * data.esg.creditoVerdeScore / 100} ${2 * Math.PI * 40}`}
                        strokeLinecap="round" style={{ transition: 'stroke-dasharray 1s ease' }} />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-bold text-white">{data.esg.creditoVerdeScore}</span>
                      <span className="text-xs text-slate-500">/100</span>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-emerald-400 mb-1">{data.esg.creditoVerdeScore >= 70 ? 'Elegível — Crédito Verde' : data.esg.creditoVerdeScore >= 50 ? 'Parcialmente elegível' : 'Regularizar para elegibilidade'}</p>
                  <p className="text-xs text-slate-600">Compliance: {data.esg.complianceScore.toFixed(0)}%</p>

                  {/* Carbon */}
                  <div className="w-full mt-5 pt-4 border-t border-white/8">
                    <p className="text-xs text-slate-500 mb-3">Créditos de Carbono</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-xl p-3" style={{ background: 'rgba(52,211,153,.08)' }}>
                        <div className="text-lg font-bold text-emerald-400">{data.esg.carbono.creditosCarbono}</div>
                        <div className="text-xs text-slate-500">créditos</div>
                      </div>
                      <div className="rounded-xl p-3" style={{ background: 'rgba(96,165,250,.08)' }}>
                        <div className="text-lg font-bold text-blue-400">R$ {data.esg.carbono.valorEstimadoBRL.toLocaleString('pt-BR')}</div>
                        <div className="text-xs text-slate-500">valor est.</div>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 mt-2">{data.esg.carbono.tCO2} tCO₂ · {data.esg.carbono.metodologia}</p>
                  </div>
                </div>

                {/* Compliance checklist */}
                <div className="card p-5">
                  <h2 className="text-sm font-bold text-white mb-4">Checklist de Compliance</h2>
                  <div className="space-y-3">
                    {data.esg.compliance.map(c => (
                      <div key={c.id} className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: `${statusColor(c.status)}22` }}>
                          {c.status === 'regular' ? (
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="#34d399" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                          ) : c.status === 'pendente' ? (
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="#f59e0b" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01" /></svg>
                          ) : (
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="#f87171" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white">{c.label}</p>
                          <p className="text-xs mt-0.5" style={{ color: statusColor(c.status) }}>{statusLabel(c.status)} · peso {c.peso}%</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Uso da terra */}
                  <div className="mt-5 pt-4 border-t border-white/8">
                    <p className="text-xs text-slate-500 mb-3 uppercase tracking-wider">Uso da Terra</p>
                    {[
                      { label: 'Área Consolidada', pct: data.uso.consolidadaPct, ha: data.uso.consolidadaHa, color: '#34d399' },
                      { label: 'Reserva Legal', pct: data.uso.reservaLegalPct, ha: data.uso.reservaLegalHa, color: '#60a5fa' },
                      { label: 'APP', pct: data.uso.appPct, ha: data.uso.appHa, color: '#a78bfa' },
                    ].map(u => (
                      <div key={u.label} className="mb-2">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-400">{u.label}</span>
                          <span style={{ color: u.color }}>{u.pct.toFixed(1)}% · {u.ha} ha</span>
                        </div>
                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${u.pct}%`, background: u.color }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* NDVI histórico + Zonas de expansão */}
                <div className="space-y-4">
                  <div className="card p-5">
                    <h2 className="text-sm font-bold text-white mb-1">NDVI Histórico (12m)</h2>
                    <p className="text-xs text-slate-500 mb-3">Monitoramento contínuo de vegetação</p>
                    <NdviSparkline data={data.ndviHistorico} />
                    <div className="flex justify-between text-xs text-slate-600 mt-1">
                      <span>12 meses atrás</span>
                      <span>Hoje</span>
                    </div>
                  </div>

                  <div className="card p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-sm font-bold text-white">Zonas de Expansão</h2>
                      <span className="text-xs text-emerald-400">{data.expansao.haDisponivel} ha disponíveis</span>
                    </div>
                    <div className="space-y-2">
                      {data.expansao.zonas.map(z => (
                        <div key={z.id} className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'rgba(255,255,255,.04)' }}>
                          <div>
                            <p className="text-sm text-white">{z.label}</p>
                            <p className="text-xs text-slate-500">{z.ha} ha · NDVI {z.ndviAtual.toFixed(2)}</p>
                            {z.restricao && <p className="text-xs text-amber-400">{z.restricao}</p>}
                          </div>
                          <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ background: `${potencialColor(z.potencial)}22`, color: potencialColor(z.potencial) }}>
                            {z.potencial}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-xs text-slate-600">{data.source}</span>
                <span className="text-xs text-slate-700">· {new Date(data.generatedAt).toLocaleString('pt-BR')}</span>
              </div>
            </>
          ) : (
            <div className="card p-8 text-center">
              <p className="text-slate-400">Erro ao carregar dados de expansão.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

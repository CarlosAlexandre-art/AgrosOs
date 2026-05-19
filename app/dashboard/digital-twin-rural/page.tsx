'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { usePlan } from '@/lib/hooks/usePlan'
import ProPaywall from '@/components/ProPaywall'

interface Scenario { id: string; label: string; description: string; icon: string }
interface MonthData { month: string; baseline: number; simulated: number; ndviBaseline: number; ndviSimulated: number }
interface TwinData {
  property: { id: string; name: string; declaredHa: number; hasCoords: boolean }
  scenarios: Scenario[]
  activeScenario: Scenario & { precipMultiplier: number; tempDelta: number; priceMultiplier: number }
  baseline: { precipMm: number; tempC: number; ndvi: number; yieldTha: number; revenueBRL: number }
  simulation: { precipMm: number; tempC: number; ndvi: number; yieldTha: number; revenueBRL: number; deltaRevenueBRL: number; deltaPct: number }
  months: MonthData[]
  mitigacoes: string[]
  source: string
  generatedAt: string
}

function BarChart({ months, field, baseKey, simKey, label, unit }: { months: MonthData[]; field: string; baseKey: keyof MonthData; simKey: keyof MonthData; label: string; unit: string }) {
  const allVals = months.flatMap(m => [Number(m[baseKey]), Number(m[simKey])])
  const maxVal = Math.max(...allVals, 1)
  return (
    <div>
      <p className="text-xs text-slate-500 mb-3 uppercase tracking-wider">{label}</p>
      <div className="flex items-end gap-1.5 h-20">
        {months.map(m => (
          <div key={m.month} className="flex-1 flex flex-col items-center gap-0.5">
            <div className="w-full flex gap-0.5 items-end" style={{ height: 60 }}>
              <div className="flex-1 rounded-t" style={{ height: `${(Number(m[baseKey]) / maxVal) * 60}px`, background: 'rgba(148,163,184,.3)' }} />
              <div className="flex-1 rounded-t transition-all duration-700" style={{ height: `${(Number(m[simKey]) / maxVal) * 60}px`, background: 'rgba(52,211,153,.7)' }} />
            </div>
            <span className="text-[9px] text-slate-600">{m.month}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-4 mt-2">
        <div className="flex items-center gap-1.5"><div className="w-3 h-1.5 rounded-full bg-slate-500/50" /><span className="text-xs text-slate-500">Baseline</span></div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-1.5 rounded-full" style={{ background: 'rgba(52,211,153,.7)' }} /><span className="text-xs text-emerald-400">Simulação</span></div>
      </div>
    </div>
  )
}

export default function DigitalTwinRural() {
  const { loading: planLoading, isPro } = usePlan()
  const [data, setData] = useState<TwinData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeScenario, setActiveScenario] = useState('seca_leve')
  const [switching, setSwitching] = useState(false)

  const fetchScenario = useCallback(async (id: string) => {
    setSwitching(true)
    try {
      const r = await fetch(`/api/geo/digital-twin?scenario=${id}`)
      const d = await r.json()
      setData(d)
    } finally {
      setSwitching(false)
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchScenario('seca_leve') }, [fetchScenario])

  const handleScenario = (id: string) => {
    setActiveScenario(id)
    fetchScenario(id)
  }

  if (planLoading) return null
  if (!isPro) return <ProPaywall feature="Digital Twin Rural" />

  const deltaPositive = (data?.simulation.deltaRevenueBRL ?? 0) >= 0

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #020c14 0%, #04100d 60%, #020c14 100%)' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=Inter:wght@300;400;500&display=swap');
        .twin-page { font-family: 'Inter', sans-serif; }
        .twin-title { font-family: 'Syne', sans-serif; }
        .hex-bg { background-image: radial-gradient(rgba(52,211,153,.06) 1px, transparent 1px); background-size: 20px 20px; }
        .card { background: rgba(255,255,255,.025); border: 1px solid rgba(52,211,153,.1); border-radius: 16px; }
        .scenario-card { cursor: pointer; transition: all .2s; border-radius: 12px; }
        .scenario-active { background: rgba(52,211,153,.12); border-color: rgba(52,211,153,.4) !important; }
      `}</style>

      <div className="twin-page hex-bg min-h-screen">
        <div className="max-w-6xl mx-auto px-6 py-8">

          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style={{ background: 'rgba(52,211,153,.15)', border: '1px solid rgba(52,211,153,.3)' }}>🔬</div>
                <div>
                  <h1 className="text-2xl font-bold text-white twin-title">Digital Twin Rural</h1>
                  <p className="text-xs text-slate-500 mt-0.5">Simulações de impacto financeiro e produtivo por cenário</p>
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
                <p className="text-slate-400 text-sm">Inicializando Digital Twin...</p>
              </div>
            </div>
          ) : data ? (
            <>
              {/* Scenario selector */}
              <div className="mb-6">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Selecionar Cenário</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                  {data.scenarios.map(s => (
                    <button
                      key={s.id}
                      onClick={() => handleScenario(s.id)}
                      className={`scenario-card p-3 border text-left ${activeScenario === s.id ? 'scenario-active' : 'border-white/10 hover:border-white/20'}`}
                    >
                      <div className="text-xl mb-1">{s.icon}</div>
                      <div className="text-xs font-medium text-white leading-tight">{s.label}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5 leading-tight">{s.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {switching && (
                <div className="flex items-center gap-2 mb-4 text-sm text-emerald-400">
                  <div className="w-4 h-4 border border-emerald-400 border-t-transparent rounded-full animate-spin" />
                  Simulando cenário...
                </div>
              )}

              <div className="grid md:grid-cols-3 gap-5">
                {/* Delta principal */}
                <div className="card p-6 text-center flex flex-col items-center justify-center">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-4">Impacto na Receita</p>
                  <div className={`text-5xl font-bold twin-title mb-2 transition-all duration-700 ${deltaPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                    {deltaPositive ? '+' : ''}{data.simulation.deltaPct.toFixed(1)}%
                  </div>
                  <div className={`text-lg font-medium mb-1 ${deltaPositive ? 'text-emerald-300' : 'text-red-300'}`}>
                    {deltaPositive ? '+' : ''}R$ {Math.abs(data.simulation.deltaRevenueBRL).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </div>
                  <p className="text-xs text-slate-500 mb-6">vs. baseline ({data.activeScenario.label})</p>

                  {/* Comparison grid */}
                  <div className="w-full grid grid-cols-2 gap-3">
                    {[
                      { label: 'Precipitação', base: `${data.baseline.precipMm.toFixed(0)} mm`, sim: `${data.simulation.precipMm.toFixed(0)} mm` },
                      { label: 'Temperatura', base: `${data.baseline.tempC.toFixed(1)}°C`, sim: `${data.simulation.tempC.toFixed(1)}°C` },
                      { label: 'NDVI', base: data.baseline.ndvi.toFixed(2), sim: data.simulation.ndvi.toFixed(2) },
                      { label: 'Produtividade', base: `${data.baseline.yieldTha} t/ha`, sim: `${data.simulation.yieldTha} t/ha` },
                    ].map(c => (
                      <div key={c.label} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,.04)' }}>
                        <div className="text-xs text-slate-500 mb-1">{c.label}</div>
                        <div className="text-sm text-slate-300 line-through opacity-60">{c.base}</div>
                        <div className="text-sm font-bold text-white">{c.sim}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Charts */}
                <div className="card p-5 space-y-5">
                  <BarChart months={data.months} field="precip" baseKey="baseline" simKey="simulated" label="Precipitação (mm/mês)" unit="mm" />
                  <BarChart months={data.months} field="ndvi" baseKey="ndviBaseline" simKey="ndviSimulated" label="NDVI por mês" unit="" />
                </div>

                {/* Mitigation */}
                <div className="card p-5">
                  <h2 className="text-sm font-bold text-white mb-4">Ações de Mitigação</h2>
                  {data.mitigacoes.length > 0 ? (
                    <div className="space-y-3">
                      {data.mitigacoes.map((m, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: 'rgba(52,211,153,.06)', border: '1px solid rgba(52,211,153,.12)' }}>
                          <div className="w-5 h-5 rounded-full bg-emerald-400/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-xs font-bold text-emerald-400">{i + 1}</span>
                          </div>
                          <p className="text-sm text-slate-300 leading-relaxed">{m}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: 'rgba(52,211,153,.08)' }}>
                      <span className="text-2xl">✅</span>
                      <div>
                        <p className="text-sm font-medium text-emerald-400">Cenário favorável</p>
                        <p className="text-xs text-slate-500">Sem ações urgentes necessárias</p>
                      </div>
                    </div>
                  )}

                  <div className="mt-5 pt-4 border-t border-white/8">
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Receita Projetada</p>
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-xs text-slate-500">Baseline</span>
                      <span className="text-base font-bold text-slate-300">R$ {data.baseline.revenueBRL.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</span>
                    </div>
                    <div className="flex justify-between items-end">
                      <span className="text-xs text-emerald-400">Com cenário</span>
                      <span className={`text-xl font-bold ${deltaPositive ? 'text-emerald-400' : 'text-red-400'}`}>R$ {data.simulation.revenueBRL.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-xs text-slate-600">{data.source}</span>
              </div>
            </>
          ) : (
            <div className="card p-8 text-center">
              <p className="text-slate-400">Erro ao carregar Digital Twin.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

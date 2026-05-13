'use client'

import { useState, useEffect } from 'react'
import HowToUse from '../../../components/HowToUse'
import ProPaywall from '../../../components/ProPaywall'
import { usePlan } from '../../../lib/hooks/usePlan'

type MonthData = {
  month: string
  ndviProxy: number
  precip: number
  et0: number
  temp: number
}

type VegeData = {
  property: { name: string; lat: number; lng: number; sizeHectares: number }
  currentNdvi: number
  avgNdvi: number
  classification: { label: string; color: string; description: string }
  months: MonthData[]
}

const MONTH_LABELS: Record<string, string> = {
  '01':'Jan','02':'Fev','03':'Mar','04':'Abr','05':'Mai','06':'Jun',
  '07':'Jul','08':'Ago','09':'Set','10':'Out','11':'Nov','12':'Dez',
}

function ndviColor(v: number): string {
  if (v >= 0.7) return '#15803d'
  if (v >= 0.5) return '#22c55e'
  if (v >= 0.35) return '#84cc16'
  if (v >= 0.2) return '#f59e0b'
  return '#ef4444'
}

function ndviBg(v: number): string {
  if (v >= 0.7) return 'rgba(21,128,61,0.15)'
  if (v >= 0.5) return 'rgba(34,197,94,0.12)'
  if (v >= 0.35) return 'rgba(132,204,22,0.12)'
  if (v >= 0.2) return 'rgba(245,158,11,0.12)'
  return 'rgba(239,68,68,0.12)'
}

function NdviGauge({ value }: { value: number }) {
  const pct = Math.round(value * 100)
  const color = ndviColor(value)
  // SVG arc gauge
  const r = 54; const cx = 64; const cy = 64
  const startAngle = 200; const endAngle = 340
  const range = endAngle - startAngle
  const angle = startAngle + range * value
  const toRad = (a: number) => (a - 90) * Math.PI / 180
  const arcX = (a: number) => cx + r * Math.cos(toRad(a))
  const arcY = (a: number) => cy + r * Math.sin(toRad(a))
  const largeArc = range * value > 180 ? 1 : 0

  return (
    <svg viewBox="0 0 128 80" className="w-full max-w-[200px]">
      {/* Track */}
      <path
        d={`M${arcX(startAngle)} ${arcY(startAngle)} A${r} ${r} 0 1 1 ${arcX(endAngle)} ${arcY(endAngle)}`}
        fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" strokeLinecap="round"
      />
      {/* Value arc */}
      {value > 0.02 && (
        <path
          d={`M${arcX(startAngle)} ${arcY(startAngle)} A${r} ${r} 0 ${largeArc} 1 ${arcX(angle)} ${arcY(angle)}`}
          fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
        />
      )}
      <text x={cx} y={cy - 2} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="20" fontWeight="800">
        {pct}
      </text>
      <text x={cx} y={cy + 16} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="9">
        NDVI PROXY
      </text>
    </svg>
  )
}

function VegetacaoContent() {
  const [data, setData] = useState<VegeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [hoveredMonth, setHoveredMonth] = useState<MonthData | null>(null)

  useEffect(() => {
    fetch('/api/vegetacao')
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error)
        else setData(d)
      })
      .catch(() => setError('Erro de rede'))
      .finally(() => setLoading(false))
  }, [])

  const maxBar = data ? Math.max(...data.months.map(m => m.ndviProxy)) : 1
  const currentColor = data ? ndviColor(data.currentNdvi) : '#22c55e'
  const currentBg = data ? ndviBg(data.currentNdvi) : 'rgba(34,197,94,0.12)'

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg, #051a0a 0%, #0a1f10 50%, #061510 100%)' }}>
      {/* Header */}
      <div className="border-b px-6 py-5" style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(5,26,10,0.6)' }}>
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)' }}>
              <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Índice de Vegetação</h1>
              <p className="text-xs text-slate-500">Green View Index · NDVI proxy via Open-Meteo</p>
            </div>
          </div>
          {data && (
            <div className="hidden sm:block text-right">
              <div className="text-xs text-slate-500">{data.property.name}</div>
              <div className="text-xs font-mono text-slate-400">{data.property.lat.toFixed(4)}°, {data.property.lng.toFixed(4)}°</div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6 space-y-5">
        <HowToUse
          storageKey="vegetacao"
          title="Índice de Vegetação (NDVI Proxy)"
          subtitle="Monitoramento da saúde da vegetação via balanço hídrico · Open-Meteo"
          theme="dark"
          accentColor="#22c55e"
          steps={[
            { icon: '🌧️', title: 'Dados automáticos', description: 'Precipitação e evapotranspiração (ET₀) dos últimos 12 meses são buscados automaticamente das coordenadas da sua propriedade.' },
            { icon: '📊', title: 'Cálculo do NDVI proxy', description: 'O balanço hídrico mensal (chuva ÷ ET₀) é normalizado para gerar um índice de vegetação sem precisar de imagens de satélite NIR.' },
            { icon: '📈', title: 'Analise a tendência', description: 'O gráfico de barras mostra a evolução mensal. Barras verdes indicam vegetação saudável; amarelas/vermelhas indicam estresse hídrico.' },
            { icon: '💧', title: 'Balanço hídrico', description: 'A seção inferior compara chuva vs ET₀ mês a mês. Quando ET₀ supera chuva, a vegetação sofre déficit hídrico.' },
          ]}
          tip="O NDVI proxy é calculado com dados climáticos reais como substituto do índice espectral. Para NDVI real, você precisaria de imagens multiespectrais NIR."
        />

        {loading && (
          <div className="flex items-center justify-center py-24">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full border-2 border-emerald-500/30 border-t-emerald-500 animate-spin mx-auto mb-4" />
              <p className="text-sm text-slate-400">Carregando dados de vegetação...</p>
            </div>
          </div>
        )}

        {error === 'SEM_COORDENADAS' && (
          <div className="rounded-2xl p-8 text-center border" style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.1)' }}>
            <div className="text-4xl mb-3">📍</div>
            <p className="text-sm font-semibold text-white">Propriedade sem coordenadas</p>
            <p className="text-xs text-slate-400 mt-1">Defina a localização na página Mapa primeiro</p>
          </div>
        )}

        {data && (
          <>
            {/* Current status */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Gauge card */}
              <div className="rounded-2xl p-5 flex flex-col items-center border" style={{ background: currentBg, borderColor: `${currentColor}30` }}>
                <NdviGauge value={data.currentNdvi} />
                <div className="mt-2 text-center">
                  <div className="text-base font-bold" style={{ color: currentColor }}>{data.classification.label}</div>
                  <div className="text-xs text-slate-400 mt-0.5 max-w-[160px] text-center leading-tight">{data.classification.description}</div>
                </div>
              </div>

              {/* Stats */}
              <div className="sm:col-span-2 grid grid-cols-2 gap-3">
                {[
                  { label: 'NDVI Atual', value: data.currentNdvi.toFixed(3), sub: 'Mês atual', color: currentColor },
                  { label: 'Média 12 meses', value: data.avgNdvi.toFixed(3), sub: 'Histórico anual', color: '#94a3b8' },
                  { label: 'Precipitação', value: `${data.months[data.months.length-1]?.precip.toFixed(0)} mm`, sub: 'Mês atual', color: '#38bdf8' },
                  { label: 'Temperatura', value: `${data.months[data.months.length-1]?.temp.toFixed(1)}°C`, sub: 'Média mensal', color: '#fb923c' },
                ].map(stat => (
                  <div key={stat.label} className="rounded-xl p-4 border" style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}>
                    <div className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</div>
                    <div className="text-xs font-semibold text-white mt-0.5">{stat.label}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{stat.sub}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Monthly NDVI chart */}
            <div className="rounded-2xl p-5 border" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' }}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-semibold text-white">NDVI mensal — últimos 12 meses</h3>
                {hoveredMonth && (
                  <div className="text-xs font-mono px-3 py-1 rounded-lg" style={{ background: `${ndviColor(hoveredMonth.ndviProxy)}20`, color: ndviColor(hoveredMonth.ndviProxy) }}>
                    {MONTH_LABELS[hoveredMonth.month.substring(5,7)]}/{hoveredMonth.month.substring(0,4)} · {hoveredMonth.ndviProxy.toFixed(3)}
                  </div>
                )}
              </div>

              <div className="flex items-end gap-1.5 h-36">
                {data.months.map((m, i) => {
                  const monthKey = m.month.substring(5, 7)
                  const barH = Math.max(4, (m.ndviProxy / maxBar) * 100)
                  const color = ndviColor(m.ndviProxy)
                  const isLast = i === data.months.length - 1
                  return (
                    <div
                      key={m.month}
                      className="flex-1 flex flex-col items-center gap-1 cursor-pointer group"
                      onMouseEnter={() => setHoveredMonth(m)}
                      onMouseLeave={() => setHoveredMonth(null)}
                    >
                      <div className="relative w-full flex items-end justify-center" style={{ height: '100px' }}>
                        <div
                          className="w-full rounded-t-lg transition-all group-hover:opacity-100"
                          style={{
                            height: `${barH}%`,
                            background: `linear-gradient(to top, ${color}cc, ${color}66)`,
                            opacity: isLast ? 1 : 0.7,
                            border: isLast ? `1px solid ${color}` : '1px solid transparent',
                          }}
                        />
                      </div>
                      <div className="text-[9px] font-semibold" style={{ color: isLast ? color : '#475569' }}>
                        {MONTH_LABELS[monthKey]}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Precip vs ET0 balance */}
            <div className="rounded-2xl p-5 border" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' }}>
              <h3 className="text-sm font-semibold text-white mb-4">Balanço hídrico mensal</h3>
              <div className="space-y-2.5">
                {data.months.slice(-6).map(m => {
                  const monthKey = m.month.substring(5, 7)
                  const maxVal = Math.max(m.precip, m.et0, 1)
                  return (
                    <div key={m.month} className="flex items-center gap-3">
                      <div className="text-[10px] font-mono text-slate-500 w-8 flex-shrink-0">
                        {MONTH_LABELS[monthKey]}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="w-16 text-[9px] text-blue-400">Chuva</div>
                          <div className="flex-1 bg-white/5 rounded-full h-1.5 overflow-hidden">
                            <div className="h-full rounded-full bg-blue-400" style={{ width: `${(m.precip / maxVal) * 100}%` }} />
                          </div>
                          <div className="text-[9px] font-mono text-slate-400 w-14 text-right">{m.precip.toFixed(0)} mm</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-16 text-[9px] text-orange-400">ET₀</div>
                          <div className="flex-1 bg-white/5 rounded-full h-1.5 overflow-hidden">
                            <div className="h-full rounded-full bg-orange-400" style={{ width: `${(m.et0 / maxVal) * 100}%` }} />
                          </div>
                          <div className="text-[9px] font-mono text-slate-400 w-14 text-right">{m.et0.toFixed(0)} mm</div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function VegetacaoPage() {
  const { loading, isPro } = usePlan()
  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-slate-200 border-t-[#16a34a] rounded-full animate-spin" /></div>
  if (!isPro) return <ProPaywall icon="🌿" feature="Índice Vegetal (NDVI)" desc="Monitore a saúde da vegetação com proxy NDVI baseado em dados climáticos mensais integrados à sua propriedade." />
  return <VegetacaoContent />
}

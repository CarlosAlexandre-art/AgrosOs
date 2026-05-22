'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface DayForecast {
  date: string; tMax: number; tMin: number; precip: number; rainPct: number; code: number; label: string; icon: string
}
interface HistDay { date: string; precip: number; tMax: number; tMin: number }
interface Insight  { type: 'warning' | 'info' | 'ok'; text: string }
interface WeatherData {
  property: string; lat: number; lng: number
  current: { temp: number; windspeed: number; humidity: number | null; label: string; icon: string }
  days: DayForecast[]; history: HistDay[]
  summary: { totalRain30d: number; rainDays30d: number }
  insights: Insight[]
  updatedAt: string
}

const DAY_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

function dayLabel(dateStr: string, idx: number) {
  if (idx === 0) return 'Hoje'
  if (idx === 1) return 'Amanhã'
  return DAY_SHORT[new Date(dateStr + 'T12:00:00').getDay()]
}

type NasaData = {
  soil: { percent: number | null; label: string; color: string; level: number }
  precipitation: { total30d: number; byDay: { date: string; mm: number }[] }
  temperature: { avg30d: number | null }
  fires: { count: number; closest: { distKm: number; date: string; confidence: string } | null; hasKey: boolean }
  source: string
  updatedAt: string
}

type GpmData = {
  hasKey: boolean
  days: { date: string; mm: number | null }[]
  summary: { total10d: number; maxDay: { date: string; mm: number } | null; validDays: number }
  resolution: string
  source: string
  updatedAt: string
}

export default function ClimaPage() {
  const [data, setData] = useState<WeatherData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [sim, setSim] = useState<any>(null)
  const [loadingSim, setLoadingSim] = useState(false)
  const [nasa, setNasa] = useState<NasaData | null>(null)
  const [nasaLoading, setNasaLoading] = useState(true)
  const [gpm, setGpm] = useState<GpmData | null>(null)
  const [gpmLoading, setGpmLoading] = useState(true)

  async function simularFisica() {
    setLoadingSim(true)
    try {
      const res = await fetch('/api/ai/clima-simulacao')
      if (res.ok) setSim(await res.json())
    } finally {
      setLoadingSim(false)
    }
  }

  useEffect(() => {
    fetch('/api/clima')
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error)
        else setData(d)
      })
      .catch(() => setError('Falha de conexão'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetch('/api/nasa/earth-data')
      .then(r => r.json())
      .then(d => { if (!d.error) setNasa(d) })
      .catch(() => {})
      .finally(() => setNasaLoading(false))
  }, [])

  useEffect(() => {
    fetch('/api/nasa/gpm')
      .then(r => r.json())
      .then(d => setGpm(d))
      .catch(() => setGpm({ hasKey: false, days: [], summary: { total10d: 0, maxDay: null, validDays: 0 }, resolution: '', source: '', updatedAt: '' }))
      .finally(() => setGpmLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-[#0369a1] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-500">Buscando dados climáticos...</p>
        </div>
      </div>
    )
  }

  if (error === 'SEM_COORDENADAS') {
    return (
      <div className="p-6 max-w-lg mx-auto mt-12 text-center">
        <div className="text-5xl mb-4">📍</div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Localização da fazenda não definida</h2>
        <p className="text-slate-500 text-sm mb-4">Para ver os dados climáticos, primeiro marque a localização da sua fazenda no mapa.</p>
        <Link href="/dashboard/mapa" className="inline-flex items-center gap-2 bg-[#16a34a] text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-[#15803d] transition-colors text-sm">
          Ir para o Mapa →
        </Link>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="p-6 max-w-lg mx-auto mt-12 text-center">
        <div className="text-5xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Erro ao carregar clima</h2>
        <p className="text-slate-500 text-sm">{error ?? 'Tente novamente em instantes.'}</p>
      </div>
    )
  }

  const today = data.days[0]
  const updatedAt = new Date(data.updatedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="p-6 space-y-5 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Clima</h1>
          <p className="text-sm text-slate-500 mt-0.5">{data.property} · atualizado às {updatedAt}</p>
        </div>
      </div>

      {/* Insights */}
      {data.insights.length > 0 && (
        <div className="space-y-2">
          {data.insights.map((ins, i) => (
            <div key={i} className={`flex items-start gap-3 px-4 py-3 rounded-xl text-sm font-medium ${
              ins.type === 'warning' ? 'bg-amber-50 border border-amber-200 text-amber-800' :
              ins.type === 'ok'      ? 'bg-green-50 border border-green-200 text-green-800' :
                                       'bg-sky-50 border border-sky-200 text-sky-800'
            }`}>
              <span className="text-base flex-shrink-0">
                {ins.type === 'warning' ? '⚠️' : ins.type === 'ok' ? '✅' : 'ℹ️'}
              </span>
              {ins.text}
            </div>
          ))}
        </div>
      )}

      {/* Current + Today */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Current conditions */}
        <div className="bg-gradient-to-br from-[#0c4a6e] to-[#075985] rounded-2xl p-5 text-white shadow-lg">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="text-6xl font-black leading-none">{data.current.temp}°</div>
              <div className="text-sky-200 text-sm mt-1">{data.current.label}</div>
            </div>
            <div className="text-5xl">{data.current.icon}</div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-white/10 rounded-xl py-2">
              <div className="text-xs text-sky-300 mb-0.5">Máx/Mín</div>
              <div className="text-sm font-bold">{today.tMax}°/{today.tMin}°</div>
            </div>
            <div className="bg-white/10 rounded-xl py-2">
              <div className="text-xs text-sky-300 mb-0.5">Umidade</div>
              <div className="text-sm font-bold">{data.current.humidity != null ? `${data.current.humidity}%` : '—'}</div>
            </div>
            <div className="bg-white/10 rounded-xl py-2">
              <div className="text-xs text-sky-300 mb-0.5">Vento</div>
              <div className="text-sm font-bold">{data.current.windspeed} km/h</div>
            </div>
          </div>
        </div>

        {/* 30-day summary */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h3 className="text-sm font-bold text-slate-700 mb-4">Últimos 30 dias</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-100 flex items-center justify-center text-xl">🌧️</div>
                <div>
                  <div className="text-xs text-slate-500">Chuva acumulada</div>
                  <div className="text-xl font-black text-slate-800">{data.summary.totalRain30d} <span className="text-sm font-semibold text-slate-400">mm</span></div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-500">Dias com chuva</div>
                <div className="text-xl font-black text-slate-800">{data.summary.rainDays30d} <span className="text-sm font-semibold text-slate-400">dias</span></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>Nível de chuva no mês</span>
                <span>{data.summary.totalRain30d < 50 ? 'Seco' : data.summary.totalRain30d < 120 ? 'Normal' : 'Úmido'}</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-sky-500 transition-all" style={{ width: `${Math.min(100, (data.summary.totalRain30d / 200) * 100)}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 7-day forecast */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-700">Previsão — 7 dias</h3>
        </div>
        <div className="grid grid-cols-7 divide-x divide-slate-100">
          {data.days.map((d, i) => (
            <div key={d.date} className={`px-2 py-4 text-center ${i === 0 ? 'bg-sky-50/60' : ''}`}>
              <div className="text-[10px] font-semibold text-slate-500 mb-1.5">{dayLabel(d.date, i)}</div>
              <div className="text-2xl mb-1.5">{d.icon}</div>
              <div className="text-xs font-bold text-slate-700">{d.tMax}°</div>
              <div className="text-[10px] text-slate-400 mb-1.5">{d.tMin}°</div>
              {d.rainPct > 20 && (
                <div className="text-[9px] text-sky-600 font-semibold bg-sky-50 rounded-full px-1 py-0.5">
                  {d.rainPct}%
                </div>
              )}
              {d.precip > 0 && (
                <div className="text-[9px] text-slate-400 mt-0.5">{d.precip}mm</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Simulação Física — PhysicsNeMo-inspired */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <div className="font-bold text-slate-800">🌡️ Simulação Física (ET₀ + Balanço Hídrico)</div>
            <div className="text-xs text-slate-400">Hargreaves FAO-56 + NVIDIA NIM</div>
          </div>
          <button
            onClick={simularFisica}
            disabled={loadingSim}
            className="text-xs font-bold bg-sky-600 text-white px-3 py-1.5 rounded-xl hover:bg-sky-700 transition disabled:opacity-50"
          >
            {loadingSim ? '⏳ Simulando...' : '⚡ Simular'}
          </button>
        </div>
        {sim && (
          <div className="p-5 space-y-4">
            {/* Resumo */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-sky-50 rounded-xl py-3">
                <div className="text-lg font-bold text-sky-700">{sim.resumo.totalEtc} mm</div>
                <div className="text-[10px] text-sky-500">ETc 7 dias (Kc {sim.kc})</div>
              </div>
              <div className="bg-blue-50 rounded-xl py-3">
                <div className="text-lg font-bold text-blue-700">{sim.resumo.totalPrecip} mm</div>
                <div className="text-[10px] text-blue-500">Precipitação 7 dias</div>
              </div>
              <div className={`rounded-xl py-3 ${sim.resumo.deficitTotal > 0 ? 'bg-red-50' : 'bg-green-50'}`}>
                <div className={`text-lg font-bold ${sim.resumo.deficitTotal > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {sim.resumo.deficitTotal > 0 ? `-${sim.resumo.deficitTotal}` : '✓'} {sim.resumo.deficitTotal > 0 ? 'mm' : 'OK'}
                </div>
                <div className={`text-[10px] ${sim.resumo.deficitTotal > 0 ? 'text-red-400' : 'text-green-500'}`}>
                  {sim.resumo.deficitTotal > 0 ? `déficit · ${sim.resumo.diasEstresse}d estresse` : 'sem déficit'}
                </div>
              </div>
            </div>
            {/* Dias */}
            <div className="grid grid-cols-7 gap-1">
              {sim.dias.map((d: any, i: number) => (
                <div key={i} className={`rounded-lg p-2 text-center text-[10px] ${
                  d.estresse === 'alto' ? 'bg-red-50 border border-red-200'
                  : d.estresse === 'moderado' ? 'bg-amber-50 border border-amber-200'
                  : 'bg-slate-50 border border-slate-100'
                }`}>
                  <div className="font-semibold text-slate-600">{new Date(d.date + 'T12:00:00').getDate()}/{new Date(d.date + 'T12:00:00').getMonth() + 1}</div>
                  <div className="text-sky-600 font-bold mt-1">{d.et0}mm</div>
                  <div className="text-slate-400">ET₀</div>
                  <div className={`mt-1 font-semibold ${d.balance >= 0 ? 'text-green-600' : 'text-red-500'}`}>{d.balance > 0 ? '+' : ''}{d.balance}</div>
                </div>
              ))}
            </div>
            {/* Análise NIM */}
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3">
              <div className="text-xs font-bold text-indigo-600 mb-1">🤖 Recomendação agronômica</div>
              <p className="text-sm text-slate-700 whitespace-pre-line">{sim.analiseIA}</p>
              <p className="text-[10px] text-slate-400 mt-2">{sim.modelo}</p>
            </div>
          </div>
        )}
      </div>

      {/* Rainfall history chart */}
      {data.history.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h3 className="text-sm font-bold text-slate-700 mb-4">Precipitação diária — últimos 30 dias (mm)</h3>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={data.history} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis
                dataKey="date"
                tick={{ fontSize: 9, fill: '#94a3b8' }}
                tickFormatter={v => {
                  const d = new Date(v + 'T12:00:00')
                  return `${d.getDate()}/${d.getMonth() + 1}`
                }}
                interval={4}
              />
              <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} />
              <Tooltip
                formatter={(v: any) => [`${v} mm`, 'Chuva']}
                labelFormatter={(v: any) => new Date(v + 'T12:00:00').toLocaleDateString('pt-BR')}
                contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e2e8f0' }}
              />
              <Bar dataKey="precip" radius={[3, 3, 0, 0]}>
                {data.history.map((d, i) => (
                  <Cell key={i} fill={d.precip > 10 ? '#0369a1' : d.precip > 0 ? '#7dd3fc' : '#e2e8f0'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="text-[10px] text-slate-400 mt-2 text-center">
            Fonte: Open-Meteo Archive · Coordenadas {data.lat.toFixed(3)}, {data.lng.toFixed(3)}
          </p>
        </div>
      )}

      {/* ── NASA Earth Intelligence ─────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="bg-[#0b3d91] px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🛰️</span>
            <div>
              <div className="text-white font-bold text-sm">NASA Earth Intelligence</div>
              <div className="text-blue-200 text-[10px] mt-0.5">POWER (MERRA-2) + FIRMS VIIRS · satélite real</div>
            </div>
          </div>
          {nasa && (
            <div className="text-[10px] text-blue-300 font-mono text-right">
              <div>atualizado</div>
              <div>{new Date(nasa.updatedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
          )}
        </div>

        <div className="p-5 space-y-5">
          {nasaLoading ? (
            <div className="flex items-center gap-3 py-4">
              <div className="w-5 h-5 border-2 border-[#0b3d91] border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-slate-400">Consultando satélites NASA...</span>
            </div>
          ) : !nasa ? (
            <p className="text-sm text-slate-400 py-4 text-center">Dados NASA indisponíveis (adicione coordenadas à fazenda).</p>
          ) : (
            <>
              {/* Métricas principais */}
              <div className="grid grid-cols-3 gap-3">
                {/* Umidade do solo */}
                <div className={`rounded-2xl p-4 text-center ${
                  nasa.soil.color === 'red'    ? 'bg-red-50 border border-red-200' :
                  nasa.soil.color === 'orange' ? 'bg-orange-50 border border-orange-200' :
                  nasa.soil.color === 'green'  ? 'bg-green-50 border border-green-200' :
                  nasa.soil.color === 'blue'   ? 'bg-blue-50 border border-blue-200' :
                  nasa.soil.color === 'indigo' ? 'bg-indigo-50 border border-indigo-200' :
                  'bg-slate-50 border border-slate-200'
                }`}>
                  <div className="text-2xl mb-1">🌱</div>
                  <div className={`text-2xl font-black ${
                    nasa.soil.color === 'red'    ? 'text-red-600' :
                    nasa.soil.color === 'orange' ? 'text-orange-600' :
                    nasa.soil.color === 'green'  ? 'text-green-700' :
                    nasa.soil.color === 'blue'   ? 'text-blue-700' :
                    nasa.soil.color === 'indigo' ? 'text-indigo-700' :
                    'text-slate-500'
                  }`}>
                    {nasa.soil.percent !== null ? `${nasa.soil.percent}%` : '—'}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5 font-semibold">{nasa.soil.label}</div>
                  <div className="text-[9px] text-slate-400 mt-0.5">Umidade Solo</div>
                </div>

                {/* Chuva 30 dias */}
                <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 text-center">
                  <div className="text-2xl mb-1">🌧️</div>
                  <div className="text-2xl font-black text-sky-700">
                    {nasa.precipitation.total30d > 0 ? `${nasa.precipitation.total30d}` : '0'}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5 font-semibold">mm acumulado</div>
                  <div className="text-[9px] text-slate-400 mt-0.5">Chuva 30 dias</div>
                </div>

                {/* Temp média */}
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
                  <div className="text-2xl mb-1">🌡️</div>
                  <div className="text-2xl font-black text-amber-700">
                    {nasa.temperature.avg30d !== null ? `${nasa.temperature.avg30d}°` : '—'}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5 font-semibold">Temperatura</div>
                  <div className="text-[9px] text-slate-400 mt-0.5">Média 30 dias</div>
                </div>
              </div>

              {/* Gráfico de chuva NASA */}
              {nasa.precipitation.byDay.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-slate-600 mb-2">Precipitação diária · últimos 14 dias (NASA POWER)</div>
                  <ResponsiveContainer width="100%" height={110}>
                    <BarChart data={nasa.precipitation.byDay} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                      <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#94a3b8' }} interval={3} />
                      <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} />
                      <Tooltip
                        formatter={(v: any) => [`${v} mm`, 'Chuva']}
                        contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e2e8f0' }}
                      />
                      <Bar dataKey="mm" radius={[3, 3, 0, 0]}>
                        {nasa.precipitation.byDay.map((d, i) => (
                          <Cell key={i} fill={d.mm > 10 ? '#0369a1' : d.mm > 0 ? '#7dd3fc' : '#e2e8f0'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Focos de incêndio */}
              <div className={`rounded-xl px-4 py-3 flex items-start gap-3 ${
                nasa.fires.count > 0
                  ? 'bg-red-50 border border-red-200'
                  : 'bg-green-50 border border-green-200'
              }`}>
                <span className="text-xl flex-shrink-0 mt-0.5">{nasa.fires.count > 0 ? '🔥' : '✅'}</span>
                <div className="flex-1 min-w-0">
                  {nasa.fires.count === 0 ? (
                    <>
                      <div className="text-sm font-semibold text-green-700">Nenhum foco de incêndio</div>
                      <div className="text-xs text-green-600 mt-0.5">
                        {nasa.fires.hasKey
                          ? 'Raio de 200 km monitorado · últimos 7 dias (VIIRS SNPP)'
                          : 'Adicione NASA_FIRMS_KEY para monitorar focos de incêndio'}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-sm font-semibold text-red-700">
                        {nasa.fires.count} foco{nasa.fires.count > 1 ? 's' : ''} detectado{nasa.fires.count > 1 ? 's' : ''} em 200 km
                      </div>
                      {nasa.fires.closest && (
                        <div className="text-xs text-red-600 mt-0.5">
                          Mais próximo: <strong>{nasa.fires.closest.distKm} km</strong> · {nasa.fires.closest.date} · confiança {nasa.fires.closest.confidence}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Indicador de nível de umidade */}
              {nasa.soil.percent !== null && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-slate-600">Saturação do solo</span>
                    <span className="text-xs text-slate-400 font-mono">{nasa.soil.percent}% · {nasa.soil.label}</span>
                  </div>
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        nasa.soil.color === 'red'    ? 'bg-red-500' :
                        nasa.soil.color === 'orange' ? 'bg-orange-500' :
                        nasa.soil.color === 'green'  ? 'bg-green-500' :
                        nasa.soil.color === 'blue'   ? 'bg-blue-500' :
                        'bg-indigo-600'
                      }`}
                      style={{ width: `${Math.min(nasa.soil.percent, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[9px] text-slate-400 mt-1">
                    <span>Seco</span><span>Normal</span><span>Saturado</span>
                  </div>
                </div>
              )}

              <p className="text-[10px] text-slate-400">
                Fonte: {nasa.source}
              </p>
            </>
          )}
        </div>
      </div>

      {/* ── NASA GPM IMERG ────────────────────────────────────────────────── */}
      {(gpm || gpmLoading) && (
        <div className="mt-6 bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 flex items-center justify-between"
            style={{ background: 'linear-gradient(135deg, #0c4a6e 0%, #075985 100%)' }}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">🌧️</span>
              <div>
                <div className="text-white font-bold text-sm">NASA GPM IMERG</div>
                <div className="text-sky-200 text-[10px] mt-0.5">Late Daily Run V07B · 0.1° (~11 km) · satélite real</div>
              </div>
            </div>
            {gpm && (
              <div className="text-right text-sky-300 text-[10px]">
                <div>Atualizado</div>
                <div>{new Date(gpm.updatedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
              </div>
            )}
          </div>

          <div className="p-5">
            {gpmLoading ? (
              <div className="flex items-center gap-2 py-2">
                <div className="w-4 h-4 border-2 border-sky-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                <span className="text-sm text-slate-400">Consultando satélite GPM...</span>
              </div>
            ) : !gpm ? (
              <p className="text-sm text-slate-400 text-center py-2">
                Adicione <code className="bg-slate-100 px-1 rounded text-xs">EARTHDATA_TOKEN</code> no Vercel para ativar o GPM IMERG.
              </p>
            ) : (
              <>
                {/* Métricas resumo */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-sky-50 border border-sky-100 rounded-xl p-3 text-center">
                    <div className="text-2xl font-bold text-sky-700">{gpm.summary.total10d}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5 font-semibold">mm · 10 dias</div>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center">
                    <div className="text-2xl font-bold text-slate-700">{gpm.summary.validDays}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5 font-semibold">dias com dados</div>
                  </div>
                  <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 text-center">
                    <div className="text-xl font-bold text-indigo-700">
                      {gpm.summary.maxDay ? `${gpm.summary.maxDay.mm} mm` : '—'}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5 font-semibold">
                      {gpm.summary.maxDay ? `pico ${gpm.summary.maxDay.date}` : 'sem pico'}
                    </div>
                  </div>
                </div>

                {/* Gráfico de barras diário */}
                {gpm.days.filter(d => d.mm !== null).length > 0 && (
                  <div>
                    <div className="text-xs font-semibold text-slate-600 mb-2">Precipitação diária · últimos 10 dias (GPM IMERG)</div>
                    <ResponsiveContainer width="100%" height={90}>
                      <BarChart data={gpm.days} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                        <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                        <Tooltip
                          formatter={(v: number | null) => v !== null ? [`${v} mm`, 'Chuva'] : ['—', 'Chuva']}
                          contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e2e8f0' }}
                        />
                        <Bar dataKey="mm" radius={[3, 3, 0, 0]}>
                          {gpm.days.map((d, i) => (
                            <Cell key={i} fill={d.mm !== null && d.mm > 10 ? '#0284c7' : d.mm !== null && d.mm > 0 ? '#7dd3fc' : '#e2e8f0'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                <p className="text-[10px] text-slate-400 mt-3">Fonte: {gpm.source}</p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

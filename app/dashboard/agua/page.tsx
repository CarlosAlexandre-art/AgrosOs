'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'

// ─── Types ───────────────────────────────────────────────────────────────────
interface AnalysisResult {
  level: string
  label: string
  color: string
  description: string
  agroRateImpact: number
  total: number
  scores: Record<string, number>
  inputs: Record<string, string>
  calculatedAt: string
}

interface HBVDay { date: string; precip: number; temp: number; smPct: number; et: number; deficit: boolean }
interface HBVSummary {
  deficitDays30d: number
  avgSmPct30d: number
  currentSmPct: number
  currentSm: number
  FC: number
  totalPrecip30d: number
  totalRunoffMm30d: number
  irrigationStatus: 'OK' | 'ALERTA' | 'CRÍTICO'
  irrigationNote: string
}
interface HBVData {
  property: string
  params: { soilType: string; landUse: string; FC: number; areaKm2: number }
  days: HBVDay[]
  summary: HBVSummary
  updatedAt: string
}

// ─── Question definitions ─────────────────────────────────────────────────────
const QUESTIONS = [
  {
    id: 'solo',
    title: 'Qual é o tipo de solo predominante na propriedade?',
    icon: '🌱',
    options: [
      { value: 'areia',          label: 'Arenoso',              desc: 'Areia ou areia franca — drena muito rápido' },
      { value: 'franco_arenoso', label: 'Franco-arenoso',       desc: 'Textura leve, drenagem moderada-alta' },
      { value: 'franco',         label: 'Franco',               desc: 'Solo equilibrado, drenagem moderada' },
      { value: 'franco_argiloso',label: 'Franco-argiloso',      desc: 'Mais pesado, retém água com facilidade' },
      { value: 'argiloso',       label: 'Argiloso',             desc: 'Solo pesado, baixa drenagem, alta retenção' },
    ],
  },
  {
    id: 'recarga',
    title: 'Como você estimaria a infiltração de água na sua região?',
    icon: '🌧️',
    options: [
      { value: 'muito_alta', label: 'Muito alta',  desc: 'Chuvas frequentes e solo absorve bastante (> 400 mm/ano de recarga)' },
      { value: 'alta',       label: 'Alta',        desc: 'Boa infiltração, região úmida (200–400 mm/ano)' },
      { value: 'media',      label: 'Média',       desc: 'Infiltração moderada, região semi-árida (100–200 mm/ano)' },
      { value: 'baixa',      label: 'Baixa',       desc: 'Pouca recarga, região árida ou solo impermeável (< 100 mm/ano)' },
    ],
  },
  {
    id: 'geologia',
    title: 'Qual é a formação geológica principal da área?',
    icon: '⛰️',
    options: [
      { value: 'areia_cascalho', label: 'Areia e cascalho',      desc: 'Sedimento granular solto — alta permeabilidade' },
      { value: 'arenito',        label: 'Arenito',               desc: 'Rocha sedimentar — permeabilidade média' },
      { value: 'basalto',        label: 'Basalto',               desc: 'Rocha vulcânica, pode ter fraturas' },
      { value: 'cristalino',     label: 'Granito / Cristalino',  desc: 'Rocha dura, baixa permeabilidade' },
      { value: 'argila_silte',   label: 'Argila e silte',        desc: 'Sedimento fino — alta proteção do aquífero' },
    ],
  },
  {
    id: 'profundidade',
    title: 'A que profundidade fica o lençol freático (água subterrânea)?',
    icon: '💧',
    options: [
      { value: 'menos_5m',  label: 'Menos de 5 m',  desc: 'Muito superficial — aparece em poços rasos facilmente' },
      { value: 'de_5_15m',  label: 'Entre 5 e 15 m', desc: 'Profundidade moderada' },
      { value: 'de_15_30m', label: 'Entre 15 e 30 m', desc: 'Relativamente profundo' },
      { value: 'mais_30m',  label: 'Mais de 30 m',   desc: 'Profundo — poços artesianos comuns' },
    ],
  },
  {
    id: 'usoSolo',
    title: 'Como o solo está sendo usado atualmente na propriedade?',
    icon: '🚜',
    options: [
      { value: 'agricultura_intensiva', label: 'Agricultura intensiva', desc: 'Uso de agrotóxicos, fertilizantes químicos em grande escala' },
      { value: 'pastagem',              label: 'Pastagem',              desc: 'Criação de gado ou outros animais' },
      { value: 'agricultura_organica',  label: 'Agricultura orgânica / integrada', desc: 'Baixo uso de insumos químicos' },
      { value: 'reflorestamento',       label: 'Reflorestamento',       desc: 'Árvores plantadas para recuperação ou produção' },
      { value: 'mata_nativa',           label: 'Mata nativa / APP',     desc: 'Vegetação nativa preservada' },
    ],
  },
]

const SCORE_LABELS: Record<string, string> = {
  solo: 'Tipo de solo', recarga: 'Recarga hídrica', geologia: 'Formação geológica',
  profundidade: 'Profundidade do lençol', usoSolo: 'Uso do solo',
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function AguaPage() {
  const [activeTab, setActiveTab] = useState<'vulnerabilidade' | 'balanco'>('vulnerabilidade')

  // ── Vulnerability state ──────────────────────────────────────────────────
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [savedResult, setSavedResult] = useState<AnalysisResult | null>(null)
  const [loadingVuln, setLoadingVuln] = useState(true)
  const [saving, setSaving] = useState(false)

  // ── HBV state ────────────────────────────────────────────────────────────
  const [hbv, setHbv] = useState<HBVData | null>(null)
  const [hbvError, setHbvError] = useState<string | null>(null)
  const [loadingHbv, setLoadingHbv] = useState(false)

  useEffect(() => {
    fetch('/api/vulnerabilidade-hidrica')
      .then(r => r.json())
      .then(d => { if (d?.waterAnalysisData) setSavedResult(d.waterAnalysisData as AnalysisResult) })
      .finally(() => setLoadingVuln(false))
  }, [])

  useEffect(() => {
    if (activeTab !== 'balanco' || hbv || hbvError) return
    setLoadingHbv(true)
    fetch('/api/hbv')
      .then(r => r.json())
      .then(d => { if (d.error) setHbvError(d.error); else setHbv(d) })
      .catch(() => setHbvError('Falha de conexão'))
      .finally(() => setLoadingHbv(false))
  }, [activeTab, hbv, hbvError])

  const currentQ = QUESTIONS[step - 1]

  function handleAnswer(value: string) {
    const next = { ...answers, [currentQ.id]: value }
    setAnswers(next)
    if (step < QUESTIONS.length) setStep(s => s + 1)
    else runAnalysis(next)
  }

  async function runAnalysis(data: Record<string, string>) {
    setSaving(true)
    try {
      const res = await fetch('/api/vulnerabilidade-hidrica', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const r = await res.json()
      setResult(r)
      setSavedResult(r)
      setStep(6)
      // Invalidate HBV so it re-fetches with updated soil params
      setHbv(null)
      setHbvError(null)
    } finally { setSaving(false) }
  }

  function restart() {
    setStep(1)
    setAnswers({})
    setResult(null)
  }

  // ─── Tab bar ──────────────────────────────────────────────────────────────
  const tabs = (
    <div className="flex gap-1 bg-slate-100 p-1 rounded-xl mb-5">
      {([
        { id: 'vulnerabilidade', label: '💧 Vulnerabilidade' },
        { id: 'balanco',         label: '📊 Balanço Hídrico' },
      ] as const).map(t => (
        <button
          key={t.id}
          onClick={() => setActiveTab(t.id)}
          className={`flex-1 text-sm font-semibold py-2 rounded-lg transition-all ${
            activeTab === t.id
              ? 'bg-white text-[#0369a1] shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  )

  // ─── Vulnerability wizard ─────────────────────────────────────────────────
  if (activeTab === 'vulnerabilidade') {
    // Saving spinner
    if (saving) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-10 h-10 border-2 border-[#0369a1] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-slate-500">Calculando vulnerabilidade hídrica...</p>
          </div>
        </div>
      )
    }

    // Questions
    if (step >= 1 && step <= QUESTIONS.length) {
      const progress = ((step - 1) / QUESTIONS.length) * 100
      return (
        <div className="p-6 max-w-2xl mx-auto">
          {tabs}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Pergunta {step} de {QUESTIONS.length}
              </span>
              <button onClick={() => setStep(s => Math.max(0, s - 1))} className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
                ← Voltar
              </button>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-[#0369a1] rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-4">
            <div className="text-4xl mb-4">{currentQ.icon}</div>
            <h2 className="text-lg font-bold text-slate-900 mb-6 leading-snug">{currentQ.title}</h2>
            <div className="space-y-3">
              {currentQ.options.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => handleAnswer(opt.value)}
                  className={`w-full text-left px-4 py-3.5 rounded-xl border-2 transition-all hover:border-[#0369a1] hover:bg-sky-50 active:scale-[0.99] group ${
                    answers[currentQ.id] === opt.value ? 'border-[#0369a1] bg-sky-50' : 'border-slate-200'
                  }`}
                >
                  <div className="font-semibold text-slate-800 text-sm group-hover:text-[#0369a1] transition-colors">{opt.label}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )
    }

    // Result view
    const r = result ?? savedResult
    if (step === 6 && r) {
      return (
        <div className="p-6 max-w-2xl mx-auto space-y-4">
          {tabs}
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-slate-900">Resultado</h1>
            <button onClick={restart} className="text-sm text-slate-500 hover:text-slate-700 underline transition-colors">
              Refazer análise
            </button>
          </div>
          <ResultCard result={r} />
        </div>
      )
    }

    // Intro
    return (
      <div className="p-6 max-w-2xl mx-auto">
        {tabs}
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-slate-900">Recursos Hídricos</h1>
          <p className="text-slate-500 text-sm mt-1">Análise de vulnerabilidade do aquífero da sua propriedade</p>
        </div>

        {loadingVuln ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-[#16a34a] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {savedResult && <ResultCard result={savedResult} compact onRedo={restart} />}
            <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden ${savedResult ? 'mt-4' : ''}`}>
              <div className="bg-gradient-to-r from-[#0c4a6e] to-[#0369a1] px-6 py-8 text-white">
                <div className="text-4xl mb-3">💧</div>
                <h2 className="text-xl font-bold mb-2">
                  {savedResult ? 'Refazer análise' : 'Análise de Vulnerabilidade Hídrica'}
                </h2>
                <p className="text-sky-200 text-sm leading-relaxed">
                  Baseado no método GLA (Geologisches Landesamt), usado internacionalmente para avaliar a exposição de aquíferos à contaminação. Responda 5 perguntas sobre sua propriedade.
                </p>
              </div>
              <div className="px-6 py-5">
                <div className="grid grid-cols-3 gap-4 mb-6 text-center">
                  {[
                    { n: '5', label: 'Perguntas' },
                    { n: '2 min', label: 'Tempo estimado' },
                    { n: 'GLA', label: 'Método científico' },
                  ].map(i => (
                    <div key={i.n} className="bg-slate-50 rounded-xl py-3">
                      <div className="text-lg font-bold text-slate-800">{i.n}</div>
                      <div className="text-xs text-slate-500">{i.label}</div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setStep(1)}
                  className="btn-primary w-full bg-[#0369a1] text-white font-bold py-3.5 rounded-xl hover:bg-[#0284c7] shadow-sm transition-all"
                >
                  {savedResult ? 'Refazer análise →' : 'Iniciar análise →'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    )
  }

  // ─── Balanço Hídrico (HBV-96) ─────────────────────────────────────────────
  return (
    <div className="p-6 max-w-2xl mx-auto">
      {tabs}

      {loadingHbv && (
        <div className="flex items-center justify-center py-24">
          <div className="text-center">
            <div className="w-10 h-10 border-2 border-[#0369a1] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-slate-500">Simulando balanço hídrico...</p>
          </div>
        </div>
      )}

      {!loadingHbv && hbvError === 'SEM_COORDENADAS' && (
        <div className="text-center mt-12">
          <div className="text-5xl mb-4">📍</div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Localização não definida</h2>
          <p className="text-slate-500 text-sm mb-4">Marque a localização da fazenda no mapa para calcular o balanço hídrico.</p>
          <Link href="/dashboard/mapa" className="inline-flex items-center gap-2 bg-[#16a34a] text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-[#15803d] transition-colors text-sm">
            Ir para o Mapa →
          </Link>
        </div>
      )}

      {!loadingHbv && hbvError && hbvError !== 'SEM_COORDENADAS' && (
        <div className="text-center mt-12">
          <div className="text-5xl mb-4">⚠️</div>
          <p className="text-sm text-slate-500">{hbvError}</p>
        </div>
      )}

      {!loadingHbv && hbv && <HBVDashboard data={hbv} />}
    </div>
  )
}

// ─── HBV Dashboard ────────────────────────────────────────────────────────────
function HBVDashboard({ data }: { data: HBVData }) {
  const s = data.summary
  const updatedAt = new Date(data.updatedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

  const statusColor = s.irrigationStatus === 'OK' ? '#16a34a' : s.irrigationStatus === 'ALERTA' ? '#ca8a04' : '#dc2626'
  const statusBg    = s.irrigationStatus === 'OK' ? 'bg-green-50 border-green-200 text-green-800'
                    : s.irrigationStatus === 'ALERTA' ? 'bg-amber-50 border-amber-200 text-amber-800'
                    : 'bg-red-50 border-red-200 text-red-800'

  const SOIL_NAMES: Record<string, string> = {
    areia: 'Arenoso', franco_arenoso: 'Franco-arenoso', franco: 'Franco',
    franco_argiloso: 'Franco-argiloso', argiloso: 'Argiloso',
  }
  const USE_NAMES: Record<string, string> = {
    agricultura_intensiva: 'Ag. Intensiva', pastagem: 'Pastagem',
    agricultura_organica: 'Ag. Orgânica', reflorestamento: 'Reflorestamento', mata_nativa: 'Mata Nativa',
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Balanço Hídrico</h1>
        <p className="text-sm text-slate-500 mt-0.5">{data.property} · modelo HBV-96 · atualizado às {updatedAt}</p>
      </div>

      {/* Status alert */}
      <div className={`flex items-start gap-3 px-4 py-3 rounded-xl border text-sm font-medium ${statusBg}`}>
        <span className="text-base flex-shrink-0">
          {s.irrigationStatus === 'OK' ? '✅' : s.irrigationStatus === 'ALERTA' ? '⚠️' : '🚨'}
        </span>
        {s.irrigationNote}
      </div>

      {/* Soil moisture gauge + stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Gauge */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col items-center justify-center">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Umidade atual do solo</div>
          <SoilMoistureGauge pct={s.currentSmPct} color={statusColor} />
          <div className="text-xs text-slate-400 mt-2">
            {s.currentSm} mm de {s.FC} mm (cap. de campo)
          </div>
        </div>

        {/* Stats */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Últimos 30 dias</div>
          {[
            { icon: '📉', label: 'Dias com déficit hídrico', value: `${s.deficitDays30d} dias` },
            { icon: '💧', label: 'Umidade média do solo', value: `${s.avgSmPct30d}%` },
            { icon: '🌧️', label: 'Precipitação total', value: `${s.totalPrecip30d} mm` },
            { icon: '🔄', label: 'Escoamento estimado', value: `${s.totalRunoffMm30d} mm` },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">{item.icon}</span>
                <span className="text-xs text-slate-500">{item.label}</span>
              </div>
              <span className="text-sm font-bold text-slate-800">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Soil moisture chart */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <h3 className="text-sm font-bold text-slate-700 mb-1">Umidade do solo — últimos 60 dias (%)</h3>
        <p className="text-xs text-slate-400 mb-4">Linha vermelha = limiar de déficit (30% da capacidade de campo)</p>
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={data.days} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="smGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#0369a1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#0369a1" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              tick={{ fontSize: 9, fill: '#94a3b8' }}
              tickFormatter={v => {
                const d = new Date(v + 'T12:00:00')
                return `${d.getDate()}/${d.getMonth() + 1}`
              }}
              interval={9}
            />
            <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} domain={[0, 100]} unit="%" />
            <Tooltip
              formatter={(v: number) => [`${v}%`, 'Umidade']}
              labelFormatter={v => new Date(v + 'T12:00:00').toLocaleDateString('pt-BR')}
              contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e2e8f0' }}
            />
            <ReferenceLine y={30} stroke="#dc2626" strokeDasharray="4 3" strokeWidth={1.5} />
            <Area
              type="monotone"
              dataKey="smPct"
              stroke="#0369a1"
              strokeWidth={2}
              fill="url(#smGrad)"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Model parameters */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <h3 className="text-sm font-bold text-slate-700 mb-3">Parâmetros do modelo</h3>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="bg-slate-50 rounded-xl px-3 py-2.5">
            <div className="text-slate-400 mb-0.5">Tipo de solo</div>
            <div className="font-semibold text-slate-700">{SOIL_NAMES[data.params.soilType] ?? data.params.soilType}</div>
          </div>
          <div className="bg-slate-50 rounded-xl px-3 py-2.5">
            <div className="text-slate-400 mb-0.5">Uso do solo</div>
            <div className="font-semibold text-slate-700">{USE_NAMES[data.params.landUse] ?? data.params.landUse}</div>
          </div>
          <div className="bg-slate-50 rounded-xl px-3 py-2.5">
            <div className="text-slate-400 mb-0.5">Cap. de campo (FC)</div>
            <div className="font-semibold text-slate-700">{data.params.FC} mm</div>
          </div>
          <div className="bg-slate-50 rounded-xl px-3 py-2.5">
            <div className="text-slate-400 mb-0.5">Área da propriedade</div>
            <div className="font-semibold text-slate-700">{(data.params.areaKm2 * 100).toFixed(1)} ha</div>
          </div>
        </div>
        <p className="text-[10px] text-slate-400 mt-3 leading-relaxed">
          Modelo HBV-96 · Fonte climática: Open-Meteo Archive · Solo e uso derivados da análise de vulnerabilidade
          {!data.params.soilType && ' (valores padrão — realize a análise de vulnerabilidade para personalizar)'}
        </p>
      </div>
    </div>
  )
}

// ─── Soil moisture gauge (SVG arc) ───────────────────────────────────────────
function SoilMoistureGauge({ pct, color }: { pct: number; color: string }) {
  const r = 52
  const cx = 64, cy = 64
  const circumference = Math.PI * r  // half-circle arc
  const filled = (pct / 100) * circumference

  return (
    <div className="relative">
      <svg width={128} height={80} viewBox="0 0 128 80">
        {/* Background arc */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={12}
          strokeLinecap="round"
        />
        {/* Filled arc */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke={color}
          strokeWidth={12}
          strokeLinecap="round"
          strokeDasharray={`${filled} ${circumference}`}
          style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
        <div className="text-3xl font-black leading-none" style={{ color }}>{pct}%</div>
      </div>
    </div>
  )
}

// ─── Result Card ─────────────────────────────────────────────────────────────
function ResultCard({ result, compact, onRedo }: { result: AnalysisResult; compact?: boolean; onRedo?: () => void }) {
  const maxScore = 5
  const scoreEntries = Object.entries(result.scores)
  const date = new Date(result.calculatedAt).toLocaleDateString('pt-BR')

  if (compact) {
    return (
      <div className="bg-white rounded-2xl border-2 shadow-sm p-5 mb-2" style={{ borderColor: result.color }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium mb-1">Última análise · {date}</div>
            <div className="flex items-center gap-3">
              <div className="text-2xl font-black" style={{ color: result.color }}>{result.label}</div>
              <div className="text-xs px-2 py-0.5 rounded-full text-white font-semibold" style={{ background: result.color }}>
                {result.agroRateImpact > 0 ? '+' : ''}{result.agroRateImpact} pts AgroRate
              </div>
            </div>
          </div>
          {onRedo && (
            <button onClick={onRedo} className="text-xs text-slate-400 hover:text-slate-600 transition-colors underline">
              Atualizar
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white rounded-2xl border-2 shadow-sm overflow-hidden" style={{ borderColor: result.color }}>
        <div className="px-6 py-5" style={{ background: result.color + '15' }}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
                Vulnerabilidade do Aquífero
              </div>
              <div className="text-3xl font-black mb-1" style={{ color: result.color }}>{result.label}</div>
              <p className="text-sm text-slate-600 leading-relaxed max-w-sm">{result.description}</p>
            </div>
            <div className="flex-shrink-0 text-right">
              <div className="text-xs text-slate-400 mb-1">Score total</div>
              <div className="text-3xl font-black text-slate-700">{result.total}</div>
              <div className="text-xs text-slate-400">de 25</div>
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-800">
              Impacto no AgroRate:{' '}
              <span style={{ color: result.agroRateImpact >= 0 ? '#16a34a' : '#dc2626' }}>
                {result.agroRateImpact > 0 ? '+' : ''}{result.agroRateImpact} pontos
              </span>
            </div>
            <div className="text-xs text-slate-500">
              {result.agroRateImpact < 0
                ? 'Vulnerabilidade alta representa risco ambiental para crédito rural'
                : result.agroRateImpact === 0
                  ? 'Vulnerabilidade média — impacto neutro no score de crédito'
                  : 'Baixa vulnerabilidade agrega valor ao perfil de crédito rural'}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <h3 className="text-sm font-bold text-slate-700 mb-4">Detalhamento por dimensão</h3>
        <div className="space-y-3">
          {scoreEntries.map(([key, score]) => (
            <div key={key}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-600 font-medium">{SCORE_LABELS[key] ?? key}</span>
                <span className="text-slate-500">{score}/{maxScore}</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${(score / maxScore) * 100}%`,
                    background: score <= 2 ? '#dc2626' : score <= 3 ? '#ca8a04' : '#16a34a',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-slate-400 mt-4 leading-relaxed">
          Pontuação mais alta = maior proteção natural = menor vulnerabilidade. Calculado em {date}.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <h3 className="text-sm font-bold text-slate-700 mb-3">Recomendações</h3>
        <RecommendationList level={result.level} />
      </div>
    </>
  )
}

function RecommendationList({ level }: { level: string }) {
  const recs: Record<string, string[]> = {
    MUITO_ALTA: [
      'Evite aplicar agrotóxicos e fertilizantes em área de recarga direta',
      'Mantenha mínimo de 30 m de área verde ao redor de nascentes e cursos d\'água',
      'Considere certificação ambiental — valoriza o imóvel e facilita crédito verde',
      'Monitore a qualidade da água em poços existentes pelo menos 2x ao ano',
    ],
    ALTA: [
      'Adote práticas de agricultura de precisão para reduzir insumos',
      'Implante barreiras vegetais em declives para conter escoamento',
      'Verifique regularmente a água consumida por animais e na propriedade',
    ],
    MEDIA: [
      'Mantenha cobertura vegetal permanente em áreas de recarga',
      'Controle o destino de embalagens de agrotóxicos',
      'Avalie periodicamente a qualidade da água subterrânea',
    ],
    BAIXA: [
      'Continue as boas práticas de manejo que protegem o aquífero',
      'Documente as práticas sustentáveis para fortalecer seu AgroRate',
    ],
    MUITO_BAIXA: [
      'Excelente proteção natural — mantenha a cobertura vegetal existente',
      'Sua propriedade é um ativo ambiental valioso para linhas de crédito verde',
    ],
  }
  const list = recs[level] ?? recs.MEDIA
  return (
    <ul className="space-y-2">
      {list.map((rec, i) => (
        <li key={i} className="flex items-start gap-2.5 text-sm text-slate-600">
          <svg className="w-4 h-4 text-[#0369a1] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {rec}
        </li>
      ))}
    </ul>
  )
}

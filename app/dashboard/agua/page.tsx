'use client'

import { useState, useEffect } from 'react'

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

// ─── Score labels ─────────────────────────────────────────────────────────────
const SCORE_LABELS: Record<string, string> = {
  solo: 'Tipo de solo', recarga: 'Recarga hídrica', geologia: 'Formação geológica',
  profundidade: 'Profundidade do lençol', usoSolo: 'Uso do solo',
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function AguaPage() {
  const [step, setStep] = useState(0) // 0 = intro, 1-5 = questions, 6 = result
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [savedResult, setSavedResult] = useState<AnalysisResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/vulnerabilidade-hidrica')
      .then(r => r.json())
      .then(d => {
        if (d?.waterAnalysisData) setSavedResult(d.waterAnalysisData as AnalysisResult)
      })
      .finally(() => setLoading(false))
  }, [])

  const currentQ = QUESTIONS[step - 1]

  function handleAnswer(value: string) {
    const next = { ...answers, [currentQ.id]: value }
    setAnswers(next)
    if (step < QUESTIONS.length) {
      setStep(s => s + 1)
    } else {
      runAnalysis(next)
    }
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
    } finally {
      setSaving(false)
    }
  }

  function restart() {
    setStep(1)
    setAnswers({})
    setResult(null)
  }

  // ─── Intro ───────────────────────────────────────────────────────────────
  if (step === 0) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Recursos Hídricos</h1>
          <p className="text-slate-500 text-sm mt-1">Análise de vulnerabilidade do aquífero da sua propriedade</p>
        </div>

        {loading ? (
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

  // ─── Questions ───────────────────────────────────────────────────────────
  if (step >= 1 && step <= QUESTIONS.length) {
    const progress = ((step - 1) / QUESTIONS.length) * 100
    return (
      <div className="p-6 max-w-2xl mx-auto">
        {/* Progress */}
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

        {/* Question card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-4">
          <div className="text-4xl mb-4">{currentQ.icon}</div>
          <h2 className="text-lg font-bold text-slate-900 mb-6 leading-snug">{currentQ.title}</h2>

          <div className="space-y-3">
            {currentQ.options.map(opt => (
              <button
                key={opt.value}
                onClick={() => handleAnswer(opt.value)}
                className={`w-full text-left px-4 py-3.5 rounded-xl border-2 transition-all hover:border-[#0369a1] hover:bg-sky-50 active:scale-[0.99] group ${
                  answers[currentQ.id] === opt.value
                    ? 'border-[#0369a1] bg-sky-50'
                    : 'border-slate-200'
                }`}
              >
                <div className="font-semibold text-slate-800 text-sm group-hover:text-[#0369a1] transition-colors">
                  {opt.label}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ─── Loading result ───────────────────────────────────────────────────────
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

  // ─── Result ───────────────────────────────────────────────────────────────
  const r = result ?? savedResult
  if (!r) return null

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-4">
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
      {/* Main result */}
      <div className="bg-white rounded-2xl border-2 shadow-sm overflow-hidden" style={{ borderColor: result.color }}>
        <div className="px-6 py-5" style={{ background: result.color + '15' }}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
                Vulnerabilidade do Aquífero
              </div>
              <div className="text-3xl font-black mb-1" style={{ color: result.color }}>
                {result.label}
              </div>
              <p className="text-sm text-slate-600 leading-relaxed max-w-sm">{result.description}</p>
            </div>
            <div className="flex-shrink-0 text-right">
              <div className="text-xs text-slate-400 mb-1">Score total</div>
              <div className="text-3xl font-black text-slate-700">{result.total}</div>
              <div className="text-xs text-slate-400">de 25</div>
            </div>
          </div>
        </div>

        {/* AgroRate impact */}
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

      {/* Score breakdown */}
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

      {/* Recommendations */}
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

'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

type AgroRateData = {
  score: number
  category: string
  productionScore: number
  efficiencyScore: number
  behaviorScore: number
  operationalScore: number
  totalRevenue: number
  totalCosts: number
  productivity: number
  marginRate: number
  activityCount: number
  dataCompleteness: number
  lastCalculated: string
}

const CATEGORY_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; ring: string; desc: string }> = {
  ELITE:    { label: 'Elite',    color: 'text-yellow-700', bg: 'bg-yellow-50',  border: 'border-yellow-300', ring: 'ring-yellow-400', desc: 'Operação exemplar — acesso às melhores condições de crédito' },
  HIGH:     { label: 'Alto',     color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-300', ring: 'ring-emerald-400', desc: 'Gestão eficiente — excelentes ofertas de crédito disponíveis' },
  GOOD:     { label: 'Bom',      color: 'text-teal-700',   bg: 'bg-teal-50',    border: 'border-teal-300',    ring: 'ring-teal-400',    desc: 'Boa performance — boas condições de financiamento' },
  REGULAR:  { label: 'Regular',  color: 'text-blue-700',   bg: 'bg-blue-50',    border: 'border-blue-300',    ring: 'ring-blue-400',    desc: 'Desempenho médio — melhorias podem abrir novas linhas de crédito' },
  LOW:      { label: 'Baixo',    color: 'text-orange-700', bg: 'bg-orange-50',  border: 'border-orange-300',  ring: 'ring-orange-400',  desc: 'Pontos de melhoria identificados — siga as dicas abaixo' },
  CRITICAL: { label: 'Crítico',  color: 'text-red-700',    bg: 'bg-red-50',     border: 'border-red-300',     ring: 'ring-red-400',     desc: 'Score crítico — complete seus dados para melhorar' },
}

const SCORE_COLOR = (s: number) =>
  s >= 900 ? '#ca8a04' : s >= 750 ? '#16a34a' : s >= 600 ? '#0d9488' : s >= 450 ? '#2563eb' : s >= 300 ? '#ea580c' : '#dc2626'

function ScoreGauge({ score }: { score: number }) {
  const pct = Math.min(score / 1000, 1)
  const r = 70
  const cx = 90, cy = 90
  const startAngle = Math.PI * 0.75
  const endAngle = Math.PI * 2.25
  const totalArc = endAngle - startAngle
  const filled = totalArc * pct

  const polarX = (angle: number) => cx + r * Math.cos(angle)
  const polarY = (angle: number) => cy + r * Math.sin(angle)

  const arcPath = (from: number, to: number) => {
    const large = to - from > Math.PI ? 1 : 0
    return `M ${polarX(from)} ${polarY(from)} A ${r} ${r} 0 ${large} 1 ${polarX(to)} ${polarY(to)}`
  }

  const color = SCORE_COLOR(score)

  return (
    <svg viewBox="0 0 180 120" className="w-48 h-32">
      <path d={arcPath(startAngle, endAngle)} fill="none" stroke="#e2e8f0" strokeWidth="12" strokeLinecap="round" />
      {score > 0 && (
        <path d={arcPath(startAngle, startAngle + filled)} fill="none" stroke={color} strokeWidth="12" strokeLinecap="round" />
      )}
      <text x={cx} y={cy + 6} textAnchor="middle" fill={color} fontSize="26" fontWeight="800">{score}</text>
      <text x={cx} y={cy + 22} textAnchor="middle" fill="#94a3b8" fontSize="9">de 1000</text>
    </svg>
  )
}

function ScoreBar({ label: labelText, score, weight, icon }: { label: string; score: number; weight: number; icon: string }) {
  const pct = Math.min((score / 1000) * 100, 100)
  const color = SCORE_COLOR(score)
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <span className="text-base">{icon}</span>
          <span className="font-medium text-slate-700">{labelText}</span>
          <span className="text-xs text-slate-400">({weight}%)</span>
        </div>
        <span className="font-bold tabular-nums" style={{ color }}>{score}</span>
      </div>
      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}

function getTips(data: AgroRateData): { icon: string; text: string; priority: 'high' | 'med' | 'low' }[] {
  const tips: { icon: string; text: string; priority: 'high' | 'med' | 'low' }[] = []
  if (data.productionScore < 600) tips.push({ icon: '🌾', text: 'Registre receitas de suas culturas para aumentar o score de produção', priority: 'high' })
  if (data.efficiencyScore < 600) tips.push({ icon: '💰', text: 'Melhore sua margem reduzindo custos ou aumentando receita', priority: 'high' })
  if (data.behaviorScore < 600) tips.push({ icon: '📋', text: 'Lance custos regularmente — consistência financeira melhora o comportamento', priority: 'med' })
  if (data.operationalScore < 600) tips.push({ icon: '✅', text: 'Complete mais atividades e cadastre talhões e membros da equipe', priority: 'med' })
  if (data.dataCompleteness < 80) tips.push({ icon: '📊', text: 'Complete o cadastro da propriedade (talhões, equipe, culturas)', priority: 'med' })
  if (data.activityCount < 4) tips.push({ icon: '⚡', text: 'Registre mais atividades concluídas para aumentar o histórico operacional', priority: 'low' })
  if (tips.length === 0) tips.push({ icon: '🏆', text: 'Excelente! Continue mantendo registros regulares para preservar seu score', priority: 'low' })
  return tips.slice(0, 4)
}

function getCreditCount(score: number) {
  if (score >= 900) return 12
  if (score >= 750) return 9
  if (score >= 600) return 6
  if (score >= 450) return 3
  return 1
}

export default function AgroRatePage() {
  const [data, setData] = useState<AgroRateData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) { setError('Não autenticado'); setLoading(false); return }
      const res = await fetch(`/api/agrorate/score?userId=${session.user.id}`)
      const json = await res.json()
      if (!res.ok) { setError(json.error || 'Erro ao calcular score'); setLoading(false); return }
      setData(json)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return (
    <div className="p-6 max-w-3xl mx-auto space-y-4">
      {[1,2,3].map(i => <div key={i} className="h-24 bg-slate-100 rounded-2xl animate-pulse" />)}
    </div>
  )

  if (error || !data) return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center text-red-600 text-sm">{error || 'Erro desconhecido'}</div>
    </div>
  )

  const cat = CATEGORY_CONFIG[data.category] ?? CATEGORY_CONFIG.REGULAR
  const tips = getTips(data)
  const creditCount = getCreditCount(data.score)
  const marginPct = Math.round(data.marginRate * 100)

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">AgroRate</h1>
        <p className="text-slate-500 text-sm mt-0.5">Score de crédito rural baseado nos dados reais da sua fazenda</p>
      </div>

      {/* Score principal */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col sm:flex-row items-center gap-6">
        <div className="flex flex-col items-center">
          <ScoreGauge score={data.score} />
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border mt-1 ${cat.color} ${cat.bg} ${cat.border}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current inline-block" />
            {cat.label}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-slate-600 text-sm leading-relaxed mb-4">{cat.desc}</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 rounded-xl p-3">
              <div className="text-xs text-slate-500 mb-0.5">Receita total</div>
              <div className="font-bold text-slate-800 text-sm">R$ {data.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</div>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <div className="text-xs text-slate-500 mb-0.5">Margem</div>
              <div className={`font-bold text-sm ${marginPct >= 30 ? 'text-emerald-600' : marginPct >= 0 ? 'text-blue-600' : 'text-red-600'}`}>{marginPct}%</div>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <div className="text-xs text-slate-500 mb-0.5">Atividades concluídas</div>
              <div className="font-bold text-slate-800 text-sm">{data.activityCount}</div>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <div className="text-xs text-slate-500 mb-0.5">Atualizado em</div>
              <div className="font-bold text-slate-800 text-sm">{new Date(data.lastCalculated).toLocaleDateString('pt-BR')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Breakdown */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <h2 className="font-bold text-slate-900 text-base">Composição do score</h2>
        <ScoreBar label="Produção" score={data.productionScore} weight={30} icon="🌾" />
        <ScoreBar label="Eficiência" score={data.efficiencyScore} weight={25} icon="💰" />
        <ScoreBar label="Comportamento" score={data.behaviorScore} weight={25} icon="📋" />
        <ScoreBar label="Operacional" score={data.operationalScore} weight={20} icon="⚙️" />
        <p className="text-[11px] text-slate-400 pt-1">Score calculado a partir dos 12 meses anteriores com dados reais da sua propriedade.</p>
      </div>

      {/* Dicas */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="font-bold text-slate-900 text-base mb-4">Como melhorar seu score</h2>
        <div className="space-y-3">
          {tips.map((tip, i) => (
            <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border ${
              tip.priority === 'high' ? 'bg-orange-50 border-orange-100' : 'bg-slate-50 border-slate-100'
            }`}>
              <span className="text-xl flex-shrink-0">{tip.icon}</span>
              <p className="text-sm text-slate-700 leading-snug">{tip.text}</p>
              {tip.priority === 'high' && (
                <span className="text-[10px] font-bold text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded-full flex-shrink-0">prioritário</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Crédito CTA */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 text-white">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm font-medium text-emerald-100 mb-1">Com seu score atual</div>
            <div className="text-2xl font-bold mb-1">{creditCount} oferta{creditCount !== 1 ? 's' : ''} de crédito disponíve{creditCount !== 1 ? 'is' : 'l'}</div>
            <p className="text-emerald-100 text-sm">Linhas agrícolas, custeio e investimento compatíveis com seu perfil.</p>
          </div>
          <span className="text-4xl flex-shrink-0">💳</span>
        </div>
        <Link
          href="/dashboard/agrorate/credito"
          className="mt-4 inline-flex items-center gap-2 bg-white text-emerald-700 font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-emerald-50 transition-colors"
        >
          Ver ofertas de crédito →
        </Link>
      </div>

      {/* Score scale reference */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <h2 className="font-bold text-slate-900 text-base mb-3">Tabela de classificação</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => {
            const ranges: Record<string, string> = { ELITE: '900–1000', HIGH: '750–899', GOOD: '600–749', REGULAR: '450–599', LOW: '300–449', CRITICAL: '0–299' }
            const active = key === data.category
            return (
              <div key={key} className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs ${active ? `${cfg.bg} ${cfg.border} ${cfg.color} font-bold ring-2 ${cfg.ring}` : 'border-slate-100 text-slate-500'}`}>
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${active ? 'bg-current' : 'bg-slate-300'}`} />
                <span>{cfg.label}</span>
                <span className="ml-auto tabular-nums">{ranges[key]}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

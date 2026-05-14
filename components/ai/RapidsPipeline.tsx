'use client'

import { useState } from 'react'

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-500">{label}</span>
        <span className={`font-bold ${color}`}>{value}</span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${
            value >= 70 ? 'bg-green-500' : value >= 40 ? 'bg-amber-400' : 'bg-red-400'
          }`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )
}

export default function RapidsPipeline() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  async function rodar() {
    setLoading(true)
    setData(null)
    try {
      const res = await fetch('/api/ai/rapids-pipeline')
      if (res.ok) setData(await res.json())
    } finally {
      setLoading(false)
    }
  }

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div>
          <div className="font-bold text-slate-900 flex items-center gap-2">
            <span className="text-lg">🔬</span> Pipeline RAPIDS
          </div>
          <div className="text-xs text-slate-400 mt-0.5">Análise batch multi-domínio · NVIDIA NIM</div>
        </div>
        <button
          onClick={rodar}
          disabled={loading}
          className="flex items-center gap-2 text-xs bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-xl transition-colors"
        >
          {loading ? (
            <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
            </svg>
          )}
          {loading ? 'Processando...' : 'Rodar Pipeline'}
        </button>
      </div>

      {!data && !loading && (
        <div className="px-5 py-5 text-sm text-slate-400 flex items-start gap-3">
          <svg className="w-5 h-5 text-violet-300 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
          </svg>
          Processa todos os dados da fazenda em paralelo: financeiro, operacional, equipe, alertas, metas e energia — gerando um relatório executivo com score por domínio.
        </div>
      )}

      {loading && (
        <div className="px-5 py-5 space-y-2">
          {['Financeiro', 'Operacional', 'Equipe', 'Alertas', 'Metas', 'Energia'].map(d => (
            <div key={d} className="flex items-center gap-3">
              <svg className="w-3.5 h-3.5 animate-spin text-violet-500 shrink-0" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              <span className="text-xs text-slate-500">Processando {d}...</span>
            </div>
          ))}
        </div>
      )}

      {data && (
        <div className="px-5 py-5 space-y-5">
          {/* Score geral */}
          <div className="flex items-center gap-4">
            <div className={`text-4xl font-black tabular-nums ${
              data.scoreGeral >= 70 ? 'text-green-600' : data.scoreGeral >= 40 ? 'text-amber-500' : 'text-red-500'
            }`}>
              {data.scoreGeral}
              <span className="text-sm font-normal text-slate-400">/100</span>
            </div>
            <div className="flex-1 space-y-1.5">
              <ScoreBar label="Financeiro"   value={data.scores.financeiro}   color={data.scores.financeiro >= 70 ? 'text-green-600' : 'text-amber-500'} />
              <ScoreBar label="Operacional"  value={data.scores.operacional}  color={data.scores.operacional >= 70 ? 'text-green-600' : 'text-amber-500'} />
              <ScoreBar label="Equipe"       value={data.scores.equipe}       color={data.scores.equipe >= 70 ? 'text-green-600' : 'text-amber-500'} />
              <ScoreBar label="Metas"        value={data.scores.metas}        color={data.scores.metas >= 70 ? 'text-green-600' : 'text-amber-500'} />
            </div>
          </div>

          {/* KPIs rápidos */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="bg-slate-50 rounded-xl p-3 text-center">
              <div className={`text-lg font-bold ${data.financeiro.margem >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                {data.financeiro.margem}%
              </div>
              <div className="text-xs text-slate-400">Margem bruta</div>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 text-center">
              <div className="text-lg font-bold text-slate-900">{data.operacional.completionRate}%</div>
              <div className="text-xs text-slate-400">Conclusão ops.</div>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 text-center">
              <div className={`text-lg font-bold ${data.alertas.naoLidos > 0 ? 'text-amber-600' : 'text-green-700'}`}>
                {data.alertas.naoLidos}
              </div>
              <div className="text-xs text-slate-400">Alertas novos</div>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 text-center">
              <div className={`text-lg font-bold ${data.energia.autoSuficiencia >= 50 ? 'text-green-700' : 'text-slate-500'}`}>
                {data.energia.autoSuficiencia}%
              </div>
              <div className="text-xs text-slate-400">Autossuficiência</div>
            </div>
          </div>

          {/* Anomalias financeiras */}
          {data.financeiro.anomaliasMeses.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <div className="text-xs font-semibold text-amber-700 mb-1">⚠️ Meses com volatilidade anômala (&gt;2σ)</div>
              <div className="text-xs text-amber-600">{data.financeiro.anomaliasMeses.join(' · ')}</div>
            </div>
          )}

          {/* Top custos */}
          {data.financeiro.topCostCat.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Top categorias de custo</div>
              {data.financeiro.topCostCat.map((c: any) => (
                <div key={c.cat} className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">{c.cat}</span>
                  <span className="font-semibold text-slate-900">{fmt(c.val)} <span className="text-xs text-slate-400">({c.pct}%)</span></span>
                </div>
              ))}
            </div>
          )}

          {/* Relatório NIM */}
          <div className="bg-violet-50 border border-violet-100 rounded-xl p-4">
            <div className="text-xs font-semibold text-violet-600 mb-2 uppercase tracking-wide">Relatório Executivo · NIM</div>
            <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{data.relatorioIA}</p>
          </div>

          <p className="text-[10px] text-slate-300 text-right">
            {new Date(data.geradoEm).toLocaleString('pt-BR')} · {data.modelo}
          </p>
        </div>
      )}
    </div>
  )
}

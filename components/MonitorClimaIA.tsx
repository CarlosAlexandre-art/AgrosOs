'use client'

import { useState, useCallback } from 'react'

type Estado = 'idle' | 'carregando' | 'resultado' | 'erro'

type RiscoClima = {
  tipo: string
  nivel: 'baixo' | 'medio' | 'alto'
  descricao: string
  janela: string
}

type ImpactoAtividade = {
  atividade: string
  impacto: 'favoravel' | 'desfavoravel' | 'critico'
  recomendacao: string
}

type AnaliseClimatica = {
  resumoClimatico: string
  riscosIdentificados: RiscoClima[]
  impactoAtividades: ImpactoAtividade[]
  janelaIdeal: string
  alertas: string[]
  recomendacoesPraticas: string[]
  condicaoGeral: 'otima' | 'boa' | 'atencao' | 'critica'
}

const CONDICAO_CONFIG = {
  otima: { label: 'Ótima', color: 'text-emerald-300', bg: 'bg-emerald-500/15', border: 'border-emerald-500/20', icon: '☀️' },
  boa: { label: 'Boa', color: 'text-blue-300', bg: 'bg-blue-500/15', border: 'border-blue-500/20', icon: '⛅' },
  atencao: { label: 'Atenção', color: 'text-amber-300', bg: 'bg-amber-500/15', border: 'border-amber-500/20', icon: '🌥️' },
  critica: { label: 'Crítica', color: 'text-red-300', bg: 'bg-red-500/15', border: 'border-red-500/20', icon: '⛈️' },
}

const NIVEL_COLOR = {
  baixo: 'text-emerald-300 bg-emerald-500/15',
  medio: 'text-amber-300 bg-amber-500/15',
  alto: 'text-red-300 bg-red-500/15',
}

const IMPACTO_CONFIG = {
  favoravel: { icon: '✅', color: 'text-emerald-300' },
  desfavoravel: { icon: '⚠️', color: 'text-amber-300' },
  critico: { icon: '🚫', color: 'text-red-300' },
}

export default function MonitorClimaIA() {
  const [estado, setEstado] = useState<Estado>('idle')
  const [modalAberto, setModalAberto] = useState(false)
  const [analise, setAnalise] = useState<AnaliseClimatica | null>(null)
  const [localidade, setLocalidade] = useState('')
  const [temDados, setTemDados] = useState({ openweather: false, nasa: false })
  const [erro, setErro] = useState('')

  const buscarAnalise = useCallback(async () => {
    setEstado('carregando')
    setErro('')
    try {
      const res = await fetch('/api/ai/clima-inteligente', { method: 'POST' })
      const data = await res.json()
      if (!res.ok || !data.ok) throw new Error(data.error || 'Erro na análise')
      setAnalise(data.analise)
      setLocalidade(data.localidade || '')
      setTemDados(data.dadosBrutos || { openweather: false, nasa: false })
      setEstado('resultado')
    } catch (e: any) {
      setErro(e.message || 'Erro ao buscar análise climática')
      setEstado('erro')
    }
  }, [])

  function abrirModal() {
    setModalAberto(true)
    if (estado === 'idle') buscarAnalise()
  }

  function fechar() {
    setModalAberto(false)
    setEstado('idle')
    setAnalise(null)
    setErro('')
  }

  const cond = analise ? (CONDICAO_CONFIG[analise.condicaoGeral] ?? CONDICAO_CONFIG.boa) : null

  return (
    <>
      {/* Botão flutuante — acima do diagnóstico animal */}
      <button
        onClick={abrirModal}
        className="fixed z-50 w-12 h-12 rounded-2xl flex items-center justify-center transition-all hover:scale-105 active:scale-95"
        style={{
          bottom: '18.5rem',
          right: '1.5rem',
          background: 'linear-gradient(135deg,#1d4ed8,#2563eb)',
          boxShadow: '0 0 16px rgba(29,78,216,.4)',
        }}
        title="Monitor Climático IA — análise de risco para atividades"
      >
        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
        </svg>
      </button>

      {/* Modal */}
      {modalAberto && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4 bg-black/60">
          <div
            className="w-full max-w-lg rounded-2xl overflow-hidden"
            style={{
              background: 'linear-gradient(180deg,#0f172a 0%,#0b1628 100%)',
              border: '1px solid rgba(255,255,255,.1)',
              boxShadow: '0 24px 64px rgba(0,0,0,.6)',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-white/8 flex items-center justify-between flex-shrink-0"
              style={{ background: 'rgba(29,78,216,.08)' }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(29,78,216,.2)' }}>
                  <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-bold text-white">Monitor Climático IA</div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    {temDados.openweather ? 'OpenWeather · ' : ''}{temDados.nasa ? 'NASA POWER · ' : ''}LLaMA 3.3 70B
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {estado === 'resultado' && (
                  <button onClick={buscarAnalise} className="text-slate-500 hover:text-blue-400 transition-colors p-1" title="Atualizar">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                    </svg>
                  </button>
                )}
                <button onClick={fechar} className="text-slate-500 hover:text-white transition-colors p-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="overflow-y-auto flex-1 p-5 space-y-4">
              {/* Carregando */}
              {estado === 'carregando' && (
                <div className="flex flex-col items-center gap-4 py-8">
                  <div className="relative w-16 h-16">
                    <div className="absolute inset-0 rounded-full border-2 border-blue-500/20" />
                    <div className="absolute inset-0 rounded-full border-2 border-t-blue-500 animate-spin" />
                    <div className="absolute inset-3 rounded-full flex items-center justify-center"
                      style={{ background: 'rgba(29,78,216,.15)' }}>
                      <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                      </svg>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-white">Consultando dados climáticos...</p>
                    <p className="text-[11px] text-slate-500 mt-1">OpenWeather + NASA POWER + IA</p>
                  </div>
                </div>
              )}

              {/* Erro */}
              {estado === 'erro' && (
                <div className="space-y-3">
                  <div className="rounded-xl p-3 bg-red-500/10 border border-red-500/20">
                    <p className="text-sm text-red-300">{erro}</p>
                  </div>
                  <button onClick={buscarAnalise}
                    className="w-full py-2.5 rounded-xl text-sm font-bold text-white"
                    style={{ background: 'linear-gradient(135deg,#1d4ed8,#2563eb)' }}>
                    Tentar novamente
                  </button>
                </div>
              )}

              {/* Resultado */}
              {estado === 'resultado' && analise && cond && (
                <div className="space-y-4">
                  {/* Condição geral */}
                  <div className={`rounded-xl px-4 py-3 flex items-center gap-3 ${cond.bg} border ${cond.border}`}>
                    <span className="text-2xl">{cond.icon}</span>
                    <div className="flex-1">
                      <div className={`text-sm font-bold ${cond.color}`}>Condição {cond.label}</div>
                      {localidade && <div className="text-[11px] text-slate-400">{localidade}</div>}
                    </div>
                  </div>

                  {/* Resumo */}
                  <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.06)' }}>
                    <p className="text-[12px] text-slate-300 leading-relaxed">{analise.resumoClimatico}</p>
                  </div>

                  {/* Janela ideal */}
                  {analise.janelaIdeal && (
                    <div className="rounded-xl px-4 py-3 flex items-start gap-3"
                      style={{ background: 'rgba(29,78,216,.08)', border: '1px solid rgba(29,78,216,.2)' }}>
                      <span className="text-blue-400 flex-shrink-0 mt-0.5">🕐</span>
                      <div>
                        <div className="text-[10px] text-blue-400/70 uppercase tracking-widest font-bold mb-0.5">Janela ideal para atividades</div>
                        <p className="text-[12px] text-slate-200">{analise.janelaIdeal}</p>
                      </div>
                    </div>
                  )}

                  {/* Riscos */}
                  {analise.riscosIdentificados?.length > 0 && (
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-2">Riscos identificados</div>
                      <div className="space-y-2">
                        {analise.riscosIdentificados.map((r, i) => (
                          <div key={i} className="rounded-xl p-3 flex items-start gap-3"
                            style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.06)' }}>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5 ${NIVEL_COLOR[r.nivel]}`}>
                              {r.nivel.toUpperCase()}
                            </span>
                            <div>
                              <div className="text-[12px] text-white font-semibold capitalize">{r.tipo}</div>
                              <p className="text-[11px] text-slate-400 mt-0.5">{r.descricao}</p>
                              <p className="text-[10px] text-slate-500 mt-0.5">📅 {r.janela}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Impacto nas atividades */}
                  {analise.impactoAtividades?.length > 0 && (
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-2">Impacto nas atividades</div>
                      <div className="space-y-1.5">
                        {analise.impactoAtividades.map((a, i) => (
                          <div key={i} className="rounded-xl p-2.5 flex items-start gap-3"
                            style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.06)' }}>
                            <span className="flex-shrink-0 mt-0.5">{IMPACTO_CONFIG[a.impacto]?.icon}</span>
                            <div>
                              <div className="text-[11px] text-white font-semibold">{a.atividade}</div>
                              <p className="text-[11px] text-slate-400">{a.recomendacao}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Alertas */}
                  {analise.alertas?.length > 0 && (
                    <div className="space-y-1.5">
                      {analise.alertas.map((a, i) => (
                        <div key={i} className="flex items-start gap-2 rounded-lg px-3 py-2 bg-amber-500/10 border border-amber-500/20">
                          <span className="text-amber-400 flex-shrink-0">⚠️</span>
                          <p className="text-[11px] text-amber-200">{a}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Recomendações */}
                  {analise.recomendacoesPraticas?.length > 0 && (
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-2">Ações para as próximas 48h</div>
                      {analise.recomendacoesPraticas.map((r, i) => (
                        <div key={i} className="flex items-start gap-2 text-[11px] text-slate-300 mb-1.5">
                          <span className="text-blue-400 flex-shrink-0 mt-0.5">→</span>{r}
                        </div>
                      ))}
                    </div>
                  )}

                  {!temDados.openweather && !temDados.nasa && (
                    <div className="rounded-xl p-3 bg-slate-800/50 border border-white/6">
                      <p className="text-[10px] text-slate-500">💡 Configure <code className="text-slate-400">OPENWEATHER_API_KEY</code> no Vercel para dados climáticos em tempo real.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

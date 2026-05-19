'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePlan } from '@/lib/hooks/usePlan'
import ProPaywall from '@/components/ProPaywall'

interface Agente {
  id: string; nome: string; descricao: string; icone: string
  status: 'ok' | 'atencao' | 'alerta'
  ultimaVerificacao: string; proximaVerificacao: string
  metrica: number; metricaLabel: string; limiteAlerta: number; unidade: string
}
interface Evento {
  id: string; tipo: string; agente: string; msg: string; ts: string
}
interface IAData {
  property: { id: string; name: string; declaredHa: number; hasCoords: boolean }
  resumo: { totalAgentes: number; agentesAtivos: number; alertasAtivos: number; ultimaAtualizacao: string }
  agentes: Agente[]
  eventos: Evento[]
  metricas: { ndviAtual: number; precipAtual: number; tempAtual: number; umidAtual: number }
  source: string
  generatedAt: string
}

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'agora'
  if (m < 60) return `${m}min atrás`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h atrás`
  return `${Math.floor(h / 24)}d atrás`
}

function nextIn(ts: string) {
  const diff = new Date(ts).getTime() - Date.now()
  if (diff <= 0) return 'em breve'
  const m = Math.floor(diff / 60000)
  if (m < 60) return `${m}min`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}

export default function IATerritorial() {
  const { loading: planLoading, isPro } = usePlan()
  const [data, setData] = useState<IAData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/geo/ia-territorial')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (planLoading) return null
  if (!isPro) return <ProPaywall feature="IA Territorial Autônoma" />

  const statusConfig = {
    ok: { color: '#34d399', bg: 'rgba(52,211,153,.12)', label: 'OK', pulse: false },
    atencao: { color: '#f59e0b', bg: 'rgba(245,158,11,.12)', label: 'Atenção', pulse: true },
    alerta: { color: '#f87171', bg: 'rgba(248,113,113,.12)', label: 'Alerta', pulse: true },
  }
  const eventoConfig = {
    alerta: { color: '#f87171', icon: '⚠️' },
    atencao: { color: '#f59e0b', icon: '⚠️' },
    info: { color: '#60a5fa', icon: 'ℹ️' },
    sucesso: { color: '#34d399', icon: '✅' },
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #020c14 0%, #040b10 60%, #020c14 100%)' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Plus+Jakarta+Sans:wght@300;400;500;600&display=swap');
        .ia-page { font-family: 'Plus Jakarta Sans', sans-serif; }
        .ia-mono { font-family: 'JetBrains Mono', monospace; }
        .grid-bg { background-image: linear-gradient(rgba(52,211,153,.03) 1px, transparent 1px), linear-gradient(90deg, rgba(96,165,250,.02) 1px, transparent 1px); background-size: 28px 28px; }
        .card { background: rgba(255,255,255,.025); border: 1px solid rgba(52,211,153,.1); border-radius: 16px; }
        @keyframes pulse-ring { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: .5; transform: scale(1.15); } }
        .pulse-ring { animation: pulse-ring 2s ease-in-out infinite; }
      `}</style>

      <div className="ia-page grid-bg min-h-screen">
        <div className="max-w-6xl mx-auto px-6 py-8">

          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style={{ background: 'rgba(96,165,250,.15)', border: '1px solid rgba(96,165,250,.3)' }}>🤖</div>
                <div>
                  <h1 className="text-2xl font-bold text-white">IA Territorial Autônoma</h1>
                  <p className="text-xs text-slate-500 mt-0.5">Agentes monitoram clima · vegetação · água · compliance 24h</p>
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
                <div className="w-10 h-10 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-slate-400 text-sm">Inicializando agentes territoriais...</p>
              </div>
            </div>
          ) : data ? (
            <>
              {/* Status bar */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <div className="card p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="text-xs text-slate-500">Agentes Ativos</span>
                  </div>
                  <div className="text-2xl font-bold text-emerald-400 ia-mono">{data.resumo.agentesAtivos}</div>
                  <div className="text-xs text-slate-600">de {data.resumo.totalAgentes} total</div>
                </div>
                <div className="card p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-2 h-2 rounded-full ${data.resumo.alertasAtivos > 0 ? 'bg-red-400 pulse-ring' : 'bg-slate-600'}`} />
                    <span className="text-xs text-slate-500">Alertas</span>
                  </div>
                  <div className={`text-2xl font-bold ia-mono ${data.resumo.alertasAtivos > 0 ? 'text-red-400' : 'text-slate-400'}`}>{data.resumo.alertasAtivos}</div>
                  <div className="text-xs text-slate-600">ativos agora</div>
                </div>
                <div className="card p-4">
                  <div className="text-xs text-slate-500 mb-1">NDVI Atual</div>
                  <div className="text-2xl font-bold ia-mono" style={{ color: data.metricas.ndviAtual >= 0.5 ? '#34d399' : data.metricas.ndviAtual >= 0.35 ? '#f59e0b' : '#f87171' }}>
                    {data.metricas.ndviAtual.toFixed(2)}
                  </div>
                  <div className="text-xs text-slate-600">índice vegetativo</div>
                </div>
                <div className="card p-4">
                  <div className="text-xs text-slate-500 mb-1">Última Atualização</div>
                  <div className="text-base font-bold text-white ia-mono">{timeAgo(data.resumo.ultimaAtualizacao)}</div>
                  <div className="text-xs text-slate-600">ciclo automático</div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-5">
                {/* Agents grid */}
                <div className="space-y-3">
                  <h2 className="text-sm font-bold text-white">Agentes em Execução</h2>
                  {data.agentes.map(a => {
                    const cfg = statusConfig[a.status]
                    return (
                      <div key={a.id} className="card p-4" style={{ borderColor: a.status !== 'ok' ? cfg.color + '44' : undefined }}>
                        <div className="flex items-start gap-3">
                          <div className="relative flex-shrink-0">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ background: cfg.bg }}>
                              {a.icone}
                            </div>
                            <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border border-[#020c14] ${a.status === 'ok' ? '' : 'pulse-ring'}`} style={{ background: cfg.color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="text-sm font-bold text-white">{a.nome}</span>
                              <span className="text-xs px-2 py-0.5 rounded-full ia-mono" style={{ background: cfg.bg, color: cfg.color }}>
                                {cfg.label}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mb-2">{a.descricao}</p>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-bold ia-mono" style={{ color: cfg.color }}>{a.metricaLabel}</span>
                              <div className="text-right">
                                <div className="text-xs text-slate-600">últ: {timeAgo(a.ultimaVerificacao)}</div>
                                <div className="text-xs text-slate-600">prox: {nextIn(a.proximaVerificacao)}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Event feed */}
                <div>
                  <h2 className="text-sm font-bold text-white mb-3">Feed de Observações</h2>
                  <div className="space-y-2">
                    {data.eventos.map(ev => {
                      const cfg = eventoConfig[ev.tipo as keyof typeof eventoConfig] ?? eventoConfig.info
                      return (
                        <div key={ev.id} className="card p-4" style={{ borderColor: `${cfg.color}33` }}>
                          <div className="flex items-start gap-3">
                            <span className="text-base flex-shrink-0 mt-0.5">{cfg.icon}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-bold" style={{ color: cfg.color }}>{ev.agente}</span>
                                <span className="text-xs text-slate-600 ia-mono">{timeAgo(ev.ts)}</span>
                              </div>
                              <p className="text-sm text-slate-300 leading-relaxed">{ev.msg}</p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Live metrics footer */}
                  <div className="card p-4 mt-4">
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Métricas ao Vivo</p>
                    <div className="grid grid-cols-4 gap-3">
                      {[
                        { label: 'NDVI', value: data.metricas.ndviAtual.toFixed(2), unit: '' },
                        { label: 'Precip.', value: data.metricas.precipAtual.toFixed(0), unit: 'mm' },
                        { label: 'Temp.', value: data.metricas.tempAtual.toFixed(1), unit: '°C' },
                        { label: 'Umid.', value: data.metricas.umidAtual.toFixed(0), unit: '%' },
                      ].map(m => (
                        <div key={m.label} className="text-center">
                          <div className="text-sm font-bold text-white ia-mono">{m.value}{m.unit}</div>
                          <div className="text-xs text-slate-600">{m.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 pulse-ring" />
                <span className="text-xs text-slate-600">{data.source}</span>
                <span className="text-xs text-slate-700">· {new Date(data.generatedAt).toLocaleString('pt-BR')}</span>
              </div>
            </>
          ) : (
            <div className="card p-8 text-center">
              <p className="text-slate-400">Erro ao carregar agentes territoriais.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

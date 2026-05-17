'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

type CenarioOpcao = { id: string; label: string; descricao: string; impactoReceita: string; impactoCusto: string }
type SimResult = {
  cenario: string; label: string; descricao: string
  receita: number; custo: number; resultado: number; margem: number
  deltaResultado: number; deltaPercent: number; viavel: boolean; risco: string
}
type Base = { receita: number; custo: number; resultado: number; margemPercent: number; areaHa: number }
type Data = { ok: boolean; fazenda: string; linhaDeBase: Base; simulacoes: SimResult[]; cenariosMaisRisco: string[]; analiseIA: string }

const RISCO_COLOR: Record<string, string> = { baixo: '#10b981', medio: '#f59e0b', alto: '#ef4444' }
const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)

function use3D(intensity = 14) {
  const ref = useRef<HTMLDivElement>(null)
  const [st, setSt] = useState({})
  const onMove = (e: React.MouseEvent) => {
    const el = ref.current; if (!el) return
    const r = el.getBoundingClientRect()
    const x = ((e.clientX - r.left) / r.width - 0.5) * intensity
    const y = ((e.clientY - r.top) / r.height - 0.5) * intensity
    setSt({ transform: `perspective(900px) rotateY(${x}deg) rotateX(${-y}deg) scale3d(1.03,1.03,1.03)`, transition: 'transform 0.05s ease' })
  }
  const onLeave = () => setSt({ transform: 'perspective(900px) rotateY(0deg) rotateX(0deg) scale3d(1,1,1)', transition: 'transform 0.45s ease' })
  return { ref, st, onMove, onLeave }
}

function Bar3D({ sim, base }: { sim: SimResult; base: Base }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => { const t = setTimeout(() => setVisible(true), 100); return () => clearTimeout(t) }, [])
  const maxVal = Math.max(Math.abs(base.resultado), Math.abs(sim.resultado), 1)
  const baseW = (Math.abs(base.resultado) / maxVal) * 100
  const simW  = (Math.abs(sim.resultado)  / maxVal) * 100
  const ganho = sim.deltaResultado >= 0
  const color = ganho ? '#10b981' : '#ef4444'
  return (
    <div className="space-y-3">
      {/* Barra base */}
      <div className="flex items-center gap-3">
        <span className="text-[11px] text-white/30 w-16 shrink-0 text-right">Atual</span>
        <div className="flex-1 relative h-4 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <div className="absolute inset-y-0 left-0 rounded-full" style={{
            width: visible ? `${baseW}%` : '0%',
            background: 'linear-gradient(90deg, rgba(100,116,139,0.8), rgba(71,85,105,0.6))',
            transition: 'width 0.8s cubic-bezier(.4,0,.2,1)',
            boxShadow: '2px 0 8px rgba(100,116,139,0.4)',
          }} />
        </div>
        <span className="text-[11px] text-white/40 w-24 text-right">{fmt(base.resultado)}</span>
      </div>
      {/* Barra cenário */}
      <div className="flex items-center gap-3">
        <span className="text-[11px] text-white/30 w-16 shrink-0 text-right">Cenário</span>
        <div className="flex-1 relative h-6 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <div className="absolute inset-y-0 left-0 rounded-full" style={{
            width: visible ? `${simW}%` : '0%',
            background: ganho
              ? 'linear-gradient(90deg, #10b981, #059669)'
              : 'linear-gradient(90deg, #ef4444, #dc2626)',
            transition: 'width 1s cubic-bezier(.4,0,.2,1) 0.1s',
            boxShadow: `2px 0 16px ${color}88`,
          }} />
          {/* Reflexo 3D */}
          <div className="absolute inset-x-0 top-0 h-1/2 rounded-t-full" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.15), transparent)' }} />
        </div>
        <span className="text-[11px] font-bold w-24 text-right" style={{ color }}>{fmt(sim.resultado)}</span>
      </div>
    </div>
  )
}

function ScenarioCard({ sim, base }: { sim: SimResult; base: Base }) {
  const { ref, st, onMove, onLeave } = use3D(10)
  const ganho = sim.deltaResultado >= 0
  const riskColor = RISCO_COLOR[sim.risco] ?? '#94a3b8'
  return (
    <div ref={ref} style={{
      ...st, transformStyle: 'preserve-3d', cursor: 'default',
      background: ganho
        ? 'linear-gradient(135deg, rgba(16,185,129,0.05), rgba(5,150,105,0.03))'
        : 'linear-gradient(135deg, rgba(239,68,68,0.06), rgba(220,38,38,0.03))',
      border: `1px solid ${ganho ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
      borderRadius: '1.25rem',
      boxShadow: ganho
        ? '0 8px 32px rgba(0,0,0,0.4), 0 0 20px rgba(16,185,129,0.1), inset 0 1px 0 rgba(255,255,255,0.05)'
        : '0 8px 32px rgba(0,0,0,0.4), 0 0 20px rgba(239,68,68,0.1), inset 0 1px 0 rgba(255,255,255,0.05)',
      padding: '1.5rem',
    }} onMouseMove={onMove} onMouseLeave={onLeave}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-bold text-white">{sim.label}</span>
            {!sim.viavel && <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: 'rgba(239,68,68,0.2)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.3)' }}>INVIÁVEL</span>}
            <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: `${riskColor}22`, color: riskColor, border: `1px solid ${riskColor}44` }}>
              risco {sim.risco}
            </span>
          </div>
          <p className="text-xs text-white/40">{sim.descricao}</p>
        </div>
        {/* Delta 3D badge */}
        <div className="text-right ml-4" style={{ transform: 'translateZ(20px)' }}>
          <div className="text-2xl font-black" style={{ color: ganho ? '#10b981' : '#ef4444', textShadow: `0 0 20px ${ganho ? '#10b981' : '#ef4444'}88` }}>
            {ganho ? '+' : ''}{sim.deltaPercent}%
          </div>
          <div className="text-[11px] opacity-60" style={{ color: ganho ? '#10b981' : '#ef4444' }}>
            {ganho ? '+' : ''}{fmt(sim.deltaResultado)}
          </div>
        </div>
      </div>

      <Bar3D sim={sim} base={base} />

      {/* Métricas */}
      <div className="grid grid-cols-3 gap-2 mt-4">
        {[
          { l: 'Receita', v: fmt(sim.receita), c: '#10b981' },
          { l: 'Custo',   v: fmt(sim.custo),   c: '#f97316' },
          { l: 'Margem',  v: `${sim.margem}%`,  c: sim.margem >= 10 ? '#10b981' : sim.margem >= 0 ? '#f59e0b' : '#ef4444' },
        ].map(m => (
          <div key={m.l} className="text-center py-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="text-[10px] text-white/30 mb-0.5">{m.l}</div>
            <div className="text-xs font-bold" style={{ color: m.c }}>{m.v}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function SimulacoesPage() {
  const [opcoes, setOpcoes] = useState<CenarioOpcao[]>([])
  const [sel, setSel] = useState<string[]>(['seca_moderada', 'alta_commodity', 'aumento_insumos'])
  const [data, setData] = useState<Data | null>(null)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [aiOpen, setAiOpen] = useState(false)

  useEffect(() => { fetch('/api/ai/digital-twin').then(r => r.json()).then(j => setOpcoes(j.cenarios ?? [])) }, [])

  function toggle(id: string) { setSel(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]) }

  async function simular() {
    if (!sel.length) return
    setLoading(true); setErro('')
    try {
      const res = await fetch('/api/ai/digital-twin', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cenarios: sel }),
      })
      const json = await res.json()
      if (!res.ok || !json.ok) { setErro(json.error ?? 'Erro'); return }
      setData(json); setAiOpen(true)
    } catch (e: any) { setErro(e.message) }
    finally { setLoading(false) }
  }

  const base = data?.linhaDeBase

  return (
    <div className="min-h-screen pb-24" style={{ background: 'linear-gradient(135deg, #060b14 0%, #0d1b2e 60%, #060b14 100%)' }}>

      {/* Background 3D mesh */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute w-[700px] h-[700px] rounded-full opacity-8 blur-3xl -top-32 -right-32"
          style={{ background: 'radial-gradient(circle, #6366f1, transparent)' }} />
        <div className="absolute w-[500px] h-[500px] rounded-full opacity-6 blur-3xl bottom-0 -left-20"
          style={{ background: 'radial-gradient(circle, #10b981, transparent)' }} />
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
          transform: 'perspective(600px) rotateX(3deg)',
          transformOrigin: 'center top',
        }} />
      </div>

      <div className="relative max-w-5xl mx-auto px-4 py-8 space-y-6">

        {/* Header flutuante */}
        <div style={{ transform: 'perspective(1200px) rotateX(1.5deg)', transformOrigin: 'center top' }}>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 text-white/20 text-xs mb-2">
                <Link href="/dashboard/financeiro" className="hover:text-white/50 transition-colors">Financeiro</Link>
                <span>/</span><span>Digital Twin</span>
              </div>
              <h1 className="text-3xl font-black tracking-tight" style={{
                background: 'linear-gradient(135deg, #ffffff, #a5b4fc)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                textShadow: 'none', filter: 'drop-shadow(0 0 30px rgba(99,102,241,0.5))',
              }}>Digital Twin da Fazenda</h1>
              <p className="text-white/30 text-sm mt-1.5">Simule cenários futuros e antecipe riscos antes que aconteçam</p>
            </div>
          </div>
        </div>

        {/* Seletor de cenários — glassmorphism */}
        <div style={{
          background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.08)', borderRadius: '1.5rem',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)',
          padding: '1.75rem',
        }}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-white/80">Selecionar Cenários</h2>
            <span className="text-xs text-white/30">{sel.length} selecionado(s)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
            {opcoes.map(op => {
              const isSelected = sel.includes(op.id)
              const positive = op.impactoReceita.startsWith('+')
              return (
                <button key={op.id} onClick={() => toggle(op.id)}
                  className="text-left rounded-xl p-3.5 transition-all"
                  style={{
                    background: isSelected ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${isSelected ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.06)'}`,
                    boxShadow: isSelected ? '0 0 20px rgba(99,102,241,0.2)' : 'none',
                    transform: isSelected ? 'scale(1.01)' : 'scale(1)',
                  }}>
                  <div className="flex items-start gap-2 mb-2">
                    <div className="w-4 h-4 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center transition-all"
                      style={{ borderColor: isSelected ? '#6366f1' : 'rgba(255,255,255,0.2)', background: isSelected ? '#6366f1' : 'transparent' }}>
                      {isSelected && <svg viewBox="0 0 10 10" className="w-2.5 h-2.5" fill="white"><path d="M1.5 5l2.5 2.5 5-5" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>}
                    </div>
                    <span className="text-sm font-medium text-white/80 leading-snug">{op.label}</span>
                  </div>
                  <div className="flex gap-1.5 ml-6">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{
                      background: positive ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                      color: positive ? '#34d399' : '#f87171',
                    }}>R {op.impactoReceita}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{
                      background: op.impactoCusto.startsWith('-') ? 'rgba(16,185,129,0.15)' : 'rgba(249,115,22,0.15)',
                      color: op.impactoCusto.startsWith('-') ? '#34d399' : '#fb923c',
                    }}>C {op.impactoCusto}</span>
                  </div>
                </button>
              )
            })}
          </div>

          <button onClick={simular} disabled={loading || !sel.length}
            className="w-full py-3.5 font-bold rounded-xl disabled:opacity-40 transition-all"
            style={{
              background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
              boxShadow: sel.length ? '0 8px 32px rgba(99,102,241,0.4), 0 0 60px rgba(99,102,241,0.15)' : 'none',
              color: 'white', fontSize: '0.9rem',
              transform: loading ? 'scale(0.99)' : 'scale(1)',
            }}>
            {loading ? '⏳ Processando simulação...' : `▶ Simular ${sel.length} cenário(s)`}
          </button>
        </div>

        {erro && <div className="p-4 rounded-xl text-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5' }}>{erro}</div>}

        {/* Linha de base — cards 3D flutuantes */}
        {base && (
          <div>
            <div className="text-[10px] text-white/25 uppercase tracking-widest mb-3">Linha de Base</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { l: 'Receita', v: fmt(base.receita), c: '#10b981', icon: '📈' },
                { l: 'Custo',   v: fmt(base.custo),   c: '#f97316', icon: '📉' },
                { l: 'Resultado', v: fmt(base.resultado), c: base.resultado >= 0 ? '#10b981' : '#ef4444', icon: '💰' },
                { l: 'Margem',  v: `${base.margemPercent}%`, c: base.margemPercent >= 15 ? '#10b981' : '#f59e0b', icon: '📊' },
              ].map(m => (
                <div key={m.l} className="text-center p-4 rounded-2xl" style={{
                  background: `linear-gradient(135deg, ${m.c}0a, ${m.c}05)`,
                  border: `1px solid ${m.c}22`,
                  boxShadow: `0 4px 20px rgba(0,0,0,0.3), 0 0 20px ${m.c}0a`,
                }}>
                  <div className="text-2xl mb-1">{m.icon}</div>
                  <div className="text-[10px] text-white/30 mb-1 uppercase tracking-wider">{m.l}</div>
                  <div className="text-base font-black" style={{ color: m.c, textShadow: `0 0 20px ${m.c}66` }}>{m.v}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Resultados com 3D cards */}
        {data?.simulacoes && data.simulacoes.length > 0 && (
          <div className="space-y-4">
            <div className="text-[10px] text-white/25 uppercase tracking-widest">Resultados por Cenário</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.simulacoes.map((sim, i) => <ScenarioCard key={i} sim={sim} base={base!} />)}
            </div>
          </div>
        )}

        {/* Cenários mais arriscados */}
        {data?.cenariosMaisRisco && data.cenariosMaisRisco.length > 0 && (
          <div className="p-4 rounded-xl" style={{
            background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)',
            boxShadow: '0 0 30px rgba(239,68,68,0.1)',
          }}>
            <div className="text-xs font-semibold mb-2" style={{ color: '#f87171' }}>⚠ Maior risco identificado</div>
            <div className="flex flex-wrap gap-2">
              {data.cenariosMaisRisco.map((c, i) => (
                <span key={i} className="text-xs px-2 py-1 rounded-lg" style={{ background: 'rgba(239,68,68,0.15)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.25)' }}>{c}</span>
              ))}
            </div>
          </div>
        )}

        {/* Análise IA — accordion */}
        {data?.analiseIA && (
          <button onClick={() => setAiOpen(!aiOpen)} className="w-full text-left" style={{
            background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.05))',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(99,102,241,0.2)',
            borderRadius: '1.25rem',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 40px rgba(99,102,241,0.1)',
            padding: '1.25rem 1.5rem',
          }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                  style={{ background: 'rgba(99,102,241,0.2)', boxShadow: '0 0 20px rgba(99,102,241,0.3)' }}>🧠</div>
                <div>
                  <div className="font-semibold text-white text-sm">Análise Estratégica</div>
                  <div className="text-xs text-white/30">Diagnóstico de resiliência + recomendações</div>
                </div>
              </div>
              <span className="text-white/30 text-lg">{aiOpen ? '▲' : '▼'}</span>
            </div>
            {aiOpen && (
              <p className="text-white/60 text-sm leading-relaxed mt-4 pt-4 border-t border-white/05 whitespace-pre-wrap text-left">
                {data.analiseIA}
              </p>
            )}
          </button>
        )}
      </div>
    </div>
  )
}

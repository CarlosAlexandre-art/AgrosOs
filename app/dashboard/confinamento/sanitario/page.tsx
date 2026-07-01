'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'

type LoteAnalise = {
  nome: string; semaforo: 'verde' | 'amarelo' | 'vermelho'
  scoreSaude: number; pontosCriticos: string[]
  gmdAvaliacao: string; riscoSanitario: string
  acoesPrioritarias: string[]; previsaoAbate: string
}
type Analise = {
  resumoGeral: string; lotes: LoteAnalise[]
  alertasGerais: string[]; recomendacoesNutricionais: string[]; custoBeneficio: string
}
type Data = { ok: boolean; lotes: number; analise: Analise }

const SEMAFORO = {
  verde:    { color: '#10b981', glow: '#10b98166', label: 'Saudável', bg: 'rgba(16,185,129,0.06)', border: 'rgba(16,185,129,0.4)' },
  amarelo:  { color: '#f59e0b', glow: '#f59e0b66', label: 'Atenção',  bg: 'rgba(245,158,11,0.06)', border: 'rgba(245,158,11,0.4)' },
  vermelho: { color: '#ef4444', glow: '#ef444466', label: 'Crítico',  bg: 'rgba(239,68,68,0.06)',  border: 'rgba(239,68,68,0.4)' },
}

function use3D() {
  const ref = useRef<HTMLDivElement>(null)
  const [style, setStyle] = useState({})
  function onMove(e: React.MouseEvent) {
    const el = ref.current; if (!el) return
    const r = el.getBoundingClientRect()
    const x = ((e.clientX - r.left) / r.width  - 0.5) * 18
    const y = ((e.clientY - r.top)  / r.height - 0.5) * 18
    setStyle({ transform: `perspective(900px) rotateY(${x}deg) rotateX(${-y}deg) scale3d(1.03,1.03,1.03)`, transition: 'transform 0.05s ease' })
  }
  function onLeave() { setStyle({ transform: 'perspective(900px) rotateY(0deg) rotateX(0deg) scale3d(1,1,1)', transition: 'transform 0.4s ease' }) }
  return { ref, style, onMove, onLeave }
}

function ScoreRing({ score, color, glow }: { score: number; color: string; glow: string }) {
  const r = 38, cx = 46, cy = 46, circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ
  return (
    <div className="relative">
      <svg viewBox="0 0 92 92" className="w-24 h-24 -rotate-90" style={{ filter: `drop-shadow(0 0 12px ${glow})` }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={9} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={9}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s cubic-bezier(.4,0,.2,1)' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-black" style={{ color }}>{score}</span>
        <span className="text-[9px] text-white/40 uppercase tracking-widest">saúde</span>
      </div>
    </div>
  )
}

function LoteCard({ lote }: { lote: LoteAnalise }) {
  const s = SEMAFORO[lote.semaforo]
  const { ref, style, onMove, onLeave } = use3D()
  return (
    <div ref={ref} style={{ ...style, transformStyle: 'preserve-3d', cursor: 'default',
      background: `linear-gradient(135deg, ${s.bg}, rgba(15,23,42,0.9))`,
      border: `1px solid ${s.border}`,
      boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 40px ${s.glow}, inset 0 1px 0 rgba(255,255,255,0.06)`,
      borderRadius: '1.25rem', padding: '1.5rem' }}
      onMouseMove={onMove} onMouseLeave={onLeave}>

      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="w-3 h-3 rounded-full animate-pulse" style={{ background: s.color, boxShadow: `0 0 8px ${s.color}` }} />
            <span className="font-bold text-white text-lg">{lote.nome}</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
              {s.label}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-white/50">
              GMD {lote.gmdAvaliacao}
            </span>
          </div>
        </div>
        <ScoreRing score={lote.scoreSaude} color={s.color} glow={s.glow} />
      </div>

      {/* Previsão abate */}
      <div className="mb-4 px-3 py-2 rounded-xl text-xs text-white/60" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
        🗓 Abate estimado: <span className="text-white/80">{lote.previsaoAbate}</span>
      </div>

      {/* Pontos críticos */}
      {lote.pontosCriticos.length > 0 && (
        <div className="mb-4">
          <div className="text-[10px] text-white/30 uppercase tracking-widest mb-2">Pontos críticos</div>
          <ul className="space-y-1.5">
            {lote.pontosCriticos.map((p, i) => (
              <li key={i} className="text-sm text-white/70 flex gap-2">
                <span style={{ color: '#f59e0b' }}>⚠</span>{p}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Ações */}
      {lote.acoesPrioritarias.length > 0 && (
        <div>
          <div className="text-[10px] text-white/30 uppercase tracking-widest mb-2">Ações prioritárias</div>
          <ul className="space-y-1.5">
            {lote.acoesPrioritarias.map((a, i) => (
              <li key={i} className="text-sm flex gap-2" style={{ color: s.color }}>
                <span>→</span>{a}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default function MonitorSanitarioPage() {
  const [data, setData] = useState<Data | null>(null)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [solicitado, setSolicitado] = useState(false)

  async function analisar() {
    setLoading(true); setErro(''); setSolicitado(true)
    try {
      const res = await fetch('/api/ai/monitor-sanitario', { method: 'POST' })
      let json: any
      try { json = await res.json() } catch { setErro('Serviço de IA indisponível. Tente novamente em instantes.'); return }
      if (!res.ok || !json.ok) { setErro(json.error ?? 'Erro na análise'); return }
      setData(json)
    } catch { setErro('Não foi possível conectar ao servidor. Verifique sua conexão.') }
    finally { setLoading(false) }
  }

  const a = data?.analise

  return (
    <div className="min-h-screen pb-20" style={{ background: 'linear-gradient(135deg, #060b14 0%, #0d1b2e 50%, #07111f 100%)' }}>

      {/* Mesh de fundo */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute w-[600px] h-[600px] rounded-full opacity-10 blur-3xl"
          style={{ background: 'radial-gradient(circle, #10b981, transparent)', top: '-10%', left: '-10%' }} />
        <div className="absolute w-[500px] h-[500px] rounded-full opacity-8 blur-3xl"
          style={{ background: 'radial-gradient(circle, #ef4444, transparent)', bottom: '0', right: '-5%' }} />
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />
      </div>

      <div className="relative max-w-5xl mx-auto px-4 py-8 space-y-6">

        {/* Header 3D */}
        <div style={{ transform: 'perspective(1200px) rotateX(2deg)', transformStyle: 'preserve-3d' }}>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 text-white/30 text-xs mb-2">
                <Link href="/dashboard/confinamento" className="hover:text-white/60 transition-colors">Confinamento</Link>
                <span>/</span><span>Monitor Sanitário</span>
              </div>
              <h1 className="text-3xl font-black text-white tracking-tight" style={{
                textShadow: '0 0 40px rgba(16,185,129,0.5), 0 4px 8px rgba(0,0,0,0.8)',
              }}>Monitor Sanitário IA</h1>
              <p className="text-white/40 text-sm mt-1.5">Análise zootécnica em tempo real com semáforo por lote</p>
            </div>
            <button onClick={analisar} disabled={loading}
              className="px-6 py-3 font-bold text-sm rounded-xl disabled:opacity-50 transition-all"
              style={{
                background: 'linear-gradient(135deg, #10b981, #059669)',
                boxShadow: '0 8px 24px rgba(16,185,129,0.4), 0 0 40px rgba(16,185,129,0.2)',
                color: 'white', transform: loading ? 'scale(0.98)' : 'scale(1)',
              }}>
              {loading ? '⏳ Analisando...' : '🔬 Analisar Lotes'}
            </button>
          </div>
        </div>

        {/* Estado inicial */}
        {!solicitado && !loading && (
          <div className="text-center py-20" style={{
            background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.06)', borderRadius: '1.5rem',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          }}>
            <div className="text-6xl mb-5 inline-block" style={{ filter: 'drop-shadow(0 0 20px #10b98166)' }}>🩺</div>
            <h2 className="text-xl font-bold text-white mb-3">Saúde do Rebanho em Tempo Real</h2>
            <p className="text-white/40 text-sm max-w-sm mx-auto mb-8">Cruza GMD, consumo, mortalidade e ocorrências dos últimos 7 dias para emitir um parecer sanitário completo.</p>
            <button onClick={analisar} className="px-8 py-4 font-bold rounded-2xl text-white"
              style={{ background: 'linear-gradient(135deg,#10b981,#059669)', boxShadow: '0 8px 32px rgba(16,185,129,0.5)' }}>
              Iniciar Diagnóstico
            </button>
          </div>
        )}

        {loading && (
          <div className="text-center py-20" style={{ background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '1.5rem' }}>
            <div className="flex justify-center gap-2 mb-5">
              {[0, 1, 2].map(i => (
                <div key={i} className="w-3 h-3 rounded-full" style={{
                  background: '#10b981', animation: 'bounce 1s ease infinite',
                  animationDelay: `${i * 0.15}s`, boxShadow: '0 0 8px #10b981',
                }} />
              ))}
            </div>
            <p className="text-white/40 text-sm">Cruzando dados zootécnicos...</p>
          </div>
        )}

        {erro && !loading && (
          <div className="p-4 rounded-xl text-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5' }}>{erro}</div>
        )}

        {a && !loading && (
          <>
            {/* Resumo geral — glasscard */}
            <div style={{
              background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(24px)',
              border: '1px solid rgba(255,255,255,0.08)', borderRadius: '1.25rem',
              boxShadow: '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)',
              padding: '1.5rem',
            }}>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">📊</span>
                <span className="text-sm font-semibold text-white/70 uppercase tracking-wider">
                  Avaliação Geral — {data?.lotes} lote(s)
                </span>
              </div>
              <p className="text-white/70 text-sm leading-relaxed">{a.resumoGeral}</p>
            </div>

            {/* Alertas críticos */}
            {a.alertasGerais.length > 0 && (
              <div style={{
                background: 'rgba(239,68,68,0.08)', backdropFilter: 'blur(16px)',
                border: '1px solid rgba(239,68,68,0.3)', borderRadius: '1.25rem',
                boxShadow: '0 4px 24px rgba(239,68,68,0.15)', padding: '1.25rem',
              }}>
                <h3 className="text-sm font-bold mb-3" style={{ color: '#f87171' }}>🚨 Alertas Críticos</h3>
                <ul className="space-y-2">
                  {a.alertasGerais.map((al, i) => (
                    <li key={i} className="text-sm flex gap-2" style={{ color: '#fca5a5' }}><span>•</span>{al}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Cards de lotes em 3D */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {a.lotes.map((lote, i) => <LoteCard key={i} lote={lote} />)}
            </div>

            {/* Recomendações nutricionais */}
            {a.recomendacoesNutricionais.length > 0 && (
              <div style={{
                background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255,255,255,0.08)', borderRadius: '1.25rem',
                padding: '1.5rem',
              }}>
                <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">🌾 Recomendações Nutricionais</h3>
                <ul className="space-y-2">
                  {a.recomendacoesNutricionais.map((r, i) => (
                    <li key={i} className="text-sm text-white/70 flex gap-2"><span style={{ color: '#10b981' }}>•</span>{r}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Custo-benefício */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(16,185,129,0.06), rgba(5,150,105,0.04))',
              border: '1px solid rgba(16,185,129,0.2)', borderRadius: '1.25rem', padding: '1.5rem',
            }}>
              <h3 className="text-sm font-semibold mb-2" style={{ color: '#34d399' }}>💰 Avaliação Econômica</h3>
              <p className="text-white/60 text-sm leading-relaxed">{a.custoBeneficio}</p>
            </div>
          </>
        )}
      </div>
      <style>{`@keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }`}</style>
    </div>
  )
}

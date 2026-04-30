'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type Stats = { activeTokens: number; totalValue: number; investors: number; totalTokens: number }

function useCountUp(target: number, duration = 1200) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (target === 0) return
    let start: number | null = null
    const step = (ts: number) => {
      if (!start) start = ts
      const p = Math.min((ts - start) / duration, 1)
      const ease = 1 - Math.pow(1 - p, 3)
      setVal(Math.round(target * ease))
      if (p < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [target, duration])
  return val
}

function StatCard({ label, value, prefix = '', suffix = '', delay = 0 }: {
  label: string; value: number; prefix?: string; suffix?: string; delay?: number
}) {
  const animated = useCountUp(value, 1400)
  const display = prefix + (value >= 1000
    ? animated.toLocaleString('pt-BR')
    : animated.toString()) + suffix

  return (
    <div style={{
      animationDelay: `${delay}ms`,
      background: 'linear-gradient(135deg, rgba(255,255,255,.03) 0%, rgba(255,255,255,.01) 100%)',
      border: '1px solid rgba(212,168,67,.15)',
      borderRadius: 20,
      padding: '28px 24px',
    }} className="stat-card">
      <div style={{
        fontFamily: "'DM Mono', 'Courier New', monospace",
        fontSize: 36,
        fontWeight: 700,
        color: '#d4a843',
        letterSpacing: '-1px',
        lineHeight: 1,
        marginBottom: 8,
      }}>{display}</div>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,.35)', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
        {label}
      </div>
    </div>
  )
}

export default function TokenHubPage() {
  const [stats, setStats] = useState<Stats>({ activeTokens: 0, totalValue: 0, investors: 0, totalTokens: 0 })
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    fetch('/api/tokens/stats').then(r => r.ok ? r.json() : null).then(d => {
      if (d) setStats(d)
    }).catch(() => {})
  }, [])

  const cards = [
    {
      href: '/dashboard/token/novo',
      icon: '✦',
      title: 'Emitir Token',
      desc: 'Tokenize sua safra, material ou maquinário e capte capital de múltiplos investidores.',
      cta: 'Começar emissão',
      accent: '#4ade80',
      glow: 'rgba(74,222,128,.18)',
      colorClass: 'green',
    },
    {
      href: '/dashboard/token/mercado',
      icon: '◈',
      title: 'Mercado',
      desc: 'Explore tokens ativos de produtores verificados. Invista com laudo de capacidade produtiva.',
      cta: 'Ver mercado',
      accent: '#d4a843',
      glow: 'rgba(212,168,67,.18)',
      colorClass: 'gold',
    },
    {
      href: '/dashboard/token/investimentos',
      icon: '◎',
      title: 'Meus Investimentos',
      desc: 'Acompanhe sua carteira de tokens agrícolas, retornos e posição on-chain.',
      cta: 'Ver carteira',
      accent: '#60a5fa',
      glow: 'rgba(96,165,250,.18)',
      colorClass: 'blue',
    },
  ]

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600&family=DM+Mono:wght@400;500;700&display=swap');

        @keyframes grain {
          0%, 100% { transform: translate(0,0) }
          10% { transform: translate(-2%,-3%) }
          30% { transform: translate(3%,-1%) }
          50% { transform: translate(-1%,3%) }
          70% { transform: translate(2%,1%) }
          90% { transform: translate(-3%,2%) }
        }
        @keyframes pulse-ring {
          0%, 100% { opacity: .4; transform: scale(1) }
          50% { opacity: .7; transform: scale(1.06) }
        }
        @keyframes float-up {
          from { opacity: 0; transform: translateY(32px) }
          to   { opacity: 1; transform: translateY(0) }
        }
        @keyframes slide-in {
          from { opacity: 0; transform: translateX(-20px) }
          to   { opacity: 1; transform: translateX(0) }
        }
        @keyframes shimmer-gold {
          0%   { background-position: 200% center }
          100% { background-position: -200% center }
        }
        @keyframes orbit-dot {
          from { transform: rotate(0deg) translateX(110px) rotate(0deg) }
          to   { transform: rotate(360deg) translateX(110px) rotate(-360deg) }
        }
        @keyframes orbit-dot2 {
          from { transform: rotate(90deg) translateX(160px) rotate(-90deg) }
          to   { transform: rotate(450deg) translateX(160px) rotate(-450deg) }
        }
        @keyframes scan-line {
          0%   { top: -2px }
          100% { top: 100% }
        }
        @keyframes ticker {
          from { transform: translateX(0) }
          to   { transform: translateX(-50%) }
        }

        .hub-bg {
          font-family: 'DM Sans', sans-serif;
          background: #060b06;
          min-height: 100%;
          position: relative;
          overflow: hidden;
        }
        .gold-text {
          background: linear-gradient(90deg, #d4a843, #f0cc70, #c49a2a, #d4a843);
          background-size: 200%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer-gold 4s linear infinite;
        }
        .stat-card {
          animation: float-up .7s cubic-bezier(.16,1,.3,1) both;
        }
        .action-card {
          transition: transform .2s ease, border-color .2s ease, box-shadow .2s ease;
          cursor: pointer;
          border: 1px solid rgba(255,255,255,.07);
        }
        .action-card.green:hover  { transform: translateY(-4px); border-color: rgba(74,222,128,.35)  !important; box-shadow: 0 0 40px rgba(74,222,128,.18),  0 8px 32px rgba(0,0,0,.4); }
        .action-card.gold:hover   { transform: translateY(-4px); border-color: rgba(212,168,67,.35) !important; box-shadow: 0 0 40px rgba(212,168,67,.18), 0 8px 32px rgba(0,0,0,.4); }
        .action-card.blue:hover   { transform: translateY(-4px); border-color: rgba(96,165,250,.35) !important; box-shadow: 0 0 40px rgba(96,165,250,.18), 0 8px 32px rgba(0,0,0,.4); }
        .action-card a, .action-card a:hover { color: inherit; text-decoration: none; }
        .live-dot {
          width: 8px; height: 8px;
          background: #4ade80;
          border-radius: 50%;
          box-shadow: 0 0 0 0 rgba(74,222,128,.6);
          animation: pulse-ring 1.8s ease-in-out infinite;
        }
        .grain-overlay {
          position: absolute; inset: -50%;
          width: 200%; height: 200%;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='.04'/%3E%3C/svg%3E");
          opacity: .5;
          animation: grain 8s steps(10) infinite;
          pointer-events: none;
        }
      `}</style>

      <div className="hub-bg">
        {/* Grain overlay */}
        <div className="grain-overlay" style={{ pointerEvents: 'none' }} />

        {/* Background mesh */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
          <div style={{
            position: 'absolute', top: '-20%', left: '-10%',
            width: 700, height: 700,
            background: 'radial-gradient(ellipse, rgba(22,101,52,.22) 0%, transparent 65%)',
            filter: 'blur(40px)',
          }} />
          <div style={{
            position: 'absolute', bottom: '-10%', right: '-5%',
            width: 500, height: 500,
            background: 'radial-gradient(ellipse, rgba(146,100,23,.14) 0%, transparent 65%)',
            filter: 'blur(50px)',
          }} />
          <div style={{
            position: 'absolute', top: '40%', left: '55%',
            width: 300, height: 300,
            background: 'radial-gradient(ellipse, rgba(22,163,74,.06) 0%, transparent 70%)',
            filter: 'blur(30px)',
          }} />

          {/* Geometric grid */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'linear-gradient(rgba(212,168,67,.03) 1px, transparent 1px), linear-gradient(90deg, rgba(212,168,67,.03) 1px, transparent 1px)',
            backgroundSize: '80px 80px',
          }} />

          {/* Orbital rings */}
          {mounted && (
            <div style={{ position: 'absolute', top: '50%', left: '50%', width: 0, height: 0 }}>
              <div style={{
                position: 'absolute', width: 320, height: 320,
                marginTop: -160, marginLeft: -160,
                border: '1px solid rgba(212,168,67,.06)',
                borderRadius: '50%',
              }} />
              <div style={{
                position: 'absolute', width: 460, height: 460,
                marginTop: -230, marginLeft: -230,
                border: '1px solid rgba(74,222,128,.04)',
                borderRadius: '50%',
              }} />
              <div style={{
                position: 'absolute', width: 8, height: 8, borderRadius: '50%',
                background: '#d4a843', opacity: .7,
                boxShadow: '0 0 16px #d4a843',
                animation: 'orbit-dot 9s linear infinite',
              }} />
              <div style={{
                position: 'absolute', width: 5, height: 5, borderRadius: '50%',
                background: '#4ade80', opacity: .5,
                boxShadow: '0 0 10px #4ade80',
                animation: 'orbit-dot2 14s linear infinite',
              }} />
            </div>
          )}
        </div>

        {/* Ticker bar */}
        <div style={{
          position: 'relative', zIndex: 10,
          borderBottom: '1px solid rgba(212,168,67,.1)',
          background: 'rgba(0,0,0,.3)',
          backdropFilter: 'blur(12px)',
          overflow: 'hidden',
          height: 36,
          display: 'flex', alignItems: 'center',
        }}>
          <div style={{ animation: 'ticker 28s linear infinite', display: 'flex', gap: 64, whiteSpace: 'nowrap', willChange: 'transform' }}>
            {['SOJ · R$ 148,20/sc', 'MILHO · R$ 63,40/sc', 'CAFÉ · R$ 1.820/sc', 'TRIGO · R$ 89,50/sc', 'ALGODÃO · R$ 4,20/kg', 'POLYGON · $0.47', 'SOJ · R$ 148,20/sc', 'MILHO · R$ 63,40/sc', 'CAFÉ · R$ 1.820/sc', 'TRIGO · R$ 89,50/sc', 'ALGODÃO · R$ 4,20/kg', 'POLYGON · $0.47'].map((item, i) => (
              <span key={i} style={{ fontSize: 11, color: 'rgba(212,168,67,.6)', fontFamily: "'DM Mono', monospace", fontWeight: 500, letterSpacing: '.06em' }}>
                {item}
              </span>
            ))}
          </div>
        </div>

        {/* Main content */}
        <div style={{ position: 'relative', zIndex: 10, padding: '48px 32px 64px', maxWidth: 1100, margin: '0 auto' }}>

          {/* Header */}
          <div style={{ animation: 'float-up .6s cubic-bezier(.16,1,.3,1) both', marginBottom: 56 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div className="live-dot" />
              <span style={{ fontSize: 11, color: '#4ade80', fontWeight: 700, letterSpacing: '.18em', textTransform: 'uppercase' }}>
                Plataforma ao vivo · Polygon Mainnet
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24 }}>
              <div>
                <h1 style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 'clamp(48px, 6vw, 80px)',
                  fontWeight: 900,
                  lineHeight: .95,
                  letterSpacing: '-2px',
                  color: '#f5f0e8',
                  margin: 0,
                }}>
                  Agro<span className="gold-text">Token</span>
                </h1>
                <p style={{ marginTop: 16, fontSize: 16, color: 'rgba(255,255,255,.4)', maxWidth: 440, lineHeight: 1.6, fontWeight: 400 }}>
                  Tokenização de ativos agrícolas brasileiros na blockchain Polygon.
                  Produtores captam capital. Investidores participam do campo.
                </p>
              </div>

              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'rgba(212,168,67,.06)',
                border: '1px solid rgba(212,168,67,.2)',
                borderRadius: 14, padding: '10px 18px',
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#d4a843" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span style={{ fontSize: 12, color: 'rgba(212,168,67,.8)', fontFamily: "'DM Mono', monospace", fontWeight: 500 }}>
                  ERC-1155 · POLYGON
                </span>
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 16,
            marginBottom: 48,
          }}>
            <StatCard label="Tokens ativos" value={stats.activeTokens} delay={100} />
            <StatCard label="Volume tokenizado" value={stats.totalValue} prefix="R$ " delay={200} />
            <StatCard label="Investidores" value={stats.investors} delay={300} />
            <StatCard label="Tokens emitidos" value={stats.totalTokens} delay={400} />
          </div>

          {/* Divider */}
          <div style={{
            height: 1,
            background: 'linear-gradient(90deg, transparent, rgba(212,168,67,.2), rgba(74,222,128,.15), transparent)',
            marginBottom: 48,
          }} />

          {/* Action cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 20,
            marginBottom: 48,
          }}>
            {cards.map((card, i) => (
              <Link key={card.href} href={card.href} style={{ textDecoration: 'none', display: 'block' }}>
                <div
                  className={`action-card ${card.colorClass}`}
                  style={{
                    animationDelay: `${200 + i * 120}ms`,
                    animation: 'float-up .7s cubic-bezier(.16,1,.3,1) both',
                    background: 'linear-gradient(135deg, rgba(255,255,255,.04) 0%, rgba(255,255,255,.01) 100%)',
                    borderRadius: 24,
                    padding: 28,
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {/* Corner glow */}
                  <div style={{
                    position: 'absolute', top: 0, right: 0,
                    width: 120, height: 120,
                    background: `radial-gradient(circle at 100% 0%, ${card.glow} 0%, transparent 70%)`,
                    pointerEvents: 'none',
                  }} />

                  <div style={{
                    width: 48, height: 48,
                    background: `${card.accent}14`,
                    border: `1px solid ${card.accent}30`,
                    borderRadius: 14,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22, color: card.accent,
                    marginBottom: 20,
                    fontFamily: "'DM Mono', monospace",
                  }}>
                    {card.icon}
                  </div>

                  <h3 style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: 22, fontWeight: 700,
                    color: '#f5f0e8', margin: '0 0 10px',
                  }}>
                    {card.title}
                  </h3>
                  <p style={{
                    fontSize: 14, color: 'rgba(255,255,255,.4)',
                    lineHeight: 1.6, margin: '0 0 24px',
                  }}>
                    {card.desc}
                  </p>

                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    fontSize: 13, fontWeight: 600, color: card.accent,
                  }}>
                    {card.cta}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M5 12h14M12 5l7 7-7 7" stroke={card.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Info strip */}
          <div style={{
            animation: 'float-up .7s cubic-bezier(.16,1,.3,1) .5s both',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 12,
          }}>
            {[
              { icon: '🔐', label: 'KYC obrigatório', text: 'CPF verificado via Receita Federal em tempo real antes da emissão.' },
              { icon: '✍️', label: 'Assinatura digital', text: 'Termo de emissão assinado eletronicamente via Clicksign.' },
              { icon: '🌦️', label: 'Validação climática', text: 'Aptidão da commodity verificada com dados OpenMeteo + CONAB.' },
              { icon: '⛓️', label: 'Blockchain real', text: 'Tokens mintados on-chain na Polygon Mainnet, auditáveis no PolygonScan.' },
            ].map(item => (
              <div key={item.label} style={{
                background: 'rgba(255,255,255,.02)',
                border: '1px solid rgba(255,255,255,.05)',
                borderRadius: 16,
                padding: '16px 18px',
                display: 'flex', alignItems: 'flex-start', gap: 12,
              }}>
                <span style={{ fontSize: 20, flexShrink: 0 }}>{item.icon}</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,.6)', marginBottom: 3 }}>{item.label}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,.25)', lineHeight: 1.5 }}>{item.text}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

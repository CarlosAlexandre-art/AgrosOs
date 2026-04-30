'use client'

import { useEffect, useState } from 'react'

type Stats = { activeTokens: number; totalValue: number; investors: number; totalTokens: number }

function useCountUp(target: number, duration = 1400) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (target === 0) return
    let start: number | null = null
    const raf = requestAnimationFrame(function step(ts) {
      if (!start) start = ts
      const p = Math.min((ts - start) / duration, 1)
      setVal(Math.round(target * (1 - Math.pow(1 - p, 3))))
      if (p < 1) requestAnimationFrame(step)
    })
    return () => cancelAnimationFrame(raf)
  }, [target, duration])
  return val
}

function StatCard({ label, value, prefix = '', delay = 0 }: {
  label: string; value: number; prefix?: string; delay?: number
}) {
  const animated = useCountUp(value)
  return (
    <div style={{
      background: 'rgba(255,255,255,.03)',
      border: '1px solid rgba(212,168,67,.14)',
      borderRadius: 20,
      padding: '28px 24px',
      animationDelay: `${delay}ms`,
      animation: 'fadeUp .7s cubic-bezier(.16,1,.3,1) both',
    }}>
      <div style={{
        fontFamily: 'monospace',
        fontSize: 36,
        fontWeight: 700,
        color: '#d4a843',
        letterSpacing: '-1px',
        lineHeight: 1,
        marginBottom: 8,
      }}>
        {prefix}{animated >= 1000 ? animated.toLocaleString('pt-BR') : animated}
      </div>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,.35)', fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase' }}>
        {label}
      </div>
    </div>
  )
}

const CARDS = [
  {
    href: '/dashboard/token/novo',
    symbol: '✦',
    title: 'Emitir Token',
    desc: 'Tokenize sua safra, material ou maquinário e capte capital de múltiplos investidores.',
    cta: 'Começar emissão',
    color: '#4ade80',
    bg: 'rgba(74,222,128,.06)',
    border: 'rgba(74,222,128,.15)',
    hoverBorder: 'rgba(74,222,128,.4)',
    hoverShadow: '0 0 40px rgba(74,222,128,.15), 0 8px 32px rgba(0,0,0,.4)',
  },
  {
    href: '/dashboard/token/mercado',
    symbol: '◈',
    title: 'Mercado',
    desc: 'Explore tokens ativos de produtores verificados. Invista com laudo de capacidade produtiva.',
    cta: 'Ver mercado',
    color: '#d4a843',
    bg: 'rgba(212,168,67,.06)',
    border: 'rgba(212,168,67,.15)',
    hoverBorder: 'rgba(212,168,67,.4)',
    hoverShadow: '0 0 40px rgba(212,168,67,.15), 0 8px 32px rgba(0,0,0,.4)',
  },
  {
    href: '/dashboard/token/investimentos',
    symbol: '◎',
    title: 'Meus Investimentos',
    desc: 'Acompanhe sua carteira de tokens agrícolas, retornos e posição on-chain.',
    cta: 'Ver carteira',
    color: '#60a5fa',
    bg: 'rgba(96,165,250,.06)',
    border: 'rgba(96,165,250,.15)',
    hoverBorder: 'rgba(96,165,250,.4)',
    hoverShadow: '0 0 40px rgba(96,165,250,.15), 0 8px 32px rgba(0,0,0,.4)',
  },
]

export default function TokenHubPage() {
  const [stats, setStats] = useState<Stats>({ activeTokens: 0, totalValue: 0, investors: 0, totalTokens: 0 })
  const [hovered, setHovered] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/tokens/stats').then(r => r.ok ? r.json() : null).then(d => { if (d) setStats(d) }).catch(() => {})
  }, [])

  return (
    <div style={{
      minHeight: '100%',
      background: '#060b06',
      backgroundImage: `
        radial-gradient(ellipse at -10% -20%, rgba(22,101,52,.22) 0%, transparent 50%),
        radial-gradient(ellipse at 110% 110%, rgba(146,100,23,.14) 0%, transparent 50%),
        linear-gradient(rgba(212,168,67,.025) 1px, transparent 1px),
        linear-gradient(90deg, rgba(212,168,67,.025) 1px, transparent 1px)
      `,
      backgroundSize: 'auto, auto, 80px 80px, 80px 80px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(24px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes ticker { from { transform: translateX(0) } to { transform: translateX(-50%) } }
        @keyframes livePulse { 0%,100% { box-shadow: 0 0 0 0 rgba(74,222,128,.5) } 50% { box-shadow: 0 0 0 6px rgba(74,222,128,0) } }
        @keyframes goldShimmer { 0% { background-position: 200% } 100% { background-position: -200% } }
      `}</style>

      {/* Ticker */}
      <div style={{
        borderBottom: '1px solid rgba(212,168,67,.1)',
        background: 'rgba(0,0,0,.4)',
        height: 36,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
      }}>
        <div style={{
          display: 'flex',
          gap: 64,
          whiteSpace: 'nowrap',
          animation: 'ticker 28s linear infinite',
        }}>
          {['SOJ · R$ 148,20/sc', 'MILHO · R$ 63,40/sc', 'CAFÉ · R$ 1.820/sc', 'TRIGO · R$ 89,50/sc', 'ALGODÃO · R$ 4,20/kg', 'POL · $0.47',
            'SOJ · R$ 148,20/sc', 'MILHO · R$ 63,40/sc', 'CAFÉ · R$ 1.820/sc', 'TRIGO · R$ 89,50/sc', 'ALGODÃO · R$ 4,20/kg', 'POL · $0.47'].map((t, i) => (
            <span key={i} style={{ fontSize: 11, color: 'rgba(212,168,67,.55)', fontFamily: 'monospace', letterSpacing: '.06em' }}>{t}</span>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '48px 32px 64px', maxWidth: 1100, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 52, animation: 'fadeUp .6s cubic-bezier(.16,1,.3,1) both' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%', background: '#4ade80', display: 'inline-block',
              animation: 'livePulse 2s ease-in-out infinite',
            }} />
            <span style={{ fontSize: 11, color: '#4ade80', fontWeight: 700, letterSpacing: '.18em', textTransform: 'uppercase' }}>
              Plataforma ao vivo · Polygon Mainnet
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 'clamp(44px, 6vw, 76px)', fontWeight: 900, lineHeight: .95, letterSpacing: '-2px', color: '#f5f0e8' }}>
                Agro
                <span style={{
                  background: 'linear-gradient(90deg, #d4a843, #f0cc70, #c49a2a, #d4a843)',
                  backgroundSize: '200%',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  animation: 'goldShimmer 4s linear infinite',
                }}>Token</span>
              </h1>
              <p style={{ marginTop: 14, fontSize: 15, color: 'rgba(255,255,255,.38)', maxWidth: 420, lineHeight: 1.65 }}>
                Tokenização de ativos agrícolas brasileiros na blockchain Polygon.
                Produtores captam capital. Investidores participam do campo.
              </p>
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'rgba(212,168,67,.06)',
              border: '1px solid rgba(212,168,67,.2)',
              borderRadius: 12, padding: '9px 16px',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#d4a843" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span style={{ fontSize: 11, color: 'rgba(212,168,67,.8)', fontFamily: 'monospace', fontWeight: 600 }}>
                ERC-1155 · POLYGON
              </span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 44 }}>
          <StatCard label="Tokens ativos"     value={stats.activeTokens} delay={80} />
          <StatCard label="Volume tokenizado" value={stats.totalValue} prefix="R$ " delay={160} />
          <StatCard label="Investidores"       value={stats.investors} delay={240} />
          <StatCard label="Tokens emitidos"   value={stats.totalTokens} delay={320} />
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(212,168,67,.18), rgba(74,222,128,.12), transparent)', marginBottom: 40 }} />

        {/* Action cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18, marginBottom: 44 }}>
          {CARDS.map((card, i) => (
            <a
              key={card.href}
              href={card.href}
              style={{ textDecoration: 'none', display: 'block', animation: `fadeUp .7s cubic-bezier(.16,1,.3,1) ${180 + i * 100}ms both` }}
            >
              <div
                onMouseEnter={() => setHovered(card.href)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  background: hovered === card.href ? card.bg : 'rgba(255,255,255,.025)',
                  border: `1px solid ${hovered === card.href ? card.hoverBorder : card.border}`,
                  borderRadius: 22,
                  padding: 26,
                  cursor: 'pointer',
                  transition: 'background .18s, border-color .18s, box-shadow .18s, transform .18s',
                  transform: hovered === card.href ? 'translateY(-4px)' : 'translateY(0)',
                  boxShadow: hovered === card.href ? card.hoverShadow : 'none',
                }}
              >
                <div style={{
                  width: 46, height: 46,
                  background: card.bg,
                  border: `1px solid ${card.border}`,
                  borderRadius: 13,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20, color: card.color,
                  marginBottom: 18,
                  fontFamily: 'monospace',
                }}>
                  {card.symbol}
                </div>
                <h3 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 700, color: '#f0ece3' }}>
                  {card.title}
                </h3>
                <p style={{ margin: '0 0 22px', fontSize: 13, color: 'rgba(255,255,255,.38)', lineHeight: 1.65 }}>
                  {card.desc}
                </p>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: card.color }}>
                  {card.cta}
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12h14M12 5l7 7-7 7" stroke={card.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
              </div>
            </a>
          ))}
        </div>

        {/* Guarantees */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 10, animation: 'fadeUp .7s cubic-bezier(.16,1,.3,1) .5s both' }}>
          {[
            { icon: '🔐', label: 'KYC obrigatório', text: 'CPF verificado via Receita Federal antes da emissão.' },
            { icon: '✍️', label: 'Assinatura digital', text: 'Termo assinado eletronicamente via Clicksign.' },
            { icon: '🌦️', label: 'Validação climática', text: 'Aptidão da commodity via OpenMeteo + CONAB 2024.' },
            { icon: '⛓️', label: 'Blockchain real', text: 'Tokens mintados on-chain na Polygon Mainnet.' },
          ].map(item => (
            <div key={item.label} style={{
              background: 'rgba(255,255,255,.02)',
              border: '1px solid rgba(255,255,255,.05)',
              borderRadius: 14,
              padding: '14px 16px',
              display: 'flex', alignItems: 'flex-start', gap: 10,
            }}>
              <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>{item.icon}</span>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.55)', marginBottom: 3 }}>{item.label}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,.22)', lineHeight: 1.5 }}>{item.text}</div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}

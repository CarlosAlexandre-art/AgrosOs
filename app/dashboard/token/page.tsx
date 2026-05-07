'use client'

import { useEffect, useState } from 'react'

type Stats = { totalTokens: number; activeTokens: number; totalValue: number; investors: number }

function fmt(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact', maximumFractionDigits: 1 }).format(v)
}

function IconMarket() {
  return (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
    </svg>
  )
}

function IconPlus() {
  return (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  )
}

function IconChart() {
  return (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
    </svg>
  )
}

function IconArrow() {
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
  )
}

const CARDS = [
  {
    href: '/dashboard/token/mercado',
    title: 'Mercado',
    desc: 'Explore tokens agrícolas ativos e invista',
    icon: <IconMarket />,
    accentColor: '#16a34a',
    accentBg: 'rgba(22, 163, 74, 0.1)',
    tag: 'Ao vivo',
  },
  {
    href: '/dashboard/token/novo',
    title: 'Tokenizar ativo',
    desc: 'Registre sua safra, insumo ou maquinário',
    icon: <IconPlus />,
    accentColor: '#4ade80',
    accentBg: 'rgba(74, 222, 128, 0.08)',
    tag: null,
  },
  {
    href: '/dashboard/token/investimentos',
    title: 'Meus investimentos',
    desc: 'Posição atual dos tokens que você comprou',
    icon: <IconChart />,
    accentColor: '#86efac',
    accentBg: 'rgba(134, 239, 172, 0.07)',
    tag: null,
  },
]

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=Outfit:wght@300;400;500;600&display=swap');

.at-hub { font-family: 'Outfit', sans-serif; }

@keyframes at-fadeUp {
  from { opacity: 0; transform: translateY(18px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes at-pulse {
  0%,100% { box-shadow: 0 0 0 0 rgba(22,163,74,0.5); }
  50%      { box-shadow: 0 0 0 5px rgba(22,163,74,0); }
}
@keyframes at-shimmer {
  0%   { background-position: -200% center; }
  100% { background-position: 200% center; }
}

.at-hub .at-card {
  transition: border-color .2s, transform .2s, background .2s;
}
.at-hub .at-card:hover {
  transform: translateX(5px);
}
.at-hub .at-card:hover .at-arrow {
  transform: translateX(3px);
  opacity: 1;
}
.at-hub .at-arrow {
  transition: transform .2s, opacity .2s;
  opacity: 0.35;
}

.at-hub .at-stat-row {
  animation: at-fadeUp .55s ease .2s both;
}
.at-hub .at-c1 { animation: at-fadeUp .5s ease .3s both; }
.at-hub .at-c2 { animation: at-fadeUp .5s ease .38s both; }
.at-hub .at-c3 { animation: at-fadeUp .5s ease .46s both; }
.at-hub .at-footer { animation: at-fadeUp .5s ease .55s both; }

.at-hub .at-title em {
  font-style: normal;
  background: linear-gradient(90deg, #16a34a 0%, #4ade80 50%, #16a34a 100%);
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: at-shimmer 4s linear infinite;
}

.at-dot {
  animation: at-pulse 2.5s ease infinite;
}
`

export default function TokenHubPage() {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    fetch('/api/tokens/stats')
      .then(r => r.json())
      .then(d => { if (!d.error) setStats(d) })
      .catch(() => {})
  }, [])

  return (
    <div className="at-hub" style={{
      background: 'linear-gradient(160deg, #020c08 0%, #041409 60%, #030e07 100%)',
      minHeight: '100%',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* Hexagonal grid bg — absolute para não vazar no sidebar */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='100' viewBox='0 0 56 100'%3E%3Cpath d='M28 0L56 16.2V49L28 65.2L0 49V16.2Z' fill='none' stroke='rgba(22,163,74,0.04)' stroke-width='0.6'/%3E%3Cpath d='M28 33.8L56 50V82.8L28 99L0 82.8V50Z' fill='none' stroke='rgba(22,163,74,0.04)' stroke-width='0.6'/%3E%3C/svg%3E")`,
        backgroundSize: '56px 100px',
        opacity: 0.8,
      }} />

      <div style={{ position: 'relative', zIndex: 1, padding: 'clamp(24px, 5vw, 48px) clamp(16px, 4vw, 28px) 56px', maxWidth: 720, margin: '0 auto' }}>

        {/* Eyebrow */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18,
          animation: 'at-fadeUp .5s ease both',
        }}>
          <div style={{ width: 28, height: 1, background: '#16a34a' }} />
          <span style={{
            fontFamily: 'Syne, sans-serif', fontSize: 11, fontWeight: 700,
            letterSpacing: '0.18em', textTransform: 'uppercase', color: '#16a34a',
          }}>AgroToken · Polygon Mainnet</span>
        </div>

        {/* Title */}
        <h1 className="at-title" style={{
          fontFamily: 'Syne, sans-serif',
          fontSize: 'clamp(34px, 5vw, 52px)',
          fontWeight: 800,
          color: '#e8faf0',
          lineHeight: 1.08,
          letterSpacing: '-0.025em',
          margin: '0 0 10px',
          animation: 'at-fadeUp .5s ease .08s both',
        }}>
          Ativos agrícolas<br />
          <em>em blockchain</em>
        </h1>

        <p style={{
          fontSize: 14, color: '#3a6648', marginBottom: 40, fontWeight: 400,
          animation: 'at-fadeUp .5s ease .16s both',
        }}>
          Tokenização com liquidez, transparência e registro imutável na rede Polygon
        </p>

        {/* Stats */}
        {stats && (
          <div className="at-stat-row" style={{
            display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
            border: '1px solid rgba(22,163,74,0.12)',
            borderRadius: 16, overflow: 'hidden',
            marginBottom: 28, gap: '1px',
            background: 'rgba(22,163,74,0.08)',
          }}>
            {[
              { label: 'Tokens vendidos', value: String(stats.totalTokens) },
              { label: 'Ativos', value: String(stats.activeTokens) },
              { label: 'Volume captado', value: fmt(stats.totalValue) },
              { label: 'Investidores', value: String(stats.investors) },
            ].map(s => (
              <div key={s.label} style={{
                background: 'rgba(2,12,8,0.92)', padding: 'clamp(12px,3vw,16px) clamp(14px,3vw,18px)',
              }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: '#2a5c3a', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
                  {s.label}
                </div>
                <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(18px,4vw,22px)', fontWeight: 800, color: '#e2faea' }}>
                  {s.value}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Nav cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
          {CARDS.map((card, i) => (
            <a
              key={card.href}
              href={card.href}
              className={`at-card at-c${i + 1}`}
              style={{
                display: 'flex', alignItems: 'center', gap: 'clamp(12px,3vw,18px)',
                padding: 'clamp(14px,3vw,20px) clamp(14px,3vw,22px)',
                background: 'rgba(8, 22, 14, 0.85)',
                border: '1px solid rgba(22,163,74,0.1)',
                borderRadius: 14,
                textDecoration: 'none',
                cursor: 'pointer',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = card.accentColor + '55'
                e.currentTarget.style.background = 'rgba(10, 28, 17, 0.98)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'rgba(22,163,74,0.1)'
                e.currentTarget.style.background = 'rgba(8, 22, 14, 0.85)'
              }}
            >
              {/* Icon */}
              <div style={{
                width: 44, height: 44, borderRadius: 11,
                background: card.accentBg,
                color: card.accentColor,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                {card.icon}
              </div>

              {/* Text */}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                  <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 15, fontWeight: 700, color: '#dcfce7' }}>
                    {card.title}
                  </span>
                  {card.tag && (
                    <span style={{
                      fontSize: 9, fontWeight: 700, letterSpacing: '0.12em',
                      textTransform: 'uppercase', color: '#16a34a',
                      background: 'rgba(22,163,74,0.12)',
                      padding: '2px 7px', borderRadius: 99,
                    }}>
                      {card.tag}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 13, color: '#3a6648', fontWeight: 400 }}>
                  {card.desc}
                </div>
              </div>

              {/* Arrow */}
              <div className="at-arrow" style={{ color: '#16a34a', flexShrink: 0 }}>
                <IconArrow />
              </div>
            </a>
          ))}
        </div>

        {/* Blockchain footer */}
        <div className="at-footer" style={{
          display: 'flex', alignItems: 'flex-start', gap: 12,
          padding: '14px 18px',
          background: 'rgba(4, 14, 9, 0.6)',
          border: '1px solid rgba(22,163,74,0.07)',
          borderRadius: 12,
        }}>
          <div className="at-dot" style={{
            width: 7, height: 7, borderRadius: '50%', marginTop: 4,
            background: '#16a34a', flexShrink: 0,
          }} />
          <p style={{ fontSize: 'clamp(11px,2.5vw,12px)', color: '#2a5c3a', margin: 0, lineHeight: 1.7 }}>
            <strong style={{ color: '#3d7a52', fontWeight: 600 }}>Polygon Mainnet</strong>
            {' '}— contrato ERC-1155 · cada token tem ID único derivado do UUID · mint e transferências on-chain após aprovação admin
          </p>
        </div>

      </div>
    </div>
  )
}

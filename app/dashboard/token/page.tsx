'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type Stats = { activeTokens: number; totalValue: number; investors: number; totalTokens: number }

export default function TokenHubPage() {
  const router = useRouter()
  const [stats, setStats] = useState<Stats>({ activeTokens: 0, totalValue: 0, investors: 0, totalTokens: 0 })
  const [hovered, setHovered] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/tokens/stats')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setStats(d) })
      .catch(() => {})
  }, [])

  const cards = [
    {
      href: '/dashboard/token/novo',
      symbol: '✦',
      title: 'Emitir Token',
      desc: 'Tokenize sua safra, material ou maquinário e capte capital de múltiplos investidores.',
      cta: 'Começar emissão',
      color: '#4ade80',
      border: 'rgba(74,222,128,.2)',
      hoverBorder: 'rgba(74,222,128,.5)',
      shadow: 'rgba(74,222,128,.12)',
    },
    {
      href: '/dashboard/token/mercado',
      symbol: '◈',
      title: 'Mercado',
      desc: 'Explore tokens ativos de produtores verificados. Invista com laudo de capacidade produtiva.',
      cta: 'Ver mercado',
      color: '#d4a843',
      border: 'rgba(212,168,67,.2)',
      hoverBorder: 'rgba(212,168,67,.5)',
      shadow: 'rgba(212,168,67,.12)',
    },
    {
      href: '/dashboard/token/investimentos',
      symbol: '◎',
      title: 'Meus Investimentos',
      desc: 'Acompanhe sua carteira de tokens agrícolas, retornos e posição on-chain.',
      cta: 'Ver carteira',
      color: '#60a5fa',
      border: 'rgba(96,165,250,.2)',
      hoverBorder: 'rgba(96,165,250,.5)',
      shadow: 'rgba(96,165,250,.12)',
    },
  ]

  const guarantees = [
    { icon: '🔐', label: 'KYC obrigatório', text: 'CPF verificado via Receita Federal.' },
    { icon: '✍️', label: 'Assinatura digital', text: 'Termo assinado via Clicksign.' },
    { icon: '🌦️', label: 'Validação climática', text: 'Aptidão via OpenMeteo + CONAB 2024.' },
    { icon: '⛓️', label: 'Blockchain real', text: 'Mintado on-chain na Polygon Mainnet.' },
  ]

  return (
    <div style={{
      minHeight: '100%',
      background: 'linear-gradient(135deg, #060b06 0%, #0a120a 50%, #07100a 100%)',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '40px 24px 64px',
    }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>

        {/* Live badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28 }}>
          <span style={{
            width: 8, height: 8, borderRadius: '50%', background: '#4ade80', display: 'inline-block',
            boxShadow: '0 0 0 3px rgba(74,222,128,.2)',
          }} />
          <span style={{ fontSize: 11, color: '#4ade80', fontWeight: 700, letterSpacing: '.15em', textTransform: 'uppercase' }}>
            Plataforma ao vivo · Polygon Mainnet
          </span>
        </div>

        {/* Title */}
        <h1 style={{ margin: '0 0 10px', fontSize: 'clamp(40px, 6vw, 68px)', fontWeight: 900, lineHeight: .95, letterSpacing: '-2px', color: '#f5f0e8' }}>
          Agro<span style={{ color: '#d4a843' }}>Token</span>
        </h1>
        <p style={{ margin: '0 0 44px', fontSize: 15, color: 'rgba(255,255,255,.4)', maxWidth: 400, lineHeight: 1.65 }}>
          Tokenização de ativos agrícolas brasileiros na blockchain Polygon.
        </p>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 40 }}>
          {[
            { label: 'Tokens ativos', value: stats.activeTokens, prefix: '' },
            { label: 'Volume total', value: stats.totalValue, prefix: 'R$ ' },
            { label: 'Investidores', value: stats.investors, prefix: '' },
            { label: 'Tokens emitidos', value: stats.totalTokens, prefix: '' },
          ].map(s => (
            <div key={s.label} style={{
              background: 'rgba(255,255,255,.04)',
              border: '1px solid rgba(212,168,67,.12)',
              borderRadius: 16,
              padding: '22px 18px',
            }}>
              <div style={{ fontFamily: 'monospace', fontSize: 30, fontWeight: 700, color: '#d4a843', letterSpacing: '-1px', lineHeight: 1, marginBottom: 6 }}>
                {s.prefix}{s.value.toLocaleString('pt-BR')}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,.3)', fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase' }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(212,168,67,.15), rgba(74,222,128,.1), transparent)', marginBottom: 36 }} />

        {/* Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginBottom: 40 }}>
          {cards.map(card => (
            <button
              key={card.href}
              onClick={() => router.push(card.href)}
              onMouseEnter={() => setHovered(card.href)}
              onMouseLeave={() => setHovered(null)}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                background: hovered === card.href ? `rgba(${card.color === '#4ade80' ? '74,222,128' : card.color === '#d4a843' ? '212,168,67' : '96,165,250'},.06)` : 'rgba(255,255,255,.025)',
                border: `1px solid ${hovered === card.href ? card.hoverBorder : card.border}`,
                borderRadius: 20,
                padding: '24px 22px',
                cursor: 'pointer',
                transition: 'all .18s ease',
                transform: hovered === card.href ? 'translateY(-3px)' : 'translateY(0)',
                boxShadow: hovered === card.href ? `0 12px 40px ${card.shadow}` : 'none',
              }}
            >
              <div style={{
                width: 44, height: 44,
                background: `${card.color}14`,
                border: `1px solid ${card.border}`,
                borderRadius: 12,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, color: card.color, fontFamily: 'monospace',
                marginBottom: 16,
              }}>
                {card.symbol}
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#f0ece3', marginBottom: 8 }}>
                {card.title}
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,.36)', lineHeight: 1.65, marginBottom: 20 }}>
                {card.desc}
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: card.color, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                {card.cta} →
              </span>
            </button>
          ))}
        </div>

        {/* Guarantees */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
          {guarantees.map(g => (
            <div key={g.label} style={{
              background: 'rgba(255,255,255,.02)',
              border: '1px solid rgba(255,255,255,.05)',
              borderRadius: 12,
              padding: '14px 16px',
              display: 'flex', alignItems: 'flex-start', gap: 10,
            }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>{g.icon}</span>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.5)', marginBottom: 3 }}>{g.label}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,.22)', lineHeight: 1.5 }}>{g.text}</div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}

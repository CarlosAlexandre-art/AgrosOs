'use client'

import { useEffect, useState } from 'react'

type Stats = {
  totalTokens: number
  activeTokens: number
  totalCaptado: number
  totalInvestido: number
}

function fmt(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact', maximumFractionDigits: 1 }).format(v)
}

const CARDS = [
  {
    href: '/dashboard/token/mercado',
    title: 'Mercado',
    desc: 'Explore e invista em tokens agrícolas ativos',
    border: '#16a34a',
    bg: '#f0fdf4',
    iconBg: '#dcfce7',
    iconColor: '#16a34a',
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
      </svg>
    ),
  },
  {
    href: '/dashboard/token/novo',
    title: 'Tokenizar ativo',
    desc: 'Crie um token para sua safra, insumo ou maquinário',
    border: '#2563eb',
    bg: '#eff6ff',
    iconBg: '#dbeafe',
    iconColor: '#2563eb',
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
      </svg>
    ),
  },
  {
    href: '/dashboard/token/investimentos',
    title: 'Meus investimentos',
    desc: 'Tokens que você comprou e sua posição atual',
    border: '#7c3aed',
    bg: '#f5f3ff',
    iconBg: '#ede9fe',
    iconColor: '#7c3aed',
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
      </svg>
    ),
  },
]

export default function TokenHubPage() {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    fetch('/api/tokens/stats')
      .then(r => r.json())
      .then(d => { if (!d.error) setStats(d) })
      .catch(() => {})
  }, [])

  return (
    <div style={{ padding: 24, maxWidth: 720, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: 0 }}>AgroToken</h1>
        <p style={{ fontSize: 14, color: '#64748b', margin: '4px 0 0' }}>Tokenização de ativos agrícolas na Polygon Mainnet</p>
      </div>

      {/* Stats */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Seus tokens', value: String(stats.totalTokens) },
            { label: 'Ativos', value: String(stats.activeTokens) },
            { label: 'Total captado', value: fmt(stats.totalCaptado) },
            { label: 'Total investido', value: fmt(stats.totalInvestido) },
          ].map(s => (
            <div key={s.label} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 16 }}>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>{s.label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginTop: 4 }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Cards de navegação */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
        {CARDS.map(card => (
          <a
            key={card.href}
            href={card.href}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              padding: '20px 20px',
              background: '#fff',
              border: `2px solid #e2e8f0`,
              borderRadius: 16,
              textDecoration: 'none',
              cursor: 'pointer',
              transition: 'border-color 0.15s, background 0.15s',
            }}
            onMouseEnter={e => {
              const el = e.currentTarget
              el.style.borderColor = card.border
              el.style.background = card.bg
            }}
            onMouseLeave={e => {
              const el = e.currentTarget
              el.style.borderColor = '#e2e8f0'
              el.style.background = '#fff'
            }}
          >
            <div style={{ background: card.iconBg, color: card.iconColor, borderRadius: 12, padding: 10, flexShrink: 0 }}>
              {card.icon}
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{card.title}</div>
              <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>{card.desc}</div>
            </div>
            <svg style={{ marginLeft: 'auto', color: '#94a3b8' }} width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </a>
        ))}
      </div>

      {/* Blockchain info */}
      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 16, padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#16a34a', display: 'inline-block' }} />
          <span style={{ fontSize: 14, fontWeight: 700, color: '#334155' }}>Polygon Mainnet — Contrato deployado</span>
        </div>
        <p style={{ fontSize: 12, color: '#64748b', margin: 0, lineHeight: 1.6 }}>
          Tokens AgroToken são registrados on-chain na rede Polygon. Cada ativo tokenizado recebe um ID único derivado do UUID do banco. Transferências via contrato ERC-1155.
        </p>
      </div>
    </div>
  )
}

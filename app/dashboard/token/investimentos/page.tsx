'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type Investment = {
  id: string
  quantity: number
  pricePerToken: number
  totalAmount: number
  createdAt: string
  token: {
    id: string
    title: string
    type: string
    status: string
    expectedReturn: number | null
    periodMonths: number | null
    deliveryDate: string | null
    tokenPrice: number
    totalTokens: number
    soldTokens: number
    property: { name: string }
  }
}

type Portfolio = {
  transactions: Investment[]
  totalInvestido: number
  totalTokens: number
  ativos: number
  resgatados: number
}

const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Rascunho', PENDING_REVIEW: 'Em análise', ACTIVE: 'Ativo', REDEEMED: 'Resgatado', CANCELLED: 'Cancelado',
}
const STATUS_STYLE: Record<string, { color: string; bg: string }> = {
  ACTIVE:         { color: '#4ade80', bg: 'rgba(74,222,128,0.1)' },
  PENDING_REVIEW: { color: '#fbbf24', bg: 'rgba(251,191,36,0.1)' },
  REDEEMED:       { color: '#60a5fa', bg: 'rgba(96,165,250,0.1)' },
  CANCELLED:      { color: '#f87171', bg: 'rgba(248,113,113,0.1)' },
  DRAFT:          { color: '#3a6648', bg: 'rgba(22,163,74,0.06)' },
}
const TYPE_LABEL: Record<string, string> = { SAFRA: 'Safra', MATERIAL: 'Material', MAQUINARIO: 'Maquinário' }

function fmt(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=Outfit:wght@300;400;500;600&display=swap');

.ai-wrap { font-family: 'Outfit', sans-serif; }

@keyframes ai-fadeUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes ai-pulse {
  0%,100% { box-shadow: 0 0 0 0 rgba(22,163,74,0.5); }
  50%      { box-shadow: 0 0 0 5px rgba(22,163,74,0); }
}
@keyframes ai-spin {
  to { transform: rotate(360deg); }
}

.ai-wrap .ai-header  { animation: ai-fadeUp .45s ease both; }
.ai-wrap .ai-stats   { animation: ai-fadeUp .45s ease .06s both; }
.ai-wrap .ai-badge   { animation: ai-fadeUp .45s ease .1s both; }
.ai-wrap .ai-card    { animation: ai-fadeUp .5s ease both; transition: border-color .2s, transform .2s; }
.ai-wrap .ai-card:hover { transform: translateY(-2px); }
.ai-dot { animation: ai-pulse 2.5s ease infinite; }
.ai-spin { animation: ai-spin .75s linear infinite; }
`

export default function InvestimentosPage() {
  const [data, setData] = useState<Portfolio | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/tokens/meus-investimentos')
      .then(r => r.json())
      .then(d => {
        if (d && Array.isArray(d.transactions)) setData(d)
        else setError(d?.error || 'Erro ao carregar investimentos')
        setLoading(false)
      })
      .catch(() => { setError('Falha na conexão. Tente novamente.'); setLoading(false) })
  }, [])

  return (
    <div className="ai-wrap" style={{
      background: 'linear-gradient(160deg, #020c08 0%, #041409 60%, #030e07 100%)',
      minHeight: '100%',
      position: 'relative',
    }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* Hexagonal grid bg */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='100' viewBox='0 0 56 100'%3E%3Cpath d='M28 0L56 16.2V49L28 65.2L0 49V16.2Z' fill='none' stroke='rgba(22,163,74,0.04)' stroke-width='0.6'/%3E%3Cpath d='M28 33.8L56 50V82.8L28 99L0 82.8V50Z' fill='none' stroke='rgba(22,163,74,0.04)' stroke-width='0.6'/%3E%3C/svg%3E")`,
        backgroundSize: '56px 100px', opacity: 0.8,
      }} />

      <div style={{ position: 'relative', zIndex: 1, padding: '40px 24px 64px', maxWidth: 780, margin: '0 auto' }}>

        {/* Header */}
        <div className="ai-header" style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
          <Link href="/dashboard/token" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 38, height: 38, borderRadius: 10,
            border: '1px solid rgba(22,163,74,0.15)',
            background: 'rgba(22,163,74,0.06)',
            color: '#4ade80', textDecoration: 'none',
            transition: 'border-color .2s',
          }}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </Link>
          <div>
            <h1 style={{
              fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800,
              color: '#e8faf0', margin: 0, letterSpacing: '-0.02em',
            }}>Meus Investimentos</h1>
            <p style={{ fontSize: 13, color: '#2a5c3a', margin: '2px 0 0' }}>Tokens que você comprou</p>
          </div>
        </div>

        {/* Stats */}
        {data && (
          <div className="ai-stats" style={{
            display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '1px', background: 'rgba(22,163,74,0.08)',
            border: '1px solid rgba(22,163,74,0.12)',
            borderRadius: 16, overflow: 'hidden', marginBottom: 20,
          }}>
            {[
              { label: 'Total investido',   value: fmt(data.totalInvestido) },
              { label: 'Tokens em carteira', value: data.totalTokens.toLocaleString('pt-BR') },
              { label: 'Ativos',            value: String(data.ativos) },
              { label: 'Resgatados',        value: String(data.resgatados) },
            ].map(s => (
              <div key={s.label} style={{ background: 'rgba(2,12,8,0.92)', padding: '16px 18px' }}>
                <div style={{ fontSize: 9, fontWeight: 600, color: '#2a5c3a', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
                  {s.label}
                </div>
                <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 800, color: '#e2faea' }}>
                  {s.value}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Blockchain badge */}
        <div className="ai-badge" style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '12px 16px',
          background: 'rgba(4,14,9,0.6)',
          border: '1px solid rgba(22,163,74,0.09)',
          borderRadius: 12, marginBottom: 24,
        }}>
          <div className="ai-dot" style={{ width: 7, height: 7, borderRadius: '50%', background: '#16a34a', flexShrink: 0 }} />
          <p style={{ fontSize: 12, color: '#2a5c3a', margin: 0 }}>
            <strong style={{ color: '#3d7a52', fontWeight: 600 }}>Polygon Mainnet</strong>
            {' '}— tokens registrados on-chain · posição visível no PolygonScan
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <svg className="ai-spin" width="28" height="28" fill="none" viewBox="0 0 24 24" style={{ margin: '0 auto', display: 'block', color: '#16a34a' }}>
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.2" />
              <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
            <p style={{ color: '#2a5c3a', fontSize: 14, marginTop: 14 }}>Carregando investimentos...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)',
            borderRadius: 12, padding: '20px 24px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>⚠️</div>
            <p style={{ color: '#f87171', fontWeight: 600, margin: '0 0 4px' }}>Erro ao carregar</p>
            <p style={{ color: '#3a6648', fontSize: 13, margin: 0 }}>{error}</p>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && data && data.transactions.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>💼</div>
            <p style={{ color: '#3a6648', fontWeight: 600, fontSize: 15, margin: '0 0 6px' }}>
              Você ainda não investiu em nenhum token
            </p>
            <Link href="/dashboard/token/mercado" style={{
              display: 'inline-block', marginTop: 16,
              background: '#16a34a', color: '#fff',
              fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 14,
              padding: '12px 26px', borderRadius: 12, textDecoration: 'none',
            }}>
              Ver mercado
            </Link>
          </div>
        )}

        {/* Investment cards */}
        {data && data.transactions.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {data.transactions.map((inv, idx) => {
              const retornoEsperado = inv.token.expectedReturn
                ? (inv.totalAmount * (inv.token.expectedReturn / 100))
                : null
              const st = STATUS_STYLE[inv.token.status] ?? STATUS_STYLE.DRAFT

              return (
                <div
                  key={inv.id}
                  className="ai-card"
                  style={{
                    background: 'rgba(6,18,11,0.9)',
                    border: '1px solid rgba(22,163,74,0.1)',
                    borderRadius: 16, padding: '20px 22px',
                    animationDelay: `${idx * 0.07}s`,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(22,163,74,0.28)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(22,163,74,0.1)' }}
                >
                  {/* Top row */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 14 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 11, color: '#2a5c3a', fontWeight: 400 }}>
                          {TYPE_LABEL[inv.token.type]}
                        </span>
                        <span style={{
                          fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
                          textTransform: 'uppercase',
                          color: st.color, background: st.bg,
                          padding: '2px 8px', borderRadius: 99,
                        }}>
                          {STATUS_LABEL[inv.token.status]}
                        </span>
                      </div>
                      <Link
                        href={`/dashboard/token/${inv.token.id}`}
                        style={{
                          fontFamily: 'Syne, sans-serif', fontSize: 15, fontWeight: 700,
                          color: '#dcfce7', textDecoration: 'none', display: 'block', marginBottom: 3,
                        }}
                        onMouseEnter={e => { (e.target as HTMLElement).style.color = '#4ade80' }}
                        onMouseLeave={e => { (e.target as HTMLElement).style.color = '#dcfce7' }}
                      >
                        {inv.token.title}
                      </Link>
                      <p style={{ fontSize: 12, color: '#2a5c3a', margin: 0 }}>
                        {inv.token.property.name}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{
                        fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 800,
                        color: '#e2faea', letterSpacing: '-0.02em',
                      }}>
                        {fmt(Number(inv.totalAmount))}
                      </div>
                      <div style={{ fontSize: 11, color: '#2a5c3a', marginTop: 2 }}>
                        {inv.quantity.toLocaleString('pt-BR')} tokens
                      </div>
                    </div>
                  </div>

                  {/* Stats grid */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
                    gap: '1px',
                    background: 'rgba(22,163,74,0.08)',
                    border: '1px solid rgba(22,163,74,0.08)',
                    borderRadius: 12, overflow: 'hidden', marginBottom: 14,
                  }}>
                    {[
                      { label: 'Preço/token',      value: `R$ ${Number(inv.pricePerToken).toLocaleString('pt-BR')}` },
                      ...(retornoEsperado ? [{ label: 'Retorno esperado', value: fmt(retornoEsperado) }] : []),
                      ...(inv.token.deliveryDate ? [{ label: 'Vencimento', value: new Date(inv.token.deliveryDate).toLocaleDateString('pt-BR') }] : []),
                      ...(inv.token.periodMonths ? [{ label: 'Prazo', value: `${inv.token.periodMonths} meses` }] : []),
                    ].map(s => (
                      <div key={s.label} style={{ background: 'rgba(2,12,8,0.92)', padding: '10px 14px' }}>
                        <div style={{ fontSize: 9, fontWeight: 600, color: '#2a5c3a', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
                          {s.label}
                        </div>
                        <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 700, color: '#d1fae5' }}>
                          {s.value}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Footer */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 11, color: '#2a5c3a' }}>
                      Comprado em {new Date(inv.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                    <Link
                      href="/dashboard/token/mercado"
                      style={{ fontSize: 12, color: '#16a34a', textDecoration: 'none', fontWeight: 500 }}
                      onMouseEnter={e => { (e.target as HTMLElement).style.color = '#4ade80' }}
                      onMouseLeave={e => { (e.target as HTMLElement).style.color = '#16a34a' }}
                    >
                      Ver no mercado →
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}

      </div>
    </div>
  )
}

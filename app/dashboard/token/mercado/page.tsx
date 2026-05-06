'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type Token = {
  id: string
  title: string
  type: 'SAFRA' | 'MATERIAL' | 'MAQUINARIO'
  status: string
  totalValue: number
  tokenPrice: number
  totalTokens: number
  soldTokens: number
  expectedReturn: number | null
  periodMonths: number | null
  commodity: string | null
  deliveryDate: string | null
  property: { name: string; location: string | null }
}

const TYPE_LABEL: Record<string, string> = { SAFRA: 'Safra', MATERIAL: 'Material', MAQUINARIO: 'Maquinário' }

const TYPE_STYLE: Record<string, { color: string; bg: string }> = {
  SAFRA:      { color: '#4ade80', bg: 'rgba(74,222,128,0.1)' },
  MATERIAL:   { color: '#fbbf24', bg: 'rgba(251,191,36,0.1)' },
  MAQUINARIO: { color: '#60a5fa', bg: 'rgba(96,165,250,0.1)' },
}

function fmt(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=Outfit:wght@300;400;500;600&display=swap');

.am-wrap { font-family: 'Outfit', sans-serif; }

@keyframes am-fadeUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes am-pulse {
  0%,100% { box-shadow: 0 0 0 0 rgba(22,163,74,0.5); }
  50%      { box-shadow: 0 0 0 5px rgba(22,163,74,0); }
}
@keyframes am-spin {
  to { transform: rotate(360deg); }
}
@keyframes am-barGrow {
  from { width: 0%; }
}

.am-wrap .am-header   { animation: am-fadeUp .45s ease both; }
.am-wrap .am-badge    { animation: am-fadeUp .45s ease .08s both; }
.am-wrap .am-card     { animation: am-fadeUp .5s ease both; transition: border-color .2s, transform .2s; }
.am-wrap .am-card:hover { transform: translateY(-2px); }

.am-wrap .am-bar-fill { animation: am-barGrow .8s cubic-bezier(.4,0,.2,1) both; }

.am-wrap .am-btn {
  transition: background .15s, transform .1s, opacity .15s;
}
.am-wrap .am-btn:active { transform: scale(0.97); }

.am-wrap .am-qty-btn {
  transition: background .15s, color .15s;
}
.am-wrap .am-qty-btn:hover { background: rgba(22,163,74,0.12); color: #4ade80; }

.am-spin { animation: am-spin .75s linear infinite; }
.am-dot  { animation: am-pulse 2.5s ease infinite; }

.am-wrap input[type=number] { -moz-appearance: textfield; appearance: textfield; }
.am-wrap input[type=number]::-webkit-inner-spin-button,
.am-wrap input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; }
`

export default function MercadoPage() {
  const router = useRouter()
  const [tokens, setTokens] = useState<Token[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [buying, setBuying] = useState<string | null>(null)
  const [qty, setQty] = useState<Record<string, string>>({})

  useEffect(() => {
    fetch('/api/tokens/mercado')
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d)) setTokens(d)
        else setError(d?.error || 'Erro ao carregar mercado')
        setLoading(false)
      })
      .catch(() => { setError('Falha de conexão'); setLoading(false) })
  }, [])

  async function handleComprar(token: Token) {
    const q = parseInt(qty[token.id] || '1')
    if (!q || q < 1) return
    setBuying(token.id)
    try {
      const res = await fetch(`/api/tokens/${token.id}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: q }),
      })
      const data = await res.json()
      if (data.url) {
        router.push(data.url)
      } else {
        alert(data.error || 'Erro ao iniciar compra')
      }
    } catch {
      alert('Erro de conexão')
    } finally {
      setBuying(null)
    }
  }

  return (
    <div className="am-wrap" style={{
      background: 'linear-gradient(160deg, #020c08 0%, #041409 60%, #030e07 100%)',
      minHeight: '100%',
      position: 'relative',
    }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* Hexagonal grid bg */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='100' viewBox='0 0 56 100'%3E%3Cpath d='M28 0L56 16.2V49L28 65.2L0 49V16.2Z' fill='none' stroke='rgba(22,163,74,0.04)' stroke-width='0.6'/%3E%3Cpath d='M28 33.8L56 50V82.8L28 99L0 82.8V50Z' fill='none' stroke='rgba(22,163,74,0.04)' stroke-width='0.6'/%3E%3C/svg%3E")`,
        backgroundSize: '56px 100px',
        opacity: 0.8,
      }} />

      <div style={{ position: 'relative', zIndex: 1, padding: '40px 24px 64px', maxWidth: 780, margin: '0 auto' }}>

        {/* Header */}
        <div className="am-header" style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
          <Link href="/dashboard/token" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 38, height: 38, borderRadius: 10,
            border: '1px solid rgba(22,163,74,0.15)',
            background: 'rgba(22,163,74,0.06)',
            color: '#4ade80',
            textDecoration: 'none',
            transition: 'border-color .2s, background .2s',
          }}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </Link>
          <div>
            <h1 style={{
              fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800,
              color: '#e8faf0', margin: 0, letterSpacing: '-0.02em',
            }}>Mercado AgroToken</h1>
            <p style={{ fontSize: 13, color: '#2a5c3a', margin: '2px 0 0', fontWeight: 400 }}>
              Tokens ativos disponíveis para investimento
            </p>
          </div>
        </div>

        {/* Blockchain badge */}
        <div className="am-badge" style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '12px 16px',
          background: 'rgba(4, 14, 9, 0.6)',
          border: '1px solid rgba(22,163,74,0.09)',
          borderRadius: 12,
          marginBottom: 24,
        }}>
          <div className="am-dot" style={{
            width: 7, height: 7, borderRadius: '50%',
            background: '#16a34a', flexShrink: 0,
          }} />
          <p style={{ fontSize: 12, color: '#2a5c3a', margin: 0 }}>
            <strong style={{ color: '#3d7a52', fontWeight: 600 }}>Polygon Mainnet</strong>
            {' '}— tokens registrados on-chain · posição visível no PolygonScan
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 12, padding: '14px 18px',
            fontSize: 14, color: '#f87171', marginBottom: 20,
          }}>{error}</div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <svg className="am-spin" width="28" height="28" fill="none" viewBox="0 0 24 24" style={{ margin: '0 auto', display: 'block', color: '#16a34a' }}>
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.2" />
              <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
            <p style={{ color: '#2a5c3a', fontSize: 14, marginTop: 14 }}>Carregando mercado...</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && tokens.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🌾</div>
            <p style={{ color: '#3a6648', fontWeight: 600, fontSize: 15, margin: '0 0 6px' }}>
              Nenhum token ativo no momento
            </p>
            <p style={{ color: '#2a5c3a', fontSize: 13, margin: '0 0 24px' }}>
              Seja o primeiro a tokenizar um ativo agrícola
            </p>
            <Link href="/dashboard/token/novo" style={{
              display: 'inline-block',
              background: '#16a34a', color: '#fff',
              fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 14,
              padding: '12px 26px', borderRadius: 12,
              textDecoration: 'none',
            }}>
              Criar token
            </Link>
          </div>
        )}

        {/* Token cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {tokens.map((token, idx) => {
            const available = token.totalTokens - token.soldTokens
            const soldPct = token.totalTokens > 0 ? (token.soldTokens / token.totalTokens) * 100 : 0
            const q = parseInt(qty[token.id] || '1') || 1
            const total = q * Number(token.tokenPrice)
            const typeStyle = TYPE_STYLE[token.type] ?? { color: '#4ade80', bg: 'rgba(74,222,128,0.1)' }

            return (
              <div
                key={token.id}
                className="am-card"
                style={{
                  background: 'rgba(6, 18, 11, 0.9)',
                  border: '1px solid rgba(22,163,74,0.1)',
                  borderRadius: 16,
                  padding: '22px 22px 18px',
                  animationDelay: `${idx * 0.07}s`,
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(22,163,74,0.28)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(22,163,74,0.1)' }}
              >
                {/* Top row */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 16 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        color: typeStyle.color, background: typeStyle.bg,
                        padding: '3px 9px', borderRadius: 99,
                      }}>
                        {TYPE_LABEL[token.type]}
                      </span>
                      {token.commodity && (
                        <span style={{ fontSize: 11, color: '#3a6648', fontWeight: 400 }}>{token.commodity}</span>
                      )}
                    </div>
                    <Link
                      href={`/dashboard/token/${token.id}`}
                      style={{
                        fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 700,
                        color: '#dcfce7', textDecoration: 'none',
                        display: 'block', marginBottom: 4,
                        transition: 'color .15s',
                      }}
                      onMouseEnter={e => { (e.target as HTMLElement).style.color = '#4ade80' }}
                      onMouseLeave={e => { (e.target as HTMLElement).style.color = '#dcfce7' }}
                    >
                      {token.title}
                    </Link>
                    <p style={{ fontSize: 12, color: '#2a5c3a', margin: 0, fontWeight: 400 }}>
                      {token.property.name}{token.property.location ? ` · ${token.property.location}` : ''}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{
                      fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 800,
                      color: '#e2faea', letterSpacing: '-0.02em',
                    }}>
                      {fmt(Number(token.tokenPrice))}
                    </div>
                    <div style={{ fontSize: 11, color: '#2a5c3a', marginTop: 2 }}>por token</div>
                  </div>
                </div>

                {/* Stats grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
                  gap: 1,
                  background: 'rgba(22,163,74,0.08)',
                  borderRadius: 12,
                  overflow: 'hidden',
                  marginBottom: 14,
                  border: '1px solid rgba(22,163,74,0.1)',
                }}>
                  {[
                    { label: 'Valor total',   value: fmt(Number(token.totalValue)) },
                    ...(token.expectedReturn ? [{ label: 'Rendimento',     value: `${token.expectedReturn}%${token.periodMonths ? ` / ${token.periodMonths}m` : ''}` }] : []),
                    ...(token.deliveryDate    ? [{ label: 'Vencimento',     value: new Date(token.deliveryDate).toLocaleDateString('pt-BR') }] : []),
                    { label: 'Disponíveis',   value: `${available.toLocaleString('pt-BR')} tokens` },
                  ].map(s => (
                    <div key={s.label} style={{ background: 'rgba(2,12,8,0.92)', padding: '12px 14px' }}>
                      <div style={{ fontSize: 9, fontWeight: 600, color: '#2a5c3a', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
                        {s.label}
                      </div>
                      <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 700, color: '#d1fae5' }}>
                        {s.value}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Progress bar */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#2a5c3a', marginBottom: 6 }}>
                    <span>{token.soldTokens.toLocaleString('pt-BR')} vendidos</span>
                    <span style={{ color: soldPct > 70 ? '#4ade80' : '#2a5c3a' }}>{soldPct.toFixed(0)}% captado</span>
                  </div>
                  <div style={{
                    height: 4, background: 'rgba(22,163,74,0.1)',
                    borderRadius: 99, overflow: 'hidden',
                  }}>
                    <div
                      className="am-bar-fill"
                      style={{
                        height: '100%',
                        width: `${Math.min(soldPct, 100)}%`,
                        background: soldPct > 80
                          ? 'linear-gradient(90deg, #16a34a, #4ade80)'
                          : '#16a34a',
                        borderRadius: 99,
                      }}
                    />
                  </div>
                </div>

                {/* Buy controls */}
                {available > 0 ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    {/* Quantity stepper */}
                    <div style={{
                      display: 'flex', alignItems: 'center',
                      border: '1px solid rgba(22,163,74,0.18)',
                      borderRadius: 10, overflow: 'hidden',
                      background: 'rgba(2,12,8,0.8)',
                    }}>
                      <button
                        className="am-qty-btn"
                        onClick={() => setQty(prev => ({ ...prev, [token.id]: String(Math.max(1, (parseInt(prev[token.id] || '1') || 1) - 1)) }))}
                        style={{
                          padding: '8px 13px', background: 'transparent',
                          border: 'none', cursor: 'pointer',
                          color: '#3a6648', fontSize: 16, fontWeight: 600,
                          lineHeight: 1,
                        }}
                      >−</button>
                      <input
                        type="number"
                        min="1"
                        max={available}
                        value={qty[token.id] || '1'}
                        onChange={e => setQty(prev => ({ ...prev, [token.id]: e.target.value }))}
                        style={{
                          width: 48, textAlign: 'center',
                          padding: '8px 0',
                          background: 'transparent',
                          border: 'none',
                          borderLeft: '1px solid rgba(22,163,74,0.12)',
                          borderRight: '1px solid rgba(22,163,74,0.12)',
                          color: '#e2faea',
                          fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 700,
                          outline: 'none',
                        }}
                      />
                      <button
                        className="am-qty-btn"
                        onClick={() => setQty(prev => ({ ...prev, [token.id]: String(Math.min(available, (parseInt(prev[token.id] || '1') || 1) + 1)) }))}
                        style={{
                          padding: '8px 13px', background: 'transparent',
                          border: 'none', cursor: 'pointer',
                          color: '#3a6648', fontSize: 16, fontWeight: 600,
                          lineHeight: 1,
                        }}
                      >+</button>
                    </div>

                    {/* Total */}
                    <div style={{ flex: 1, fontSize: 13, color: '#3a6648', minWidth: 80 }}>
                      Total:{' '}
                      <span style={{
                        fontFamily: 'Syne, sans-serif', fontWeight: 700,
                        color: '#86efac', fontSize: 15,
                      }}>{fmt(total)}</span>
                    </div>

                    {/* Buy button */}
                    <button
                      className="am-btn"
                      onClick={() => handleComprar(token)}
                      disabled={buying === token.id}
                      style={{
                        background: buying === token.id ? 'rgba(22,163,74,0.4)' : '#16a34a',
                        color: '#fff',
                        fontFamily: 'Syne, sans-serif', fontWeight: 700,
                        fontSize: 14,
                        padding: '10px 22px',
                        borderRadius: 10,
                        border: 'none', cursor: buying === token.id ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', gap: 8,
                        opacity: buying === token.id ? 0.7 : 1,
                      }}
                    >
                      {buying === token.id ? (
                        <>
                          <svg className="am-spin" width="14" height="14" fill="none" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
                            <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                          </svg>
                          Aguarde...
                        </>
                      ) : 'Comprar'}
                    </button>
                  </div>
                ) : (
                  <div style={{
                    textAlign: 'center', padding: '10px 0',
                    fontSize: 13, color: '#2a5c3a', fontWeight: 500,
                    border: '1px solid rgba(22,163,74,0.08)',
                    borderRadius: 10, background: 'rgba(22,163,74,0.03)',
                  }}>
                    Token esgotado
                  </div>
                )}
              </div>
            )
          })}
        </div>

      </div>
    </div>
  )
}

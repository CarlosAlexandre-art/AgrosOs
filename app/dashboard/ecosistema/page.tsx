'use client'

import { useEffect, useRef, useState } from 'react'

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,700;0,9..144,900;1,9..144,300;1,9..144,700&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');

.ory-root { font-family: 'DM Sans', sans-serif; }

@keyframes ory-fadeUp {
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes ory-fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes ory-shimmer {
  0%   { background-position: -300% center; }
  100% { background-position: 300% center; }
}
@keyframes ory-pulse-dot {
  0%,100% { box-shadow: 0 0 0 0 rgba(74,222,128,0.6); }
  50%      { box-shadow: 0 0 0 6px rgba(74,222,128,0); }
}
@keyframes ory-line-grow {
  from { width: 0; }
  to   { width: 100%; }
}
@keyframes ory-float {
  0%,100% { transform: translateY(0px); }
  50%     { transform: translateY(-8px); }
}
@keyframes ory-spin-slow {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}

.ory-hero-title { animation: ory-fadeUp .7s ease both; }
.ory-hero-sub   { animation: ory-fadeUp .7s ease .12s both; }
.ory-hero-tags  { animation: ory-fadeUp .7s ease .22s both; }
.ory-hero-cta   { animation: ory-fadeUp .7s ease .32s both; }
.ory-stats      { animation: ory-fadeUp .6s ease .4s both; }

.ory-tagline em {
  font-style: italic;
  background: linear-gradient(90deg, #22c55e 0%, #4ade80 40%, #86efac 70%, #22c55e 100%);
  background-size: 300% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: ory-shimmer 6s linear infinite;
}

.ory-product-card {
  transition: border-color .25s, transform .25s, background .25s;
  cursor: default;
}
.ory-product-card:hover {
  transform: translateY(-4px);
  border-color: rgba(74,222,128,0.28) !important;
  background: rgba(10,26,16,0.98) !important;
}

.ory-feature-pill {
  transition: background .2s, color .2s;
}
.ory-feature-pill:hover {
  background: rgba(74,222,128,0.15) !important;
  color: #4ade80 !important;
}

.ory-value-card {
  transition: border-color .2s, background .2s;
}
.ory-value-card:hover {
  border-color: rgba(34,197,94,0.22) !important;
  background: rgba(8,20,13,0.9) !important;
}

.ory-cta-btn {
  transition: background .2s, transform .15s, box-shadow .2s;
}
.ory-cta-btn:hover {
  background: #16a34a !important;
  transform: translateY(-2px);
  box-shadow: 0 12px 40px rgba(22,163,74,0.35) !important;
}
.ory-cta-btn:active { transform: translateY(0); }

.ory-tech-tag {
  transition: border-color .2s, color .2s;
}
.ory-tech-tag:hover {
  border-color: rgba(74,222,128,0.4) !important;
  color: #4ade80 !important;
}

.ory-dot-live { animation: ory-pulse-dot 2.5s ease infinite; }
`

// Animated constellation canvas
function ConstellationCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf: number
    let W = canvas.offsetWidth
    let H = canvas.offsetHeight
    canvas.width = W
    canvas.height = H

    const onResize = () => {
      W = canvas.offsetWidth; H = canvas.offsetHeight
      canvas.width = W; canvas.height = H
    }
    window.addEventListener('resize', onResize)

    const NODE_COUNT = 52
    interface Node { x: number; y: number; vx: number; vy: number; r: number; opacity: number }
    const nodes: Node[] = Array.from({ length: NODE_COUNT }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      r: Math.random() * 1.5 + 0.8,
      opacity: Math.random() * 0.5 + 0.3,
    }))

    const MAX_DIST = 160

    function draw() {
      ctx.clearRect(0, 0, W, H)

      // Edges
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x
          const dy = nodes[i].y - nodes[j].y
          const d = Math.sqrt(dx * dx + dy * dy)
          if (d < MAX_DIST) {
            const alpha = (1 - d / MAX_DIST) * 0.18
            ctx.beginPath()
            ctx.moveTo(nodes[i].x, nodes[i].y)
            ctx.lineTo(nodes[j].x, nodes[j].y)
            ctx.strokeStyle = `rgba(74,222,128,${alpha})`
            ctx.lineWidth = 0.6
            ctx.stroke()
          }
        }
      }

      // Nodes
      for (const n of nodes) {
        ctx.beginPath()
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(74,222,128,${n.opacity})`
        ctx.fill()
      }
    }

    function tick() {
      for (const n of nodes) {
        n.x += n.vx; n.y += n.vy
        if (n.x < 0 || n.x > W) n.vx *= -1
        if (n.y < 0 || n.y > H) n.vy *= -1
      }
      draw()
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute', inset: 0, width: '100%', height: '100%',
        pointerEvents: 'none', opacity: 0.7,
      }}
    />
  )
}

const PRODUCTS = [
  {
    id: 'agrocore',
    href: '/dashboard/agrocore',
    eyebrow: 'Marketplace Agrícola',
    name: 'AgroCore',
    desc: 'Conecta produtores rurais a prestadores de serviço com inteligência. Do pedido à avaliação — tudo em um fluxo transparente e rastreável.',
    accent: '#22c55e',
    accentBg: 'rgba(34,197,94,0.08)',
    features: ['Matching inteligente', 'Propostas e contratos', 'Avaliações verificadas', 'Pagamentos integrados'],
    icon: (
      <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    ),
  },
  {
    id: 'smartagros',
    href: '/dashboard',
    eyebrow: 'Sistema Operacional',
    name: 'SmartAgroOS',
    desc: 'O sistema nervoso central da sua fazenda. Operacional, financeiro, mapas geoespaciais, solo, clima e APIs científicas Embrapa em tempo real.',
    accent: '#4ade80',
    accentBg: 'rgba(74,222,128,0.07)',
    features: ['APIs Embrapa', 'Mapa geoespacial', 'IA operacional', 'AgroToken blockchain'],
    icon: (
      <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1 1 .03 2.798-1.338 2.798H4.136c-1.369 0-2.34-1.798-1.338-2.798L4.2 15.3" />
      </svg>
    ),
  },
  {
    id: 'agrorate',
    href: '/dashboard/agrorate',
    eyebrow: 'Crédito Rural',
    name: 'AgroRate',
    desc: 'Plataforma de scoring e crédito rural inteligente. Avalia fazendas, produtores e documentos para conectar diretamente a instituições financeiras.',
    accent: '#86efac',
    accentBg: 'rgba(134,239,172,0.06)',
    features: ['Scoring por fazenda', 'Análise documental', 'Conexão bancária', 'Crédito rural digital'],
    icon: (
      <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
]

const VALUES = [
  {
    title: 'Dados com propósito',
    desc: 'Cada informação coletada tem um objetivo: ajudar o produtor a tomar decisões melhores. Não vendemos dados — usamos para gerar valor direto no campo.',
    num: '01',
  },
  {
    title: 'Transparência radical',
    desc: 'Do contrato ao crédito, tudo é registrado, rastreável e verificável. Blockchain no core — imutabilidade não é promessa, é arquitetura.',
    num: '02',
  },
  {
    title: 'Tecnologia no campo',
    desc: 'APIs Embrapa, modelos de IA agrícola, sensoriamento remoto e blockchain acessíveis por qualquer produtor rural, do pequeno ao enterprise.',
    num: '03',
  },
  {
    title: 'Crescimento sustentável',
    desc: 'Construído para escalar sem perder a essência: ferramenta que respeita o tempo do produtor, o ciclo da lavoura e a complexidade do agronegócio.',
    num: '04',
  },
]

const TECH = [
  'APIs Embrapa', 'AGROFIT', 'SmartSolosExpert', 'BovTrace',
  'Polygon ERC-1155', 'AgroToken', 'YOLO/ONNX Florestal',
  'Next.js App Router', 'Supabase', 'Prisma ORM',
  'Groq LLaMA 3.3', 'LiDAR / Point Cloud', 'NDVI Satélite',
  'GPX Geoespacial', 'Stripe Payments',
]

const STATS = [
  { value: '3', label: 'Plataformas integradas' },
  { value: '5+', label: 'APIs Embrapa ativas' },
  { value: '100%', label: 'Dados no campo' },
  { value: 'Polygon', label: 'Blockchain mainnet' },
]

export default function EcossistemaPage() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 60)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="ory-root" style={{
      background: 'linear-gradient(170deg, #020c05 0%, #030f07 50%, #020c05 100%)',
      minHeight: '100%',
      color: '#e2faea',
      overflowX: 'hidden',
    }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* ─── HERO ──────────────────────────────────────────────── */}
      <section style={{
        position: 'relative',
        minHeight: '88vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: 'clamp(64px,10vh,120px) clamp(20px,6vw,80px) clamp(48px,8vh,100px)',
        overflow: 'hidden',
      }}>
        <ConstellationCanvas />

        {/* Radial glow */}
        <div style={{
          position: 'absolute', top: '30%', left: '50%',
          transform: 'translate(-50%,-50%)',
          width: 600, height: 600,
          background: 'radial-gradient(ellipse, rgba(34,197,94,0.06) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 820 }}>
          {/* Eyebrow */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24,
            opacity: visible ? 1 : 0,
            transition: 'opacity .5s ease',
          }}>
            <div className="ory-dot-live" style={{
              width: 7, height: 7, borderRadius: '50%',
              background: '#4ade80', flexShrink: 0,
            }} />
            <span style={{
              fontFamily: 'DM Mono, monospace', fontSize: 11, fontWeight: 500,
              letterSpacing: '0.2em', textTransform: 'uppercase',
              color: '#4ade80',
            }}>Ecossistema OryonAG — Agtech Brasileiro</span>
          </div>

          {/* Title */}
          <h1 className="ory-hero-title ory-tagline" style={{
            fontFamily: 'Fraunces, serif',
            fontSize: 'clamp(48px, 7vw, 96px)',
            fontWeight: 900,
            lineHeight: 1.0,
            letterSpacing: '-0.03em',
            margin: '0 0 24px',
            color: '#f0fdf4',
          }}>
            Inteligência que<br />
            <em>conecta o agro</em><br />
            ao futuro.
          </h1>

          {/* Sub */}
          <p className="ory-hero-sub" style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: 'clamp(16px, 2vw, 20px)',
            fontWeight: 300,
            color: '#4a7c5c',
            maxWidth: 560,
            lineHeight: 1.65,
            margin: '0 0 36px',
          }}>
            Três plataformas integradas. Uma visão: levar dados, crédito e mercado direto
            ao produtor rural brasileiro — com transparência, tecnologia e escala.
          </p>

          {/* Tags */}
          <div className="ory-hero-tags" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 40 }}>
            {['Marketplace', 'SO da Fazenda', 'Crédito Rural', 'Blockchain', 'IA Agrícola', 'APIs Embrapa'].map(t => (
              <span key={t} style={{
                fontFamily: 'DM Mono, monospace',
                fontSize: 11, fontWeight: 500,
                padding: '5px 12px',
                border: '1px solid rgba(74,222,128,0.2)',
                borderRadius: 99,
                color: '#3a6648',
                letterSpacing: '0.08em',
              }}>{t}</span>
            ))}
          </div>

          {/* CTA */}
          <div className="ory-hero-cta" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <a href="/dashboard" className="ory-cta-btn" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '13px 28px',
              background: '#22c55e',
              borderRadius: 10,
              fontFamily: 'DM Sans, sans-serif',
              fontSize: 14, fontWeight: 600,
              color: '#020c05',
              textDecoration: 'none',
              boxShadow: '0 8px 32px rgba(34,197,94,0.25)',
            }}>
              Acessar plataforma
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
            <a href="#produtos" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '13px 28px',
              background: 'transparent',
              border: '1px solid rgba(74,222,128,0.22)',
              borderRadius: 10,
              fontFamily: 'DM Sans, sans-serif',
              fontSize: 14, fontWeight: 500,
              color: '#4a7c5c',
              textDecoration: 'none',
              transition: 'border-color .2s, color .2s',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(74,222,128,0.45)'; (e.currentTarget as HTMLAnchorElement).style.color = '#4ade80' }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(74,222,128,0.22)'; (e.currentTarget as HTMLAnchorElement).style.color = '#4a7c5c' }}
            >
              Conhecer o ecossistema
            </a>
          </div>
        </div>

        {/* Scroll indicator */}
        <div style={{
          position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
          opacity: 0.35,
          animation: 'ory-float 2.5s ease infinite',
        }}>
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </section>

      {/* ─── STATS ─────────────────────────────────────────────── */}
      <section className="ory-stats" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        borderTop: '1px solid rgba(34,197,94,0.08)',
        borderBottom: '1px solid rgba(34,197,94,0.08)',
        background: 'rgba(2,12,6,0.6)',
      }}>
        {STATS.map((s, i) => (
          <div key={i} style={{
            padding: 'clamp(20px,4vw,32px) clamp(16px,3vw,28px)',
            borderRight: i < STATS.length - 1 ? '1px solid rgba(34,197,94,0.08)' : 'none',
          }}>
            <div style={{
              fontFamily: 'Fraunces, serif',
              fontSize: 'clamp(28px,4vw,40px)',
              fontWeight: 700,
              color: '#4ade80',
              lineHeight: 1,
              marginBottom: 6,
            }}>{s.value}</div>
            <div style={{
              fontFamily: 'DM Mono, monospace',
              fontSize: 11, fontWeight: 500,
              color: '#2a4f36',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}>{s.label}</div>
          </div>
        ))}
      </section>

      {/* ─── PRODUCTS ──────────────────────────────────────────── */}
      <section id="produtos" style={{
        padding: 'clamp(64px,10vw,112px) clamp(20px,6vw,80px)',
      }}>
        {/* Section header */}
        <div style={{ marginBottom: 'clamp(40px,6vw,64px)' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16,
          }}>
            <div style={{ height: 1, width: 32, background: '#22c55e' }} />
            <span style={{
              fontFamily: 'DM Mono, monospace', fontSize: 11, fontWeight: 500,
              color: '#22c55e', letterSpacing: '0.2em', textTransform: 'uppercase',
            }}>Nossas plataformas</span>
          </div>
          <h2 style={{
            fontFamily: 'Fraunces, serif',
            fontSize: 'clamp(32px,4vw,52px)',
            fontWeight: 700,
            color: '#f0fdf4',
            lineHeight: 1.1,
            letterSpacing: '-0.025em',
            margin: 0,
          }}>
            Um ecossistema,<br />três instrumentos.
          </h2>
        </div>

        {/* Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 16,
        }}>
          {PRODUCTS.map(p => (
            <div
              key={p.id}
              className="ory-product-card"
              style={{
                background: 'rgba(6,18,11,0.85)',
                border: '1px solid rgba(34,197,94,0.1)',
                borderRadius: 18,
                padding: 'clamp(24px,3vw,32px)',
                display: 'flex',
                flexDirection: 'column',
                gap: 0,
              }}
            >
              {/* Icon + eyebrow */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <div style={{
                  width: 52, height: 52,
                  borderRadius: 13,
                  background: p.accentBg,
                  color: p.accent,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {p.icon}
                </div>
                <div>
                  <div style={{
                    fontFamily: 'DM Mono, monospace',
                    fontSize: 10, fontWeight: 500,
                    color: '#2a4f36',
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    marginBottom: 3,
                  }}>{p.eyebrow}</div>
                  <div style={{
                    fontFamily: 'Fraunces, serif',
                    fontSize: 22, fontWeight: 700,
                    color: '#e2faea',
                    lineHeight: 1,
                  }}>{p.name}</div>
                </div>
              </div>

              {/* Desc */}
              <p style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: 14, fontWeight: 300,
                color: '#3a6648',
                lineHeight: 1.7,
                margin: '0 0 20px',
                flex: 1,
              }}>{p.desc}</p>

              {/* Features */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 24 }}>
                {p.features.map(f => (
                  <span key={f} className="ory-feature-pill" style={{
                    fontFamily: 'DM Mono, monospace',
                    fontSize: 10.5, fontWeight: 500,
                    padding: '4px 10px',
                    background: 'rgba(34,197,94,0.06)',
                    border: '1px solid rgba(34,197,94,0.12)',
                    borderRadius: 99,
                    color: '#2a5c3a',
                    letterSpacing: '0.06em',
                  }}>{f}</span>
                ))}
              </div>

              {/* Link */}
              <a href={p.href} style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                fontFamily: 'DM Sans, sans-serif',
                fontSize: 13, fontWeight: 600,
                color: p.accent,
                textDecoration: 'none',
                paddingTop: 16,
                borderTop: '1px solid rgba(34,197,94,0.08)',
                transition: 'gap .2s',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.gap = '10px' }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.gap = '6px' }}
              >
                Acessar plataforma
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* ─── VISION ────────────────────────────────────────────── */}
      <section style={{
        padding: 'clamp(64px,8vw,96px) clamp(20px,6vw,80px)',
        background: 'rgba(3,10,6,0.6)',
        borderTop: '1px solid rgba(34,197,94,0.06)',
        borderBottom: '1px solid rgba(34,197,94,0.06)',
      }}>
        <div style={{
          maxWidth: 900,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 'clamp(40px,6vw,80px)',
          alignItems: 'center',
        }}>
          {/* Left — text */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ height: 1, width: 32, background: '#22c55e' }} />
              <span style={{
                fontFamily: 'DM Mono, monospace', fontSize: 11, fontWeight: 500,
                color: '#22c55e', letterSpacing: '0.2em', textTransform: 'uppercase',
              }}>Visão</span>
            </div>
            <h2 style={{
              fontFamily: 'Fraunces, serif',
              fontSize: 'clamp(28px,3.5vw,44px)',
              fontWeight: 700,
              color: '#f0fdf4',
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
              margin: '0 0 20px',
            }}>
              O agro brasileiro<br />
              <span style={{ color: '#4ade80', fontStyle: 'italic' }}>merece tecnologia</span><br />
              de ponta.
            </h2>
            <p style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: 15, fontWeight: 300,
              color: '#3a6648',
              lineHeight: 1.75,
              margin: 0,
            }}>
              O Brasil é potência agrícola mundial, mas o produtor ainda enfrenta burocracia,
              falta de crédito e ausência de ferramentas inteligentes. A OryonAG nasce para
              mudar isso — unindo ciência, blockchain e IA em uma plataforma acessível,
              do pequeno produtor ao grande complexo agroindustrial.
            </p>
          </div>

          {/* Right — orbital visual */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 260 }}>
            {/* Outer ring */}
            <div style={{
              position: 'absolute',
              width: 240, height: 240,
              borderRadius: '50%',
              border: '1px solid rgba(34,197,94,0.1)',
              animation: 'ory-spin-slow 20s linear infinite',
            }}>
              {[0, 90, 180, 270].map(deg => (
                <div key={deg} style={{
                  position: 'absolute',
                  width: 8, height: 8,
                  borderRadius: '50%',
                  background: 'rgba(74,222,128,0.5)',
                  top: '50%', left: '50%',
                  transform: `rotate(${deg}deg) translateX(120px) translate(-50%,-50%)`,
                }} />
              ))}
            </div>
            {/* Mid ring */}
            <div style={{
              position: 'absolute',
              width: 160, height: 160,
              borderRadius: '50%',
              border: '1px solid rgba(34,197,94,0.15)',
              animation: 'ory-spin-slow 13s linear infinite reverse',
            }}>
              {[45, 165, 285].map(deg => (
                <div key={deg} style={{
                  position: 'absolute',
                  width: 6, height: 6,
                  borderRadius: '50%',
                  background: 'rgba(34,197,94,0.6)',
                  top: '50%', left: '50%',
                  transform: `rotate(${deg}deg) translateX(80px) translate(-50%,-50%)`,
                }} />
              ))}
            </div>
            {/* Center */}
            <div style={{
              width: 72, height: 72,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(74,222,128,0.2) 0%, rgba(34,197,94,0.05) 70%)',
              border: '1px solid rgba(74,222,128,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 1,
            }}>
              <span style={{
                fontFamily: 'Fraunces, serif',
                fontSize: 14, fontWeight: 700,
                color: '#4ade80',
                letterSpacing: '0.05em',
              }}>AG</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── VALUES ────────────────────────────────────────────── */}
      <section style={{
        padding: 'clamp(64px,8vw,96px) clamp(20px,6vw,80px)',
      }}>
        <div style={{ marginBottom: 'clamp(40px,5vw,56px)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ height: 1, width: 32, background: '#22c55e' }} />
            <span style={{
              fontFamily: 'DM Mono, monospace', fontSize: 11, fontWeight: 500,
              color: '#22c55e', letterSpacing: '0.2em', textTransform: 'uppercase',
            }}>Princípios</span>
          </div>
          <h2 style={{
            fontFamily: 'Fraunces, serif',
            fontSize: 'clamp(30px,3.5vw,48px)',
            fontWeight: 700,
            color: '#f0fdf4',
            lineHeight: 1.1,
            letterSpacing: '-0.025em',
            margin: 0,
          }}>O que nos guia.</h2>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 12,
        }}>
          {VALUES.map(v => (
            <div
              key={v.num}
              className="ory-value-card"
              style={{
                padding: 'clamp(20px,3vw,28px)',
                border: '1px solid rgba(34,197,94,0.09)',
                borderRadius: 14,
                background: 'rgba(4,14,9,0.6)',
              }}
            >
              <div style={{
                fontFamily: 'Fraunces, serif',
                fontSize: 11, fontWeight: 300,
                color: 'rgba(74,222,128,0.3)',
                letterSpacing: '0.15em',
                marginBottom: 12,
              }}>{v.num}</div>
              <h3 style={{
                fontFamily: 'Fraunces, serif',
                fontSize: 18, fontWeight: 700,
                color: '#dcfce7',
                margin: '0 0 10px',
                lineHeight: 1.2,
              }}>{v.title}</h3>
              <p style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: 13, fontWeight: 300,
                color: '#2e5c3e',
                margin: 0,
                lineHeight: 1.7,
              }}>{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── TECHNOLOGY ────────────────────────────────────────── */}
      <section style={{
        padding: 'clamp(48px,6vw,72px) clamp(20px,6vw,80px)',
        background: 'rgba(3,10,6,0.5)',
        borderTop: '1px solid rgba(34,197,94,0.06)',
        borderBottom: '1px solid rgba(34,197,94,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <div style={{ height: 1, width: 32, background: '#22c55e' }} />
          <span style={{
            fontFamily: 'DM Mono, monospace', fontSize: 11, fontWeight: 500,
            color: '#22c55e', letterSpacing: '0.2em', textTransform: 'uppercase',
          }}>Stack tecnológico</span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {TECH.map(t => (
            <span key={t} className="ory-tech-tag" style={{
              fontFamily: 'DM Mono, monospace',
              fontSize: 12, fontWeight: 400,
              padding: '7px 14px',
              border: '1px solid rgba(34,197,94,0.14)',
              borderRadius: 8,
              color: '#2a4f36',
              letterSpacing: '0.05em',
              transition: 'border-color .2s, color .2s',
            }}>{t}</span>
          ))}
        </div>
      </section>

      {/* ─── CTA ───────────────────────────────────────────────── */}
      <section style={{
        padding: 'clamp(80px,12vw,128px) clamp(20px,6vw,80px)',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Glow bg */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%,-50%)',
          width: 700, height: 400,
          background: 'radial-gradient(ellipse, rgba(34,197,94,0.07) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            fontFamily: 'DM Mono, monospace',
            fontSize: 11, fontWeight: 500,
            color: '#4ade80',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            marginBottom: 20,
          }}>Faça parte do futuro do agro</div>

          <h2 style={{
            fontFamily: 'Fraunces, serif',
            fontSize: 'clamp(36px,5vw,68px)',
            fontWeight: 900,
            color: '#f0fdf4',
            lineHeight: 1.05,
            letterSpacing: '-0.03em',
            margin: '0 0 20px',
          }}>
            Conheça nosso<br />
            <span style={{ color: '#4ade80', fontStyle: 'italic' }}>ecossistema.</span>
          </h2>

          <p style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: 'clamp(15px,2vw,18px)',
            fontWeight: 300,
            color: '#3a6648',
            maxWidth: 460,
            margin: '0 auto 40px',
            lineHeight: 1.65,
          }}>
            Marketplace, sistema operacional e crédito rural — tudo conectado,
            tudo inteligente, tudo em um lugar.
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/dashboard" className="ory-cta-btn" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '15px 36px',
              background: '#22c55e',
              borderRadius: 11,
              fontFamily: 'DM Sans, sans-serif',
              fontSize: 15, fontWeight: 600,
              color: '#020c05',
              textDecoration: 'none',
              boxShadow: '0 8px 40px rgba(34,197,94,0.22)',
            }}>
              Acessar agora
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
            <a href="/dashboard/planos" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '15px 36px',
              background: 'transparent',
              border: '1px solid rgba(74,222,128,0.2)',
              borderRadius: 11,
              fontFamily: 'DM Sans, sans-serif',
              fontSize: 15, fontWeight: 500,
              color: '#4a7c5c',
              textDecoration: 'none',
              transition: 'border-color .2s, color .2s',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(74,222,128,0.42)'; (e.currentTarget as HTMLAnchorElement).style.color = '#4ade80' }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(74,222,128,0.2)'; (e.currentTarget as HTMLAnchorElement).style.color = '#4a7c5c' }}
            >
              Ver planos
            </a>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ────────────────────────────────────────────── */}
      <footer style={{
        padding: '28px clamp(20px,6vw,80px)',
        borderTop: '1px solid rgba(34,197,94,0.07)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
      }}>
        <div style={{
          fontFamily: 'Fraunces, serif',
          fontSize: 16, fontWeight: 700,
          color: '#4ade80',
          letterSpacing: '-0.01em',
        }}>OryonAG</div>
        <p style={{
          fontFamily: 'DM Mono, monospace',
          fontSize: 10, fontWeight: 400,
          color: '#1a3824',
          margin: 0,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}>
          © 2026 OryonAG · Inteligência que conecta o agro ao futuro
        </p>
      </footer>
    </div>
  )
}

'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Nav from '@/components/Nav'

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,700;0,9..144,900;1,9..144,700&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');

.ory-pub { font-family: 'DM Sans', sans-serif; }

@keyframes ory-fadeUp {
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes ory-shimmer {
  0%   { background-position: -300% center; }
  100% { background-position: 300% center; }
}
@keyframes ory-pulse-dot {
  0%,100% { box-shadow: 0 0 0 0 rgba(74,222,128,0.6); }
  50%      { box-shadow: 0 0 0 6px rgba(74,222,128,0); }
}
@keyframes ory-float {
  0%,100% { transform: translateY(0px); }
  50%     { transform: translateY(-8px); }
}
@keyframes ory-spin-slow {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}

.ory-pub .ory-tagline em {
  font-style: italic;
  background: linear-gradient(90deg, #22c55e 0%, #4ade80 40%, #86efac 70%, #22c55e 100%);
  background-size: 300% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: ory-shimmer 6s linear infinite;
}
.ory-pub .ory-hero-title { animation: ory-fadeUp .7s ease both; }
.ory-pub .ory-hero-sub   { animation: ory-fadeUp .7s ease .12s both; }
.ory-pub .ory-hero-cta   { animation: ory-fadeUp .7s ease .28s both; }

.ory-pub .ory-dot-live { animation: ory-pulse-dot 2.5s ease infinite; }

.ory-pub .ory-card {
  transition: border-color .25s, transform .25s, background .25s;
}
.ory-pub .ory-card:hover {
  transform: translateY(-4px);
  border-color: rgba(74,222,128,0.28) !important;
  background: rgba(10,26,16,0.98) !important;
}
.ory-pub .ory-cta-btn {
  transition: background .2s, transform .15s, box-shadow .2s;
}
.ory-pub .ory-cta-btn:hover {
  background: #16a34a !important;
  transform: translateY(-2px);
  box-shadow: 0 12px 40px rgba(22,163,74,0.35) !important;
}
`

function ConstellationCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctxMaybe = canvas.getContext('2d')
    if (!ctxMaybe) return
    const ctx = ctxMaybe

    let raf: number
    let W = canvas.offsetWidth
    let H = canvas.offsetHeight
    canvas.width = W; canvas.height = H

    const onResize = () => { W = canvas.offsetWidth; H = canvas.offsetHeight; canvas.width = W; canvas.height = H }
    window.addEventListener('resize', onResize)

    interface Node { x: number; y: number; vx: number; vy: number; r: number; opacity: number }
    const nodes: Node[] = Array.from({ length: 48 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.22, vy: (Math.random() - 0.5) * 0.22,
      r: Math.random() * 1.4 + 0.7, opacity: Math.random() * 0.5 + 0.3,
    }))

    function tick() {
      ctx.clearRect(0, 0, W, H)
      for (let i = 0; i < nodes.length; i++) {
        nodes[i].x += nodes[i].vx; nodes[i].y += nodes[i].vy
        if (nodes[i].x < 0 || nodes[i].x > W) nodes[i].vx *= -1
        if (nodes[i].y < 0 || nodes[i].y > H) nodes[i].vy *= -1
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x; const dy = nodes[i].y - nodes[j].y
          const d = Math.sqrt(dx * dx + dy * dy)
          if (d < 160) {
            ctx.beginPath(); ctx.moveTo(nodes[i].x, nodes[i].y); ctx.lineTo(nodes[j].x, nodes[j].y)
            ctx.strokeStyle = `rgba(74,222,128,${(1 - d / 160) * 0.16})`; ctx.lineWidth = 0.5; ctx.stroke()
          }
        }
        ctx.beginPath(); ctx.arc(nodes[i].x, nodes[i].y, nodes[i].r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(74,222,128,${nodes[i].opacity})`; ctx.fill()
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', onResize) }
  }, [])

  return <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity: 0.65 }} />
}

const PRODUCTS = [
  {
    eyebrow: 'Marketplace Agrícola',
    name: 'AgroCore',
    desc: 'Conecta produtores a prestadores de serviço com matching inteligente. Do pedido à avaliação, tudo rastreável.',
    accent: '#22c55e',
    accentBg: 'rgba(34,197,94,0.08)',
    features: ['Matching inteligente', 'Propostas e contratos', 'Pagamentos integrados', 'Avaliações verificadas'],
  },
  {
    eyebrow: 'Sistema Operacional',
    name: 'SmartAgroOS',
    desc: 'O sistema nervoso central da fazenda. Operacional, financeiro, mapas, solo, clima e APIs Embrapa em tempo real.',
    accent: '#4ade80',
    accentBg: 'rgba(74,222,128,0.07)',
    features: ['APIs Embrapa', 'Mapa geoespacial', 'AgroToken blockchain', 'IA operacional'],
  },
  {
    eyebrow: 'Crédito Rural',
    name: 'AgroRate',
    desc: 'Scoring e crédito rural inteligente. Avalia fazendas e conecta produtores diretamente a bancos e cooperativas.',
    accent: '#86efac',
    accentBg: 'rgba(134,239,172,0.06)',
    features: ['Score por fazenda', 'Análise documental', 'Conexão bancária', 'Histórico de análises'],
  },
]

export default function EcossistemaPublicPage() {
  const [vis, setVis] = useState(false)
  useEffect(() => { const t = setTimeout(() => setVis(true), 60); return () => clearTimeout(t) }, [])

  return (
    <div className="ory-pub" style={{ background: 'linear-gradient(170deg, #020c05 0%, #030f07 50%, #020c05 100%)', minHeight: '100vh', color: '#e2faea' }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <Nav />

      {/* ─── HERO ── */}
      <section style={{ position: 'relative', minHeight: '90vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 'clamp(100px,14vh,140px) clamp(20px,6vw,80px) clamp(60px,10vh,100px)', overflow: 'hidden' }}>
        <ConstellationCanvas />
        <div style={{ position: 'absolute', top: '35%', left: '50%', transform: 'translate(-50%,-50%)', width: 700, height: 500, background: 'radial-gradient(ellipse, rgba(34,197,94,0.06) 0%, transparent 65%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 820 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, opacity: vis ? 1 : 0, transition: 'opacity .5s' }}>
            <div className="ory-dot-live" style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ade80', flexShrink: 0 }} />
            <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, fontWeight: 500, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#4ade80' }}>
              Ecossistema OryonAG — Agtech Brasileiro
            </span>
          </div>

          <h1 className="ory-hero-title ory-tagline" style={{ fontFamily: 'Fraunces, serif', fontSize: 'clamp(48px,7vw,96px)', fontWeight: 900, lineHeight: 1.0, letterSpacing: '-0.03em', margin: '0 0 24px', color: '#f0fdf4' }}>
            Inteligência que<br /><em>conecta o agro</em><br />ao futuro.
          </h1>

          <p className="ory-hero-sub" style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 'clamp(16px,2vw,20px)', fontWeight: 300, color: '#4a7c5c', maxWidth: 560, lineHeight: 1.65, margin: '0 0 40px' }}>
            Marketplace agrícola, sistema operacional de fazenda e crédito rural inteligente — três plataformas integradas em um único ecossistema.
          </p>

          <div className="ory-hero-cta" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link href="/login" className="ory-cta-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 32px', background: '#22c55e', borderRadius: 11, fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 600, color: '#020c05', textDecoration: 'none', boxShadow: '0 8px 32px rgba(34,197,94,0.25)' }}>
              Criar conta grátis
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </Link>
            <Link href="/demo" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 32px', background: 'transparent', border: '1px solid rgba(74,222,128,0.22)', borderRadius: 11, fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 500, color: '#4a7c5c', textDecoration: 'none', transition: 'border-color .2s, color .2s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(74,222,128,0.45)'; (e.currentTarget as HTMLAnchorElement).style.color = '#4ade80' }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(74,222,128,0.22)'; (e.currentTarget as HTMLAnchorElement).style.color = '#4a7c5c' }}
            >
              Ver demonstração
            </Link>
          </div>
        </div>

        <div style={{ position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)', opacity: 0.3, animation: 'ory-float 2.5s ease infinite' }}>
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
        </div>
      </section>

      {/* ─── STATS ── */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', borderTop: '1px solid rgba(34,197,94,0.08)', borderBottom: '1px solid rgba(34,197,94,0.08)', background: 'rgba(2,12,6,0.6)' }}>
        {[
          { value: '3', label: 'Plataformas integradas' },
          { value: '5+', label: 'APIs Embrapa ativas' },
          { value: 'Polygon', label: 'Blockchain mainnet' },
          { value: '100%', label: 'Dados no campo' },
        ].map((s, i, arr) => (
          <div key={i} style={{ padding: 'clamp(20px,4vw,28px) clamp(16px,3vw,24px)', borderRight: i < arr.length - 1 ? '1px solid rgba(34,197,94,0.08)' : 'none' }}>
            <div style={{ fontFamily: 'Fraunces, serif', fontSize: 'clamp(26px,4vw,38px)', fontWeight: 700, color: '#4ade80', lineHeight: 1, marginBottom: 5 }}>{s.value}</div>
            <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, fontWeight: 500, color: '#2a4f36', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{s.label}</div>
          </div>
        ))}
      </section>

      {/* ─── PRODUCTS ── */}
      <section style={{ padding: 'clamp(64px,10vw,100px) clamp(20px,6vw,80px)' }}>
        <div style={{ marginBottom: 'clamp(40px,5vw,56px)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ height: 1, width: 32, background: '#22c55e' }} />
            <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, fontWeight: 500, color: '#22c55e', letterSpacing: '0.2em', textTransform: 'uppercase' }}>Nossas plataformas</span>
          </div>
          <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 'clamp(30px,4vw,50px)', fontWeight: 700, color: '#f0fdf4', lineHeight: 1.1, letterSpacing: '-0.025em', margin: 0 }}>
            Um ecossistema, três instrumentos.
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
          {PRODUCTS.map(p => (
            <div key={p.name} className="ory-card" style={{ background: 'rgba(6,18,11,0.85)', border: '1px solid rgba(34,197,94,0.1)', borderRadius: 18, padding: 'clamp(22px,3vw,30px)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, fontWeight: 500, color: '#2a4f36', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 8 }}>{p.eyebrow}</div>
              <div style={{ fontFamily: 'Fraunces, serif', fontSize: 22, fontWeight: 700, color: p.accent, marginBottom: 12, lineHeight: 1 }}>{p.name}</div>
              <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 300, color: '#3a6648', lineHeight: 1.7, margin: '0 0 18px', flex: 1 }}>{p.desc}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {p.features.map(f => (
                  <span key={f} style={{ fontFamily: 'DM Mono, monospace', fontSize: 10.5, padding: '4px 9px', background: p.accentBg, border: `1px solid ${p.accent}22`, borderRadius: 99, color: '#2a5c3a' }}>{f}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── VISION ── */}
      <section style={{ padding: 'clamp(60px,8vw,88px) clamp(20px,6vw,80px)', background: 'rgba(3,10,6,0.6)', borderTop: '1px solid rgba(34,197,94,0.06)', borderBottom: '1px solid rgba(34,197,94,0.06)' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ height: 1, width: 32, background: '#22c55e' }} />
            <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, fontWeight: 500, color: '#22c55e', letterSpacing: '0.2em', textTransform: 'uppercase' }}>Visão</span>
          </div>
          <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 'clamp(28px,3.5vw,48px)', fontWeight: 700, color: '#f0fdf4', lineHeight: 1.1, letterSpacing: '-0.02em', margin: '0 0 20px' }}>
            O agro brasileiro merece{' '}
            <span style={{ color: '#4ade80', fontStyle: 'italic' }}>tecnologia de ponta.</span>
          </h2>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 'clamp(15px,1.8vw,18px)', fontWeight: 300, color: '#3a6648', lineHeight: 1.75, maxWidth: 680, margin: 0 }}>
            O Brasil é potência agrícola mundial, mas o produtor ainda enfrenta burocracia, falta de crédito e ausência de ferramentas inteligentes.
            A OryonAG nasce para mudar isso — unindo ciência, blockchain e IA em uma plataforma acessível,
            do pequeno produtor ao grande complexo agroindustrial.
          </p>
        </div>
      </section>

      {/* ─── CTA FINAL ── */}
      <section style={{ padding: 'clamp(80px,12vw,120px) clamp(20px,6vw,80px)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 700, height: 400, background: 'radial-gradient(ellipse, rgba(34,197,94,0.07) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, color: '#4ade80', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 20 }}>
            Faça parte do futuro do agro
          </div>
          <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 'clamp(36px,5vw,68px)', fontWeight: 900, color: '#f0fdf4', lineHeight: 1.05, letterSpacing: '-0.03em', margin: '0 0 20px' }}>
            Comece a usar<br />
            <span style={{ color: '#4ade80', fontStyle: 'italic' }}>gratuitamente.</span>
          </h2>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 'clamp(15px,2vw,18px)', fontWeight: 300, color: '#3a6648', maxWidth: 420, margin: '0 auto 40px', lineHeight: 1.65 }}>
            Cadastre-se e tenha acesso ao sistema operacional da fazenda moderna em minutos.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/login" className="ory-cta-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '15px 36px', background: '#22c55e', borderRadius: 11, fontFamily: 'DM Sans, sans-serif', fontSize: 15, fontWeight: 600, color: '#020c05', textDecoration: 'none', boxShadow: '0 8px 40px rgba(34,197,94,0.22)' }}>
              Criar conta grátis
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </Link>
            <Link href="/demo" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '15px 36px', background: 'transparent', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 11, fontFamily: 'DM Sans, sans-serif', fontSize: 15, fontWeight: 500, color: '#4a7c5c', textDecoration: 'none', transition: 'border-color .2s, color .2s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(74,222,128,0.42)'; (e.currentTarget as HTMLAnchorElement).style.color = '#4ade80' }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(74,222,128,0.2)'; (e.currentTarget as HTMLAnchorElement).style.color = '#4a7c5c' }}
            >
              Ver demonstração
            </Link>
          </div>
        </div>
      </section>

      <footer style={{ padding: '24px clamp(20px,6vw,80px)', borderTop: '1px solid rgba(34,197,94,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <span style={{ fontFamily: 'Fraunces, serif', fontSize: 15, fontWeight: 700, color: '#4ade80' }}>OryonAG</span>
        <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, color: '#1a3824', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          © 2026 OryonAG · Inteligência que conecta o agro ao futuro
        </span>
      </footer>
    </div>
  )
}

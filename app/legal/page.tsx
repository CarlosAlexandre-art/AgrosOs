'use client'

import { useEffect, useRef, useState } from 'react'

const AGRORATE_URL = 'https://agrorate.app/oryon-legal'

function useInView(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null)
  const [v, setV] = useState(false)
  useEffect(() => {
    const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) setV(true) }, { threshold })
    if (ref.current) o.observe(ref.current)
    return () => o.disconnect()
  }, [threshold])
  return { ref, v }
}

function Reveal({ children, delay = 0, y = 40 }: { children: React.ReactNode; delay?: number; y?: number }) {
  const { ref, v } = useInView()
  return (
    <div ref={ref} style={{ opacity: v ? 1 : 0, transform: v ? 'none' : `translateY(${y}px)`, transition: `opacity 0.7s cubic-bezier(.16,1,.3,1) ${delay}ms, transform 0.7s cubic-bezier(.16,1,.3,1) ${delay}ms` }}>
      {children}
    </div>
  )
}

function ScoreRing({ score, color }: { score: number; color: string }) {
  const r = 44, circ = 2 * Math.PI * r
  return (
    <svg width="110" height="110" viewBox="0 0 110 110">
      <circle cx="55" cy="55" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
      <circle cx="55" cy="55" r={r} fill="none" stroke={color} strokeWidth="10"
        strokeDasharray={`${(score / 100) * circ} ${circ}`} strokeLinecap="round"
        transform="rotate(-90 55 55)" style={{ transition: 'stroke-dasharray 1.2s cubic-bezier(.16,1,.3,1)' }} />
      <text x="55" y="51" textAnchor="middle" fill="white" fontSize="22" fontWeight="900">{score}</text>
      <text x="55" y="67" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="11">/100</text>
    </svg>
  )
}

export default function LegalVitrinePage() {
  const [scrollY, setScrollY] = useState(0)
  const [activeScore] = useState(72)

  useEffect(() => {
    const fn = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: '#0a0a0f', overflowX: 'hidden' }}>

      {/* ── HERO ─────────────────────────────────────────── */}
      <section style={{ minHeight: '100vh', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: '100px 24px 80px' }}>

        {/* Background layers */}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(202,138,4,0.25) 0%, transparent 60%)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 50% at 80% 80%, rgba(120,53,15,0.2) 0%, transparent 60%)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 40% 40% at 20% 60%, rgba(251,191,36,0.08) 0%, transparent 50%)' }} />

        {/* Floating orbs */}
        {[
          { w: 600, h: 600, t: '5%', l: '55%', op: 0.04 },
          { w: 400, h: 400, t: '60%', l: '10%', op: 0.03 },
          { w: 800, h: 800, t: '20%', l: '30%', op: 0.02 },
        ].map((o, i) => (
          <div key={i} style={{ position: 'absolute', width: o.w, height: o.h, borderRadius: '50%', border: '1px solid rgba(251,191,36,0.15)', top: o.t, left: o.l, transform: `translate(-50%,-50%) scale(${1 + scrollY * 0.0002 * (i + 1)})`, opacity: o.op + 0.05, pointerEvents: 'none' }} />
        ))}

        {/* Grid pattern */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.015) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.015) 1px,transparent 1px)', backgroundSize: '60px 60px', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 2, maxWidth: '820px', textAlign: 'center' }}>
          {/* Badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', backdropFilter: 'blur(12px)', color: '#fbbf24', fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '8px 18px', borderRadius: '999px', marginBottom: '36px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fbbf24', display: 'inline-block', animation: 'pulse-gold 2s infinite' }} />
            ORYON Legal · Inteligência Jurídica para o Agro
          </div>

          {/* Headline */}
          <h1 style={{ fontSize: 'clamp(40px,7vw,80px)', fontWeight: 900, color: 'white', lineHeight: 1.0, marginBottom: '24px', letterSpacing: '-0.03em' }}>
            Sua fazenda<br />
            <span style={{ background: 'linear-gradient(135deg,#fbbf24 0%,#f59e0b 40%,#d97706 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              protegida.
            </span>
          </h1>

          {/* Sub */}
          <p style={{ fontSize: 'clamp(16px,2.2vw,20px)', color: 'rgba(255,255,255,0.5)', lineHeight: 1.75, marginBottom: '48px', maxWidth: '560px', margin: '0 auto 48px' }}>
            Diagnóstico jurídico com IA, score de risco personalizado e consultoria com especialista — tudo integrado ao seu perfil no AgroRate.
          </p>

          {/* CTAs */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '64px' }}>
            <a href={AGRORATE_URL} target="_blank" rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '16px 36px', background: 'linear-gradient(135deg,#ca8a04,#fbbf24)', color: '#1c0700', fontWeight: 800, fontSize: '16px', borderRadius: '14px', textDecoration: 'none', boxShadow: '0 8px 40px rgba(202,138,4,0.4), 0 0 0 1px rgba(251,191,36,0.3)', letterSpacing: '-0.01em' }}>
              ⚖️ Fazer Diagnóstico Gratuito
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </a>
            <a href={`${AGRORATE_URL}/minha-agenda`} target="_blank" rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '16px 28px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.75)', fontWeight: 600, fontSize: '16px', borderRadius: '14px', textDecoration: 'none', backdropFilter: 'blur(12px)' }}>
              📅 Minha Agenda
            </a>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: '0', justifyContent: 'center', flexWrap: 'wrap', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', backdropFilter: 'blur(16px)', overflow: 'hidden', maxWidth: '560px', margin: '0 auto' }}>
            {[
              { n: '7', l: 'perguntas estratégicas' },
              { n: '3 min', l: 'para o diagnóstico' },
              { n: '100%', l: 'gratuito' },
              { n: 'IA', l: 'LLaMA 3.3 70B' },
            ].map((s, i) => (
              <div key={i} style={{ flex: 1, minWidth: '100px', padding: '20px 16px', textAlign: 'center', borderRight: i < 3 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                <div style={{ fontSize: '22px', fontWeight: 900, color: '#fbbf24', marginBottom: '4px' }}>{s.n}</div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div style={{ position: 'absolute', bottom: '32px', left: '50%', transform: 'translateX(-50%)', opacity: scrollY > 80 ? 0 : 1, transition: 'opacity 0.4s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>scroll</span>
          <div style={{ width: '1px', height: '40px', background: 'linear-gradient(to bottom,rgba(251,191,36,0.4),transparent)' }} />
        </div>
      </section>

      {/* ── DIAGNÓSTICO DEMO ──────────────────────────────── */}
      <section style={{ padding: '120px 24px', background: 'linear-gradient(180deg,#0a0a0f 0%,#0f0a02 100%)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 70% 50% at 50% 100%, rgba(202,138,4,0.08) 0%, transparent 60%)' }} />

        <div style={{ maxWidth: '1100px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: '72px' }}>
              <div style={{ display: 'inline-block', background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.15)', color: '#fbbf24', fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '6px 16px', borderRadius: '999px', marginBottom: '20px' }}>
                Como funciona
              </div>
              <h2 style={{ fontSize: 'clamp(28px,4.5vw,52px)', fontWeight: 900, color: 'white', lineHeight: 1.1, marginBottom: '16px', letterSpacing: '-0.02em' }}>
                Do diagnóstico à reunião<br />em menos de 5 minutos
              </h2>
              <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.4)', maxWidth: '480px', margin: '0 auto', lineHeight: 1.75 }}>
                IA especializada analisa sua situação jurídica e gera um score personalizado antes de qualquer reunião.
              </p>
            </div>
          </Reveal>

          {/* Steps + Mockup */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: '48px', alignItems: 'center' }}>
            {/* Steps */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { n: '01', icon: '📋', t: '7 perguntas estratégicas', d: 'Documentação, CAR, contratos, sucessão, crédito. Menos de 3 minutos.', c: '#fbbf24' },
                { n: '02', icon: '🤖', t: 'IA jurídica analisa', d: 'LLaMA 3.3 70B processa suas respostas e identifica vulnerabilidades reais.', c: '#f59e0b' },
                { n: '03', icon: '📊', t: 'Score Jurídico gerado', d: 'De 0 a 100 com nível de risco, vulnerabilidades e recomendações.', c: '#d97706' },
                { n: '04', icon: '📅', t: 'Agende com a especialista', d: 'Escolha um horário disponível. Online ou presencial. Confirmação automática.', c: '#ca8a04' },
              ].map((s, i) => (
                <Reveal key={s.n} delay={i * 80}>
                  <div style={{ display: 'flex', gap: '16px', padding: '20px 24px', borderRadius: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', alignItems: 'flex-start', transition: 'all 0.3s' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: `rgba(202,138,4,0.12)`, border: `1px solid rgba(202,138,4,0.2)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>{s.icon}</div>
                    <div>
                      <div style={{ fontSize: '10px', fontWeight: 700, color: s.c, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>Etapa {s.n}</div>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: 'white', marginBottom: '4px' }}>{s.t}</div>
                      <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.65 }}>{s.d}</div>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>

            {/* Mockup resultado */}
            <Reveal delay={200}>
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '28px', backdropFilter: 'blur(20px)' }}>
                {/* Header do card */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px', paddingBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg,#ca8a04,#fbbf24)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>⚖️</div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'white' }}>Diagnóstico ORYON Legal</div>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>Resultado personalizado por IA</div>
                  </div>
                  <div style={{ marginLeft: 'auto', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171', fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '999px' }}>ALTO RISCO</div>
                </div>

                {/* Score */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
                  <ScoreRing score={activeScore} color="#f59e0b" />
                  <div>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>Score Jurídico</div>
                    <div style={{ fontSize: '32px', fontWeight: 900, color: '#f59e0b', lineHeight: 1 }}>{activeScore}<span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.3)', fontWeight: 500 }}>/100</span></div>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>Prioridade: <span style={{ color: '#fbbf24', fontWeight: 700 }}>ALTA</span></div>
                  </div>
                </div>

                {/* Vulnerabilidades */}
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px' }}>Vulnerabilidades detectadas</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' }}>
                  {[
                    { t: '🔴', d: 'Escritura com pendências cartoriais' },
                    { t: '🟡', d: 'Planejamento sucessório inexistente' },
                    { t: '🟡', d: 'Contratos de parceria sem formalização' },
                  ].map((v, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '10px', background: v.t === '🔴' ? 'rgba(239,68,68,0.08)' : 'rgba(245,158,11,0.08)', border: `1px solid ${v.t === '🔴' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)'}`, fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>
                      <span style={{ fontSize: '14px' }}>{v.t}</span><span>{v.d}</span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <a href={AGRORATE_URL} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'block', padding: '14px', background: 'linear-gradient(135deg,#ca8a04,#fbbf24)', color: '#1c0700', fontWeight: 800, textAlign: 'center', borderRadius: '12px', textDecoration: 'none', fontSize: '14px' }}>
                  📅 Agendar com a Especialista →
                </a>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── FEATURES GRID ─────────────────────────────────── */}
      <section style={{ padding: '120px 24px', background: '#0a0a0f', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '1px', height: '120px', background: 'linear-gradient(to bottom,rgba(251,191,36,0.3),transparent)' }} />

        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: '72px' }}>
              <div style={{ display: 'inline-block', background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.15)', color: '#fbbf24', fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '6px 16px', borderRadius: '999px', marginBottom: '20px' }}>
                Funcionalidades
              </div>
              <h2 style={{ fontSize: 'clamp(26px,4vw,48px)', fontWeight: 900, color: 'white', lineHeight: 1.15, letterSpacing: '-0.02em' }}>
                Tudo que você precisa<br />em um só lugar
              </h2>
            </div>
          </Reveal>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: '16px' }}>
            {[
              { icon: '🤖', t: 'IA Jurídica Especializada', d: 'LLaMA 3.3 70B treinado em direito rural brasileiro. Análise precisa em segundos.', glow: 'rgba(202,138,4,0.2)' },
              { icon: '📊', t: 'Score Jurídico 0-100', d: 'Métrica clara do seu risco. Quanto menor o score, maior o risco identificado.', glow: 'rgba(245,158,11,0.15)' },
              { icon: '🔍', t: 'Mapeamento de Riscos', d: 'Documentação, ambiental, contratos, sucessão — tudo auditado automaticamente.', glow: 'rgba(251,191,36,0.1)' },
              { icon: '📅', t: 'Agendamento Integrado', d: 'Slots disponíveis da especialista em tempo real. Confirmação automática por e-mail.', glow: 'rgba(202,138,4,0.15)' },
              { icon: '✅', t: 'Notificações Automáticas', d: 'E-mail + Google Calendar ao confirmar reunião. Cliente e especialista sincronizados.', glow: 'rgba(245,158,11,0.12)' },
              { icon: '🔗', t: 'Integrado ao AgroRate', d: 'Seus dados de crédito rural enriquecem automaticamente o diagnóstico jurídico.', glow: 'rgba(251,191,36,0.1)' },
            ].map((f, i) => (
              <Reveal key={f.t} delay={i * 60}>
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '28px', height: '100%', position: 'relative', overflow: 'hidden', transition: 'border-color 0.3s' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: `linear-gradient(90deg,transparent,${f.glow},transparent)` }} />
                  <div style={{ fontSize: '28px', marginBottom: '16px' }}>{f.icon}</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: 'white', marginBottom: '8px' }}>{f.t}</div>
                  <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.7 }}>{f.d}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── ECOSSISTEMA ───────────────────────────────────── */}
      <section style={{ padding: '120px 24px', background: 'linear-gradient(180deg,#0a0a0f 0%,#0c0902 50%,#0a0a0f 100%)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(202,138,4,0.06) 0%, transparent 60%)' }} />

        <div style={{ maxWidth: '900px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: '72px' }}>
              <div style={{ display: 'inline-block', background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.15)', color: '#fbbf24', fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '6px 16px', borderRadius: '999px', marginBottom: '20px' }}>
                Ecossistema OryonAG
              </div>
              <h2 style={{ fontSize: 'clamp(26px,4vw,48px)', fontWeight: 900, color: 'white', lineHeight: 1.15, marginBottom: '16px', letterSpacing: '-0.02em' }}>
                Uma plataforma integrada
              </h2>
              <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.4)', maxWidth: '480px', margin: '0 auto', lineHeight: 1.75 }}>
                O ORYON Legal não é isolado. Ele conversa com toda a sua jornada no ecossistema agrícola.
              </p>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '2px', borderRadius: '24px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.07)' }}>
              {[
                { nome: 'SmartAgroOS', sub: 'Sistema da Fazenda', icon: '🌱', desc: 'Operações, talhões, AgroNav e monitoramento da propriedade em tempo real.', cor: '#16a34a', active: true },
                { nome: 'AgroRate', sub: 'Crédito Rural', icon: '📈', desc: 'Score de crédito, documentos, planner e acesso a financiamentos rurais.', cor: '#ca8a04', active: false },
                { nome: 'ORYON Legal', sub: 'Proteção Jurídica', icon: '⚖️', desc: 'Diagnóstico IA, score jurídico, agendamento e consultoria especializada.', cor: '#fbbf24', active: false },
              ].map((p, i) => (
                <div key={p.nome} style={{ background: i === 2 ? 'rgba(251,191,36,0.06)' : 'rgba(255,255,255,0.02)', padding: '32px 28px', position: 'relative', borderRight: i < 2 ? '1px solid rgba(255,255,255,0.07)' : 'none' }}>
                  {i === 2 && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg,#ca8a04,#fbbf24)' }} />}
                  <div style={{ fontSize: '28px', marginBottom: '14px' }}>{p.icon}</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: p.cor, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>{p.sub}</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: 'white', marginBottom: '10px' }}>{p.nome}</div>
                  <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.65 }}>{p.desc}</div>
                  {i === 2 && (
                    <a href={AGRORATE_URL} target="_blank" rel="noopener noreferrer"
                      style={{ display: 'inline-block', marginTop: '20px', padding: '10px 20px', background: 'linear-gradient(135deg,#ca8a04,#fbbf24)', color: '#1c0700', fontWeight: 700, fontSize: '13px', borderRadius: '10px', textDecoration: 'none' }}>
                      Acessar →
                    </a>
                  )}
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── ÁREAS DE ATUAÇÃO ──────────────────────────────── */}
      <section style={{ padding: '120px 24px', background: '#0a0a0f' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: '64px' }}>
              <div style={{ display: 'inline-block', background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.15)', color: '#fbbf24', fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '6px 16px', borderRadius: '999px', marginBottom: '20px' }}>
                Especialidades
              </div>
              <h2 style={{ fontSize: 'clamp(26px,4vw,48px)', fontWeight: 900, color: 'white', lineHeight: 1.15, letterSpacing: '-0.02em' }}>
                O que a especialista resolve
              </h2>
            </div>
          </Reveal>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '12px' }}>
            {[
              { icon: '📜', t: 'Regularização Fundiária', d: 'Escritura, registro, CCIR e georreferenciamento.' },
              { icon: '🌿', t: 'Regularização Ambiental', d: 'CAR, SICAR, reserva legal e APP.' },
              { icon: '📑', t: 'Contratos Agrícolas', d: 'Arrendamento, parceria, empreitada e prestação.' },
              { icon: '🏛️', t: 'Holding Familiar', d: 'Estruturação societária e proteção patrimonial.' },
              { icon: '👨‍👩‍👧', t: 'Planejamento Sucessório', d: 'Testamento, inventário e herança rural.' },
              { icon: '💳', t: 'Crédito Rural', d: 'DAP, pronaf, garantias e recuperação de acesso.' },
            ].map((a, i) => (
              <Reveal key={a.t} delay={i * 50}>
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '24px 20px', textAlign: 'center' }}>
                  <div style={{ fontSize: '28px', marginBottom: '12px' }}>{a.icon}</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'white', marginBottom: '6px' }}>{a.t}</div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', lineHeight: 1.65 }}>{a.d}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ─────────────────────────────────────── */}
      <section style={{ padding: '120px 24px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 80% at 50% 50%, rgba(202,138,4,0.12) 0%, transparent 60%)' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(251,191,36,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(251,191,36,0.02) 1px,transparent 1px)', backgroundSize: '48px 48px' }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '680px', margin: '0 auto', textAlign: 'center' }}>
          <Reveal>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', color: '#fbbf24', fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '8px 18px', borderRadius: '999px', marginBottom: '36px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fbbf24', display: 'inline-block', animation: 'pulse-gold 2s infinite' }} />
              Gratuito · Imediato · Personalizado
            </div>

            <h2 style={{ fontSize: 'clamp(32px,5.5vw,64px)', fontWeight: 900, color: 'white', lineHeight: 1.05, marginBottom: '20px', letterSpacing: '-0.03em' }}>
              Descubra os riscos<br />
              <span style={{ background: 'linear-gradient(135deg,#fbbf24,#f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                da sua fazenda agora.
              </span>
            </h2>

            <p style={{ fontSize: '17px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.75, marginBottom: '48px', maxWidth: '480px', margin: '0 auto 48px' }}>
              7 perguntas. IA especializada. Score jurídico personalizado. Agendamento integrado. Tudo gratuito.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
              <a href={AGRORATE_URL} target="_blank" rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', padding: '20px 48px', background: 'linear-gradient(135deg,#ca8a04,#fbbf24)', color: '#1c0700', fontWeight: 800, fontSize: '18px', borderRadius: '16px', textDecoration: 'none', boxShadow: '0 12px 48px rgba(202,138,4,0.5), 0 0 0 1px rgba(251,191,36,0.4)', letterSpacing: '-0.01em' }}>
                ⚖️ Fazer Diagnóstico Gratuito
                <svg width="18" height="18" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </a>
              <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.25)' }}>Disponível em agrorate.app · Sem cadastro para o diagnóstico</span>
            </div>
          </Reveal>
        </div>
      </section>

      <style>{`
        @keyframes pulse-gold { 0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(251,191,36,0.4)} 50%{opacity:0.7;box-shadow:0 0 0 4px rgba(251,191,36,0)} }
        * { box-sizing: border-box; }
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
      `}</style>
    </div>
  )
}

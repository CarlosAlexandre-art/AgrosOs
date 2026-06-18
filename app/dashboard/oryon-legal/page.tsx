'use client'

import { useEffect, useRef, useState } from 'react'

const AGRORATE_URL = 'https://agrorate.app/oryon-legal'

function useInView() {
  const ref = useRef<HTMLDivElement>(null)
  const [v, setV] = useState(false)
  useEffect(() => {
    const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) setV(true) }, { threshold: 0.1 })
    if (ref.current) o.observe(ref.current)
    return () => o.disconnect()
  }, [])
  return { ref, v }
}

function Fade({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const { ref, v } = useInView()
  return (
    <div ref={ref} style={{ opacity: v ? 1 : 0, transform: v ? 'none' : 'translateY(24px)', transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms` }}>
      {children}
    </div>
  )
}

export default function OryonLegalDashboardPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#0c0c12', fontFamily: 'system-ui,sans-serif', overflowX: 'hidden' }}>

      {/* Hero */}
      <div style={{ position: 'relative', padding: '64px 32px 56px', overflow: 'hidden', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 70% 80% at 50% -10%, rgba(202,138,4,0.18) 0%, transparent 60%)' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.012) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.012) 1px,transparent 1px)', backgroundSize: '48px 48px' }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '680px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', color: '#fbbf24', fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '6px 16px', borderRadius: '999px', marginBottom: '28px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fbbf24', display: 'inline-block', animation: 'pg 2s infinite' }} />
            ORYON Legal · Proteção Jurídica para o Agro
          </div>

          <h1 style={{ fontSize: 'clamp(28px,4vw,52px)', fontWeight: 900, color: 'white', lineHeight: 1.1, marginBottom: '16px', letterSpacing: '-0.025em' }}>
            Sua fazenda{' '}
            <span style={{ background: 'linear-gradient(135deg,#fbbf24,#f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              protegida.
            </span>
          </h1>

          <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.75, marginBottom: '36px', maxWidth: '480px', margin: '0 auto 36px' }}>
            Diagnóstico jurídico com IA, score de risco e consultoria com especialista — disponível na plataforma AgroRate.
          </p>

          <a href={AGRORATE_URL} target="_blank" rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '15px 32px', background: 'linear-gradient(135deg,#ca8a04,#fbbf24)', color: '#1c0700', fontWeight: 800, fontSize: '15px', borderRadius: '14px', textDecoration: 'none', boxShadow: '0 8px 32px rgba(202,138,4,0.35)' }}>
            ⚖️ Fazer Diagnóstico Gratuito
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </a>

          {/* Stats */}
          <div style={{ display: 'flex', gap: '0', justifyContent: 'center', marginTop: '32px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', overflow: 'hidden', maxWidth: '480px', margin: '32px auto 0' }}>
            {[{ n: '7', l: 'perguntas' }, { n: '3 min', l: 'diagnóstico' }, { n: 'IA', l: 'LLaMA 70B' }, { n: '100%', l: 'gratuito' }].map((s, i) => (
              <div key={i} style={{ flex: 1, padding: '16px 10px', textAlign: 'center', borderRight: i < 3 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                <div style={{ fontSize: '18px', fontWeight: 900, color: '#fbbf24' }}>{s.n}</div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginTop: '2px' }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Como funciona */}
      <div style={{ padding: '56px 32px', maxWidth: '860px', margin: '0 auto' }}>
        <Fade>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '32px', textAlign: 'center' }}>
            Passo a passo
          </div>
        </Fade>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '12px' }}>
          {[
            { n: '01', icon: '📋', t: '7 perguntas', d: 'Documentação, CAR, contratos, sucessão e crédito.' },
            { n: '02', icon: '🤖', t: 'IA analisa', d: 'LLaMA 3.3 70B identifica vulnerabilidades jurídicas.' },
            { n: '03', icon: '📊', t: 'Score Jurídico', d: '0 a 100 com nível de risco e recomendações.' },
            { n: '04', icon: '📅', t: 'Agendamento', d: 'Escolha um horário. Confirmação automática.' },
            { n: '05', icon: '✅', t: 'Reunião', d: 'E-mail + Google Calendar. Tudo sincronizado.' },
          ].map((s, i) => (
            <Fade key={s.n} delay={i * 70}>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '20px 18px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg,transparent,rgba(251,191,36,0.3),transparent)' }} />
                <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(251,191,36,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px' }}>Etapa {s.n}</div>
                <div style={{ fontSize: '22px', marginBottom: '10px' }}>{s.icon}</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'white', marginBottom: '6px' }}>{s.t}</div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.38)', lineHeight: 1.65 }}>{s.d}</div>
              </div>
            </Fade>
          ))}
        </div>
      </div>

      {/* Áreas */}
      <div style={{ padding: '0 32px 56px', maxWidth: '860px', margin: '0 auto' }}>
        <Fade>
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '28px 32px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '20px' }}>Especialidades</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: '12px' }}>
              {[
                { icon: '📜', t: 'Regularização Fundiária' },
                { icon: '🌿', t: 'Regularização Ambiental' },
                { icon: '📑', t: 'Contratos Agrícolas' },
                { icon: '🏛️', t: 'Holding Familiar' },
                { icon: '👨‍👩‍👧', t: 'Planejamento Sucessório' },
                { icon: '💳', t: 'Recuperação de Crédito' },
              ].map((a, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ fontSize: '18px' }}>{a.icon}</span>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>{a.t}</span>
                </div>
              ))}
            </div>
          </div>
        </Fade>
      </div>

      {/* CTA final */}
      <div style={{ padding: '0 32px 64px', maxWidth: '680px', margin: '0 auto', textAlign: 'center' }}>
        <Fade>
          <div style={{ background: 'rgba(202,138,4,0.06)', border: '1px solid rgba(202,138,4,0.2)', borderRadius: '24px', padding: '40px 32px' }}>
            <div style={{ fontSize: '22px', fontWeight: 900, color: 'white', marginBottom: '10px' }}>Pronto para proteger sua operação?</div>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', marginBottom: '24px', lineHeight: 1.7 }}>O diagnóstico é gratuito e leva menos de 3 minutos. Disponível na plataforma AgroRate.</p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <a href={AGRORATE_URL} target="_blank" rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '13px 28px', background: 'linear-gradient(135deg,#ca8a04,#fbbf24)', color: '#1c0700', fontWeight: 800, fontSize: '14px', borderRadius: '12px', textDecoration: 'none', boxShadow: '0 4px 20px rgba(202,138,4,0.3)' }}>
                ⚖️ Acessar ORYON Legal →
              </a>
              <a href={`${AGRORATE_URL}/minha-agenda`} target="_blank" rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '13px 22px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)', fontWeight: 600, fontSize: '14px', borderRadius: '12px', textDecoration: 'none' }}>
                📅 Minha Agenda
              </a>
              <a href="https://talitamartinsadv.com.br/" target="_blank" rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '13px 22px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(251,191,36,0.2)', color: '#fbbf24', fontWeight: 600, fontSize: '14px', borderRadius: '12px', textDecoration: 'none' }}>
                👩‍⚖️ Conhecer Profissional
              </a>
            </div>
          </div>
        </Fade>
      </div>

      <style>{`@keyframes pg{0%,100%{opacity:1}50%{opacity:0.3}} *{box-sizing:border-box}`}</style>
    </div>
  )
}

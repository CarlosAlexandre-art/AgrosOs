'use client'

import { useEffect, useRef, useState } from 'react'

const AGRORATE_URL = 'https://agrorate.app/oryon-legal'

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true) }, { threshold })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, visible }
}

function Fade({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const { ref, visible } = useInView()
  return (
    <div ref={ref} style={{ opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(28px)', transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms` }}>
      {children}
    </div>
  )
}

export default function LegalVitrinePage() {
  const [scrollY, setScrollY] = useState(0)
  useEffect(() => {
    const fn = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  const cor1 = '#ca8a04'
  const cor2 = '#fbbf24'

  return (
    <div style={{ fontFamily: 'system-ui,sans-serif', background: 'white', overflowX: 'hidden' }}>

      {/* HERO */}
      <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg,#1c0700 0%,#78350f 35%,#ca8a04 70%,#fbbf24 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        {[500, 700, 900].map((size, i) => (
          <div key={size} style={{ position: 'absolute', width: `${size}px`, height: `${size}px`, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.05)', top: '50%', left: '50%', transform: `translate(-50%,-50%) scale(${1 + scrollY * 0.0004 * (i + 1)})` }} />
        ))}

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '680px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.9)', fontSize: '12px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '8px 16px', borderRadius: '999px', marginBottom: '32px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: cor2, display: 'inline-block', animation: 'pulse 2s infinite' }} />
            ORYON Legal · Inteligência Jurídica para o Agro
          </div>

          <h1 style={{ fontSize: 'clamp(32px,6vw,60px)', fontWeight: 900, color: 'white', lineHeight: 1.1, marginBottom: '20px', letterSpacing: '-0.02em' }}>
            Sua fazenda protegida.<br /><span style={{ color: cor2 }}>Juridicamente.</span>
          </h1>

          <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.75)', lineHeight: 1.7, marginBottom: '40px', maxWidth: '520px', margin: '0 auto 40px' }}>
            Diagnóstico jurídico inteligente, score de risco e consultoria com especialista. Tudo integrado ao ecossistema OryonAG.
          </p>

          <a href={AGRORATE_URL} target="_blank" rel="noopener noreferrer"
            style={{ display: 'inline-block', padding: '18px 44px', background: 'white', color: cor1, fontWeight: 800, fontSize: '17px', borderRadius: '16px', textDecoration: 'none', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', marginBottom: '12px' }}>
            Fazer Diagnóstico Gratuito →
          </a>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginTop: '4px' }}>Disponível na plataforma AgroRate · Gratuito</p>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '24px' }}>
            {['⚖️ Diagnóstico IA', '📊 Score Jurídico', '📅 Agendamento', '✅ Confirmação automática'].map(tag => (
              <span key={tag} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.8)', fontSize: '13px', fontWeight: 600, padding: '6px 14px', borderRadius: '999px' }}>{tag}</span>
            ))}
          </div>
        </div>
      </div>

      {/* O QUE É */}
      <div style={{ background: 'white', padding: '96px 24px' }}>
        <div style={{ maxWidth: '860px', margin: '0 auto' }}>
          <Fade>
            <div style={{ textAlign: 'center', marginBottom: '64px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: cor2, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '14px' }}>O que é</div>
              <h2 style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 900, color: '#111827', lineHeight: 1.2, marginBottom: '16px' }}>Proteção jurídica<br />pensada para o produtor rural</h2>
              <p style={{ fontSize: '16px', color: '#6b7280', lineHeight: 1.8, maxWidth: '600px', margin: '0 auto' }}>
                O ORYON Legal combina inteligência artificial com assessoria jurídica especializada para identificar riscos, emitir alertas e conectar você à advogada certa.
              </p>
            </div>
          </Fade>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
            {[
              { icon: '🤖', titulo: 'IA Jurídica', desc: 'LLaMA 3.3 70B analisa sua situação e gera um score de risco personalizado em segundos.' },
              { icon: '📊', titulo: 'Score Jurídico', desc: 'De 0 a 100 — quanto mais baixo, maior o risco. Vulnerabilidades identificadas com clareza.' },
              { icon: '📅', titulo: 'Agendamento Inteligente', desc: 'Escolha um horário na agenda da especialista. Confirmação automática por e-mail.' },
              { icon: '🔔', titulo: 'Alertas Contínuos', desc: 'Notificações proativas quando surgem riscos jurídicos no seu perfil no AgroRate.' },
            ].map((c, i) => (
              <Fade key={c.titulo} delay={i * 80}>
                <div style={{ background: '#f8f9fa', borderRadius: '20px', padding: '28px', height: '100%' }}>
                  <div style={{ fontSize: '32px', marginBottom: '16px' }}>{c.icon}</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#111827', marginBottom: '8px' }}>{c.titulo}</div>
                  <div style={{ fontSize: '14px', color: '#6b7280', lineHeight: 1.7 }}>{c.desc}</div>
                </div>
              </Fade>
            ))}
          </div>
        </div>
      </div>

      {/* COMO FUNCIONA */}
      <div style={{ background: '#f8f9fa', padding: '96px 24px' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <Fade>
            <div style={{ textAlign: 'center', marginBottom: '56px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: cor2, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '14px' }}>Passo a passo</div>
              <h2 style={{ fontSize: 'clamp(26px,4vw,40px)', fontWeight: 900, color: '#111827' }}>Do diagnóstico à reunião em minutos</h2>
            </div>
          </Fade>

          {[
            { n: '01', icon: '📋', t: '7 perguntas estratégicas', d: 'Documentação, contratos, sucessão, crédito e regularidade. Menos de 3 minutos.' },
            { n: '02', icon: '🤖', t: 'IA jurídica analisa tudo', d: 'Modelo especializado gera vulnerabilidades, score e recomendações precisas.' },
            { n: '03', icon: '📊', t: 'Score Jurídico gerado', d: '0 a 100 com nível de risco e lista de pendências priorizadas.' },
            { n: '04', icon: '📅', t: 'Agende com a especialista', d: 'Escolha um horário disponível na agenda. Online ou presencial.' },
            { n: '05', icon: '✅', t: 'Reunião confirmada para os dois', d: 'Você e a advogada recebem confirmação. Link Google Calendar incluído.' },
          ].map((p, i) => (
            <Fade key={p.n} delay={i * 90}>
              <div style={{ display: 'flex', gap: '20px', marginBottom: '36px', alignItems: 'flex-start' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: `linear-gradient(135deg,${cor1},${cor2})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', flexShrink: 0, boxShadow: '0 4px 16px rgba(202,138,4,0.3)' }}>{p.icon}</div>
                <div style={{ paddingTop: '8px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: cor2, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>Etapa {p.n}</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#111827', marginBottom: '4px' }}>{p.t}</div>
                  <div style={{ fontSize: '14px', color: '#6b7280', lineHeight: 1.7 }}>{p.d}</div>
                </div>
              </div>
            </Fade>
          ))}
        </div>
      </div>

      {/* INTEGRAÇÃO ECOSSISTEMA */}
      <div style={{ background: 'white', padding: '96px 24px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <Fade>
            <div style={{ fontSize: '12px', fontWeight: 700, color: cor2, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '14px' }}>Ecossistema OryonAG</div>
            <h2 style={{ fontSize: 'clamp(26px,4vw,40px)', fontWeight: 900, color: '#111827', marginBottom: '16px' }}>Parte de um sistema completo</h2>
            <p style={{ fontSize: '16px', color: '#6b7280', lineHeight: 1.8, maxWidth: '540px', margin: '0 auto 48px' }}>
              O ORYON Legal está integrado ao AgroRate — seus dados de crédito rural alimentam o diagnóstico jurídico automaticamente.
            </p>
          </Fade>

          <Fade delay={100}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
              {[
                { nome: 'SmartAgroOS', desc: 'Sistema da fazenda', bg: '#f0fdf4', cor: '#15803d' },
                { nome: '→', desc: '', bg: 'transparent', cor: '#d1d5db' },
                { nome: 'AgroRate', desc: 'Crédito rural', bg: '#fffbeb', cor: cor1 },
                { nome: '→', desc: '', bg: 'transparent', cor: '#d1d5db' },
                { nome: 'ORYON Legal', desc: 'Proteção jurídica', bg: '#fef3c7', cor: '#92400e' },
              ].map((item, i) => item.nome === '→' ? (
                <div key={i} style={{ fontSize: '24px', color: item.cor, fontWeight: 700 }}>→</div>
              ) : (
                <div key={i} style={{ background: item.bg, borderRadius: '16px', padding: '20px 24px', textAlign: 'center' }}>
                  <div style={{ fontWeight: 800, color: item.cor, fontSize: '15px' }}>{item.nome}</div>
                  <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>{item.desc}</div>
                </div>
              ))}
            </div>
          </Fade>
        </div>
      </div>

      {/* CTA FINAL */}
      <div style={{ background: `linear-gradient(160deg,${cor1},${cor2})`, padding: '96px 24px', textAlign: 'center' }}>
        <Fade>
          <div style={{ maxWidth: '560px', margin: '0 auto' }}>
            <h2 style={{ fontSize: 'clamp(28px,5vw,44px)', fontWeight: 900, color: 'white', marginBottom: '16px', lineHeight: 1.2 }}>
              Conheça os riscos<br />da sua operação agora
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '16px', marginBottom: '40px', lineHeight: 1.7 }}>
              Diagnóstico gratuito · IA jurídica especializada · Agendamento integrado
            </p>
            <a href={AGRORATE_URL} target="_blank" rel="noopener noreferrer"
              style={{ display: 'inline-block', padding: '20px 56px', background: 'white', color: cor1, fontWeight: 800, fontSize: '18px', borderRadius: '18px', textDecoration: 'none', boxShadow: '0 8px 40px rgba(0,0,0,0.25)' }}>
              Acessar ORYON Legal →
            </a>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '13px', marginTop: '14px' }}>Disponível no AgroRate · agrorate.app</p>
          </div>
        </Fade>
      </div>

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}} *{box-sizing:border-box}`}</style>
    </div>
  )
}

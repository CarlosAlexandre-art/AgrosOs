'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

const OBJETIVOS = ['Regularização de imóvel rural', 'Contratos com prestadores', 'Proteção patrimonial', 'Planejamento sucessório', 'Holding familiar', 'Recuperação de crédito rural', 'Outro']

const SERVICOS = [
  { icon: '🏡', label: 'Regularização Rural', desc: 'Escritura, CCIR, CAR e georreferenciamento' },
  { icon: '📄', label: 'Contratos Agrícolas', desc: 'Proteção em todas as suas operações' },
  { icon: '🏛️', label: 'Holding Familiar', desc: 'Estrutura empresarial para proteger seu patrimônio' },
  { icon: '🔒', label: 'Blindagem Patrimonial', desc: 'Separação entre patrimônio pessoal e empresarial' },
  { icon: '👨‍👩‍👧', label: 'Planejamento Sucessório', desc: 'Transmissão segura para as próximas gerações' },
  { icon: '💳', label: 'Recuperação de Crédito', desc: 'Regularização para acesso a financiamentos' },
]

const ALERTAS = [
  { icon: '🏡', titulo: 'Pendências documentais', texto: 'Sua propriedade pode ter pendências que impactam financiamentos futuros.', cor: '#fef3c7', borda: '#f59e0b' },
  { icon: '📄', titulo: 'Operações sem contrato', texto: 'Detectamos operações sem proteção contratual formal.', cor: '#fef3c7', borda: '#f59e0b' },
  { icon: '💳', titulo: 'Crédito bloqueado', texto: 'Documentação irregular pode estar impedindo seu acesso a crédito rural.', cor: '#fef2f2', borda: '#ef4444' },
]

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

function AnimatedSection({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const { ref, visible } = useInView()
  return (
    <div ref={ref} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(32px)',
      transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
    }}>
      {children}
    </div>
  )
}

type Etapa = 'landing' | 'formulario'

export default function Arquitetura1Page() {
  const [etapa, setEtapa] = useState<Etapa>('landing')
  const [form, setForm] = useState({ nome: '', telefone: '', email: '', cidade: '', estado: '', objetivo: '' })
  const [enviando, setEnviando] = useState(false)
  const [scrollY, setScrollY] = useState(0)
  const router = useRouter()

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  async function enviar() {
    if (!form.nome || !form.telefone || !form.objetivo) return
    setEnviando(true)
    try {
      await fetch('/api/oryon-legal/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, origem: 'ORYON Legal — Arquitetura 01' }),
      })
    } catch {}
    router.push('/legal/arq1/obrigado')
  }

  if (etapa === 'formulario') return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa', fontFamily: 'system-ui,sans-serif' }}>
      <div style={{ background: 'linear-gradient(135deg,#15803d,#16a34a)', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button onClick={() => setEtapa('landing')} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', width: '36px', height: '36px', borderRadius: '10px', cursor: 'pointer', fontSize: '16px' }}>←</button>
        <div>
          <div style={{ color: 'white', fontWeight: 800, fontSize: '16px' }}>Solicitar Consultoria</div>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>Diagnóstico inicial gratuito</div>
        </div>
      </div>

      <div style={{ maxWidth: '520px', margin: '0 auto', padding: '32px 20px' }}>
        <div style={{ background: 'white', borderRadius: '20px', padding: '32px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {[
              { key: 'nome', label: 'Nome completo', type: 'text', placeholder: 'Seu nome completo', required: true },
              { key: 'telefone', label: 'WhatsApp', type: 'tel', placeholder: '(85) 9 0000-0000', required: true },
              { key: 'email', label: 'E-mail', type: 'email', placeholder: 'seu@email.com', required: false },
            ].map(f => (
              <div key={f.key}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>
                  {f.label} {f.required && <span style={{ color: '#ef4444' }}>*</span>}
                </label>
                <input type={f.type} value={(form as Record<string,string>)[f.key]}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  style={{ width: '100%', padding: '14px 16px', border: '1.5px solid #e5e7eb', borderRadius: '12px', fontSize: '15px', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                  onFocus={e => e.target.style.borderColor = '#15803d'}
                  onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>
            ))}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 72px', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>Cidade</label>
                <input type="text" value={form.cidade} onChange={e => setForm(p => ({ ...p, cidade: e.target.value }))} placeholder="Sua cidade"
                  style={{ width: '100%', padding: '14px 16px', border: '1.5px solid #e5e7eb', borderRadius: '12px', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => e.target.style.borderColor = '#15803d'} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>UF</label>
                <input type="text" value={form.estado} onChange={e => setForm(p => ({ ...p, estado: e.target.value }))} placeholder="CE" maxLength={2}
                  style={{ width: '100%', padding: '14px 16px', border: '1.5px solid #e5e7eb', borderRadius: '12px', fontSize: '15px', outline: 'none', boxSizing: 'border-box', textTransform: 'uppercase' }}
                  onFocus={e => e.target.style.borderColor = '#15803d'} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>
                Objetivo principal <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select value={form.objetivo} onChange={e => setForm(p => ({ ...p, objetivo: e.target.value }))}
                style={{ width: '100%', padding: '14px 16px', border: '1.5px solid #e5e7eb', borderRadius: '12px', fontSize: '15px', outline: 'none', background: 'white', boxSizing: 'border-box' }}>
                <option value="">Selecione o objetivo...</option>
                {OBJETIVOS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>

            <button onClick={enviar} disabled={enviando || !form.nome || !form.telefone || !form.objetivo}
              style={{
                padding: '16px', background: (!enviando && form.nome && form.telefone && form.objetivo) ? 'linear-gradient(135deg,#15803d,#16a34a)' : '#d1d5db',
                color: 'white', fontWeight: 800, fontSize: '16px', border: 'none', borderRadius: '14px',
                cursor: (!enviando && form.nome && form.telefone && form.objetivo) ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s', boxShadow: (!enviando && form.nome && form.telefone && form.objetivo) ? '0 4px 16px rgba(21,128,61,0.3)' : 'none',
              }}>
              {enviando ? '⏳ Enviando...' : 'Solicitar Consultoria Gratuita →'}
            </button>
            <p style={{ fontSize: '12px', color: '#9ca3af', textAlign: 'center', margin: 0 }}>Sem compromisso · Diagnóstico inicial 100% gratuito</p>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div style={{ fontFamily: 'system-ui,sans-serif', background: '#ffffff', overflowX: 'hidden' }}>

      {/* HERO */}
      <div style={{
        minHeight: '100vh', background: 'linear-gradient(160deg,#052e16 0%,#14532d 50%,#15803d 100%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '80px 24px', textAlign: 'center', position: 'relative', overflow: 'hidden',
      }}>
        {/* Círculos decorativos */}
        <div style={{ position: 'absolute', width: '500px', height: '500px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.05)', top: '50%', left: '50%', transform: `translate(-50%,-50%) scale(${1 + scrollY * 0.0005})`, transition: 'transform 0.1s' }} />
        <div style={{ position: 'absolute', width: '700px', height: '700px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.03)', top: '50%', left: '50%', transform: `translate(-50%,-50%) scale(${1 + scrollY * 0.0008})` }} />
        <div style={{ position: 'absolute', width: '900px', height: '900px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.02)', top: '50%', left: '50%', transform: `translate(-50%,-50%) scale(${1 + scrollY * 0.001})` }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '640px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
            color: 'rgba(255,255,255,0.9)', fontSize: '12px', fontWeight: 700,
            letterSpacing: '0.1em', textTransform: 'uppercase', padding: '8px 16px',
            borderRadius: '999px', marginBottom: '32px',
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80', display: 'inline-block', animation: 'pulse 2s infinite' }} />
            ORYON Legal · Arquitetura 01
          </div>

          <h1 style={{
            fontSize: 'clamp(32px,6vw,56px)', fontWeight: 900, color: 'white',
            lineHeight: 1.1, marginBottom: '20px', letterSpacing: '-0.02em',
          }}>
            Proteção Jurídica<br />
            <span style={{ color: '#4ade80' }}>para o Agro</span>
          </h1>

          <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, marginBottom: '40px', maxWidth: '480px', margin: '0 auto 40px' }}>
            Assessoria especializada em regularização rural, contratos, holding familiar e planejamento sucessório.
          </p>

          <button onClick={() => setEtapa('formulario')} style={{
            padding: '18px 40px', background: 'white', color: '#15803d',
            fontWeight: 800, fontSize: '16px', border: 'none', borderRadius: '16px',
            cursor: 'pointer', boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}
            onMouseOver={e => { (e.target as HTMLElement).style.transform = 'translateY(-2px)'; (e.target as HTMLElement).style.boxShadow = '0 12px 40px rgba(0,0,0,0.4)' }}
            onMouseOut={e => { (e.target as HTMLElement).style.transform = 'translateY(0)'; (e.target as HTMLElement).style.boxShadow = '0 8px 32px rgba(0,0,0,0.3)' }}
          >
            Solicitar Consultoria Gratuita →
          </button>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginTop: '12px' }}>Sem compromisso · Diagnóstico inicial gratuito</p>
        </div>

        {/* Scroll indicator */}
        <div style={{ position: 'absolute', bottom: '32px', left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', opacity: scrollY > 50 ? 0 : 1, transition: 'opacity 0.3s' }}>
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>scroll</span>
          <div style={{ width: '1px', height: '32px', background: 'linear-gradient(to bottom, rgba(255,255,255,0.3), transparent)', animation: 'scrollAnim 1.5s infinite' }} />
        </div>
      </div>

      {/* ALERTAS */}
      <div style={{ background: '#fffbeb', padding: '80px 24px' }}>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <AnimatedSection>
            <div style={{ textAlign: 'center', marginBottom: '48px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>⚠️ Alertas identificados</div>
              <h2 style={{ fontSize: '32px', fontWeight: 900, color: '#111827', lineHeight: 1.2 }}>Encontramos pontos de atenção<br />na sua operação</h2>
            </div>
          </AnimatedSection>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {ALERTAS.map((a, i) => (
              <AnimatedSection key={i} delay={i * 100}>
                <div style={{
                  background: 'white', borderRadius: '16px', padding: '20px 24px',
                  display: 'flex', alignItems: 'center', gap: '16px',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.06)', borderLeft: `4px solid ${a.borda}`,
                }}>
                  <span style={{ fontSize: '28px', flexShrink: 0 }}>{a.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: '#111827', fontSize: '15px', marginBottom: '2px' }}>{a.titulo}</div>
                    <div style={{ fontSize: '14px', color: '#6b7280', lineHeight: 1.5 }}>{a.texto}</div>
                  </div>
                  <button onClick={() => setEtapa('formulario')} style={{
                    padding: '10px 18px', background: '#15803d', color: 'white',
                    fontSize: '13px', fontWeight: 700, border: 'none', borderRadius: '10px',
                    cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                  }}>
                    Resolver →
                  </button>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </div>

      {/* SERVIÇOS */}
      <div style={{ background: '#f8f9fa', padding: '80px 24px' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto' }}>
          <AnimatedSection>
            <div style={{ textAlign: 'center', marginBottom: '48px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>O que resolvemos</div>
              <h2 style={{ fontSize: '32px', fontWeight: 900, color: '#111827' }}>Assessoria completa para o produtor rural</h2>
            </div>
          </AnimatedSection>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '16px' }}>
            {SERVICOS.map((s, i) => (
              <AnimatedSection key={s.label} delay={i * 80}>
                <div style={{
                  background: 'white', borderRadius: '16px', padding: '24px',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid #f3f4f6',
                  transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'default',
                }}
                  onMouseOver={e => { const el = e.currentTarget as HTMLElement; el.style.transform = 'translateY(-4px)'; el.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)' }}
                  onMouseOut={e => { const el = e.currentTarget as HTMLElement; el.style.transform = 'translateY(0)'; el.style.boxShadow = '0 2px 12px rgba(0,0,0,0.05)' }}
                >
                  <div style={{ fontSize: '32px', marginBottom: '12px' }}>{s.icon}</div>
                  <div style={{ fontWeight: 700, color: '#111827', fontSize: '15px', marginBottom: '6px' }}>{s.label}</div>
                  <div style={{ fontSize: '13px', color: '#6b7280', lineHeight: 1.5 }}>{s.desc}</div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </div>

      {/* COMO FUNCIONA */}
      <div style={{ background: 'white', padding: '80px 24px' }}>
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
          <AnimatedSection>
            <div style={{ textAlign: 'center', marginBottom: '56px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>Simples e rápido</div>
              <h2 style={{ fontSize: '32px', fontWeight: 900, color: '#111827' }}>Como funciona</h2>
            </div>
          </AnimatedSection>

          {[
            { num: '01', titulo: 'Preencha o formulário', desc: 'Nome, WhatsApp e objetivo. Leva menos de 1 minuto.', icon: '📋' },
            { num: '02', titulo: 'Especialista recebe seus dados', desc: 'Ela recebe um relatório completo com seu perfil e necessidade.', icon: '📬' },
            { num: '03', titulo: 'Contato em até 24h', desc: 'Ela entra em contato com um diagnóstico inicial gratuito e personalizado.', icon: '📞' },
            { num: '04', titulo: 'Escolha o próximo passo', desc: 'Sem pressão. Você decide se quer avançar com a assessoria.', icon: '🤝' },
          ].map((p, i) => (
            <AnimatedSection key={p.num} delay={i * 100}>
              <div style={{ display: 'flex', gap: '24px', marginBottom: '40px', alignItems: 'flex-start' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'linear-gradient(135deg,#15803d,#16a34a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0, boxShadow: '0 4px 12px rgba(21,128,61,0.25)' }}>
                  {p.icon}
                </div>
                <div style={{ paddingTop: '8px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Etapa {p.num}</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#111827', marginBottom: '6px' }}>{p.titulo}</div>
                  <div style={{ fontSize: '14px', color: '#6b7280', lineHeight: 1.6 }}>{p.desc}</div>
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>

      {/* CTA FINAL */}
      <div style={{ background: 'linear-gradient(160deg,#052e16,#15803d)', padding: '80px 24px', textAlign: 'center' }}>
        <AnimatedSection>
          <div style={{ maxWidth: '520px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '36px', fontWeight: 900, color: 'white', marginBottom: '16px', lineHeight: 1.2 }}>
              Pronto para proteger<br />seu patrimônio?
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '16px', marginBottom: '36px', lineHeight: 1.6 }}>
              Diagnóstico inicial gratuito. Nossa especialista entra em contato em até 24h.
            </p>
            <button onClick={() => setEtapa('formulario')} style={{
              padding: '18px 48px', background: 'white', color: '#15803d',
              fontWeight: 800, fontSize: '17px', border: 'none', borderRadius: '16px',
              cursor: 'pointer', boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            }}>
              Solicitar Consultoria Gratuita →
            </button>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginTop: '14px' }}>Sem compromisso · 100% gratuito</p>
          </div>
        </AnimatedSection>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes scrollAnim { 0%{opacity:1;transform:scaleY(1)} 100%{opacity:0;transform:scaleY(0.3)} }
        * { box-sizing: border-box; }
      `}</style>
    </div>
  )
}

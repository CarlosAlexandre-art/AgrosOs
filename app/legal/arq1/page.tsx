'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const ALERTAS = [
  { icon: '🏡', texto: 'Identificamos que sua propriedade pode ter pendências documentais que impactam financiamentos futuros.', cta: 'Ver diagnóstico' },
  { icon: '📄', texto: 'Você possui operações sem contratos cadastrados. Isso pode gerar riscos em caso de disputas.', cta: 'Solicitar avaliação' },
  { icon: '💳', texto: 'Produtores com documentação regularizada têm até 3x mais facilidade na aprovação de crédito rural.', cta: 'Entender melhor' },
]

const OBJETIVOS = ['Regularização de imóvel rural', 'Contratos com prestadores', 'Proteção patrimonial', 'Planejamento sucessório', 'Holding familiar', 'Recuperação de crédito rural', 'Outro']

type Etapa = 'landing' | 'formulario'

export default function Arquitetura1Page() {
  const [etapa, setEtapa] = useState<Etapa>('landing')
  const [form, setForm] = useState({ nome: '', telefone: '', email: '', cidade: '', estado: '', objetivo: '' })
  const [enviando, setEnviando] = useState(false)
  const router = useRouter()

  async function enviar() {
    if (!form.nome || !form.telefone || !form.objetivo) return
    setEnviando(true)
    try {
      await fetch('/api/oryon-legal/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, origem: 'SmartAgroOS — Arquitetura 01' }),
      })
    } catch {}
    router.push('/legal/arq1/obrigado')
  }

  if (etapa === 'formulario') return (
    <div style={{ maxWidth: '520px', margin: '0 auto', padding: '32px 20px', fontFamily: 'system-ui,sans-serif' }}>
      <button onClick={() => setEtapa('landing')} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px' }}>
        ← Voltar
      </button>
      <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '10px', padding: '12px 16px', marginBottom: '24px', fontSize: '13px', color: '#92400e', fontWeight: 600 }}>
        ⚡ Arquitetura 01 — Acesso Direto
      </div>
      <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#111827', marginBottom: '4px' }}>Solicitar Consultoria Gratuita</h2>
      <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '28px' }}>Nossa especialista entra em contato em até 24h com diagnóstico inicial.</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {[
          { key: 'nome', label: 'Nome completo', type: 'text', placeholder: 'Seu nome completo' },
          { key: 'telefone', label: 'WhatsApp', type: 'tel', placeholder: '(85) 9 0000-0000' },
          { key: 'email', label: 'E-mail', type: 'email', placeholder: 'seu@email.com' },
        ].map(f => (
          <div key={f.key}>
            <label style={{ fontSize: '11px', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>{f.label}</label>
            <input type={f.type} value={(form as Record<string, string>)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
              placeholder={f.placeholder} style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #e5e7eb', borderRadius: '10px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
          </div>
        ))}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '11px', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>Cidade</label>
            <input type="text" value={form.cidade} onChange={e => setForm(p => ({ ...p, cidade: e.target.value }))} placeholder="Sua cidade"
              style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #e5e7eb', borderRadius: '10px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ fontSize: '11px', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>UF</label>
            <input type="text" value={form.estado} onChange={e => setForm(p => ({ ...p, estado: e.target.value }))} placeholder="CE" maxLength={2}
              style={{ width: '64px', padding: '12px 14px', border: '1.5px solid #e5e7eb', borderRadius: '10px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
          </div>
        </div>

        <div>
          <label style={{ fontSize: '11px', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>Objetivo principal</label>
          <select value={form.objetivo} onChange={e => setForm(p => ({ ...p, objetivo: e.target.value }))}
            style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #e5e7eb', borderRadius: '10px', fontSize: '14px', outline: 'none', background: 'white', boxSizing: 'border-box' }}>
            <option value="">Selecione...</option>
            {OBJETIVOS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>

        <button onClick={enviar} disabled={enviando || !form.nome || !form.telefone || !form.objetivo}
          style={{ padding: '16px', background: enviando ? '#9ca3af' : 'linear-gradient(135deg,#15803d,#16a34a)', color: 'white', fontWeight: 800, fontSize: '16px', border: 'none', borderRadius: '12px', cursor: enviando ? 'not-allowed' : 'pointer', marginTop: '4px', boxShadow: '0 4px 12px rgba(21,128,61,0.3)' }}>
          {enviando ? '⏳ Enviando...' : 'Solicitar Consultoria Gratuita →'}
        </button>
        <p style={{ fontSize: '12px', color: '#9ca3af', textAlign: 'center' }}>Sem compromisso. Diagnóstico inicial 100% gratuito.</p>
      </div>
    </div>
  )

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', padding: '32px 20px', fontFamily: 'system-ui,sans-serif' }}>
      {/* Tag arquitetura */}
      <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '10px', padding: '10px 16px', marginBottom: '24px', fontSize: '13px', color: '#92400e', fontWeight: 600, display: 'inline-block' }}>
        ⚡ Testando: Arquitetura 01 — Acesso Direto
      </div>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '18px', background: 'linear-gradient(135deg,#15803d,#16a34a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', margin: '0 auto 16px', boxShadow: '0 8px 24px rgba(21,128,61,0.2)' }}>⚖️</div>
        <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#111827', marginBottom: '8px' }}>ORYON Legal</h1>
        <p style={{ color: '#6b7280', fontSize: '15px', lineHeight: 1.6 }}>Proteção Jurídica, Patrimonial e Empresarial para o Agro.<br/>Acesse diretamente nossa especialista jurídica.</p>
      </div>

      {/* Alertas contextuais (simulando detecção automática) */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ fontSize: '12px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
          ⚠️ Alertas detectados no seu perfil
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {ALERTAS.map((a, i) => (
            <div key={i} style={{ background: 'white', border: '1px solid #fde68a', borderLeft: '4px solid #f59e0b', borderRadius: '12px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '20px', flexShrink: 0 }}>{a.icon}</span>
              <span style={{ fontSize: '14px', color: '#374151', flex: 1, lineHeight: 1.5 }}>{a.texto}</span>
              <button onClick={() => setEtapa('formulario')}
                style={{ padding: '8px 14px', background: '#15803d', color: 'white', fontSize: '12px', fontWeight: 700, border: 'none', borderRadius: '8px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                {a.cta}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Serviços */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '32px' }}>
        {[['🏡','Regularização Rural'],['📄','Contratos Agrícolas'],['🏛️','Holding Familiar'],['🔒','Blindagem Patrimonial'],['👨‍👩‍👧','Planejamento Sucessório'],['💳','Recuperação de Crédito']].map(([icon, label]) => (
          <div key={label} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <span style={{ fontSize: '18px' }}>{icon}</span>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>{label}</span>
          </div>
        ))}
      </div>

      {/* CTA principal */}
      <div style={{ background: 'linear-gradient(135deg,#15803d,#16a34a)', borderRadius: '20px', padding: '28px', textAlign: 'center', boxShadow: '0 8px 24px rgba(21,128,61,0.2)' }}>
        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px', marginBottom: '8px' }}>Diagnóstico inicial gratuito · Sem compromisso</p>
        <h3 style={{ color: 'white', fontSize: '20px', fontWeight: 800, marginBottom: '20px' }}>Fale com nossa especialista jurídica</h3>
        <button onClick={() => setEtapa('formulario')}
          style={{ padding: '14px 32px', background: 'white', color: '#15803d', fontWeight: 800, fontSize: '15px', border: 'none', borderRadius: '12px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
          Solicitar Consultoria Gratuita →
        </button>
      </div>
    </div>
  )
}

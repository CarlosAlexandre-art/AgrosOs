'use client'

import { useState } from 'react'

const PERGUNTAS = [
  { id: 1, pergunta: 'Sua propriedade rural possui escritura registrada em cartório?', opcoes: ['Sim, documentação completa', 'Sim, mas com pendências', 'Não possuo escritura', 'Não sei / Preciso verificar'] },
  { id: 2, pergunta: 'Sua propriedade possui CAR (Cadastro Ambiental Rural)?', opcoes: ['Sim, regularizado', 'Em andamento', 'Não possui', 'Não sei'] },
  { id: 3, pergunta: 'Você possui CCIR (Certificado de Cadastro de Imóvel Rural) atualizado?', opcoes: ['Sim, atualizado', 'Desatualizado', 'Não possuo', 'Não sei'] },
  { id: 4, pergunta: 'Você tem contratos formais com prestadores de serviço agrícola?', opcoes: ['Sim, todos formalizados', 'Alguns formalizados', 'Nenhum formalizado', 'Não contrato prestadores'] },
  { id: 5, pergunta: 'Você possui planejamento sucessório para seus bens rurais?', opcoes: ['Sim, testamento/holding', 'Em processo', 'Não possuo', 'Nunca pensei nisso'] },
  { id: 6, pergunta: 'Já teve problema com crédito rural por falta de documentação?', opcoes: ['Nunca tive problema', 'Uma vez', 'Sim, frequentemente', 'Nunca solicitei crédito'] },
  { id: 7, pergunta: 'Você possui assessoria jurídica especializada no agro?', opcoes: ['Sim, assessoria ativa', 'Uso quando necessário', 'Não possuo', 'Nunca precisei'] },
]

type Diagnostico = { score: number; nivel: string; vulnerabilidades: { tipo: string; descricao: string }[]; recomendacao: string; prioridade: string; resumo_advogada: string }
type Etapa = 'convite' | 'dados' | 'quiz' | 'analisando' | 'resultado' | 'enviado'

export default function Arquitetura2Page() {
  const [etapa, setEtapa] = useState<Etapa>('convite')
  const [passo, setPasso] = useState(0)
  const [respostas, setRespostas] = useState<string[]>(Array(PERGUNTAS.length).fill(''))
  const [dadosUsuario, setDadosUsuario] = useState({ nome: '', telefone: '', email: '', cidade: '', estado: '' })
  const [diagnostico, setDiagnostico] = useState<Diagnostico | null>(null)

  async function analisar() {
    setEtapa('analisando')
    try {
      const payload = {
        respostas: PERGUNTAS.map((p, i) => ({ pergunta: p.pergunta, resposta: respostas[i] || 'Não respondeu' })),
        dadosUsuario,
      }
      const res = await fetch('/api/oryon-legal/diagnostico', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      setDiagnostico(data.diagnostico)
      setEtapa('resultado')
    } catch {
      setDiagnostico({ score: 45, nivel: 'ALTO', vulnerabilidades: [{ tipo: '🔴', descricao: 'Pendências identificadas' }], recomendacao: 'Consultoria jurídica recomendada', prioridade: 'ALTA', resumo_advogada: 'Cliente com pendências jurídicas.' })
      setEtapa('resultado')
    }
  }

  const scoreColor = (s: number) => s < 40 ? '#ef4444' : s < 65 ? '#f59e0b' : '#22c55e'
  const progress = ((passo + 1) / PERGUNTAS.length) * 100

  const s: Record<string, React.CSSProperties> = {
    wrap: { maxWidth: '620px', margin: '0 auto', padding: '32px 20px', fontFamily: 'system-ui,sans-serif' },
    tag: { background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '10px 16px', marginBottom: '24px', fontSize: '13px', color: '#1d4ed8', fontWeight: 600, display: 'inline-block' },
    card: { background: 'white', border: '1px solid #e5e7eb', borderRadius: '20px', padding: '32px', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' },
    btn: { padding: '14px 28px', background: 'linear-gradient(135deg,#1e3a5f,#1d4ed8)', color: 'white', fontWeight: 800, fontSize: '15px', border: 'none', borderRadius: '12px', cursor: 'pointer' },
    btnSecondary: { padding: '12px 20px', background: '#f3f4f6', color: '#374151', fontWeight: 600, border: 'none', borderRadius: '10px', cursor: 'pointer' },
    input: { width: '100%', padding: '12px 14px', border: '1.5px solid #e5e7eb', borderRadius: '10px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' as const },
    label: { fontSize: '11px', fontWeight: 700, color: '#374151', textTransform: 'uppercase' as const, letterSpacing: '0.05em', display: 'block', marginBottom: '6px' },
  }

  if (etapa === 'enviado') return (
    <div style={{ ...s.wrap, textAlign: 'center', paddingTop: '80px' }}>
      <div style={{ fontSize: '64px', marginBottom: '16px' }}>✅</div>
      <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#111827', marginBottom: '8px' }}>Diagnóstico enviado!</h2>
      <p style={{ color: '#6b7280', maxWidth: '400px', margin: '0 auto 24px', lineHeight: 1.6 }}>Nossa especialista recebeu seu diagnóstico completo e entrará em contato em até 24h.</p>
      <button onClick={() => { setEtapa('convite'); setPasso(0); setRespostas(Array(PERGUNTAS.length).fill('')); setDiagnostico(null) }} style={s.btn}>
        Refazer diagnóstico
      </button>
    </div>
  )

  if (etapa === 'analisando') return (
    <div style={{ ...s.wrap, textAlign: 'center', paddingTop: '80px' }}>
      <div style={{ fontSize: '48px', marginBottom: '16px', animation: 'spin 1s linear infinite' }}>⚖️</div>
      <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#111827', marginBottom: '8px' }}>Analisando suas respostas...</h2>
      <p style={{ color: '#6b7280' }}>A IA está gerando seu diagnóstico jurídico personalizado.</p>
      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  if (etapa === 'resultado' && diagnostico) return (
    <div style={s.wrap}>
      <div style={s.tag}>⭐ Arquitetura 02 — Resultado do Diagnóstico</div>

      {/* Score */}
      <div style={{ ...s.card, marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
          <div style={{ width: '88px', height: '88px', borderRadius: '50%', background: `conic-gradient(${scoreColor(diagnostico.score)} ${diagnostico.score * 3.6}deg, #e5e7eb 0deg)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontSize: '22px', fontWeight: 900, color: scoreColor(diagnostico.score), lineHeight: 1 }}>{diagnostico.score}</div>
              <div style={{ fontSize: '10px', color: '#9ca3af', fontWeight: 600 }}>/ 100</div>
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Diagnóstico Jurídico ORYON</div>
            <div style={{ fontSize: '20px', fontWeight: 900, color: scoreColor(diagnostico.score) }}>{diagnostico.nivel}</div>
            <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '2px' }}>Prioridade: <strong>{diagnostico.prioridade}</strong></div>
          </div>
        </div>

        <div style={{ fontSize: '12px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', marginBottom: '10px' }}>Vulnerabilidades identificadas</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
          {diagnostico.vulnerabilidades.map((v, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '10px', background: v.tipo === '🔴' ? '#fef2f2' : v.tipo === '🟡' ? '#fffbeb' : '#f0fdf4', fontSize: '14px', color: v.tipo === '🔴' ? '#991b1b' : v.tipo === '🟡' ? '#92400e' : '#166534', fontWeight: 500 }}>
              <span>{v.tipo}</span><span>{v.descricao}</span>
            </div>
          ))}
        </div>

        <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '16px', marginBottom: '20px', borderLeft: '4px solid #1d4ed8' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#1d4ed8', textTransform: 'uppercase', marginBottom: '6px' }}>Recomendação</div>
          <div style={{ fontSize: '14px', color: '#374151', lineHeight: 1.6 }}>{diagnostico.recomendacao}</div>
        </div>

        <div style={{ background: 'linear-gradient(135deg,#1e3a5f,#1d4ed8)', borderRadius: '14px', padding: '24px', textAlign: 'center' }}>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px', marginBottom: '12px' }}>Nossa especialista recebeu seu diagnóstico e está pronta para ajudar</p>
          <button onClick={() => setEtapa('enviado')} style={{ padding: '14px 32px', background: 'white', color: '#1d4ed8', fontWeight: 800, fontSize: '15px', border: 'none', borderRadius: '12px', cursor: 'pointer' }}>
            Agendar Reunião Gratuita →
          </button>
        </div>
      </div>
    </div>
  )

  if (etapa === 'dados') return (
    <div style={s.wrap}>
      <div style={s.tag}>⭐ Arquitetura 02 — Seus dados</div>
      <div style={s.card}>
        <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '4px' }}>Antes de começar</h2>
        <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '24px' }}>Precisamos de algumas informações para personalizar e enviar seu diagnóstico.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[['nome','Nome completo','text','Seu nome'],['telefone','WhatsApp','tel','(85) 9 0000-0000'],['email','E-mail','email','seu@email.com']].map(([k,l,t,p]) => (
            <div key={k}>
              <label style={s.label}>{l}</label>
              <input type={t} value={(dadosUsuario as Record<string,string>)[k]} onChange={e => setDadosUsuario(d => ({ ...d, [k]: e.target.value }))} placeholder={p} style={s.input} />
            </div>
          ))}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px' }}>
            <div>
              <label style={s.label}>Cidade</label>
              <input type="text" value={dadosUsuario.cidade} onChange={e => setDadosUsuario(d => ({ ...d, cidade: e.target.value }))} placeholder="Sua cidade" style={s.input} />
            </div>
            <div>
              <label style={s.label}>UF</label>
              <input type="text" value={dadosUsuario.estado} onChange={e => setDadosUsuario(d => ({ ...d, estado: e.target.value }))} placeholder="CE" maxLength={2} style={{ ...s.input, width: '64px' }} />
            </div>
          </div>
          <button onClick={() => { if (dadosUsuario.nome && dadosUsuario.telefone) setEtapa('quiz') }} disabled={!dadosUsuario.nome || !dadosUsuario.telefone}
            style={{ ...s.btn, opacity: dadosUsuario.nome && dadosUsuario.telefone ? 1 : 0.5 }}>
            Iniciar Diagnóstico →
          </button>
        </div>
      </div>
    </div>
  )

  if (etapa === 'quiz') {
    const q = PERGUNTAS[passo]
    const selecionado = respostas[passo]
    const todasRespondidas = respostas.every(r => r !== '')

    return (
      <div style={s.wrap}>
        <div style={s.tag}>⭐ Arquitetura 02 — Diagnóstico</div>

        {/* Progress */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '24px' }}>
          {PERGUNTAS.map((_, i) => (
            <div key={i} style={{ flex: 1, height: '4px', borderRadius: '2px', background: i < passo ? '#1d4ed8' : i === passo ? '#93c5fd' : '#e5e7eb' }} />
          ))}
        </div>
        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '20px' }}>Pergunta {passo + 1} de {PERGUNTAS.length}</div>

        <div style={s.card}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', marginBottom: '20px', lineHeight: 1.4 }}>{q.pergunta}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '28px' }}>
            {q.opcoes.map(op => (
              <button key={op} onClick={() => setRespostas(r => { const n = [...r]; n[passo] = op; return n })}
                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', border: `1.5px solid ${selecionado === op ? '#1d4ed8' : '#e5e7eb'}`, borderRadius: '12px', cursor: 'pointer', fontSize: '14px', fontWeight: selecionado === op ? 700 : 500, background: selecionado === op ? '#eff6ff' : 'white', color: selecionado === op ? '#1d4ed8' : '#374151', textAlign: 'left' }}>
                <span style={{ width: '20px', height: '20px', borderRadius: '50%', border: `2px solid ${selecionado === op ? '#1d4ed8' : '#d1d5db'}`, background: selecionado === op ? '#1d4ed8' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {selecionado === op && <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'white', display: 'block' }} />}
                </span>
                {op}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button onClick={() => passo > 0 && setPasso(p => p - 1)} disabled={passo === 0} style={{ ...s.btnSecondary, opacity: passo === 0 ? 0.4 : 1 }}>← Anterior</button>
            {passo < PERGUNTAS.length - 1
              ? <button onClick={() => selecionado && setPasso(p => p + 1)} disabled={!selecionado} style={{ ...s.btn, opacity: selecionado ? 1 : 0.5 }}>Próxima →</button>
              : <button onClick={analisar} disabled={!todasRespondidas} style={{ ...s.btn, background: 'linear-gradient(135deg,#15803d,#16a34a)', opacity: todasRespondidas ? 1 : 0.5 }}>
                  Gerar diagnóstico IA →
                </button>
            }
          </div>
        </div>
      </div>
    )
  }

  // convite
  return (
    <div style={s.wrap}>
      <div style={s.tag}>⭐ Testando: Arquitetura 02 — Diagnóstico Inteligente</div>

      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '18px', background: 'linear-gradient(135deg,#1e3a5f,#1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', margin: '0 auto 16px', boxShadow: '0 8px 24px rgba(29,78,216,0.2)' }}>⚖️</div>
        <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#111827', marginBottom: '8px' }}>ORYON Legal</h1>
        <p style={{ color: '#6b7280', fontSize: '15px', lineHeight: 1.6 }}>Diagnóstico Jurídico Inteligente integrado ao seu perfil no ecossistema OryonAG.</p>
      </div>

      {/* Convite contextual */}
      <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderLeft: '4px solid #f59e0b', borderRadius: '16px', padding: '20px 24px', marginBottom: '28px', display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
        <span style={{ fontSize: '28px', flexShrink: 0 }}>⚠️</span>
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#111827', marginBottom: '6px' }}>Detectamos possíveis oportunidades de proteção jurídica na sua operação</h3>
          <p style={{ fontSize: '14px', color: '#6b7280', lineHeight: 1.5 }}>Baseado nos seus dados no SmartAgroOS e AgroRate, identificamos pontos que podem estar expostos. Realize um diagnóstico gratuito em menos de 3 minutos.</p>
        </div>
      </div>

      {/* Como funciona */}
      <div style={{ ...s.card, marginBottom: '24px' }}>
        <div style={{ fontSize: '12px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>Como funciona</div>
        {[['📋','7 perguntas rápidas sobre sua situação jurídica'],['🤖','IA analisa e gera seu Score Jurídico personalizado'],['📊','Você recebe relatório com vulnerabilidades e recomendações'],['👩‍⚖️','Nossa especialista recebe o diagnóstico completo e entra em contato']].map(([icon, text]) => (
          <div key={text} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px', fontSize: '14px', color: '#374151' }}>
            <span style={{ fontSize: '18px', flexShrink: 0 }}>{icon}</span>
            <span>{text}</span>
          </div>
        ))}
      </div>

      <button onClick={() => setEtapa('dados')} style={{ ...s.btn, width: '100%', padding: '16px', fontSize: '16px' }}>
        Realizar Diagnóstico Jurídico Gratuito →
      </button>
      <p style={{ fontSize: '12px', color: '#9ca3af', textAlign: 'center', marginTop: '10px' }}>Sem compromisso. 100% gratuito. Leva menos de 3 minutos.</p>
    </div>
  )
}

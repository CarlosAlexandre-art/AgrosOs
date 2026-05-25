'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

// ── Tipos ──────────────────────────────────────────────────────────────────────

type RunStatus = 'RUNNING' | 'COMPLETED' | 'FAILED'

type AgentRun = {
  id: string
  status: RunStatus
  startedAt: string
  finishedAt: string | null
  resultado: string | null
  erro: string | null
}

type Agent = {
  id: string
  nome: string
  descricao: string | null
  role: string
  tipo: 'PRONTO' | 'PERSONALIZADO'
  tools: string[]
  trigger: 'CRON' | 'MANUAL' | 'EVENTO'
  ativo: boolean
  runs: AgentRun[]
}

// ── Templates pré-construídos ─────────────────────────────────────────────────

const TEMPLATES = [
  {
    nome: 'Sentinela Sanitário',
    descricao: 'Monitora saúde do rebanho, detecta anomalias e cria alertas preventivos',
    role: 'especialista em saúde e sanidade bovina',
    icon: '🛡️',
    color: 'from-emerald-500/20 to-teal-600/10',
    border: 'rgba(16,185,129,0.3)',
    glow: 'rgba(16,185,129,0.15)',
    tools: ['buscar_saude_rebanho', 'buscar_lotes_confinamento', 'criar_alerta'],
    trigger: 'CRON',
  },
  {
    nome: 'Analista Financeiro',
    descricao: 'Analisa fluxo de caixa, detecta tendências negativas e recomenda ações',
    role: 'analista financeiro agrícola especializado em pecuária de corte',
    icon: '📊',
    color: 'from-blue-500/20 to-cyan-600/10',
    border: 'rgba(59,130,246,0.3)',
    glow: 'rgba(59,130,246,0.15)',
    tools: ['buscar_dados_financeiros', 'buscar_alertas_ativos', 'criar_alerta'],
    trigger: 'CRON',
  },
  {
    nome: 'Copiloto Confinamento',
    descricao: 'Otimiza GMD, conversão alimentar e custo por arroba nos lotes',
    role: 'zootecnista especializado em confinamento bovino e nutrição animal',
    icon: '🐄',
    color: 'from-amber-500/20 to-orange-600/10',
    border: 'rgba(245,158,11,0.3)',
    glow: 'rgba(245,158,11,0.15)',
    tools: ['buscar_lotes_confinamento', 'buscar_dados_financeiros', 'criar_alerta'],
    trigger: 'CRON',
  },
  {
    nome: 'Monitor Pastagem',
    descricao: 'Controla rotação de pastagens e capacidade de suporte por UA',
    role: 'agrônomo especializado em manejo de pastagens tropicais',
    icon: '🌿',
    color: 'from-green-500/20 to-lime-600/10',
    border: 'rgba(34,197,94,0.3)',
    glow: 'rgba(34,197,94,0.15)',
    tools: ['buscar_pastagens', 'buscar_lotes_confinamento', 'criar_alerta'],
    trigger: 'CRON',
  },
  {
    nome: 'Auditor de Alertas',
    descricao: 'Revisa alertas pendentes e prioriza ações urgentes do dia',
    role: 'gestor operacional de fazenda com visão sistêmica 360°',
    icon: '🔔',
    color: 'from-purple-500/20 to-violet-600/10',
    border: 'rgba(168,85,247,0.3)',
    glow: 'rgba(168,85,247,0.15)',
    tools: ['buscar_alertas_ativos', 'buscar_atividades_pendentes', 'criar_alerta'],
    trigger: 'MANUAL',
  },
  {
    nome: 'Gestor Operacional',
    descricao: 'Acompanha atividades atrasadas e distribui tarefas prioritárias',
    role: 'gerente de operações agrícolas focado em eficiência e cumprimento de prazos',
    icon: '⚙️',
    color: 'from-slate-500/20 to-zinc-600/10',
    border: 'rgba(100,116,139,0.3)',
    glow: 'rgba(100,116,139,0.15)',
    tools: ['buscar_atividades_pendentes', 'buscar_alertas_ativos', 'criar_alerta'],
    trigger: 'MANUAL',
  },
]

const ALL_TOOLS = [
  { id: 'buscar_saude_rebanho', label: 'Saúde Rebanho', icon: '💊' },
  { id: 'buscar_dados_financeiros', label: 'Dados Financeiros', icon: '💰' },
  { id: 'buscar_alertas_ativos', label: 'Alertas Ativos', icon: '🔔' },
  { id: 'buscar_lotes_confinamento', label: 'Lotes Confinamento', icon: '🐄' },
  { id: 'buscar_pastagens', label: 'Pastagens', icon: '🌿' },
  { id: 'buscar_atividades_pendentes', label: 'Atividades', icon: '📋' },
  { id: 'criar_alerta', label: 'Criar Alertas', icon: '⚠️' },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function statusColor(s: RunStatus) {
  if (s === 'COMPLETED') return '#10b981'
  if (s === 'FAILED') return '#ef4444'
  return '#f59e0b'
}

function statusLabel(s: RunStatus) {
  if (s === 'COMPLETED') return 'Concluído'
  if (s === 'FAILED') return 'Falhou'
  return 'Executando'
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'agora'
  if (mins < 60) return `${mins}min atrás`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h atrás`
  return `${Math.floor(hrs / 24)}d atrás`
}

// ── Componentes ───────────────────────────────────────────────────────────────

function AgentCard({ agent, onRun, running, onDelete }: { agent: Agent; onRun: (id: string) => void; running: boolean; onDelete?: (id: string) => void }) {
  const lastRun = agent.runs[0]
  const tpl = TEMPLATES.find(t => t.nome === agent.nome)
  const border = tpl?.border ?? 'rgba(255,255,255,0.12)'
  const glow = tpl?.glow ?? 'rgba(255,255,255,0.05)'

  return (
    <div
      style={{
        background: `linear-gradient(135deg, rgba(15,23,42,0.95) 0%, rgba(11,22,40,0.98) 100%)`,
        border: `1px solid ${border}`,
        borderRadius: 20,
        padding: '20px',
        boxShadow: `0 0 32px ${glow}, inset 0 1px 0 rgba(255,255,255,0.05)`,
        position: 'relative',
        overflow: 'hidden',
        transition: 'transform 0.2s, box-shadow 0.2s',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'
        ;(e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 48px ${glow}, 0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)`
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'
        ;(e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 32px ${glow}, inset 0 1px 0 rgba(255,255,255,0.05)`
      }}
    >
      {/* Pulse indicator + Delete */}
      <div style={{ position: 'absolute', top: 14, right: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
        {agent.ativo && (
          <span style={{
            width: 8, height: 8, borderRadius: '50%',
            background: '#10b981', boxShadow: '0 0 8px #10b981',
            animation: 'pulse 2s infinite', display: 'inline-block',
          }} />
        )}
        {onDelete && (
          <button
            onClick={e => { e.stopPropagation(); onDelete(agent.id) }}
            title="Excluir agente"
            style={{
              width: 26, height: 26, borderRadius: 8, border: 'none', cursor: 'pointer',
              background: 'rgba(239,68,68,0.08)', color: '#f87171',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, transition: 'background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.2)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.08)')}
          >
            🗑
          </button>
        )}
      </div>

      {/* Icon + Nome */}
      <div className="flex items-start gap-3 mb-3">
        <div style={{
          width: 44, height: 44, borderRadius: 14, flexShrink: 0,
          background: `linear-gradient(135deg, ${border.replace('0.3', '0.25')}, ${border.replace('0.3', '0.08')})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20,
        }}>
          {tpl?.icon ?? '🤖'}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#f1f5f9', letterSpacing: '-0.01em' }}>
            {agent.nome}
          </div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
            {agent.tipo === 'PRONTO' ? 'Especialista pré-treinado' : 'Agente personalizado'}
          </div>
        </div>
      </div>

      {/* Descrição */}
      <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.6, marginBottom: 14, minHeight: 38 }}>
        {agent.descricao ?? agent.role}
      </p>

      {/* Tools badges */}
      <div className="flex flex-wrap gap-1 mb-4">
        {agent.tools.slice(0, 3).map(t => {
          const tool = ALL_TOOLS.find(x => x.id === t)
          return (
            <span key={t} style={{
              fontSize: 10, fontWeight: 600,
              padding: '2px 8px',
              borderRadius: 20,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#94a3b8',
            }}>
              {tool?.icon} {tool?.label ?? t}
            </span>
          )
        })}
        {agent.tools.length > 3 && (
          <span style={{
            fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: '#64748b',
          }}>
            +{agent.tools.length - 3}
          </span>
        )}
      </div>

      {/* Último run */}
      {lastRun && (
        <div style={{
          padding: '8px 12px', borderRadius: 10, marginBottom: 12,
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div className="flex items-center justify-between mb-1">
            <span style={{ fontSize: 10, color: '#475569', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Última execução</span>
            <span style={{ fontSize: 10, color: statusColor(lastRun.status), fontWeight: 700 }}>
              ● {statusLabel(lastRun.status)}
            </span>
          </div>
          <div style={{ fontSize: 11, color: '#64748b' }}>{timeAgo(lastRun.startedAt)}</div>
          {lastRun.resultado && (
            <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 4, lineHeight: 1.5 }}>
              {lastRun.resultado.slice(0, 120)}{lastRun.resultado.length > 120 ? '…' : ''}
            </p>
          )}
        </div>
      )}

      {/* Trigger info */}
      <div className="flex items-center justify-between mb-3">
        <span style={{
          fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
          background: agent.trigger === 'CRON' ? 'rgba(59,130,246,0.12)' : 'rgba(168,85,247,0.12)',
          border: `1px solid ${agent.trigger === 'CRON' ? 'rgba(59,130,246,0.25)' : 'rgba(168,85,247,0.25)'}`,
          color: agent.trigger === 'CRON' ? '#60a5fa' : '#c084fc',
        }}>
          {agent.trigger === 'CRON' ? '⏰ Automático 8h' : '▶ Manual'}
        </span>
      </div>

      {/* Botão executar */}
      <button
        onClick={() => onRun(agent.id)}
        disabled={running}
        style={{
          width: '100%', padding: '10px', borderRadius: 12, cursor: running ? 'not-allowed' : 'pointer',
          fontWeight: 700, fontSize: 13, border: 'none',
          background: running
            ? 'rgba(255,255,255,0.05)'
            : `linear-gradient(135deg, ${border.replace('0.3', '0.5')}, ${border.replace('0.3', '0.2')})`,
          color: running ? '#475569' : '#f1f5f9',
          transition: 'all 0.2s',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}
      >
        {running ? (
          <>
            <span style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid #475569', borderTopColor: '#94a3b8', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
            Executando...
          </>
        ) : (
          <>▶ Executar agora</>
        )}
      </button>
    </div>
  )
}

// ── Modal Criar Agente ────────────────────────────────────────────────────────

function CreateModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [role, setRole] = useState('')
  const [selectedTools, setSelectedTools] = useState<string[]>(['buscar_alertas_ativos', 'criar_alerta'])
  const [trigger, setTrigger] = useState<'MANUAL' | 'CRON'>('MANUAL')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  async function handleSave() {
    if (!nome.trim() || !role.trim()) { setErr('Nome e especialidade são obrigatórios.'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, descricao, role, tipo: 'PERSONALIZADO', tools: selectedTools, trigger }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Erro ao criar agente')
      onCreated()
      onClose()
    } catch (e: any) {
      setErr(e.message)
    } finally {
      setSaving(false)
    }
  }

  function toggleTool(id: string) {
    setSelectedTools(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id])
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 60, display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: 16,
      background: 'rgba(0,0,0,0.7)', overflowY: 'auto',
    }} onClick={onClose}>
      <div
        style={{
          width: '100%', maxWidth: 520, borderRadius: 24, overflow: 'hidden',
          maxHeight: '90vh', overflowY: 'auto',
          background: 'linear-gradient(180deg,#0f172a 0%,#0b1628 100%)',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(99,102,241,0.08)',
        }}>
          <div style={{ fontWeight: 800, fontSize: 16, color: '#f1f5f9' }}>Criar Agente Personalizado</div>
          <div style={{ fontSize: 11, color: '#475569', marginTop: 2, fontFamily: 'monospace' }}>LLaMA 3.3 70B · Groq · Tool Use</div>
        </div>

        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Nome */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>Nome do agente</label>
            <input
              value={nome} onChange={e => setNome(e.target.value)}
              placeholder="Ex: Analista de Milho"
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 10, fontSize: 13,
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                color: '#f1f5f9', outline: 'none',
              }}
            />
          </div>

          {/* Role */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>Especialidade / Papel</label>
            <input
              value={role} onChange={e => setRole(e.target.value)}
              placeholder="Ex: agrônomo especialista em cultivo de milho safrinha"
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 10, fontSize: 13,
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                color: '#f1f5f9', outline: 'none',
              }}
            />
          </div>

          {/* Descrição */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>Descrição (opcional)</label>
            <textarea
              value={descricao} onChange={e => setDescricao(e.target.value)}
              rows={2}
              placeholder="O que este agente monitora e faz?"
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 10, fontSize: 13, resize: 'none',
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                color: '#f1f5f9', outline: 'none',
              }}
            />
          </div>

          {/* Ferramentas */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>Ferramentas</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {ALL_TOOLS.map(t => (
                <button
                  key={t.id}
                  onClick={() => toggleTool(t.id)}
                  style={{
                    padding: '6px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                    cursor: 'pointer', transition: 'all 0.15s',
                    background: selectedTools.includes(t.id) ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.05)',
                    border: selectedTools.includes(t.id) ? '1px solid rgba(99,102,241,0.5)' : '1px solid rgba(255,255,255,0.08)',
                    color: selectedTools.includes(t.id) ? '#a5b4fc' : '#64748b',
                  }}
                >
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Trigger */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>Execução</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['MANUAL', 'CRON'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTrigger(t)}
                  style={{
                    flex: 1, padding: '8px', borderRadius: 10, fontSize: 12, fontWeight: 700,
                    cursor: 'pointer', transition: 'all 0.15s',
                    background: trigger === t ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.05)',
                    border: trigger === t ? '1px solid rgba(99,102,241,0.5)' : '1px solid rgba(255,255,255,0.08)',
                    color: trigger === t ? '#a5b4fc' : '#64748b',
                  }}
                >
                  {t === 'MANUAL' ? '▶ Manual' : '⏰ Automático (8h)'}
                </button>
              ))}
            </div>
          </div>

          {err && <p style={{ fontSize: 12, color: '#f87171', padding: '8px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>{err}</p>}

          {/* Ações */}
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button
              onClick={onClose}
              style={{
                flex: 1, padding: '11px', borderRadius: 12, fontSize: 13, fontWeight: 600,
                cursor: 'pointer', background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8',
              }}
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                flex: 1, padding: '11px', borderRadius: 12, fontSize: 13, fontWeight: 700,
                cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1,
                background: 'linear-gradient(135deg,#6366f1,#4f46e5)',
                border: 'none', color: '#fff',
              }}
            >
              {saving ? 'Criando...' : 'Criar Agente'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Modal Execução (loading + rate limit + resultado) ─────────────────────────

function ExecModal({ agent, onClose }: { agent: Agent | null; onClose: () => void }) {
  const [status, setStatus] = useState<'loading' | 'done' | 'error' | 'rate_limit'>('loading')
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(0)

  const tpl = TEMPLATES.find(t => t.nome === agent?.nome)

  const doRun = useCallback(async (a: Agent) => {
    setStatus('loading'); setResult(null); setError(null); setCountdown(0)
    try {
      const res = await fetch(`/api/agents/${a.id}/run`, { method: 'POST' })
      const data = await res.json()
      if (data.ok) { setStatus('done'); setResult(data.resultado) }
      else if (data.error === 'RATE_LIMIT') { setStatus('rate_limit'); setCountdown(data.retryAfter ?? 15) }
      else { setStatus('error'); setError(data.error ?? 'Erro na execução') }
    } catch (e: any) { setStatus('error'); setError(e.message) }
  }, [])

  useEffect(() => { if (agent) doRun(agent) }, [agent, doRun])

  useEffect(() => {
    if (countdown <= 0) {
      if (status === 'rate_limit' && agent) doRun(agent)
      return
    }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown, status, agent, doRun])

  if (!agent) return null
  const border = tpl?.border ?? 'rgba(99,102,241,0.3)'
  const glow = tpl?.glow ?? 'rgba(99,102,241,0.15)'

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(0,0,0,0.7)' }} onClick={onClose}>
      <div style={{ width: '100%', maxWidth: 520, borderRadius: 24, background: 'linear-gradient(180deg,#0f172a 0%,#0b1628 100%)', border: `1px solid ${border}`, boxShadow: `0 0 48px ${glow}, 0 24px 64px rgba(0,0,0,0.6)`, overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 14, background: `linear-gradient(135deg,${border.replace('0.3','0.25')},${border.replace('0.3','0.08')})`, border: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
            {tpl?.icon ?? '🤖'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#f1f5f9' }}>{agent.nome}</div>
            <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>
              {status === 'loading' ? 'Executando análise…' : status === 'done' ? 'Análise concluída' : status === 'rate_limit' ? 'Alta demanda — aguardando' : 'Erro na execução'}
            </div>
          </div>
          <button onClick={onClose} style={{ padding: 8, borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: 'none', cursor: 'pointer', color: '#64748b' }}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div style={{ padding: 24 }}>
          {status === 'loading' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '32px 0' }}>
              <div style={{ position: 'relative', width: 52, height: 52 }}>
                <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.04)' }} />
                <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `2px solid transparent`, borderTopColor: border.replace('0.3','0.8'), animation: 'spin 0.9s linear infinite' }} />
                <div style={{ position: 'absolute', inset: 12, borderRadius: '50%', background: glow }} />
              </div>
              <p style={{ fontSize: 13, color: '#64748b', fontFamily: 'monospace' }}>Agente coletando e analisando dados…</p>
            </div>
          )}
          {status === 'rate_limit' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '24px 0' }}>
              <div style={{ fontSize: 42 }}>⏳</div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 800, fontSize: 15, color: '#f1f5f9', marginBottom: 6 }}>Alta demanda dos agentes autônomos</div>
                <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6, marginBottom: 16 }}>Aguarde a recuperação — retentando automaticamente</p>
                <div style={{ fontSize: 48, fontWeight: 900, color: '#f59e0b', letterSpacing: '-3px', lineHeight: 1 }}>{countdown}s</div>
              </div>
            </div>
          )}
          {status === 'error' && (
            <div style={{ padding: '14px 16px', borderRadius: 12, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
              <p style={{ fontSize: 13, color: '#f87171', lineHeight: 1.6 }}>{error}</p>
            </div>
          )}
          {status === 'done' && result && (
            <div style={{ padding: '14px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', maxHeight: 320, overflowY: 'auto' }}>
              <p style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{result}</p>
            </div>
          )}
        </div>
        {(status === 'done' || status === 'error') && (
          <div style={{ padding: '0 24px 24px' }}>
            <button onClick={onClose} style={{ width: '100%', padding: '11px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', color: '#64748b', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Fechar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Modal Resultado ───────────────────────────────────────────────────────────

function ResultModal({ agent, onClose }: { agent: Agent; onClose: () => void }) {
  const lastRun = agent.runs[0]
  if (!lastRun) return null

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 60, display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: 16,
      background: 'rgba(0,0,0,0.7)',
    }} onClick={onClose}>
      <div
        style={{
          width: '100%', maxWidth: 580, maxHeight: '80vh', borderRadius: 24, overflow: 'auto',
          background: 'linear-gradient(180deg,#0f172a 0%,#0b1628 100%)',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', position: 'sticky', top: 0, background: '#0f172a' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, color: '#f1f5f9' }}>{agent.nome}</div>
              <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>Último relatório · {timeAgo(lastRun.startedAt)}</div>
            </div>
            <span style={{
              fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20,
              background: lastRun.status === 'COMPLETED' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
              border: `1px solid ${lastRun.status === 'COMPLETED' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
              color: lastRun.status === 'COMPLETED' ? '#34d399' : '#f87171',
            }}>
              {statusLabel(lastRun.status)}
            </span>
          </div>
        </div>
        <div style={{ padding: 24 }}>
          {lastRun.resultado ? (
            <div style={{
              fontSize: 13, color: '#cbd5e1', lineHeight: 1.8,
              whiteSpace: 'pre-wrap', padding: '16px', borderRadius: 12,
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
            }}>
              {lastRun.resultado}
            </div>
          ) : lastRun.erro ? (
            <div style={{
              fontSize: 13, color: '#f87171', padding: '16px', borderRadius: 12,
              background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)',
            }}>
              Erro: {lastRun.erro}
            </div>
          ) : (
            <div style={{ color: '#475569', fontSize: 13 }}>Sem resultado disponível.</div>
          )}

          <button
            onClick={onClose}
            style={{
              marginTop: 20, width: '100%', padding: '11px', borderRadius: 12, fontSize: 13,
              fontWeight: 600, cursor: 'pointer', background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8',
            }}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Página Principal ──────────────────────────────────────────────────────────

export default function EquipeIaPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState<Record<string, boolean>>({})
  const [showCreate, setShowCreate] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [execAgent, setExecAgent] = useState<Agent | null>(null)
  const [tab, setTab] = useState<'especialistas' | 'personalizados'>('especialistas')
  const [prontoError, setProntoError] = useState('')

  const fetchAgents = useCallback(async () => {
    try {
      const res = await fetch('/api/agents')
      if (res.ok) {
        const data = await res.json()
        setAgents(data.agents ?? [])
      }
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => { fetchAgents() }, [fetchAgents])

  function handleRun(agentId: string) {
    const agent = agents.find(a => a.id === agentId)
    if (!agent) return
    setRunning(r => ({ ...r, [agentId]: true }))
    setExecAgent(agent)
  }

  async function handleDelete(agentId: string) {
    if (!confirm('Excluir este agente? Esta ação não pode ser desfeita.')) return
    try {
      await fetch(`/api/agents/${agentId}`, { method: 'DELETE' })
      fetchAgents()
    } catch {}
  }

  async function criarPronto(tpl: typeof TEMPLATES[number]) {
    setProntoError('')
    try {
      const res = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: tpl.nome, descricao: tpl.descricao, role: tpl.role,
          tipo: 'PRONTO', tools: tpl.tools, trigger: tpl.trigger,
        }),
      })
      if (res.ok) {
        fetchAgents()
      } else {
        const d = await res.json()
        setProntoError(d.error ?? 'Erro ao ativar agente')
      }
    } catch (e: any) {
      setProntoError(e.message ?? 'Erro de rede')
    }
  }

  const prontos = agents.filter(a => a.tipo === 'PRONTO')
  const personalizados = agents.filter(a => a.tipo === 'PERSONALIZADO')

  const templatesPendentes = TEMPLATES.filter(t => !agents.some(a => a.nome === t.nome))

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #060d1a 0%, #080f1e 50%, #060d1a 100%)', padding: '28px 24px' }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes fade-in { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .agent-card { animation: fade-in 0.4s ease both; }
      `}</style>

      {/* Header */}
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div className="flex items-start justify-between mb-8">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
              <Link href="/dashboard/equipe" style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#94a3b8', flexShrink: 0, textDecoration: 'none',
              }}>
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div style={{
                width: 40, height: 40, borderRadius: 14,
                background: 'linear-gradient(135deg, rgba(99,102,241,0.4), rgba(79,70,229,0.2))',
                border: '1px solid rgba(99,102,241,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18,
              }}>🤖</div>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.03em' }}>
                Equipe IA
              </h1>
            </div>
            <p style={{ fontSize: 13, color: '#64748b', maxWidth: 480 }}>
              Agentes autônomos que analisam sua fazenda, executam tarefas reais e criam alertas inteligentes — rodando 24h no piloto automático.
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            style={{
              padding: '10px 20px', borderRadius: 14, fontSize: 13, fontWeight: 700,
              background: 'linear-gradient(135deg,#6366f1,#4f46e5)',
              border: 'none', color: '#fff', cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(99,102,241,0.35)',
              display: 'flex', alignItems: 'center', gap: 6,
              flexShrink: 0,
            }}
          >
            + Criar Agente
          </button>
        </div>

        {/* Stats bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 28 }}>
          {[
            { label: 'Agentes ativos', value: agents.filter(a => a.ativo).length, color: '#10b981' },
            { label: 'Execuções hoje', value: agents.reduce((s, a) => s + a.runs.filter(r => new Date(r.startedAt).toDateString() === new Date().toDateString()).length, 0), color: '#6366f1' },
            { label: 'Alertas criados', value: '—', color: '#f59e0b' },
          ].map(stat => (
            <div key={stat.label} style={{
              padding: '14px 18px', borderRadius: 16,
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: stat.color, letterSpacing: '-0.02em' }}>{stat.value}</div>
              <div style={{ fontSize: 11, color: '#475569', marginTop: 2, fontWeight: 600 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, padding: 4, borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', width: 'fit-content' }}>
          {(['especialistas', 'personalizados'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: '7px 16px', borderRadius: 10, fontSize: 12, fontWeight: 700,
                cursor: 'pointer', transition: 'all 0.2s', border: 'none',
                background: tab === t ? 'rgba(99,102,241,0.25)' : 'transparent',
                color: tab === t ? '#a5b4fc' : '#475569',
              }}
            >
              {t === 'especialistas' ? `🛡️ Especialistas (${prontos.length}/${TEMPLATES.length})` : `⚙️ Personalizados (${personalizados.length})`}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#475569', fontSize: 13 }}>Carregando agentes…</div>
        ) : tab === 'especialistas' ? (
          <div>
            {/* Agentes prontos ativos */}
            {prontos.length > 0 && (
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 16 }}>
                  ● ATIVOS — {prontos.length} agente{prontos.length !== 1 ? 's' : ''}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                  {prontos.map((agent, i) => (
                    <div key={agent.id} className="agent-card" style={{ animationDelay: `${i * 60}ms` }}
                      onClick={() => agent.runs.length > 0 ? setSelectedAgent(agent) : handleRun(agent.id)} >
                      <AgentCard agent={agent} onRun={handleRun} running={!!running[agent.id]} onDelete={handleDelete} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {prontoError && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, padding: '10px 16px', marginBottom: 16, fontSize: 12, color: '#fca5a5' }}>
                {prontoError}
              </div>
            )}

            {/* Templates disponíveis */}
            {templatesPendentes.length > 0 && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 16 }}>
                  ○ DISPONÍVEIS — {templatesPendentes.length} especialista{templatesPendentes.length !== 1 ? 's' : ''}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                  {templatesPendentes.map((tpl, i) => (
                    <div
                      key={tpl.nome}
                      className="agent-card"
                      style={{
                        animationDelay: `${i * 60}ms`,
                        padding: 20, borderRadius: 20,
                        background: 'rgba(255,255,255,0.015)',
                        border: '1px dashed rgba(255,255,255,0.07)',
                        cursor: 'pointer', transition: 'all 0.2s',
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.03)'
                        ;(e.currentTarget as HTMLDivElement).style.borderColor = tpl.border
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.015)'
                        ;(e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.07)'
                      }}
                      onClick={() => criarPronto(tpl)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                        <span style={{ fontSize: 24 }}>{tpl.icon}</span>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 13, color: '#94a3b8' }}>{tpl.nome}</div>
                          <div style={{ fontSize: 10, color: '#334155', marginTop: 1 }}>Clique para ativar</div>
                        </div>
                      </div>
                      <p style={{ fontSize: 12, color: '#475569', lineHeight: 1.6 }}>{tpl.descricao}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {prontos.length === 0 && templatesPendentes.length === 0 && (
              <div style={{ textAlign: 'center', padding: 60, color: '#334155', fontSize: 14 }}>
                Todos os especialistas estão ativos.
              </div>
            )}
          </div>
        ) : (
          <div>
            {personalizados.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: '60px 24px',
                borderRadius: 20, border: '1px dashed rgba(255,255,255,0.07)',
                background: 'rgba(255,255,255,0.01)',
              }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>⚙️</div>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#64748b', marginBottom: 6 }}>Nenhum agente personalizado</div>
                <p style={{ fontSize: 13, color: '#334155', marginBottom: 20 }}>Crie agentes com sua própria especialidade, ferramentas e comportamento.</p>
                <button
                  onClick={() => setShowCreate(true)}
                  style={{
                    padding: '10px 24px', borderRadius: 12, fontSize: 13, fontWeight: 700,
                    background: 'linear-gradient(135deg,#6366f1,#4f46e5)',
                    border: 'none', color: '#fff', cursor: 'pointer',
                  }}
                >
                  + Criar meu primeiro agente
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                {personalizados.map((agent, i) => (
                  <div key={agent.id} className="agent-card" style={{ animationDelay: `${i * 60}ms` }}
                    onClick={() => agent.runs.length > 0 ? setSelectedAgent(agent) : handleRun(agent.id)}>
                    <AgentCard agent={agent} onRun={handleRun} running={!!running[agent.id]} onDelete={handleDelete} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {showCreate && <CreateModal onClose={() => setShowCreate(false)} onCreated={fetchAgents} />}
      {selectedAgent && <ResultModal agent={selectedAgent} onClose={() => setSelectedAgent(null)} />}
      {execAgent && <ExecModal agent={execAgent} onClose={() => { setExecAgent(null); setRunning({}); fetchAgents() }} />}
    </div>
  )
}

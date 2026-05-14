'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import HowToUse from '@/components/HowToUse'

interface LoteSummary {
  id: string
  nome: string
  cabecas: number
  racaPredominante?: string
  pesoMedioEntrada: number
  objetivo: string
  status: string
  custoTotal: number
  dataEntrada: string
  dataSaidaPrevista?: string
  registrosDiarios: Array<{ pesoMedio?: number; data: string }>
  _count: { animais: number; registrosDiarios: number }
}

const OBJETIVO_LABEL: Record<string, string> = {
  ABATE: 'Abate', LEITE: 'Leite', REPRODUCAO: 'Reprodução', RECRIA: 'Recria',
}
const STATUS_COLOR: Record<string, string> = {
  ATIVO: 'text-emerald-400 bg-emerald-900/30',
  ENCERRADO: 'text-slate-400 bg-slate-800/50',
  CANCELADO: 'text-red-400 bg-red-900/30',
}

export default function ConfinamentoPage() {
  const [lotes, setLotes] = useState<LoteSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    nome: '', cabecas: '', racaPredominante: '', idadeMediaMeses: '',
    pesoMedioEntrada: '', objetivo: 'ABATE', pesoMetaAbate: '', dataSaidaPrevista: '',
  })

  const carregar = useCallback(() => {
    setLoading(true)
    fetch('/api/confinamento/lotes')
      .then(r => r.json())
      .then(d => { if (d.error) setError(d.error); else setLotes(d) })
      .catch(() => setError('Falha de conexão'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { carregar() }, [carregar])

  async function salvarLote(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/confinamento/lotes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (data.error) { alert(data.error); setSaving(false); return }
    setShowForm(false)
    setForm({ nome: '', cabecas: '', racaPredominante: '', idadeMediaMeses: '', pesoMedioEntrada: '', objetivo: 'ABATE', pesoMetaAbate: '', dataSaidaPrevista: '' })
    carregar()
    setSaving(false)
  }

  const lotesAtivos = lotes.filter(l => l.status === 'ATIVO')
  const totalCabecas = lotesAtivos.reduce((s, l) => s + l.cabecas, 0)
  const custoTotal = lotesAtivos.reduce((s, l) => s + l.custoTotal, 0)

  return (
    <div style={{ background: '#0a0e1a', minHeight: '100vh', padding: '28px 24px', color: '#f1f5f9' }}>
      <HowToUse
        storageKey="confinamento"
        title="Confinamento Inteligente"
        subtitle="Gestão de lotes com cálculo automático de GMD, custo/arroba e previsão de abate"
        theme="dark"
        accentColor="#10b981"
        steps={[
          { icon: '🐄', title: 'Criar lote', description: 'Cadastre um novo lote com raça, peso médio e objetivo (abate/leite/reprodução)' },
          { icon: '📋', title: 'Lançar diário', description: 'Registre consumo de ração, peso médio e ocorrências todos os dias' },
          { icon: '📊', title: 'Acompanhar KPIs', description: 'GMD, conversão alimentar, custo/@ e previsão de abate calculados automaticamente' },
        ]}
        tip="O benchmark de referência é Nelore em confinamento: GMD 1,2–1,5 kg/dia, CA 6–8 kg MS/kg ganho."
      />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5 }}>Confinamento Inteligente</h1>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>Gestão de lotes · KPIs zootécnicos em tempo real</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          style={{ background: '#10b981', color: '#fff', border: 'none', borderRadius: 10, padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
        >
          + Novo Lote
        </button>
      </div>

      {/* KPI strip */}
      {lotesAtivos.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Lotes ativos', valor: String(lotesAtivos.length), icon: '🐄' },
            { label: 'Cabeças em confinamento', valor: totalCabecas.toLocaleString('pt-BR'), icon: '📦' },
            { label: 'Custo total acumulado', valor: `R$${custoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`, icon: '💰' },
          ].map(k => (
            <div key={k.label} style={{ background: '#111827', border: '1px solid #1e293b', borderRadius: 12, padding: '16px 18px' }}>
              <div style={{ fontSize: 20, marginBottom: 6 }}>{k.icon}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#10b981' }}>{k.valor}</div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{k.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Conteúdo principal */}
      {loading && <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>Carregando lotes...</div>}
      {error && <div style={{ background: '#1e0a0a', border: '1px solid #7f1d1d', borderRadius: 10, padding: 16, color: '#f87171', marginBottom: 16 }}>{error}</div>}

      {!loading && !error && lotes.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#475569' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🐄</div>
          <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>Nenhum lote cadastrado</p>
          <p style={{ fontSize: 13 }}>Crie seu primeiro lote de confinamento para começar</p>
          <button onClick={() => setShowForm(true)} style={{ marginTop: 16, background: '#10b981', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 22px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Criar Primeiro Lote
          </button>
        </div>
      )}

      {/* Lista de lotes */}
      <div style={{ display: 'grid', gap: 12 }}>
        {lotes.map(lote => {
          const ultimoPeso = lote.registrosDiarios[0]?.pesoMedio
          const dias = Math.floor((Date.now() - new Date(lote.dataEntrada).getTime()) / 86_400_000)
          return (
            <Link key={lote.id} href={`/dashboard/confinamento/lotes/${lote.id}`} style={{ textDecoration: 'none' }}>
              <div style={{ background: '#111827', border: '1px solid #1e293b', borderRadius: 14, padding: '18px 20px', transition: 'border-color 0.15s', cursor: 'pointer' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#10b981')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = '#1e293b')}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 15, fontWeight: 700 }}>{lote.nome}</span>
                      <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, ...(STATUS_COLOR[lote.status] ? {} : {}), background: lote.status === 'ATIVO' ? 'rgba(16,185,129,0.15)' : 'rgba(100,116,139,0.15)', color: lote.status === 'ATIVO' ? '#10b981' : '#64748b' }}>
                        {lote.status}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>
                      {lote.racaPredominante && `${lote.racaPredominante} · `}{OBJETIVO_LABEL[lote.objetivo]} · {dias} dias
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#f1f5f9' }}>{lote.cabecas}</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>cabeças</div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  <div style={{ background: '#0f172a', borderRadius: 8, padding: '8px 10px' }}>
                    <div style={{ fontSize: 11, color: '#64748b' }}>Peso entrada</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#10b981' }}>{lote.pesoMedioEntrada} kg</div>
                  </div>
                  <div style={{ background: '#0f172a', borderRadius: 8, padding: '8px 10px' }}>
                    <div style={{ fontSize: 11, color: '#64748b' }}>Peso atual</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: ultimoPeso ? '#60a5fa' : '#64748b' }}>{ultimoPeso ? `${ultimoPeso} kg` : '—'}</div>
                  </div>
                  <div style={{ background: '#0f172a', borderRadius: 8, padding: '8px 10px' }}>
                    <div style={{ fontSize: 11, color: '#64748b' }}>Custo total</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#fbbf24' }}>R${lote.custoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</div>
                  </div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Modal novo lote */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}>
          <div style={{ background: '#111827', border: '1px solid #1e293b', borderRadius: 16, padding: 28, width: '100%', maxWidth: 520 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Novo Lote de Confinamento</h2>
            <form onSubmit={salvarLote} style={{ display: 'grid', gap: 12 }}>
              {[
                { label: 'Nome do lote *', key: 'nome', placeholder: 'Ex: Lote 01 — Nelore Maio/26' },
                { label: 'Nº de cabeças *', key: 'cabecas', placeholder: '120', type: 'number' },
                { label: 'Raça predominante', key: 'racaPredominante', placeholder: 'Nelore, Angus...' },
                { label: 'Idade média (meses)', key: 'idadeMediaMeses', placeholder: '18', type: 'number' },
                { label: 'Peso médio entrada (kg) *', key: 'pesoMedioEntrada', placeholder: '320', type: 'number' },
                { label: 'Peso meta abate (kg)', key: 'pesoMetaAbate', placeholder: '480', type: 'number' },
                { label: 'Previsão de saída', key: 'dataSaidaPrevista', type: 'date' },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ fontSize: 12, color: '#94a3b8', display: 'block', marginBottom: 4 }}>{f.label}</label>
                  <input
                    type={f.type || 'text'}
                    placeholder={f.placeholder}
                    value={form[f.key as keyof typeof form]}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    required={f.label.includes('*')}
                    style={{ width: '100%', background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, padding: '9px 12px', color: '#f1f5f9', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              ))}
              <div>
                <label style={{ fontSize: 12, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Objetivo</label>
                <select value={form.objetivo} onChange={e => setForm(p => ({ ...p, objetivo: e.target.value }))}
                  style={{ width: '100%', background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, padding: '9px 12px', color: '#f1f5f9', fontSize: 13, outline: 'none' }}>
                  {Object.entries(OBJETIVO_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button type="button" onClick={() => setShowForm(false)}
                  style={{ flex: 1, background: 'transparent', border: '1px solid #1e293b', borderRadius: 10, padding: '10px', color: '#94a3b8', fontSize: 13, cursor: 'pointer' }}>
                  Cancelar
                </button>
                <button type="submit" disabled={saving}
                  style={{ flex: 1, background: '#10b981', color: '#fff', border: 'none', borderRadius: 10, padding: '10px', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
                  {saving ? 'Salvando...' : 'Criar Lote'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

import { useState, useEffect, useCallback } from 'react'

type LoteResumo = { id: string; nome: string; especie: string; quantidadeAtual: number; faseProducao: string }
type Producao = {
  id: string; data: string; ovosColetados: number; ovosQuebrados: number | null; ovosSujos: number | null
  ovosDescartados: number | null; pesoMedioG: number | null; horasLuz: number | null; observacao: string | null
  lote: { nome: string; especie: string; quantidadeAtual: number }
}
type Kpis = { ovosHoje: number; taxaPosturaMedia: number; lotesEmPostura: number }

export default function AvesPosturaPage() {
  const [lotes, setLotes] = useState<LoteResumo[]>([])
  const [producoes, setProducoes] = useState<Producao[]>([])
  const [kpis, setKpis] = useState<Kpis | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    loteId: '', data: '', ovosColetados: '', ovosQuebrados: '', ovosSujos: '',
    ovosDescartados: '', pesoMedioG: '', horasLuz: '', observacao: '',
  })

  const carregar = useCallback(() => {
    setLoading(true)
    fetch('/api/aves-postura')
      .then(r => r.json())
      .then(d => { setLotes(d.lotes ?? []); setProducoes(d.producoes ?? []); setKpis(d.kpis ?? null) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { carregar() }, [carregar])

  async function registrar(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    await fetch('/api/aves-postura', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setSaving(false)
    setForm({ loteId: form.loteId, data: '', ovosColetados: '', ovosQuebrados: '', ovosSujos: '', ovosDescartados: '', pesoMedioG: '', horasLuz: '', observacao: '' })
    carregar()
  }

  const inputStyle: React.CSSProperties = { background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, padding: '10px 13px', color: '#f1f5f9', fontSize: 13, width: '100%', outline: 'none' }
  const labelStyle: React.CSSProperties = { fontSize: 12, color: '#64748b', fontWeight: 600, marginBottom: 4, display: 'block' }

  const taxaPostura = (p: Producao) => p.lote.quantidadeAtual > 0 ? ((p.ovosColetados / p.lote.quantidadeAtual) * 100).toFixed(1) : '—'

  return (
    <div style={{ background: '#0a0e1a', minHeight: '100vh', padding: '28px 24px', color: '#f1f5f9' }}>

      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #f59e0b, #d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🥚</div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9', lineHeight: 1 }}>AvesPostura</h1>
            <p style={{ fontSize: 13, color: '#64748b', marginTop: 3 }}>Registro diário de coleta de ovos e taxa de postura</p>
          </div>
        </div>
      </div>

      {kpis && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 28 }}>
          {[
            { label: 'Ovos Hoje', value: kpis.ovosHoje.toLocaleString('pt-BR'), sub: 'coletados', color: '#f59e0b' },
            { label: 'Taxa de Postura', value: `${kpis.taxaPosturaMedia}%`, sub: 'média últimos registros', color: '#fbbf24' },
            { label: 'Lotes em Postura', value: kpis.lotesEmPostura, sub: 'produzindo agora', color: '#d97706' },
          ].map(k => (
            <div key={k.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '18px 20px' }}>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{k.label}</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: k.color, lineHeight: 1 }}>{k.value}</div>
              <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>{k.sub}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 380px) 1fr', gap: 20, alignItems: 'flex-start' }}>
        {/* Formulário de registro diário */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 22 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, color: '#f1f5f9' }}>Registrar Postura de Hoje</h2>
          <form onSubmit={registrar} style={{ display: 'grid', gap: 12 }}>
            <div><label style={labelStyle}>Lote *</label>
              <select style={inputStyle} value={form.loteId} onChange={e => setForm(p => ({ ...p, loteId: e.target.value }))} required>
                <option value="">Selecionar lote...</option>
                {lotes.map(l => <option key={l.id} value={l.id}>{l.nome} ({l.especie})</option>)}
              </select>
            </div>
            <div><label style={labelStyle}>Data</label><input style={inputStyle} type="date" value={form.data} onChange={e => setForm(p => ({ ...p, data: e.target.value }))} /></div>
            <div><label style={labelStyle}>Ovos coletados *</label><input style={inputStyle} type="number" value={form.ovosColetados} onChange={e => setForm(p => ({ ...p, ovosColetados: e.target.value }))} placeholder="420" required /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div><label style={labelStyle}>Quebrados</label><input style={inputStyle} type="number" value={form.ovosQuebrados} onChange={e => setForm(p => ({ ...p, ovosQuebrados: e.target.value }))} /></div>
              <div><label style={labelStyle}>Sujos</label><input style={inputStyle} type="number" value={form.ovosSujos} onChange={e => setForm(p => ({ ...p, ovosSujos: e.target.value }))} /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div><label style={labelStyle}>Descartados</label><input style={inputStyle} type="number" value={form.ovosDescartados} onChange={e => setForm(p => ({ ...p, ovosDescartados: e.target.value }))} /></div>
              <div><label style={labelStyle}>Peso médio (g)</label><input style={inputStyle} type="number" step="0.1" value={form.pesoMedioG} onChange={e => setForm(p => ({ ...p, pesoMedioG: e.target.value }))} placeholder="62" /></div>
            </div>
            <div><label style={labelStyle}>Horas de luz no dia</label><input style={inputStyle} type="number" step="0.5" value={form.horasLuz} onChange={e => setForm(p => ({ ...p, horasLuz: e.target.value }))} placeholder="16" /></div>
            <div><label style={labelStyle}>Observação</label><textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 50 }} value={form.observacao} onChange={e => setForm(p => ({ ...p, observacao: e.target.value }))} /></div>
            <button type="submit" disabled={saving || !lotes.length} style={{ background: '#f59e0b', color: '#111827', border: 'none', borderRadius: 10, padding: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: saving || !lotes.length ? 0.6 : 1 }}>
              {saving ? 'Salvando...' : 'Registrar Postura'}
            </button>
            {!lotes.length && !loading && <div style={{ fontSize: 12, color: '#f87171', textAlign: 'center' }}>Cadastre um lote em AvesGestão primeiro</div>}
          </form>
        </div>

        {/* Histórico */}
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, color: '#f1f5f9' }}>Histórico de Postura</h2>
          {loading && <div style={{ height: 3, background: 'linear-gradient(90deg,#f59e0b,#d97706)', borderRadius: 2, marginBottom: 12, opacity: 0.8 }} />}
          {producoes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#475569', background: 'rgba(255,255,255,0.02)', borderRadius: 16, border: '1px dashed rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Nenhum registro ainda</div>
              <div style={{ fontSize: 13 }}>Registre a coleta de hoje ao lado</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {producoes.map(p => (
                <div key={p.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                  <div style={{ flex: '1 1 160px' }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#f1f5f9' }}>{p.lote.nome}</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>{new Date(p.data).toLocaleDateString('pt-BR')} · {p.lote.especie}</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 17, fontWeight: 800, color: '#fbbf24' }}>{p.ovosColetados}</div>
                    <div style={{ fontSize: 10, color: '#475569' }}>ovos</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 17, fontWeight: 800, color: '#f59e0b' }}>{taxaPostura(p)}%</div>
                    <div style={{ fontSize: 10, color: '#475569' }}>postura</div>
                  </div>
                  {p.pesoMedioG && (
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 17, fontWeight: 800, color: '#a78bfa' }}>{p.pesoMedioG}g</div>
                      <div style={{ fontSize: 10, color: '#475569' }}>peso médio</div>
                    </div>
                  )}
                  {(p.ovosQuebrados || p.ovosSujos) && (
                    <div style={{ fontSize: 11, color: '#64748b' }}>
                      {p.ovosQuebrados ? `${p.ovosQuebrados} quebrados` : ''}{p.ovosQuebrados && p.ovosSujos ? ' · ' : ''}{p.ovosSujos ? `${p.ovosSujos} sujos` : ''}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

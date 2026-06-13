'use client'

import { useState, useEffect, useCallback } from 'react'

type Lote = { id: string; nome: string; especie: string; quantidadeAtual: number; tanque: { nome: string } }
type Arracoamento = {
  id: string; loteId: string; data: string; tipoRacao: string | null
  quantidadeKg: number; custoKg: number | null; observacao: string | null
  lote: { nome: string; especie: string; quantidadeAtual: number }
}
type Kpis = { totalKgPeriodo: number; totalCustoPeriodo: number; kgHoje: number; totalRegistros: number }

export default function AquaNutriPage() {
  const [tab, setTab] = useState<'hoje' | 'historico' | 'analise'>('hoje')
  const [lotes, setLotes] = useState<Lote[]>([])
  const [arracoamentos, setArracoamentos] = useState<Arracoamento[]>([])
  const [kpis, setKpis] = useState<Kpis | null>(null)
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [periodo, setPeriodo] = useState('30')
  const [form, setForm] = useState({ loteId: '', tipoRacao: '', quantidadeKg: '', custoKg: '', data: new Date().toISOString().slice(0, 10), observacao: '' })

  const carregar = useCallback(() => {
    setLoading(true)
    fetch(`/api/aqua-nutri?periodo=${periodo}`)
      .then(r => r.json())
      .then(d => { setLotes(d.lotes ?? []); setArracoamentos(d.arracoamentos ?? []); setKpis(d.kpis ?? null) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [periodo])

  useEffect(() => { carregar() }, [carregar])

  async function salvar(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    await fetch('/api/aqua-nutri', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setSaving(false); setModal(false); setForm(p => ({ ...p, tipoRacao: '', quantidadeKg: '', custoKg: '', observacao: '' })); carregar()
  }

  const hoje = new Date().toISOString().slice(0, 10)
  const arracoamentosHoje = arracoamentos.filter(a => a.data.slice(0, 10) === hoje)

  const tcaPorLote = lotes.map(l => {
    const registros = arracoamentos.filter(a => a.loteId === l.id)
    const totalKg = registros.reduce((acc, r) => acc + r.quantidadeKg, 0)
    return { ...l, totalKg, tca: totalKg > 0 && l.quantidadeAtual > 0 ? totalKg / (l.quantidadeAtual * 0.3) : null }
  })

  const inputStyle: React.CSSProperties = { background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, padding: '10px 13px', color: '#f1f5f9', fontSize: 13, width: '100%', outline: 'none' }
  const labelStyle: React.CSSProperties = { fontSize: 12, color: '#64748b', fontWeight: 600, marginBottom: 4, display: 'block' }

  return (
    <div style={{ background: '#0a0e1a', minHeight: '100vh', padding: '28px 24px', color: '#f1f5f9' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #0891b2, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>
        </div>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9', lineHeight: 1 }}>AquaNutri</h1>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 3 }}>Controle de arraçoamento e Taxa de Conversão Alimentar</p>
        </div>
      </div>

      {/* KPIs */}
      {kpis && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 28 }}>
          {[
            { label: 'Ração Hoje', value: `${kpis.kgHoje.toFixed(1)} kg`, color: '#06b6d4' },
            { label: `Ração (${periodo}d)`, value: `${kpis.totalKgPeriodo.toFixed(1)} kg`, color: '#0891b2' },
            { label: `Custo (${periodo}d)`, value: `R$ ${kpis.totalCustoPeriodo.toFixed(2)}`, color: '#a78bfa' },
            { label: 'Registros', value: kpis.totalRegistros, color: '#34d399' },
          ].map(k => (
            <div key={k.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '16px 18px' }}>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{k.label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: k.color }}>{k.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs + Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {[['hoje', 'Hoje'], ['historico', 'Histórico'], ['analise', 'TCA / Análise']] .map(([k, v]) => (
          <button key={k} onClick={() => setTab(k as any)} style={{ padding: '8px 16px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: tab === k ? '#0891b2' : '#111827', color: tab === k ? '#fff' : '#64748b' }}>
            {v}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        {tab === 'historico' && (
          <select style={{ background: '#111827', border: '1px solid #1e293b', color: '#94a3b8', borderRadius: 10, padding: '8px 12px', fontSize: 13, cursor: 'pointer', outline: 'none' }} value={periodo} onChange={e => setPeriodo(e.target.value)}>
            <option value="7">7 dias</option><option value="30">30 dias</option><option value="60">60 dias</option><option value="90">90 dias</option>
          </select>
        )}
        <button onClick={() => setModal(true)} style={{ background: '#0891b2', color: '#fff', border: 'none', borderRadius: 10, padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          + Registrar Arraçoamento
        </button>
      </div>

      {loading && <div style={{ textAlign: 'center', padding: 60, color: '#475569' }}>Carregando...</div>}

      {/* Hoje */}
      {!loading && tab === 'hoje' && (
        <div>
          {arracoamentosHoje.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#475569', background: 'rgba(255,255,255,0.02)', borderRadius: 16, border: '1px dashed rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🌾</div>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Nenhum arraçoamento registrado hoje</div>
              <div style={{ fontSize: 13 }}>Registre o arraçoamento de cada lote</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {arracoamentosHoje.map(a => (
                <div key={a.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                  <div style={{ flex: '1 1 200px' }}>
                    <div style={{ fontWeight: 700, color: '#f1f5f9' }}>{a.lote.nome}</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>{a.lote.especie}{a.tipoRacao ? ` · ${a.tipoRacao}` : ''}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 20 }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 20, fontWeight: 800, color: '#06b6d4' }}>{a.quantidadeKg} kg</div>
                      <div style={{ fontSize: 11, color: '#475569' }}>ração</div>
                    </div>
                    {a.custoKg && (
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 20, fontWeight: 800, color: '#a78bfa' }}>R$ {(a.quantidadeKg * a.custoKg).toFixed(2)}</div>
                        <div style={{ fontSize: 11, color: '#475569' }}>custo</div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Histórico */}
      {!loading && tab === 'historico' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {arracoamentos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#475569' }}>Nenhum registro no período</div>
          ) : arracoamentos.map(a => (
            <div key={a.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ fontSize: 12, color: '#475569', minWidth: 90 }}>{new Date(a.data).toLocaleDateString('pt-BR')}</div>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{a.lote.nome}</span>
                {a.tipoRacao && <span style={{ fontSize: 12, color: '#64748b', marginLeft: 8 }}>{a.tipoRacao}</span>}
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#06b6d4' }}>{a.quantidadeKg} kg</div>
              {a.custoKg && <div style={{ fontSize: 13, color: '#a78bfa' }}>R$ {(a.quantidadeKg * a.custoKg).toFixed(2)}</div>}
            </div>
          ))}
        </div>
      )}

      {/* TCA Análise */}
      {!loading && tab === 'analise' && (
        <div>
          <div style={{ background: 'rgba(8,145,178,0.08)', border: '1px solid rgba(8,145,178,0.2)', borderRadius: 14, padding: 16, marginBottom: 20 }}>
            <div style={{ fontSize: 13, color: '#7dd3fc', fontWeight: 600, marginBottom: 6 }}>O que é TCA?</div>
            <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6 }}>
              A Taxa de Conversão Alimentar (TCA) indica quantos kg de ração são necessários para produzir 1 kg de peixe. Tilápia ideal: 1.3–1.7 · Tambaqui ideal: 1.5–2.0.
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
            {tcaPorLote.map(l => (
              <div key={l.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 18 }}>
                <div style={{ fontWeight: 700, color: '#f1f5f9', marginBottom: 4 }}>{l.nome}</div>
                <div style={{ fontSize: 12, color: '#64748b', marginBottom: 14 }}>{l.especie}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 11, color: '#475569', marginBottom: 4 }}>Ração total</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#06b6d4' }}>{l.totalKg.toFixed(1)} kg</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: '#475569', marginBottom: 4 }}>TCA est.</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: l.tca && l.tca > 2.5 ? '#f87171' : '#34d399' }}>
                      {l.tca ? l.tca.toFixed(2) : '—'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 20 }}>
          <div style={{ background: '#111827', border: '1px solid #1e293b', borderRadius: 18, padding: 28, width: '100%', maxWidth: 460 }}>
            <h2 style={{ fontSize: 17, fontWeight: 800, marginBottom: 20, color: '#f1f5f9' }}>Registrar Arraçoamento</h2>
            <form onSubmit={salvar} style={{ display: 'grid', gap: 14 }}>
              <div><label style={labelStyle}>Lote *</label>
                <select style={inputStyle} value={form.loteId} onChange={e => setForm(p => ({ ...p, loteId: e.target.value }))} required>
                  <option value="">Selecionar lote...</option>
                  {lotes.map(l => <option key={l.id} value={l.id}>{l.nome} ({l.especie})</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><label style={labelStyle}>Quantidade (kg) *</label><input style={inputStyle} type="number" step="0.1" value={form.quantidadeKg} onChange={e => setForm(p => ({ ...p, quantidadeKg: e.target.value }))} placeholder="50" required /></div>
                <div><label style={labelStyle}>Custo/kg (R$)</label><input style={inputStyle} type="number" step="0.01" value={form.custoKg} onChange={e => setForm(p => ({ ...p, custoKg: e.target.value }))} placeholder="3.50" /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><label style={labelStyle}>Tipo de Ração</label><input style={inputStyle} value={form.tipoRacao} onChange={e => setForm(p => ({ ...p, tipoRacao: e.target.value }))} placeholder="Extrusada 28%PB" /></div>
                <div><label style={labelStyle}>Data</label><input style={inputStyle} type="date" value={form.data} onChange={e => setForm(p => ({ ...p, data: e.target.value }))} /></div>
              </div>
              <div><label style={labelStyle}>Observação</label><input style={inputStyle} value={form.observacao} onChange={e => setForm(p => ({ ...p, observacao: e.target.value }))} /></div>
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button type="button" onClick={() => setModal(false)} style={{ flex: 1, background: 'transparent', border: '1px solid #1e293b', borderRadius: 10, padding: 11, color: '#94a3b8', fontSize: 13, cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" disabled={saving} style={{ flex: 1, background: '#0891b2', color: '#fff', border: 'none', borderRadius: 10, padding: 11, fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>{saving ? 'Salvando...' : 'Registrar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

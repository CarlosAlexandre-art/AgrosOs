'use client'

import { useState, useEffect, useCallback } from 'react'

type Lote = { id: string; nome: string; especie: string; quantidadeAtual: number; dataPovamento: string; dataDespescaPrev: string | null; tanque: { nome: string } }
type Biometria = { id: string; loteId: string; data: string; amostragem: number; pesoMedioG: number; comprimentoCm: number | null; biomasseKg: number | null; observacao: string | null; lote: { nome: string; especie: string; quantidadeAtual: number } }
type Kpis = { biomasseTotal: number; pesoMedioGeral: number; totalBiometrias: number }

export default function AquaBioPage() {
  const [tab, setTab] = useState<'biometrias' | 'curva'>('biometrias')
  const [lotes, setLotes] = useState<Lote[]>([])
  const [biometrias, setBiometrias] = useState<Biometria[]>([])
  const [kpis, setKpis] = useState<Kpis | null>(null)
  const [loteFiltro, setLoteFiltro] = useState('')
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [erro, setErro] = useState('')
  const [form, setForm] = useState({ loteId: '', amostragem: '', pesoMedioG: '', comprimentoCm: '', data: new Date().toISOString().slice(0, 10), observacao: '' })

  const carregar = useCallback(() => {
    setLoading(true)
    fetch(`/api/aqua-bio${loteFiltro ? `?loteId=${loteFiltro}` : ''}`)
      .then(r => r.json())
      .then(d => { setLotes(d.lotes ?? []); setBiometrias(d.biometrias ?? []); setKpis(d.kpis ?? null) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [loteFiltro])

  useEffect(() => { carregar() }, [carregar])

  async function salvar(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setErro('')
    try {
      const res = await fetch('/api/aqua-bio', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const data = await res.json()
      if (!res.ok || data.error) { setErro(data.error || `Erro ${res.status}`); setSaving(false); return }
      setModal(false); setForm(p => ({ ...p, amostragem: '', pesoMedioG: '', comprimentoCm: '', observacao: '' })); carregar()
    } catch (err: any) { setErro(err.message) }
    setSaving(false)
  }

  const diasProd = (data: string) => Math.floor((Date.now() - new Date(data).getTime()) / 86400000)

  const curvaData = loteFiltro
    ? biometrias.filter(b => b.loteId === loteFiltro).sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
    : []

  const maxPeso = curvaData.length > 0 ? Math.max(...curvaData.map(b => b.pesoMedioG)) : 1

  const inputStyle: React.CSSProperties = { background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, padding: '10px 13px', color: '#f1f5f9', fontSize: 13, width: '100%', outline: 'none' }
  const labelStyle: React.CSSProperties = { fontSize: 12, color: '#64748b', fontWeight: 600, marginBottom: 4, display: 'block' }

  return (
    <div style={{ background: '#0a0e1a', minHeight: '100vh', padding: '28px 24px', color: '#f1f5f9' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #7c3aed, #0891b2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>
        </div>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9', lineHeight: 1 }}>AquaBio</h1>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 3 }}>Biometrias, curva de crescimento e estimativa de biomassa</p>
        </div>
      </div>

      {erro && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, padding: '12px 16px', marginBottom: 20, color: '#f87171', fontSize: 13, fontWeight: 600 }}>{erro}</div>}

      {/* KPIs */}
      {kpis && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 28 }}>
          {[
            { label: 'Biomassa Total', value: `${kpis.biomasseTotal.toFixed(0)} kg`, color: '#34d399' },
            { label: 'Peso Médio', value: `${kpis.pesoMedioGeral.toFixed(0)} g`, color: '#a78bfa' },
            { label: 'Biometrias', value: kpis.totalBiometrias, color: '#06b6d4' },
          ].map(k => (
            <div key={k.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '16px 18px' }}>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{k.label}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: k.color }}>{k.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Lotes resumo */}
      {lotes.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10, marginBottom: 24 }}>
          {lotes.map(l => {
            const ultimaBio = biometrias.find(b => b.loteId === l.id)
            const biomasse = ultimaBio?.biomasseKg
            return (
              <div key={l.id} style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${loteFiltro === l.id ? 'rgba(139,92,246,0.4)' : 'rgba(255,255,255,0.07)'}`, borderRadius: 12, padding: '14px 16px', cursor: 'pointer', transition: 'border-color .15s' }}
                onClick={() => setLoteFiltro(loteFiltro === l.id ? '' : l.id)}>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#f1f5f9', marginBottom: 2 }}>{l.nome}</div>
                <div style={{ fontSize: 12, color: '#64748b', marginBottom: 10 }}>{l.especie} · {diasProd(l.dataPovamento)}d</div>
                <div style={{ display: 'flex', gap: 14 }}>
                  {ultimaBio && <div><div style={{ fontSize: 16, fontWeight: 800, color: '#a78bfa' }}>{ultimaBio.pesoMedioG}g</div><div style={{ fontSize: 10, color: '#475569' }}>peso atual</div></div>}
                  {biomasse && <div><div style={{ fontSize: 16, fontWeight: 800, color: '#34d399' }}>{biomasse.toFixed(0)}kg</div><div style={{ fontSize: 10, color: '#475569' }}>biomassa</div></div>}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Tabs + Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {[['biometrias', 'Biometrias'], ['curva', 'Curva de Crescimento']].map(([k, v]) => (
          <button key={k} onClick={() => setTab(k as any)} style={{ padding: '8px 16px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: tab === k ? '#7c3aed' : '#111827', color: tab === k ? '#fff' : '#64748b' }}>{v}</button>
        ))}
        <div style={{ flex: 1 }} />
        <button onClick={() => setModal(true)} style={{ background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 10, padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>+ Nova Biometria</button>
      </div>

      {loading && <div style={{ textAlign: 'center', padding: 60, color: '#475569' }}>Carregando...</div>}

      {/* Biometrias */}
      {!loading && tab === 'biometrias' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {biometrias.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#475569', background: 'rgba(255,255,255,0.02)', borderRadius: 16, border: '1px dashed rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>⚖️</div>
              <div style={{ fontWeight: 700 }}>Nenhuma biometria registrada</div>
              <div style={{ fontSize: 13, marginTop: 6 }}>Pese uma amostra dos peixes periodicamente para acompanhar o crescimento</div>
            </div>
          ) : biometrias.map(b => (
            <div key={b.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ fontSize: 12, color: '#475569', minWidth: 90 }}>{new Date(b.data).toLocaleDateString('pt-BR')}</div>
              <div style={{ flex: 1 }}>
                <span style={{ fontWeight: 700, color: '#e2e8f0', fontSize: 13 }}>{b.lote.nome}</span>
                <span style={{ fontSize: 12, color: '#64748b', marginLeft: 8 }}>· amostragem: {b.amostragem} un</span>
              </div>
              <div style={{ display: 'flex', gap: 18 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#a78bfa' }}>{b.pesoMedioG}g</div>
                  <div style={{ fontSize: 10, color: '#475569' }}>peso médio</div>
                </div>
                {b.comprimentoCm && <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#06b6d4' }}>{b.comprimentoCm}cm</div>
                  <div style={{ fontSize: 10, color: '#475569' }}>comprimento</div>
                </div>}
                {b.biomasseKg && <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#34d399' }}>{b.biomasseKg.toFixed(0)}kg</div>
                  <div style={{ fontSize: 10, color: '#475569' }}>biomassa est.</div>
                </div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Curva de Crescimento */}
      {!loading && tab === 'curva' && (
        <div>
          {!loteFiltro ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#64748b', background: 'rgba(255,255,255,0.02)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)' }}>
              Selecione um lote acima para ver a curva de crescimento
            </div>
          ) : curvaData.length < 2 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>São necessárias pelo menos 2 biometrias para traçar a curva</div>
          ) : (
            <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 16, padding: 24, border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', marginBottom: 20 }}>Curva de Crescimento — {lotes.find(l => l.id === loteFiltro)?.nome}</div>
              <div style={{ position: 'relative', height: 200 }}>
                <svg viewBox={`0 0 ${curvaData.length * 80} 200`} style={{ width: '100%', height: '100%', overflow: 'visible' }} preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="curvaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#a78bfa" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {curvaData.map((b, i) => {
                    const x = i * 80 + 40
                    const y = 180 - (b.pesoMedioG / maxPeso) * 160
                    const next = curvaData[i + 1]
                    const nx = (i + 1) * 80 + 40
                    const ny = next ? 180 - (next.pesoMedioG / maxPeso) * 160 : y
                    return (
                      <g key={b.id}>
                        {next && <line x1={x} y1={y} x2={nx} y2={ny} stroke="#a78bfa" strokeWidth="2.5" strokeLinecap="round" />}
                        <circle cx={x} cy={y} r="5" fill="#a78bfa" />
                        <text x={x} y={y - 10} textAnchor="middle" fill="#c4b5fd" fontSize="11" fontWeight="700">{b.pesoMedioG}g</text>
                        <text x={x} y="198" textAnchor="middle" fill="#475569" fontSize="10">{new Date(b.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</text>
                      </g>
                    )
                  })}
                </svg>
              </div>
              <div style={{ display: 'flex', gap: 20, marginTop: 20, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <div>
                  <div style={{ fontSize: 11, color: '#475569', marginBottom: 2 }}>Crescimento médio</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#a78bfa' }}>
                    {curvaData.length >= 2 ? `${((curvaData[curvaData.length - 1].pesoMedioG - curvaData[0].pesoMedioG) / Math.max(1, curvaData.length - 1)).toFixed(1)}g/biometria` : '—'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#475569', marginBottom: 2 }}>Peso inicial → atual</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#06b6d4' }}>{curvaData[0]?.pesoMedioG}g → {curvaData[curvaData.length - 1]?.pesoMedioG}g</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 20 }}>
          <div style={{ background: '#111827', border: '1px solid #1e293b', borderRadius: 18, padding: 28, width: '100%', maxWidth: 460 }}>
            <h2 style={{ fontSize: 17, fontWeight: 800, marginBottom: 20, color: '#f1f5f9' }}>Nova Biometria</h2>
            <form onSubmit={salvar} style={{ display: 'grid', gap: 14 }}>
              <div><label style={labelStyle}>Lote *</label>
                <select style={inputStyle} value={form.loteId} onChange={e => setForm(p => ({ ...p, loteId: e.target.value }))} required>
                  <option value="">Selecionar lote...</option>
                  {lotes.map(l => <option key={l.id} value={l.id}>{l.nome} ({l.especie})</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><label style={labelStyle}>Amostragem (un) *</label><input style={inputStyle} type="number" value={form.amostragem} onChange={e => setForm(p => ({ ...p, amostragem: e.target.value }))} placeholder="30" required /></div>
                <div><label style={labelStyle}>Peso Médio (g) *</label><input style={inputStyle} type="number" step="0.1" value={form.pesoMedioG} onChange={e => setForm(p => ({ ...p, pesoMedioG: e.target.value }))} placeholder="250" required /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><label style={labelStyle}>Comprimento (cm)</label><input style={inputStyle} type="number" step="0.1" value={form.comprimentoCm} onChange={e => setForm(p => ({ ...p, comprimentoCm: e.target.value }))} placeholder="22" /></div>
                <div><label style={labelStyle}>Data</label><input style={inputStyle} type="date" value={form.data} onChange={e => setForm(p => ({ ...p, data: e.target.value }))} /></div>
              </div>
              <div><label style={labelStyle}>Observação</label><input style={inputStyle} value={form.observacao} onChange={e => setForm(p => ({ ...p, observacao: e.target.value }))} /></div>
              {erro && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '10px 14px', color: '#f87171', fontSize: 13 }}>{erro}</div>}
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button type="button" onClick={() => setModal(false)} style={{ flex: 1, background: 'transparent', border: '1px solid #1e293b', borderRadius: 10, padding: 11, color: '#94a3b8', fontSize: 13, cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" disabled={saving} style={{ flex: 1, background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 10, padding: 11, fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>{saving ? 'Salvando...' : 'Registrar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

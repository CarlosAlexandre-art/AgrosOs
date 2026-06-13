'use client'

import { useState, useEffect, useCallback } from 'react'

type Lote = { id: string; nome: string; especie: string; quantidadeAtual: number; tanque: { nome: string } }
type Mortalidade = { id: string; loteId: string; data: string; quantidade: number; causaSuspeita: string | null; tratamento: string | null; observacao: string | null; lote: { nome: string; especie: string } }
type Tratamento = { id: string; loteId: string; data: string; medicamento: string; dosagem: string | null; carenciaDias: number | null; motivoCID: string | null; observacao: string | null; lote: { nome: string; especie: string } }
type Kpis = { totalMortalidade: number; tratamentosEmCarencia: number }

export default function AquaSaudePage() {
  const [tab, setTab] = useState<'mortalidade' | 'tratamento'>('mortalidade')
  const [lotes, setLotes] = useState<Lote[]>([])
  const [mortalidades, setMortalidades] = useState<Mortalidade[]>([])
  const [tratamentos, setTratamentos] = useState<Tratamento[]>([])
  const [kpis, setKpis] = useState<Kpis | null>(null)
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formMort, setFormMort] = useState({ loteId: '', quantidade: '', causaSuspeita: '', tratamento: '', data: new Date().toISOString().slice(0, 10), observacao: '' })
  const [formTrat, setFormTrat] = useState({ loteId: '', medicamento: '', dosagem: '', carenciaDias: '', motivoCID: '', data: new Date().toISOString().slice(0, 10), observacao: '' })

  const carregar = useCallback(() => {
    setLoading(true)
    fetch('/api/aqua-saude')
      .then(r => r.json())
      .then(d => { setLotes(d.lotes ?? []); setMortalidades(d.mortalidades ?? []); setTratamentos(d.tratamentos ?? []); setKpis(d.kpis ?? null) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { carregar() }, [carregar])

  async function salvarMort(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    await fetch('/api/aqua-saude', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'mortalidade', ...formMort }) })
    setSaving(false); setModal(false); setFormMort(p => ({ ...p, quantidade: '', causaSuspeita: '', tratamento: '', observacao: '' })); carregar()
  }

  async function salvarTrat(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    await fetch('/api/aqua-saude', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'tratamento', ...formTrat }) })
    setSaving(false); setModal(false); setFormTrat(p => ({ ...p, medicamento: '', dosagem: '', carenciaDias: '', motivoCID: '', observacao: '' })); carregar()
  }

  const fimCarencia = (data: string, dias: number) => {
    const d = new Date(data); d.setDate(d.getDate() + dias)
    const diff = Math.ceil((d.getTime() - Date.now()) / 86400000)
    return { data: d.toLocaleDateString('pt-BR'), restam: diff }
  }

  const inputStyle: React.CSSProperties = { background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, padding: '10px 13px', color: '#f1f5f9', fontSize: 13, width: '100%', outline: 'none' }
  const labelStyle: React.CSSProperties = { fontSize: 12, color: '#64748b', fontWeight: 600, marginBottom: 4, display: 'block' }

  return (
    <div style={{ background: '#0a0e1a', minHeight: '100vh', padding: '28px 24px', color: '#f1f5f9' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #ef4444, #0891b2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>
        </div>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9', lineHeight: 1 }}>AquaSaúde</h1>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 3 }}>Controle de mortalidade, tratamentos e período de carência</p>
        </div>
      </div>

      {/* KPIs */}
      {kpis && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 28 }}>
          <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 14, padding: '16px 18px' }}>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Total Mortalidade</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#f87171' }}>{kpis.totalMortalidade.toLocaleString('pt-BR')}</div>
            <div style={{ fontSize: 12, color: '#475569', marginTop: 3 }}>animais registrados</div>
          </div>
          <div style={{ background: kpis.tratamentosEmCarencia > 0 ? 'rgba(251,191,36,0.08)' : 'rgba(255,255,255,0.03)', border: `1px solid ${kpis.tratamentosEmCarencia > 0 ? 'rgba(251,191,36,0.2)' : 'rgba(255,255,255,0.07)'}`, borderRadius: 14, padding: '16px 18px' }}>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Em Carência</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: kpis.tratamentosEmCarencia > 0 ? '#fbbf24' : '#34d399' }}>{kpis.tratamentosEmCarencia}</div>
            <div style={{ fontSize: 12, color: '#475569', marginTop: 3 }}>tratamento(s) ativos</div>
          </div>
        </div>
      )}

      {/* Tabs + Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {[['mortalidade', `Mortalidade (${mortalidades.length})`], ['tratamento', `Tratamentos (${tratamentos.length})`]].map(([k, v]) => (
          <button key={k} onClick={() => setTab(k as any)} style={{ padding: '8px 16px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: tab === k ? (k === 'mortalidade' ? '#ef4444' : '#0891b2') : '#111827', color: tab === k ? '#fff' : '#64748b' }}>{v}</button>
        ))}
        <div style={{ flex: 1 }} />
        <button onClick={() => setModal(true)} style={{ background: tab === 'mortalidade' ? '#ef4444' : '#0891b2', color: '#fff', border: 'none', borderRadius: 10, padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          + {tab === 'mortalidade' ? 'Registrar Mortalidade' : 'Registrar Tratamento'}
        </button>
      </div>

      {loading && <div style={{ textAlign: 'center', padding: 60, color: '#475569' }}>Carregando...</div>}

      {/* Mortalidade */}
      {!loading && tab === 'mortalidade' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {mortalidades.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#34d399', background: 'rgba(16,185,129,0.05)', borderRadius: 16, border: '1px solid rgba(16,185,129,0.15)' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>✅</div>
              <div style={{ fontWeight: 700 }}>Nenhuma mortalidade registrada</div>
            </div>
          ) : mortalidades.map(m => (
            <div key={m.id} style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 12, padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ fontSize: 12, color: '#475569', minWidth: 90 }}>{new Date(m.data).toLocaleDateString('pt-BR')}</div>
              <div style={{ flex: 1 }}>
                <span style={{ fontWeight: 700, color: '#e2e8f0' }}>{m.lote.nome}</span>
                {m.causaSuspeita && <span style={{ fontSize: 12, color: '#64748b', marginLeft: 8 }}>· {m.causaSuspeita}</span>}
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#f87171' }}>−{m.quantidade} un</div>
            </div>
          ))}
        </div>
      )}

      {/* Tratamentos */}
      {!loading && tab === 'tratamento' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {tratamentos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#475569', background: 'rgba(255,255,255,0.02)', borderRadius: 16, border: '1px dashed rgba(255,255,255,0.08)' }}>
              <div style={{ fontWeight: 700 }}>Nenhum tratamento registrado</div>
            </div>
          ) : tratamentos.map(t => {
            const carencia = t.carenciaDias ? fimCarencia(t.data, t.carenciaDias) : null
            return (
              <div key={t.id} style={{ background: carencia && carencia.restam > 0 ? 'rgba(251,191,36,0.05)' : 'rgba(255,255,255,0.03)', border: `1px solid ${carencia && carencia.restam > 0 ? 'rgba(251,191,36,0.2)' : 'rgba(255,255,255,0.07)'}`, borderRadius: 12, padding: '14px 18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <div style={{ fontWeight: 700, color: '#f1f5f9', fontSize: 14 }}>{t.medicamento}</div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{t.lote.nome} · {new Date(t.data).toLocaleDateString('pt-BR')}{t.dosagem ? ` · ${t.dosagem}` : ''}</div>
                    {t.motivoCID && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Motivo: {t.motivoCID}</div>}
                  </div>
                  {carencia && (
                    <span style={{ fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 8, background: carencia.restam > 0 ? 'rgba(251,191,36,0.15)' : 'rgba(16,185,129,0.15)', color: carencia.restam > 0 ? '#fbbf24' : '#34d399' }}>
                      {carencia.restam > 0 ? `Carência: ${carencia.restam}d restantes` : 'Carência finalizada'}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 20 }}>
          <div style={{ background: '#111827', border: '1px solid #1e293b', borderRadius: 18, padding: 28, width: '100%', maxWidth: 460 }}>
            <h2 style={{ fontSize: 17, fontWeight: 800, marginBottom: 20, color: '#f1f5f9' }}>
              {tab === 'mortalidade' ? 'Registrar Mortalidade' : 'Registrar Tratamento'}
            </h2>
            {tab === 'mortalidade' ? (
              <form onSubmit={salvarMort} style={{ display: 'grid', gap: 14 }}>
                <div><label style={labelStyle}>Lote *</label>
                  <select style={inputStyle} value={formMort.loteId} onChange={e => setFormMort(p => ({ ...p, loteId: e.target.value }))} required>
                    <option value="">Selecionar lote...</option>
                    {lotes.map(l => <option key={l.id} value={l.id}>{l.nome} ({l.especie}) · {l.quantidadeAtual} un</option>)}
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div><label style={labelStyle}>Quantidade morta *</label><input style={inputStyle} type="number" value={formMort.quantidade} onChange={e => setFormMort(p => ({ ...p, quantidade: e.target.value }))} placeholder="10" required /></div>
                  <div><label style={labelStyle}>Data</label><input style={inputStyle} type="date" value={formMort.data} onChange={e => setFormMort(p => ({ ...p, data: e.target.value }))} /></div>
                </div>
                <div><label style={labelStyle}>Causa Suspeita</label><input style={inputStyle} value={formMort.causaSuspeita} onChange={e => setFormMort(p => ({ ...p, causaSuspeita: e.target.value }))} placeholder="Estresse, falta de OD..." /></div>
                <div><label style={labelStyle}>Tratamento adotado</label><input style={inputStyle} value={formMort.tratamento} onChange={e => setFormMort(p => ({ ...p, tratamento: e.target.value }))} /></div>
                <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                  <button type="button" onClick={() => setModal(false)} style={{ flex: 1, background: 'transparent', border: '1px solid #1e293b', borderRadius: 10, padding: 11, color: '#94a3b8', fontSize: 13, cursor: 'pointer' }}>Cancelar</button>
                  <button type="submit" disabled={saving} style={{ flex: 1, background: '#ef4444', color: '#fff', border: 'none', borderRadius: 10, padding: 11, fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>{saving ? 'Salvando...' : 'Registrar'}</button>
                </div>
              </form>
            ) : (
              <form onSubmit={salvarTrat} style={{ display: 'grid', gap: 14 }}>
                <div><label style={labelStyle}>Lote *</label>
                  <select style={inputStyle} value={formTrat.loteId} onChange={e => setFormTrat(p => ({ ...p, loteId: e.target.value }))} required>
                    <option value="">Selecionar lote...</option>
                    {lotes.map(l => <option key={l.id} value={l.id}>{l.nome} ({l.especie})</option>)}
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div><label style={labelStyle}>Medicamento *</label><input style={inputStyle} value={formTrat.medicamento} onChange={e => setFormTrat(p => ({ ...p, medicamento: e.target.value }))} placeholder="Oxitetraciclina" required /></div>
                  <div><label style={labelStyle}>Dosagem</label><input style={inputStyle} value={formTrat.dosagem} onChange={e => setFormTrat(p => ({ ...p, dosagem: e.target.value }))} placeholder="10mg/kg" /></div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div><label style={labelStyle}>Carência (dias)</label><input style={inputStyle} type="number" value={formTrat.carenciaDias} onChange={e => setFormTrat(p => ({ ...p, carenciaDias: e.target.value }))} placeholder="14" /></div>
                  <div><label style={labelStyle}>Data início</label><input style={inputStyle} type="date" value={formTrat.data} onChange={e => setFormTrat(p => ({ ...p, data: e.target.value }))} /></div>
                </div>
                <div><label style={labelStyle}>Motivo / Diagnóstico</label><input style={inputStyle} value={formTrat.motivoCID} onChange={e => setFormTrat(p => ({ ...p, motivoCID: e.target.value }))} placeholder="Columnariose, aeromoniose..." /></div>
                <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                  <button type="button" onClick={() => setModal(false)} style={{ flex: 1, background: 'transparent', border: '1px solid #1e293b', borderRadius: 10, padding: 11, color: '#94a3b8', fontSize: 13, cursor: 'pointer' }}>Cancelar</button>
                  <button type="submit" disabled={saving} style={{ flex: 1, background: '#0891b2', color: '#fff', border: 'none', borderRadius: 10, padding: 11, fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>{saving ? 'Salvando...' : 'Registrar'}</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

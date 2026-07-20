'use client'

import { useState, useEffect, useCallback } from 'react'

type Tanque = { id: string; nome: string; tipo: string }
type Registro = {
  id: string; tanqueId: string; data: string
  ph: number | null; oxigenioMgL: number | null; temperaturaC: number | null
  amoniaMgL: number | null; nitritoMgL: number | null; turbidezNTU: number | null
  alcalinidadeMgL: number | null; observacao: string | null; alertas: string | null
  tanque: { nome: string }
}
type Limites = Record<string, { min: number; max: number; label: string }>

const PARAMS = [
  { key: 'ph', label: 'pH', unit: '', ideal: '6,5–8,5', color: '#06b6d4' },
  { key: 'oxigenioMgL', label: 'OD', unit: 'mg/L', ideal: '≥5', color: '#34d399' },
  { key: 'temperaturaC', label: 'Temperatura', unit: '°C', ideal: '18–32', color: '#fbbf24' },
  { key: 'amoniaMgL', label: 'Amônia', unit: 'mg/L', ideal: '<0.5', color: '#f87171' },
  { key: 'nitritoMgL', label: 'Nitrito', unit: 'mg/L', ideal: '<0.5', color: '#f97316' },
  { key: 'turbidezNTU', label: 'Turbidez', unit: 'NTU', ideal: '20–70', color: '#a78bfa' },
]

function StatusDot({ val, limites, param }: { val: number | null; limites: Limites; param: string }) {
  if (val == null) return <span style={{ color: '#475569', fontSize: 12 }}>—</span>
  const l = limites[param]
  const ok = l ? val >= l.min && val <= l.max : true
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: ok ? '#10b981' : '#ef4444', flexShrink: 0 }} />
      <span style={{ fontWeight: 700, color: ok ? '#34d399' : '#f87171' }}>{val}</span>
    </div>
  )
}

export default function AquaQualidadePage() {
  const [tab, setTab] = useState<'registros' | 'alertas'>('registros')
  const [tanques, setTanques] = useState<Tanque[]>([])
  const [registros, setRegistros] = useState<Registro[]>([])
  const [alertasAtivos, setAlertasAtivos] = useState<string[]>([])
  const [limites, setLimites] = useState<Limites>({})
  const [tanqueFiltro, setTanqueFiltro] = useState('')
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [erro, setErro] = useState('')
  const [alertaSave, setAlertaSave] = useState<string[]>([])
  const [form, setForm] = useState({ tanqueId: '', ph: '', oxigenioMgL: '', temperaturaC: '', amoniaMgL: '', nitritoMgL: '', turbidezNTU: '', alcalinidadeMgL: '', data: new Date().toISOString().slice(0, 16), observacao: '' })

  const carregar = useCallback(() => {
    setLoading(true)
    fetch(`/api/aqua-qualidade${tanqueFiltro ? `?tanqueId=${tanqueFiltro}` : ''}`)
      .then(r => r.json())
      .then(d => { setTanques(d.tanques ?? []); setRegistros(d.registros ?? []); setAlertasAtivos(d.alertasAtivos ?? []); setLimites(d.limites ?? {}) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [tanqueFiltro])

  useEffect(() => { carregar() }, [carregar])

  async function salvar(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setErro('')
    try {
      const res = await fetch('/api/aqua-qualidade', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const data = await res.json()
      setSaving(false)
      if (!res.ok || data.error) { setErro(data.error || `Erro ${res.status}`); return }
      setAlertaSave(data.alertas ?? [])
      setTimeout(() => { setModal(false); setAlertaSave([]); carregar() }, data.alertas?.length > 0 ? 2000 : 0)
    } catch (err: any) { setErro(err.message); setSaving(false) }
  }

  const inputStyle: React.CSSProperties = { background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, padding: '10px 13px', color: '#f1f5f9', fontSize: 13, width: '100%', outline: 'none' }
  const labelStyle: React.CSSProperties = { fontSize: 12, color: '#64748b', fontWeight: 600, marginBottom: 4, display: 'block' }

  return (
    <div style={{ background: '#0a0e1a', minHeight: '100vh', padding: '28px 24px', color: '#f1f5f9' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #0891b2, #10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082" /></svg>
        </div>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9', lineHeight: 1 }}>AquaQualidade</h1>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 3 }}>Monitoramento de qualidade da água — pH, OD, temperatura e mais</p>
        </div>
      </div>

      {erro && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, padding: '12px 16px', marginBottom: 20, color: '#f87171', fontSize: 13, fontWeight: 600 }}>{erro}</div>}

      {/* Parâmetros ideais */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, marginBottom: 28 }}>
        {PARAMS.map(p => {
          const ultimo = registros[0]?.[p.key as keyof Registro] as number | null
          const l = limites[p.key]
          const ok = ultimo == null || !l || (ultimo >= l.min && ultimo <= l.max)
          return (
            <div key={p.key} style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${ok ? 'rgba(255,255,255,0.07)' : 'rgba(239,68,68,0.3)'}`, borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{p.label}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: ok ? p.color : '#f87171' }}>{ultimo != null ? `${ultimo}${p.unit ? ' ' + p.unit : ''}` : '—'}</div>
              <div style={{ fontSize: 11, color: '#475569', marginTop: 3 }}>Ideal: {p.ideal}</div>
            </div>
          )
        })}
      </div>

      {/* Tabs + Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {[['registros', 'Registros'], ['alertas', `Alertas${alertasAtivos.length > 0 ? ` (${alertasAtivos.length})` : ''}`]].map(([k, v]) => (
          <button key={k} onClick={() => setTab(k as any)} style={{ padding: '8px 16px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: tab === k ? '#0891b2' : '#111827', color: tab === k ? '#fff' : '#64748b' }}>{v}</button>
        ))}
        <div style={{ flex: 1 }} />
        <select style={{ background: '#111827', border: '1px solid #1e293b', color: '#94a3b8', borderRadius: 10, padding: '8px 12px', fontSize: 13, cursor: 'pointer', outline: 'none' }} value={tanqueFiltro} onChange={e => setTanqueFiltro(e.target.value)}>
          <option value="">Todos os tanques</option>
          {tanques.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
        </select>
        <button onClick={() => setModal(true)} style={{ background: '#0891b2', color: '#fff', border: 'none', borderRadius: 10, padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>+ Registrar</button>
      </div>

      {loading && <div style={{ textAlign: 'center', padding: 60, color: '#475569' }}>Carregando...</div>}

      {/* Registros */}
      {!loading && tab === 'registros' && (
        <div style={{ overflowX: 'auto' }}>
          {registros.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#475569', background: 'rgba(255,255,255,0.02)', borderRadius: 16, border: '1px dashed rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>💧</div>
              <div style={{ fontWeight: 700 }}>Nenhuma medição registrada</div>
              <div style={{ fontSize: 13, marginTop: 6 }}>Monitore a qualidade da água dos seus tanques</div>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  {['Data', 'Tanque', 'pH', 'OD (mg/L)', 'Temp (°C)', 'Amônia', 'Nitrito', 'Status'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: '#475569', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {registros.map(r => {
                  const alerts = r.alertas ? JSON.parse(r.alertas) as string[] : []
                  return (
                    <tr key={r.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '10px 12px', color: '#94a3b8' }}>{new Date(r.data).toLocaleDateString('pt-BR')}</td>
                      <td style={{ padding: '10px 12px', fontWeight: 600, color: '#e2e8f0' }}>{r.tanque.nome}</td>
                      <td style={{ padding: '10px 12px' }}><StatusDot val={r.ph} limites={limites} param="ph" /></td>
                      <td style={{ padding: '10px 12px' }}><StatusDot val={r.oxigenioMgL} limites={limites} param="oxigenioMgL" /></td>
                      <td style={{ padding: '10px 12px' }}><StatusDot val={r.temperaturaC} limites={limites} param="temperaturaC" /></td>
                      <td style={{ padding: '10px 12px' }}><StatusDot val={r.amoniaMgL} limites={limites} param="amoniaMgL" /></td>
                      <td style={{ padding: '10px 12px' }}><StatusDot val={r.nitritoMgL} limites={limites} param="nitritoMgL" /></td>
                      <td style={{ padding: '10px 12px' }}>
                        {alerts.length > 0 ? <span style={{ fontSize: 11, color: '#f87171', fontWeight: 700 }}>⚠ {alerts.length} alerta{alerts.length > 1 ? 's' : ''}</span> : <span style={{ fontSize: 11, color: '#34d399' }}>✓ OK</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Alertas */}
      {!loading && tab === 'alertas' && (
        <div>
          {alertasAtivos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#34d399', background: 'rgba(16,185,129,0.05)', borderRadius: 16, border: '1px solid rgba(16,185,129,0.15)' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>✅</div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>Todos os parâmetros dentro do limite</div>
              <div style={{ fontSize: 13, color: '#475569', marginTop: 6 }}>Qualidade da água excelente</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {alertasAtivos.map((a, i) => (
                <div key={i} style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#f87171" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
                  <span style={{ fontSize: 13, color: '#fca5a5' }}>{a}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 20, overflowY: 'auto' }}>
          <div style={{ background: '#111827', border: '1px solid #1e293b', borderRadius: 18, padding: 28, width: '100%', maxWidth: 520, margin: 'auto' }}>
            <h2 style={{ fontSize: 17, fontWeight: 800, marginBottom: 6, color: '#f1f5f9' }}>Registrar Qualidade da Água</h2>
            <p style={{ fontSize: 12, color: '#64748b', marginBottom: 20 }}>Preencha os parâmetros disponíveis — campos em branco são ignorados</p>
            {erro && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '10px 14px', marginBottom: 12, color: '#f87171', fontSize: 13 }}>{erro}</div>}
            {alertaSave.length > 0 && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10, padding: '10px 14px', marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: '#f87171', fontWeight: 700, marginBottom: 4 }}>⚠ Alertas detectados:</div>
                {alertaSave.map((a, i) => <div key={i} style={{ fontSize: 12, color: '#fca5a5' }}>{a}</div>)}
              </div>
            )}
            <form onSubmit={salvar} style={{ display: 'grid', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><label style={labelStyle}>Tanque *</label>
                  <select style={inputStyle} value={form.tanqueId} onChange={e => setForm(p => ({ ...p, tanqueId: e.target.value }))} required>
                    <option value="">Selecionar...</option>
                    {tanques.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
                  </select>
                </div>
                <div><label style={labelStyle}>Data/Hora</label><input style={inputStyle} type="datetime-local" value={form.data} onChange={e => setForm(p => ({ ...p, data: e.target.value }))} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                <div><label style={labelStyle}>pH</label><input style={inputStyle} type="number" step="0.1" value={form.ph} onChange={e => setForm(p => ({ ...p, ph: e.target.value }))} placeholder="7.5" /></div>
                <div><label style={labelStyle}>OD (mg/L)</label><input style={inputStyle} type="number" step="0.1" value={form.oxigenioMgL} onChange={e => setForm(p => ({ ...p, oxigenioMgL: e.target.value }))} placeholder="6.5" /></div>
                <div><label style={labelStyle}>Temp. (°C)</label><input style={inputStyle} type="number" step="0.1" value={form.temperaturaC} onChange={e => setForm(p => ({ ...p, temperaturaC: e.target.value }))} placeholder="28" /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                <div><label style={labelStyle}>Amônia (mg/L)</label><input style={inputStyle} type="number" step="0.01" value={form.amoniaMgL} onChange={e => setForm(p => ({ ...p, amoniaMgL: e.target.value }))} placeholder="0.1" /></div>
                <div><label style={labelStyle}>Nitrito (mg/L)</label><input style={inputStyle} type="number" step="0.01" value={form.nitritoMgL} onChange={e => setForm(p => ({ ...p, nitritoMgL: e.target.value }))} placeholder="0.05" /></div>
                <div><label style={labelStyle}>Turbidez (NTU)</label><input style={inputStyle} type="number" step="1" value={form.turbidezNTU} onChange={e => setForm(p => ({ ...p, turbidezNTU: e.target.value }))} placeholder="40" /></div>
              </div>
              <div><label style={labelStyle}>Alcalinidade (mg/L)</label><input style={inputStyle} type="number" step="1" value={form.alcalinidadeMgL} onChange={e => setForm(p => ({ ...p, alcalinidadeMgL: e.target.value }))} placeholder="80" /></div>
              <div><label style={labelStyle}>Observação</label><input style={inputStyle} value={form.observacao} onChange={e => setForm(p => ({ ...p, observacao: e.target.value }))} /></div>
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button type="button" onClick={() => { setModal(false); setAlertaSave([]) }} style={{ flex: 1, background: 'transparent', border: '1px solid #1e293b', borderRadius: 10, padding: 11, color: '#94a3b8', fontSize: 13, cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" disabled={saving} style={{ flex: 1, background: '#0891b2', color: '#fff', border: 'none', borderRadius: 10, padding: 11, fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>{saving ? 'Registrando...' : 'Registrar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

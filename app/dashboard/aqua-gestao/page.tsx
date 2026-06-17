'use client'

import { useState, useEffect, useCallback } from 'react'

type Tanque = {
  id: string; nome: string; tipo: string; areaM2: number | null; volumeM3: number | null
  profundidadeM: number | null; localizacao: string | null; ativo: boolean
  lotesAqua: { id: string; nome: string; especie: string; quantidadeAtual: number; dataDespescaPrev: string | null }[]
  _count: { qualidadeAgua: number }
}
type Lote = {
  id: string; nome: string; especie: string; quantidadeAtual: number; status: string
  dataDespescaPrev: string | null; tanque: { nome: string; tipo: string }
  biometrias: { pesoMedioG: number; biomasseKg: number | null }[]
  _count: { arracoamentos: number }
}
type Kpis = { totalTanques: number; tanquesAtivos: number; lotesAtivos: number; biomasseTotal: number }

const TIPOS_TANQUE = ['ESCAVADO', 'TANQUE_REDE', 'RACEWAY', 'ACUDE', 'VIVEIRO']
const TIPO_LABEL: Record<string, string> = {
  ESCAVADO: 'Escavado', TANQUE_REDE: 'Tanque-rede', RACEWAY: 'Raceway', ACUDE: 'Açude', VIVEIRO: 'Viveiro',
}
const ESPECIES = ['Tilápia', 'Tambaqui', 'Pacu', 'Pintado/Surubim', 'Piau', 'Curimatã', 'Matrinxã', 'Camarão-vannamei', 'Camarão-da-Amazônia', 'Rã', 'Outro']

export default function AquaGestaoPage() {
  const [tab, setTab] = useState<'tanques' | 'lotes'>('tanques')
  const [tanques, setTanques] = useState<Tanque[]>([])
  const [lotes, setLotes] = useState<Lote[]>([])
  const [kpis, setKpis] = useState<Kpis | null>(null)
  const [loading, setLoading] = useState(true)
  const [modalTanque, setModalTanque] = useState(false)
  const [modalLote, setModalLote] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formTanque, setFormTanque] = useState({ nome: '', tipo: 'ESCAVADO', areaM2: '', volumeM3: '', profundidadeM: '', localizacao: '' })
  const [formLote, setFormLote] = useState({ tanqueId: '', nome: '', especie: 'Tilápia', quantidadeInicial: '', pesoMedioEntradaG: '', dataPovamento: '', dataDespescaPrev: '', observacao: '' })

  const carregar = useCallback(() => {
    setLoading(true)
    fetch('/api/aqua-gestao')
      .then(r => r.json())
      .then(d => { setTanques(d.tanques ?? []); setLotes(d.lotes ?? []); setKpis(d.kpis ?? null) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { carregar() }, [carregar])

  async function salvarTanque(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    await fetch('/api/aqua-gestao', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'tanque', ...formTanque }) })
    setSaving(false); setModalTanque(false); setFormTanque({ nome: '', tipo: 'ESCAVADO', areaM2: '', volumeM3: '', profundidadeM: '', localizacao: '' }); carregar()
  }

  async function salvarLote(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    await fetch('/api/aqua-gestao', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'lote', ...formLote }) })
    setSaving(false); setModalLote(false); setFormLote({ tanqueId: '', nome: '', especie: 'Tilápia', quantidadeInicial: '', pesoMedioEntradaG: '', dataPovamento: '', dataDespescaPrev: '', observacao: '' }); carregar()
  }

  const diasParaDespesca = (data: string | null) => {
    if (!data) return null
    const diff = Math.ceil((new Date(data).getTime() - Date.now()) / 86400000)
    return diff
  }

  const inputStyle: React.CSSProperties = { background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, padding: '10px 13px', color: '#f1f5f9', fontSize: 13, width: '100%', outline: 'none' }
  const labelStyle: React.CSSProperties = { fontSize: 12, color: '#64748b', fontWeight: 600, marginBottom: 4, display: 'block' }

  return (
    <div style={{ background: '#0a0e1a', minHeight: '100vh', padding: '28px 24px', color: '#f1f5f9' }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #0891b2, #0e7490)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12c0 5.385 4.365 9.75 9.75 9.75s9.75-4.365 9.75-9.75S17.385 2.25 12 2.25 2.25 6.615 2.25 12z" /></svg>
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9', lineHeight: 1 }}>AquaGestão</h1>
            <p style={{ fontSize: 13, color: '#64748b', marginTop: 3 }}>Gestão de tanques, viveiros e lotes de produção</p>
          </div>
        </div>
      </div>

      {/* KPIs */}
      {kpis && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 28 }}>
          {[
            { label: 'Total de Tanques', value: kpis.totalTanques, sub: `${kpis.tanquesAtivos} ativos`, color: '#0891b2' },
            { label: 'Lotes Ativos', value: kpis.lotesAtivos, sub: 'em produção', color: '#06b6d4' },
            { label: 'Biomassa Total', value: `${kpis.biomasseTotal.toFixed(0)} kg`, sub: 'estimada', color: '#0e7490' },
          ].map(k => (
            <div key={k.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '18px 20px' }}>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{k.label}</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: k.color, lineHeight: 1 }}>{k.value}</div>
              <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>{k.sub}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs + Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {(['tanques', 'lotes'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '8px 18px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: tab === t ? '#0891b2' : '#111827', color: tab === t ? '#fff' : '#64748b', transition: 'all .15s' }}>
            {t === 'tanques' ? 'Tanques / Viveiros' : 'Lotes Ativos'}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <button onClick={() => setModalLote(true)} style={{ background: 'rgba(8,145,178,0.15)', color: '#06b6d4', border: '1px solid rgba(8,145,178,0.3)', borderRadius: 10, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          + Novo Lote
        </button>
        <button onClick={() => setModalTanque(true)} style={{ background: '#0891b2', color: '#fff', border: 'none', borderRadius: 10, padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          + Novo Tanque
        </button>
      </div>

      {loading && <div style={{ height: 3, background: 'linear-gradient(90deg,#0891b2,#7c3aed)', borderRadius: 2, marginBottom: 4, opacity: 0.8 }} />}

      <div style={{ minHeight: 'calc(100vh - 320px)' }}>
      {/* Tanques Grid */}
      {tab === 'tanques' && (
        <div>
          {tanques.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#475569', background: 'rgba(255,255,255,0.02)', borderRadius: 16, border: '1px dashed rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🐟</div>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Nenhum tanque cadastrado</div>
              <div style={{ fontSize: 13 }}>Cadastre seu primeiro tanque ou viveiro para começar</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
              {tanques.map(t => (
                <div key={t.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 20, transition: 'border-color .15s' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 16, color: '#f1f5f9' }}>{t.nome}</div>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: 'rgba(8,145,178,0.15)', color: '#06b6d4', marginTop: 4, display: 'inline-block' }}>
                        {TIPO_LABEL[t.tipo] || t.tipo}
                      </span>
                    </div>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: t.ativo ? '#10b981' : '#ef4444', marginTop: 4 }} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
                    {t.areaM2 && <div style={{ fontSize: 12, color: '#64748b' }}>Área: <span style={{ color: '#94a3b8' }}>{t.areaM2} m²</span></div>}
                    {t.volumeM3 && <div style={{ fontSize: 12, color: '#64748b' }}>Volume: <span style={{ color: '#94a3b8' }}>{t.volumeM3} m³</span></div>}
                    {t.profundidadeM && <div style={{ fontSize: 12, color: '#64748b' }}>Prof.: <span style={{ color: '#94a3b8' }}>{t.profundidadeM} m</span></div>}
                    <div style={{ fontSize: 12, color: '#64748b' }}>Medições: <span style={{ color: '#94a3b8' }}>{t._count.qualidadeAgua}</span></div>
                  </div>
                  {t.lotesAqua.length > 0 && (
                    <div>
                      <div style={{ fontSize: 11, color: '#475569', fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Lotes em produção</div>
                      {t.lotesAqua.map(l => {
                        const dias = diasParaDespesca(l.dataDespescaPrev)
                        return (
                          <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: 'rgba(255,255,255,0.04)', borderRadius: 8, marginBottom: 4 }}>
                            <div>
                              <div style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0' }}>{l.nome}</div>
                              <div style={{ fontSize: 11, color: '#64748b' }}>{l.especie} · {l.quantidadeAtual.toLocaleString('pt-BR')} un</div>
                            </div>
                            {dias != null && (
                              <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 6, background: dias <= 30 ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)', color: dias <= 30 ? '#f87171' : '#34d399' }}>
                                {dias > 0 ? `${dias}d` : 'Despesca!'}
                              </span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Lotes Tab */}
      {tab === 'lotes' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {lotes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#475569', background: 'rgba(255,255,255,0.02)', borderRadius: 16, border: '1px dashed rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🎣</div>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Nenhum lote ativo</div>
              <div style={{ fontSize: 13 }}>Adicione um lote a um tanque para começar o ciclo de produção</div>
            </div>
          ) : lotes.map(l => {
            const dias = diasParaDespesca(l.dataDespescaPrev)
            const biomasse = l.biometrias[0]?.biomasseKg
            const pesoAtual = l.biometrias[0]?.pesoMedioG
            return (
              <div key={l.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 200px' }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#f1f5f9', marginBottom: 2 }}>{l.nome}</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>{l.especie} · {l.tanque.nome} ({TIPO_LABEL[l.tanque.tipo] || l.tanque.tipo})</div>
                </div>
                <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#06b6d4' }}>{l.quantidadeAtual.toLocaleString('pt-BR')}</div>
                    <div style={{ fontSize: 11, color: '#475569' }}>unidades</div>
                  </div>
                  {pesoAtual && (
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: '#a78bfa' }}>{pesoAtual}g</div>
                      <div style={{ fontSize: 11, color: '#475569' }}>peso médio</div>
                    </div>
                  )}
                  {biomasse && (
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: '#34d399' }}>{biomasse.toFixed(0)}kg</div>
                      <div style={{ fontSize: 11, color: '#475569' }}>biomassa</div>
                    </div>
                  )}
                  {dias != null && (
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: dias <= 14 ? '#f87171' : dias <= 30 ? '#fbbf24' : '#94a3b8' }}>{dias > 0 ? `${dias}d` : '!'}</div>
                      <div style={{ fontSize: 11, color: '#475569' }}>p/ despesca</div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
      </div>

      {/* Modal Tanque */}
      {modalTanque && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 20 }}>
          <div style={{ background: '#111827', border: '1px solid #1e293b', borderRadius: 18, padding: 28, width: '100%', maxWidth: 480 }}>
            <h2 style={{ fontSize: 17, fontWeight: 800, marginBottom: 20, color: '#f1f5f9' }}>Novo Tanque / Viveiro</h2>
            <form onSubmit={salvarTanque} style={{ display: 'grid', gap: 14 }}>
              <div><label style={labelStyle}>Nome *</label><input style={inputStyle} value={formTanque.nome} onChange={e => setFormTanque(p => ({ ...p, nome: e.target.value }))} placeholder="Ex: Tanque 01" required /></div>
              <div><label style={labelStyle}>Tipo</label>
                <select style={inputStyle} value={formTanque.tipo} onChange={e => setFormTanque(p => ({ ...p, tipo: e.target.value }))}>
                  {TIPOS_TANQUE.map(t => <option key={t} value={t}>{TIPO_LABEL[t]}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><label style={labelStyle}>Área (m²)</label><input style={inputStyle} type="number" step="0.01" value={formTanque.areaM2} onChange={e => setFormTanque(p => ({ ...p, areaM2: e.target.value }))} placeholder="500" /></div>
                <div><label style={labelStyle}>Volume (m³)</label><input style={inputStyle} type="number" step="0.01" value={formTanque.volumeM3} onChange={e => setFormTanque(p => ({ ...p, volumeM3: e.target.value }))} placeholder="1500" /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><label style={labelStyle}>Profundidade (m)</label><input style={inputStyle} type="number" step="0.1" value={formTanque.profundidadeM} onChange={e => setFormTanque(p => ({ ...p, profundidadeM: e.target.value }))} placeholder="1.5" /></div>
                <div><label style={labelStyle}>Localização</label><input style={inputStyle} value={formTanque.localizacao} onChange={e => setFormTanque(p => ({ ...p, localizacao: e.target.value }))} placeholder="Setor A" /></div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button type="button" onClick={() => setModalTanque(false)} style={{ flex: 1, background: 'transparent', border: '1px solid #1e293b', borderRadius: 10, padding: 11, color: '#94a3b8', fontSize: 13, cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" disabled={saving} style={{ flex: 1, background: '#0891b2', color: '#fff', border: 'none', borderRadius: 10, padding: 11, fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>{saving ? 'Salvando...' : 'Criar Tanque'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Lote */}
      {modalLote && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 20 }}>
          <div style={{ background: '#111827', border: '1px solid #1e293b', borderRadius: 18, padding: 28, width: '100%', maxWidth: 520 }}>
            <h2 style={{ fontSize: 17, fontWeight: 800, marginBottom: 20, color: '#f1f5f9' }}>Novo Lote de Produção</h2>
            <form onSubmit={salvarLote} style={{ display: 'grid', gap: 14 }}>
              <div><label style={labelStyle}>Tanque *</label>
                <select style={inputStyle} value={formLote.tanqueId} onChange={e => setFormLote(p => ({ ...p, tanqueId: e.target.value }))} required>
                  <option value="">Selecionar tanque...</option>
                  {tanques.filter(t => t.ativo).map(t => <option key={t.id} value={t.id}>{t.nome} ({TIPO_LABEL[t.tipo]})</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><label style={labelStyle}>Nome do Lote *</label><input style={inputStyle} value={formLote.nome} onChange={e => setFormLote(p => ({ ...p, nome: e.target.value }))} placeholder="Lote Tilápia Jan/25" required /></div>
                <div><label style={labelStyle}>Espécie *</label>
                  <select style={inputStyle} value={formLote.especie} onChange={e => setFormLote(p => ({ ...p, especie: e.target.value }))}>
                    {ESPECIES.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><label style={labelStyle}>Qtd. inicial (un) *</label><input style={inputStyle} type="number" value={formLote.quantidadeInicial} onChange={e => setFormLote(p => ({ ...p, quantidadeInicial: e.target.value }))} placeholder="5000" required /></div>
                <div><label style={labelStyle}>Peso entrada (g)</label><input style={inputStyle} type="number" step="0.1" value={formLote.pesoMedioEntradaG} onChange={e => setFormLote(p => ({ ...p, pesoMedioEntradaG: e.target.value }))} placeholder="30" /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><label style={labelStyle}>Data de Povoamento</label><input style={inputStyle} type="date" value={formLote.dataPovamento} onChange={e => setFormLote(p => ({ ...p, dataPovamento: e.target.value }))} /></div>
                <div><label style={labelStyle}>Previsão de Despesca</label><input style={inputStyle} type="date" value={formLote.dataDespescaPrev} onChange={e => setFormLote(p => ({ ...p, dataDespescaPrev: e.target.value }))} /></div>
              </div>
              <div><label style={labelStyle}>Observação</label><textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 60 }} value={formLote.observacao} onChange={e => setFormLote(p => ({ ...p, observacao: e.target.value }))} /></div>
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button type="button" onClick={() => setModalLote(false)} style={{ flex: 1, background: 'transparent', border: '1px solid #1e293b', borderRadius: 10, padding: 11, color: '#94a3b8', fontSize: 13, cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" disabled={saving} style={{ flex: 1, background: '#0891b2', color: '#fff', border: 'none', borderRadius: 10, padding: 11, fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>{saving ? 'Salvando...' : 'Criar Lote'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

import { useState, useEffect, useCallback } from 'react'

type Lote = { id: string; nome: string; especie: string; quantidadeAtual: number; status: string; dataDespescaPrev: string | null; tanque: { nome: string } }
type Despesca = { id: string; loteId: string; data: string; quantidadePeixe: number; pesoTotalKg: number; pesoMedioG: number | null; rendimentoPerc: number | null; destinoVenda: string | null; precoKg: number | null; receita: number | null; observacao: string | null; lote: { nome: string; especie: string; tanque: { nome: string } } }
type Kpis = { totalKgColhido: number; totalReceita: number; proximasDespescas: number }

const DESTINOS = ['Frigorífico', 'Feira livre', 'Restaurante', 'Supermercado', 'Peixaria', 'Venda direta', 'Outro']

export default function AquaDespescaPage() {
  const [lotes, setLotes] = useState<Lote[]>([])
  const [despescas, setDespescas] = useState<Despesca[]>([])
  const [kpis, setKpis] = useState<Kpis | null>(null)
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [erro, setErro] = useState('')
  const [form, setForm] = useState({ loteId: '', quantidadePeixe: '', pesoTotalKg: '', pesoMedioG: '', rendimentoPerc: '', destinoVenda: 'Frigorífico', precoKg: '', data: new Date().toISOString().slice(0, 10), observacao: '', encerrarLote: false })

  const carregar = useCallback(() => {
    setLoading(true)
    fetch('/api/aqua-despesca')
      .then(r => r.json())
      .then(d => { setLotes(d.lotes ?? []); setDespescas(d.despescas ?? []); setKpis(d.kpis ?? null) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { carregar() }, [carregar])

  async function salvar(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setErro('')
    try {
      const res = await fetch('/api/aqua-despesca', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const data = await res.json()
      if (!res.ok || data.error) { setErro(data.error || `Erro ${res.status}`); setSaving(false); return }
      setModal(false); setForm(p => ({ ...p, quantidadePeixe: '', pesoTotalKg: '', pesoMedioG: '', rendimentoPerc: '', precoKg: '', observacao: '', encerrarLote: false })); carregar()
    } catch (err: any) { setErro(err.message) }
    setSaving(false)
  }

  const diasParaDespesca = (data: string | null) => {
    if (!data) return null
    return Math.ceil((new Date(data).getTime() - Date.now()) / 86400000)
  }

  const lotesAtivos = lotes.filter(l => l.status === 'ATIVO')
  const proximasDespescas = lotesAtivos.filter(l => {
    const d = diasParaDespesca(l.dataDespescaPrev)
    return d != null && d <= 30
  }).sort((a, b) => new Date(a.dataDespescaPrev!).getTime() - new Date(b.dataDespescaPrev!).getTime())

  const inputStyle: React.CSSProperties = { background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, padding: '10px 13px', color: '#f1f5f9', fontSize: 13, width: '100%', outline: 'none' }
  const labelStyle: React.CSSProperties = { fontSize: 12, color: '#64748b', fontWeight: 600, marginBottom: 4, display: 'block' }

  return (
    <div style={{ background: '#0a0e1a', minHeight: '100vh', padding: '28px 24px', color: '#f1f5f9' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #10b981, #0891b2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" /></svg>
        </div>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9', lineHeight: 1 }}>AquaDespesca</h1>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 3 }}>Colheita, rastreabilidade e controle de produção</p>
        </div>
      </div>

      {erro && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, padding: '12px 16px', marginBottom: 20, color: '#f87171', fontSize: 13, fontWeight: 600 }}>{erro}</div>}

      {/* KPIs */}
      {kpis && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 28 }}>
          {[
            { label: 'Total Colhido', value: `${kpis.totalKgColhido.toFixed(0)} kg`, color: '#10b981' },
            { label: 'Receita Total', value: `R$ ${kpis.totalReceita.toFixed(2)}`, color: '#34d399' },
            { label: 'Próx. 30 dias', value: kpis.proximasDespescas, sub: 'despescas previstas', color: kpis.proximasDespescas > 0 ? '#fbbf24' : '#94a3b8' },
          ].map(k => (
            <div key={k.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '16px 18px' }}>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{k.label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: k.color }}>{k.value}</div>
              {(k as any).sub && <div style={{ fontSize: 11, color: '#475569', marginTop: 3 }}>{(k as any).sub}</div>}
            </div>
          ))}
        </div>
      )}

      {/* Alertas de Despescas Próximas */}
      {proximasDespescas.length > 0 && (
        <div style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 14, padding: 16, marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#fbbf24', marginBottom: 10 }}>⏰ Despescas nos próximos 30 dias</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {proximasDespescas.map(l => {
              const dias = diasParaDespesca(l.dataDespescaPrev)!
              return (
                <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 10 }}>
                  <div>
                    <span style={{ fontWeight: 600, color: '#e2e8f0', fontSize: 13 }}>{l.nome}</span>
                    <span style={{ fontSize: 12, color: '#64748b', marginLeft: 8 }}>{l.especie} · {l.tanque.nome}</span>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: dias <= 7 ? '#f87171' : '#fbbf24' }}>
                    {dias === 0 ? 'Hoje!' : `${dias}d`}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
        <button onClick={() => setModal(true)} style={{ background: '#10b981', color: '#fff', border: 'none', borderRadius: 10, padding: '8px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>+ Registrar Despesca</button>
      </div>

      {loading && <div style={{ textAlign: 'center', padding: 60, color: '#475569' }}>Carregando...</div>}

      {!loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {despescas.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#475569', background: 'rgba(255,255,255,0.02)', borderRadius: 16, border: '1px dashed rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🐠</div>
              <div style={{ fontWeight: 700 }}>Nenhuma despesca registrada</div>
              <div style={{ fontSize: 13, marginTop: 6 }}>Registre a colheita dos seus lotes ao final do ciclo de produção</div>
            </div>
          ) : despescas.map(d => (
            <div key={d.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 200px' }}>
                <div style={{ fontWeight: 700, color: '#f1f5f9', fontSize: 14 }}>{d.lote.nome}</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{d.lote.especie} · {d.lote.tanque.nome} · {new Date(d.data).toLocaleDateString('pt-BR')}</div>
                {d.destinoVenda && <div style={{ fontSize: 11, marginTop: 4, padding: '2px 8px', background: 'rgba(16,185,129,0.1)', color: '#34d399', borderRadius: 6, display: 'inline-block' }}>{d.destinoVenda}</div>}
              </div>
              <div style={{ display: 'flex', gap: 18 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#10b981' }}>{d.pesoTotalKg}kg</div>
                  <div style={{ fontSize: 10, color: '#475569' }}>peso total</div>
                </div>
                {d.receita && (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#34d399' }}>R$ {d.receita.toFixed(2)}</div>
                    <div style={{ fontSize: 10, color: '#475569' }}>receita</div>
                  </div>
                )}
                {d.rendimentoPerc && (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#06b6d4' }}>{d.rendimentoPerc}%</div>
                    <div style={{ fontSize: 10, color: '#475569' }}>rendimento</div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 20, overflowY: 'auto' }}>
          <div style={{ background: '#111827', border: '1px solid #1e293b', borderRadius: 18, padding: 28, width: '100%', maxWidth: 520, margin: 'auto' }}>
            <h2 style={{ fontSize: 17, fontWeight: 800, marginBottom: 20, color: '#f1f5f9' }}>Registrar Despesca</h2>
            <form onSubmit={salvar} style={{ display: 'grid', gap: 14 }}>
              <div><label style={labelStyle}>Lote *</label>
                <select style={inputStyle} value={form.loteId} onChange={e => setForm(p => ({ ...p, loteId: e.target.value }))} required>
                  <option value="">Selecionar lote...</option>
                  {lotesAtivos.map(l => <option key={l.id} value={l.id}>{l.nome} ({l.especie}) · {l.quantidadeAtual.toLocaleString('pt-BR')} un</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><label style={labelStyle}>Qtd. peixes colhidos *</label><input style={inputStyle} type="number" value={form.quantidadePeixe} onChange={e => setForm(p => ({ ...p, quantidadePeixe: e.target.value }))} placeholder="5000" required /></div>
                <div><label style={labelStyle}>Peso total (kg) *</label><input style={inputStyle} type="number" step="0.1" value={form.pesoTotalKg} onChange={e => setForm(p => ({ ...p, pesoTotalKg: e.target.value }))} placeholder="1500" required /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><label style={labelStyle}>Peso médio (g)</label><input style={inputStyle} type="number" step="1" value={form.pesoMedioG} onChange={e => setForm(p => ({ ...p, pesoMedioG: e.target.value }))} placeholder="300" /></div>
                <div><label style={labelStyle}>Rendimento (%)</label><input style={inputStyle} type="number" step="0.1" value={form.rendimentoPerc} onChange={e => setForm(p => ({ ...p, rendimentoPerc: e.target.value }))} placeholder="60" /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><label style={labelStyle}>Destino / Canal</label>
                  <select style={inputStyle} value={form.destinoVenda} onChange={e => setForm(p => ({ ...p, destinoVenda: e.target.value }))}>
                    {DESTINOS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div><label style={labelStyle}>Preço/kg (R$)</label><input style={inputStyle} type="number" step="0.01" value={form.precoKg} onChange={e => setForm(p => ({ ...p, precoKg: e.target.value }))} placeholder="8.00" /></div>
              </div>
              <div><label style={labelStyle}>Data</label><input style={inputStyle} type="date" value={form.data} onChange={e => setForm(p => ({ ...p, data: e.target.value }))} /></div>
              <div><label style={labelStyle}>Observação</label><input style={inputStyle} value={form.observacao} onChange={e => setForm(p => ({ ...p, observacao: e.target.value }))} /></div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, color: '#94a3b8', padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
                <input type="checkbox" checked={form.encerrarLote} onChange={e => setForm(p => ({ ...p, encerrarLote: e.target.checked }))} style={{ width: 16, height: 16, accentColor: '#10b981' }} />
                Encerrar lote após esta despesca
              </label>
              {erro && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '10px 14px', color: '#f87171', fontSize: 13 }}>{erro}</div>}
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button type="button" onClick={() => setModal(false)} style={{ flex: 1, background: 'transparent', border: '1px solid #1e293b', borderRadius: 10, padding: 11, color: '#94a3b8', fontSize: 13, cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" disabled={saving} style={{ flex: 1, background: '#10b981', color: '#fff', border: 'none', borderRadius: 10, padding: 11, fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>{saving ? 'Salvando...' : 'Registrar Despesca'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

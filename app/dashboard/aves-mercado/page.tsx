'use client'

import { useState, useEffect, useCallback } from 'react'

type LoteResumo = { id: string; nome: string; especie: string }
type Venda = {
  id: string; data: string; tipo: string; quantidade: number; unidade: string | null
  precoUnitario: number; total: number; comprador: string | null; canal: string | null
  lote: { nome: string; especie: string }
}
type Kpis = { receitaTotal: number; totalVendas: number; precoMedioOvos: number }

const UNIDADES = ['dúzia', 'unidade', 'kg', 'bandeja (30un)']

export default function AvesMercadoPage() {
  const [lotes, setLotes] = useState<LoteResumo[]>([])
  const [vendas, setVendas] = useState<Venda[]>([])
  const [kpis, setKpis] = useState<Kpis | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ loteId: '', data: '', tipo: 'OVOS', quantidade: '', unidade: 'dúzia', precoUnitario: '', comprador: '', canal: '', observacao: '' })

  const carregar = useCallback(() => {
    setLoading(true)
    fetch('/api/aves-mercado')
      .then(r => r.json())
      .then(d => { setLotes(d.lotes ?? []); setVendas(d.vendas ?? []); setKpis(d.kpis ?? null) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { carregar() }, [carregar])

  async function registrar(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    await fetch('/api/aves-mercado', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setSaving(false)
    setForm({ loteId: form.loteId, data: '', tipo: form.tipo, quantidade: '', unidade: form.unidade, precoUnitario: '', comprador: '', canal: '', observacao: '' })
    carregar()
  }

  const inputStyle: React.CSSProperties = { background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, padding: '10px 13px', color: '#f1f5f9', fontSize: 13, width: '100%', outline: 'none' }
  const labelStyle: React.CSSProperties = { fontSize: 12, color: '#64748b', fontWeight: 600, marginBottom: 4, display: 'block' }

  return (
    <div style={{ background: '#0a0e1a', minHeight: '100vh', padding: '28px 24px', color: '#f1f5f9' }}>

      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #ca8a04, #a16207)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>💰</div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9', lineHeight: 1 }}>AvesMercado</h1>
            <p style={{ fontSize: 13, color: '#64748b', marginTop: 3 }}>Comercialização de ovos e aves</p>
          </div>
        </div>
      </div>

      {kpis && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 28 }}>
          {[
            { label: 'Receita Total', value: `R$ ${kpis.receitaTotal.toLocaleString('pt-BR')}`, sub: 'acumulada', color: '#ca8a04' },
            { label: 'Vendas Registradas', value: kpis.totalVendas, sub: 'no total', color: '#eab308' },
            { label: 'Preço Médio', value: `R$ ${kpis.precoMedioOvos.toFixed(2)}`, sub: 'por unidade de ovos', color: '#facc15' },
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
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 22 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, color: '#f1f5f9' }}>Registrar Venda</h2>
          <form onSubmit={registrar} style={{ display: 'grid', gap: 12 }}>
            <div><label style={labelStyle}>Lote *</label>
              <select style={inputStyle} value={form.loteId} onChange={e => setForm(p => ({ ...p, loteId: e.target.value }))} required>
                <option value="">Selecionar lote...</option>
                {lotes.map(l => <option key={l.id} value={l.id}>{l.nome} ({l.especie})</option>)}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div><label style={labelStyle}>Tipo</label>
                <select style={inputStyle} value={form.tipo} onChange={e => setForm(p => ({ ...p, tipo: e.target.value }))}>
                  <option value="OVOS">Ovos</option>
                  <option value="AVES">Aves</option>
                </select>
              </div>
              <div><label style={labelStyle}>Unidade</label>
                <select style={inputStyle} value={form.unidade} onChange={e => setForm(p => ({ ...p, unidade: e.target.value }))}>
                  {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div><label style={labelStyle}>Quantidade *</label><input style={inputStyle} type="number" step="0.01" value={form.quantidade} onChange={e => setForm(p => ({ ...p, quantidade: e.target.value }))} placeholder="30" required /></div>
              <div><label style={labelStyle}>Preço unitário (R$) *</label><input style={inputStyle} type="number" step="0.01" value={form.precoUnitario} onChange={e => setForm(p => ({ ...p, precoUnitario: e.target.value }))} placeholder="8.50" required /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div><label style={labelStyle}>Comprador</label><input style={inputStyle} value={form.comprador} onChange={e => setForm(p => ({ ...p, comprador: e.target.value }))} /></div>
              <div><label style={labelStyle}>Canal</label><input style={inputStyle} value={form.canal} onChange={e => setForm(p => ({ ...p, canal: e.target.value }))} placeholder="Feira, atacado, porta a porta..." /></div>
            </div>
            <div><label style={labelStyle}>Data</label><input style={inputStyle} type="date" value={form.data} onChange={e => setForm(p => ({ ...p, data: e.target.value }))} /></div>
            <div><label style={labelStyle}>Observação</label><textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 50 }} value={form.observacao} onChange={e => setForm(p => ({ ...p, observacao: e.target.value }))} /></div>
            <button type="submit" disabled={saving || !lotes.length} style={{ background: '#ca8a04', color: '#fff', border: 'none', borderRadius: 10, padding: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: saving || !lotes.length ? 0.6 : 1 }}>
              {saving ? 'Salvando...' : 'Registrar Venda'}
            </button>
            {!lotes.length && !loading && <div style={{ fontSize: 12, color: '#f87171', textAlign: 'center' }}>Cadastre um lote em AvesGestão primeiro</div>}
          </form>
        </div>

        <div>
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, color: '#f1f5f9' }}>Histórico de Vendas</h2>
          {loading && <div style={{ height: 3, background: 'linear-gradient(90deg,#ca8a04,#facc15)', borderRadius: 2, marginBottom: 12, opacity: 0.8 }} />}
          {vendas.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#475569', background: 'rgba(255,255,255,0.02)', borderRadius: 16, border: '1px dashed rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>💰</div>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Nenhuma venda registrada</div>
              <div style={{ fontSize: 13 }}>Registre a primeira venda de ovos ou aves ao lado</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {vendas.map(v => (
                <div key={v.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                  <div style={{ flex: '1 1 160px' }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#f1f5f9' }}>{v.lote.nome}</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>{new Date(v.data).toLocaleDateString('pt-BR')} · {v.tipo === 'OVOS' ? 'Ovos' : 'Aves'}{v.comprador ? ` · ${v.comprador}` : ''}</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#94a3b8' }}>{v.quantidade} {v.unidade || ''}</div>
                    <div style={{ fontSize: 10, color: '#475569' }}>vendido</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 17, fontWeight: 800, color: '#facc15' }}>R$ {v.total.toFixed(2)}</div>
                    <div style={{ fontSize: 10, color: '#475569' }}>total</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect, useCallback } from 'react'

type Lote = { id: string; nome: string; especie: string; quantidadeAtual: number }
type Venda = { id: string; loteId: string; data: string; especie: string; pesoKg: number; precoKg: number; total: number; comprador: string | null; canal: string | null; observacao: string | null; lote: { nome: string; especie: string } }
type Kpis = { totalKg: number; totalReceita: number; precoMedioKg: number; totalVendas: number }

const CANAIS = ['Frigorífico', 'Feira livre', 'Restaurante', 'Supermercado', 'Peixaria', 'Venda direta', 'Exportação', 'Outro']
const ESPECIES = ['Tilápia', 'Tambaqui', 'Pacu', 'Pintado/Surubim', 'Piau', 'Curimatã', 'Matrinxã', 'Camarão-vannamei', 'Camarão-da-Amazônia', 'Rã', 'Outro']
const PERIODOS = [{ v: '30', l: '30 dias' }, { v: '60', l: '60 dias' }, { v: '90', l: '90 dias' }, { v: '180', l: '6 meses' }, { v: '365', l: '12 meses' }]

export default function AquaMercadoPage() {
  const [tab, setTab] = useState<'vendas' | 'canais' | 'especies'>('vendas')
  const [lotes, setLotes] = useState<Lote[]>([])
  const [vendas, setVendas] = useState<Venda[]>([])
  const [kpis, setKpis] = useState<Kpis | null>(null)
  const [porCanal, setPorCanal] = useState<Record<string, number>>({})
  const [porEspecie, setPorEspecie] = useState<Record<string, { kg: number; receita: number }>>({})
  const [periodo, setPeriodo] = useState('90')
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ loteId: '', especie: 'Tilápia', pesoKg: '', precoKg: '', comprador: '', canal: 'Frigorífico', data: new Date().toISOString().slice(0, 10), observacao: '' })

  const carregar = useCallback(() => {
    setLoading(true)
    fetch(`/api/aqua-mercado?periodo=${periodo}`)
      .then(r => r.json())
      .then(d => { setLotes(d.lotes ?? []); setVendas(d.vendas ?? []); setKpis(d.kpis ?? null); setPorCanal(d.porCanal ?? {}); setPorEspecie(d.porEspecie ?? {}) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [periodo])

  useEffect(() => { carregar() }, [carregar])

  async function salvar(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    await fetch('/api/aqua-mercado', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setSaving(false); setModal(false); setForm(p => ({ ...p, pesoKg: '', precoKg: '', comprador: '', observacao: '' })); carregar()
  }

  const totalCanal = Object.values(porCanal).reduce((a, b) => a + b, 0)
  const inputStyle: React.CSSProperties = { background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, padding: '10px 13px', color: '#f1f5f9', fontSize: 13, width: '100%', outline: 'none' }
  const labelStyle: React.CSSProperties = { fontSize: 12, color: '#64748b', fontWeight: 600, marginBottom: 4, display: 'block' }

  return (
    <div style={{ background: '#0a0e1a', minHeight: '100vh', padding: '28px 24px', color: '#f1f5f9' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #f59e0b, #10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" /></svg>
        </div>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9', lineHeight: 1 }}>AquaMercado</h1>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 3 }}>Comercialização, preços e canais de venda</p>
        </div>
      </div>

      {/* KPIs */}
      {kpis && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 28 }}>
          {[
            { label: 'Volume Vendido', value: `${kpis.totalKg.toFixed(0)} kg`, color: '#f59e0b' },
            { label: 'Receita Total', value: `R$ ${kpis.totalReceita.toFixed(2)}`, color: '#10b981' },
            { label: 'Preço Médio/kg', value: `R$ ${kpis.precoMedioKg.toFixed(2)}`, color: '#06b6d4' },
            { label: 'Transações', value: kpis.totalVendas, color: '#a78bfa' },
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
        {[['vendas', 'Vendas'], ['canais', 'Por Canal'], ['especies', 'Por Espécie']].map(([k, v]) => (
          <button key={k} onMouseDown={(e) => e.preventDefault()} onClick={() => setTab(k as any)} style={{ padding: '8px 16px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: tab === k ? '#f59e0b' : '#111827', color: tab === k ? '#fff' : '#64748b' }}>{v}</button>
        ))}
        <div style={{ flex: 1 }} />
        <select style={{ background: '#111827', border: '1px solid #1e293b', color: '#94a3b8', borderRadius: 10, padding: '8px 12px', fontSize: 13, cursor: 'pointer', outline: 'none' }} value={periodo} onChange={e => setPeriodo(e.target.value)}>
          {PERIODOS.map(p => <option key={p.v} value={p.v}>{p.l}</option>)}
        </select>
        <button onClick={() => setModal(true)} style={{ background: '#f59e0b', color: '#fff', border: 'none', borderRadius: 10, padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>+ Registrar Venda</button>
      </div>

      {loading && <div style={{ height: 3, background: 'linear-gradient(90deg,#0891b2,#7c3aed)', borderRadius: 2, marginBottom: 4, opacity: 0.8 }} />}

      <div style={{ minHeight: 'calc(100vh - 320px)' }}>
      {/* Vendas */}
      {tab === 'vendas' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {vendas.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#475569', background: 'rgba(255,255,255,0.02)', borderRadius: 16, border: '1px dashed rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>📊</div>
              <div style={{ fontWeight: 700 }}>Nenhuma venda registrada no período</div>
            </div>
          ) : vendas.map(v => (
            <div key={v.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ fontSize: 12, color: '#475569', minWidth: 90 }}>{new Date(v.data).toLocaleDateString('pt-BR')}</div>
              <div style={{ flex: 1 }}>
                <span style={{ fontWeight: 700, color: '#e2e8f0', fontSize: 13 }}>{v.especie}</span>
                {v.canal && <span style={{ fontSize: 11, marginLeft: 8, padding: '2px 7px', background: 'rgba(245,158,11,0.1)', color: '#fbbf24', borderRadius: 5 }}>{v.canal}</span>}
                {v.comprador && <span style={{ fontSize: 12, color: '#64748b', marginLeft: 8 }}>{v.comprador}</span>}
              </div>
              <div style={{ display: 'flex', gap: 18 }}>
                <div style={{ textAlign: 'center' }}><div style={{ fontSize: 16, fontWeight: 800, color: '#06b6d4' }}>{v.pesoKg}kg</div><div style={{ fontSize: 10, color: '#475569' }}>volume</div></div>
                <div style={{ textAlign: 'center' }}><div style={{ fontSize: 16, fontWeight: 800, color: '#64748b' }}>R${v.precoKg}/kg</div><div style={{ fontSize: 10, color: '#475569' }}>preço</div></div>
                <div style={{ textAlign: 'center' }}><div style={{ fontSize: 16, fontWeight: 800, color: '#10b981' }}>R${v.total.toFixed(2)}</div><div style={{ fontSize: 10, color: '#475569' }}>total</div></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Por Canal */}
      {tab === 'canais' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
          {Object.entries(porCanal).sort(([, a], [, b]) => b - a).map(([canal, receita]) => {
            const pct = totalCanal > 0 ? (receita / totalCanal) * 100 : 0
            return (
              <div key={canal} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 18 }}>
                <div style={{ fontWeight: 700, color: '#f1f5f9', marginBottom: 12 }}>{canal}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#f59e0b', marginBottom: 8 }}>R$ {receita.toFixed(2)}</div>
                <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, #f59e0b, #fbbf24)', borderRadius: 3, transition: 'width .6s ease' }} />
                </div>
                <div style={{ fontSize: 11, color: '#475569', marginTop: 4 }}>{pct.toFixed(1)}% da receita</div>
              </div>
            )
          })}
        </div>
      )}

      {/* Por Espécie */}
      {tab === 'especies' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
          {Object.entries(porEspecie).sort(([, a], [, b]) => b.receita - a.receita).map(([esp, data]) => (
            <div key={esp} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 18 }}>
              <div style={{ fontWeight: 700, color: '#f1f5f9', marginBottom: 14 }}>{esp}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><div style={{ fontSize: 11, color: '#475569', marginBottom: 2 }}>Volume</div><div style={{ fontSize: 18, fontWeight: 800, color: '#06b6d4' }}>{data.kg.toFixed(0)}kg</div></div>
                <div><div style={{ fontSize: 11, color: '#475569', marginBottom: 2 }}>Receita</div><div style={{ fontSize: 18, fontWeight: 800, color: '#10b981' }}>R${data.receita.toFixed(0)}</div></div>
                <div style={{ gridColumn: 'span 2' }}><div style={{ fontSize: 11, color: '#475569', marginBottom: 2 }}>Preço médio</div><div style={{ fontSize: 16, fontWeight: 700, color: '#fbbf24' }}>R$ {(data.receita / data.kg).toFixed(2)}/kg</div></div>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>

      {/* Modal */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 20 }}>
          <div style={{ background: '#111827', border: '1px solid #1e293b', borderRadius: 18, padding: 28, width: '100%', maxWidth: 480 }}>
            <h2 style={{ fontSize: 17, fontWeight: 800, marginBottom: 20, color: '#f1f5f9' }}>Registrar Venda</h2>
            <form onSubmit={salvar} style={{ display: 'grid', gap: 14 }}>
              <div><label style={labelStyle}>Lote *</label>
                <select style={inputStyle} value={form.loteId} onChange={e => setForm(p => ({ ...p, loteId: e.target.value }))} required>
                  <option value="">Selecionar lote...</option>
                  {lotes.map(l => <option key={l.id} value={l.id}>{l.nome} ({l.especie})</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><label style={labelStyle}>Espécie</label>
                  <select style={inputStyle} value={form.especie} onChange={e => setForm(p => ({ ...p, especie: e.target.value }))}>
                    {ESPECIES.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
                <div><label style={labelStyle}>Canal de Venda</label>
                  <select style={inputStyle} value={form.canal} onChange={e => setForm(p => ({ ...p, canal: e.target.value }))}>
                    {CANAIS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><label style={labelStyle}>Peso (kg) *</label><input style={inputStyle} type="number" step="0.1" value={form.pesoKg} onChange={e => setForm(p => ({ ...p, pesoKg: e.target.value }))} placeholder="100" required /></div>
                <div><label style={labelStyle}>Preço/kg (R$) *</label><input style={inputStyle} type="number" step="0.01" value={form.precoKg} onChange={e => setForm(p => ({ ...p, precoKg: e.target.value }))} placeholder="8.50" required /></div>
              </div>
              {form.pesoKg && form.precoKg && <div style={{ padding: '10px 14px', background: 'rgba(16,185,129,0.08)', borderRadius: 10, border: '1px solid rgba(16,185,129,0.15)' }}>
                <span style={{ fontSize: 13, color: '#64748b' }}>Total: </span>
                <span style={{ fontSize: 16, fontWeight: 800, color: '#34d399' }}>R$ {(Number(form.pesoKg) * Number(form.precoKg)).toFixed(2)}</span>
              </div>}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><label style={labelStyle}>Comprador</label><input style={inputStyle} value={form.comprador} onChange={e => setForm(p => ({ ...p, comprador: e.target.value }))} placeholder="Nome / empresa" /></div>
                <div><label style={labelStyle}>Data</label><input style={inputStyle} type="date" value={form.data} onChange={e => setForm(p => ({ ...p, data: e.target.value }))} /></div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button type="button" onClick={() => setModal(false)} style={{ flex: 1, background: 'transparent', border: '1px solid #1e293b', borderRadius: 10, padding: 11, color: '#94a3b8', fontSize: 13, cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" disabled={saving} style={{ flex: 1, background: '#f59e0b', color: '#fff', border: 'none', borderRadius: 10, padding: 11, fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>{saving ? 'Salvando...' : 'Registrar Venda'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

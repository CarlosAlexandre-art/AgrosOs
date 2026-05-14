'use client'

import { useState, useEffect, useCallback } from 'react'

const TIPO_COLOR: Record<string, string> = {
  COMPRA: '#f87171', LEILAO_COMPRA: '#fb923c',
  VENDA: '#10b981', LEILAO_VENDA: '#34d399',
}
const TIPO_LABEL: Record<string, string> = {
  COMPRA: 'Compra', LEILAO_COMPRA: 'Leilão Compra',
  VENDA: 'Venda', LEILAO_VENDA: 'Leilão Venda',
}

export default function FinanceiroPecuarioPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'transacoes' | 'valuation'>('transacoes')
  const [showForm, setShowForm] = useState<null | 'transacao' | 'valuation'>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ tipo: 'VENDA', cabecas: '', pesoTotal: '', valorArroba: '', valorTotal: '', contraparte: '', gta: '', comissao: '', observacao: '' })
  const [arrobaRef, setArrobaRef] = useState('320')

  const carregar = useCallback(() => {
    setLoading(true)
    fetch('/api/financeiro-pecuario')
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { carregar() }, [carregar])

  // Auto-calcular valorTotal quando mudam cabecas/pesoTotal/valorArroba
  function calcValorTotal(f: typeof form) {
    if (f.pesoTotal && f.valorArroba) {
      const arrobas = Number(f.pesoTotal) / 15
      return (arrobas * Number(f.valorArroba)).toFixed(2)
    }
    return f.valorTotal
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    if (showForm === 'transacao') {
      const valorTotal = calcValorTotal(form) || form.valorTotal
      await fetch('/api/financeiro-pecuario', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, valorTotal }),
      })
    } else {
      await fetch('/api/financeiro-pecuario', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ _type: 'valuation', valorArrobaRef: arrobaRef }),
      })
    }
    setShowForm(null)
    carregar()
    setSaving(false)
  }

  const kpis = data?.kpis ?? {}
  const valuation = data?.ultimoValuation

  return (
    <div style={{ background: '#0a0e1a', minHeight: '100vh', padding: '28px 24px', color: '#f1f5f9' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5 }}>AgroTrade — Financeiro Pecuário</h1>
        <p style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>Compra e venda de gado, custo por cabeça, margem e valuation do rebanho</p>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
        {[
          { label: 'Receita Vendas', val: `R$${(kpis.receitas ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`, color: '#10b981', icon: '📈' },
          { label: 'Custo Compras', val: `R$${(kpis.custos ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`, color: '#f87171', icon: '📉' },
          { label: 'Margem Bruta', val: `R$${(kpis.margem ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`, color: (kpis.margem ?? 0) >= 0 ? '#34d399' : '#f87171', icon: '💹' },
          { label: 'Valuation Rebanho', val: valuation ? `R$${(valuation.valorTotalEstimado).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}` : '—', color: '#a78bfa', icon: '🐂' },
        ].map(k => (
          <div key={k.label} style={{ background: '#111827', border: '1px solid #1e293b', borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>{k.icon} {k.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: k.color }}>{k.val}</div>
          </div>
        ))}
      </div>

      {/* Valuation card */}
      {valuation && (
        <div style={{ background: '#111827', border: '1px solid #a78bfa40', borderRadius: 14, padding: '16px 20px', marginBottom: 16, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {[
            { l: 'Animais', v: valuation.totalAnimais, c: '#a78bfa' },
            { l: 'Total arrobas', v: `${valuation.totalArrobas.toFixed(1)} @`, c: '#fbbf24' },
            { l: 'Preço ref. @', v: `R$${valuation.valorArrobaRef}`, c: '#60a5fa' },
            { l: 'Atualizado', v: new Date(valuation.data).toLocaleDateString('pt-BR'), c: '#64748b' },
          ].map(k => (
            <div key={k.l}>
              <div style={{ fontSize: 10, color: '#64748b', marginBottom: 2 }}>{k.l}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: k.c }}>{k.v}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs + botões */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[['transacoes', 'Transações'], ['valuation', 'Valuation']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id as any)}
            style={{ padding: '8px 16px', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              background: tab === id ? '#a78bfa' : '#111827', color: tab === id ? '#fff' : '#64748b' }}>
            {label}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <button onClick={() => setShowForm('valuation')}
          style={{ background: '#1e293b', color: '#a78bfa', border: '1px solid #a78bfa40', borderRadius: 9, padding: '8px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
          Calcular Valuation
        </button>
        <button onClick={() => setShowForm('transacao')}
          style={{ background: '#a78bfa', color: '#fff', border: 'none', borderRadius: 9, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          + Nova Transação
        </button>
      </div>

      {loading && <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>Carregando...</div>}

      {/* Transações */}
      {!loading && tab === 'transacoes' && (
        <div style={{ display: 'grid', gap: 8 }}>
          {(data?.transacoes ?? []).length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#475569' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>💰</div>
              <p style={{ fontWeight: 600 }}>Nenhuma transação registrada</p>
              <p style={{ fontSize: 13 }}>Registre compras e vendas para calcular margem por cabeça e custo real</p>
            </div>
          ) : (data?.transacoes ?? []).map((t: any) => {
            const isVenda = t.tipo.includes('VENDA')
            const corTipo = TIPO_COLOR[t.tipo] ?? '#64748b'
            return (
              <div key={t.id} style={{ background: '#111827', border: `1px solid ${corTipo}30`, borderRadius: 12, padding: '14px 18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 11, padding: '2px 9px', borderRadius: 20, background: corTipo + '20', color: corTipo, fontWeight: 700 }}>
                      {TIPO_LABEL[t.tipo]}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>{t.contraparte || '—'}</span>
                  </div>
                  <span style={{ fontSize: 15, fontWeight: 800, color: isVenda ? '#10b981' : '#f87171' }}>
                    {isVenda ? '+' : '-'}R${t.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, color: '#64748b' }}>{new Date(t.data).toLocaleDateString('pt-BR')}</span>
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>🐂 {t.cabecas} cabeças</span>
                  {t.pesoTotal && <span style={{ fontSize: 11, color: '#94a3b8' }}>⚖️ {t.pesoTotal} kg</span>}
                  {t.valorArroba && <span style={{ fontSize: 11, color: '#fbbf24' }}>@ R${t.valorArroba}</span>}
                  {t.gta && <span style={{ fontSize: 11, color: '#475569' }}>GTA: {t.gta}</span>}
                  {t.comissao > 0 && <span style={{ fontSize: 11, color: '#f87171' }}>Comissão: R${t.comissao}</span>}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Valuation histórico */}
      {!loading && tab === 'valuation' && (
        <div style={{ background: '#111827', border: '1px solid #1e293b', borderRadius: 14, padding: '20px 22px' }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8', marginBottom: 14 }}>Último Valuation do Rebanho</h3>
          {!valuation ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#475569' }}>
              <p>Nenhum valuation calculado ainda.</p>
              <p style={{ fontSize: 13 }}>Clique em "Calcular Valuation" para estimar o valor atual do rebanho.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              {[
                { l: 'Total de Animais', v: `${valuation.totalAnimais} cabeças`, c: '#a78bfa' },
                { l: 'Peso Total', v: `${valuation.pesoTotalKg.toFixed(0)} kg`, c: '#60a5fa' },
                { l: 'Total Arrobas', v: `${valuation.totalArrobas.toFixed(1)} @`, c: '#fbbf24' },
                { l: 'Preço Referência', v: `R$${valuation.valorArrobaRef}/@`, c: '#94a3b8' },
                { l: 'Valor Estimado do Rebanho', v: `R$${valuation.valorTotalEstimado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, c: '#10b981' },
                { l: 'Data do Cálculo', v: new Date(valuation.data).toLocaleString('pt-BR'), c: '#64748b' },
              ].map(k => (
                <div key={k.l} style={{ padding: '12px 14px', background: '#0f172a', borderRadius: 10, border: '1px solid #1e293b' }}>
                  <div style={{ fontSize: 10, color: '#475569', marginBottom: 3 }}>{k.l}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: k.c }}>{k.v}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modais */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16, overflowY: 'auto' }}>
          <div style={{ background: '#111827', border: '1px solid #1e293b', borderRadius: 16, padding: 28, width: '100%', maxWidth: 480, margin: 'auto' }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>
              {showForm === 'valuation' ? 'Calcular Valuation do Rebanho' : 'Nova Transação de Gado'}
            </h2>
            <form onSubmit={salvar} style={{ display: 'grid', gap: 12 }}>
              {showForm === 'valuation' ? (
                <div>
                  <label style={{ fontSize: 12, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Preço de referência (R$/@)</label>
                  <input value={arrobaRef} onChange={e => setArrobaRef(e.target.value)} placeholder="320"
                    style={{ width: '100%', background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, padding: '9px 12px', color: '#f1f5f9', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                  <p style={{ fontSize: 11, color: '#475569', marginTop: 6 }}>
                    Informe o preço atual da arroba de boi gordo na sua região (consulte CEPEA/ESALQ).
                  </p>
                </div>
              ) : (
                <>
                  <div>
                    <label style={{ fontSize: 12, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Tipo *</label>
                    <select value={form.tipo} onChange={e => setForm(p => ({ ...p, tipo: e.target.value }))}
                      style={{ width: '100%', background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, padding: '9px 12px', color: '#f1f5f9', fontSize: 13, outline: 'none' }}>
                      {Object.entries(TIPO_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </div>
                  {[
                    { l: 'Nº de cabeças *', k: 'cabecas', p: '50' },
                    { l: 'Peso total (kg)', k: 'pesoTotal', p: '22500' },
                    { l: 'Valor da arroba (R$)', k: 'valorArroba', p: '320' },
                    { l: 'Valor total (R$) *', k: 'valorTotal', p: '480000' },
                    { l: 'Contraparte', k: 'contraparte', p: 'Nome do comprador/vendedor' },
                    { l: 'GTA', k: 'gta', p: 'Nº Guia de Trânsito Animal' },
                    { l: 'Comissão (R$)', k: 'comissao', p: '0' },
                    { l: 'Observação', k: 'observacao', p: 'Detalhes da transação' },
                  ].map(f => (
                    <div key={f.k}>
                      <label style={{ fontSize: 12, color: '#94a3b8', display: 'block', marginBottom: 4 }}>{f.l}</label>
                      <input value={form[f.k as keyof typeof form]} placeholder={f.p} required={f.l.includes('*')}
                        onChange={e => setForm(p => {
                          const updated = { ...p, [f.k]: e.target.value }
                          if (f.k === 'pesoTotal' || f.k === 'valorArroba') {
                            const vt = calcValorTotal(updated)
                            return { ...updated, valorTotal: vt }
                          }
                          return updated
                        })}
                        style={{ width: '100%', background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, padding: '9px 12px', color: '#f1f5f9', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                    </div>
                  ))}
                </>
              )}
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button type="button" onClick={() => setShowForm(null)}
                  style={{ flex: 1, background: 'transparent', border: '1px solid #1e293b', borderRadius: 10, padding: 10, color: '#94a3b8', fontSize: 13, cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" disabled={saving}
                  style={{ flex: 1, background: '#a78bfa', color: '#fff', border: 'none', borderRadius: 10, padding: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
                  {saving ? 'Salvando...' : showForm === 'valuation' ? 'Calcular' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

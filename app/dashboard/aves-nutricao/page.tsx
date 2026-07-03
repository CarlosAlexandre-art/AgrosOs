'use client'

import { useState, useEffect, useCallback } from 'react'
import { useModoIniciante, ModoInicianteToggle, Dica, GuiaRapido, Benchmark } from '@/components/aves/AvesHelpers'
import { AvesNav } from '@/components/aves/AvesNav'

type LoteResumo = { id: string; nome: string; especie: string; quantidadeAtual: number; faseProducao: string }
type Arracoamento = {
  id: string; data: string; tipoRacao: string | null; faseAlimentar: string | null
  quantidadeKg: number; custoKg: number | null; aguaConsumidaL: number | null; observacao: string | null
  lote: { nome: string; especie: string; quantidadeAtual: number }
}
type Kpis = { consumoMedioAveG: number; custoTotal7dias: number; lotesAtivos: number }

export default function AvesNutricaoPage() {
  const [modoIniciante, setModoIniciante] = useModoIniciante()
  const [lotes, setLotes] = useState<LoteResumo[]>([])
  const [arracoamentos, setArracoamentos] = useState<Arracoamento[]>([])
  const [kpis, setKpis] = useState<Kpis | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ loteId: '', data: '', tipoRacao: '', faseAlimentar: '', quantidadeKg: '', custoKg: '', aguaConsumidaL: '', observacao: '' })

  const carregar = useCallback(() => {
    setLoading(true)
    fetch('/api/aves-nutricao')
      .then(r => r.json())
      .then(d => { setLotes(d.lotes ?? []); setArracoamentos(d.arracoamentos ?? []); setKpis(d.kpis ?? null) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { carregar() }, [carregar])

  async function registrar(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    await fetch('/api/aves-nutricao', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setSaving(false)
    setForm({ loteId: form.loteId, data: '', tipoRacao: form.tipoRacao, faseAlimentar: form.faseAlimentar, quantidadeKg: '', custoKg: form.custoKg, aguaConsumidaL: '', observacao: '' })
    carregar()
  }

  const inputStyle: React.CSSProperties = { background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, padding: '10px 13px', color: '#f1f5f9', fontSize: 13, width: '100%', outline: 'none' }
  const labelStyle: React.CSSProperties = { fontSize: 12, color: '#64748b', fontWeight: 600, marginBottom: 4, display: 'block' }

  const consumoPorAve = (a: Arracoamento) => a.lote.quantidadeAtual > 0 ? ((a.quantidadeKg * 1000) / a.lote.quantidadeAtual).toFixed(1) : '—'

  return (
    <div style={{ background: '#0a0e1a', minHeight: '100vh', padding: '28px 24px', color: '#f1f5f9' }}>

      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #65a30d, #4d7c0f)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🌾</div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9', lineHeight: 1 }}>AvesNutrição</h1>
            <p style={{ fontSize: 13, color: '#64748b', marginTop: 3 }}>Consumo de ração e custo alimentar por lote</p>
          </div>
        </div>
        <ModoInicianteToggle ativo={modoIniciante} onChange={setModoIniciante} />
      </div>

      <AvesNav />

      <Dica ativo={modoIniciante}>
        Ração é o maior custo da criação (costuma passar de 60-70% do custo total). Registrar todo arraçoamento aqui ajuda a enxergar se o consumo por ave está dentro do esperado pra fase — consumo muito acima ou abaixo pode indicar desperdício, comedouro mal ajustado ou problema de saúde no lote.
      </Dica>

      {kpis && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, margin: '16px 0 20px' }}>
          {[
            { label: 'Consumo Médio', value: `${kpis.consumoMedioAveG}g`, sub: 'por ave/dia (7 dias)', color: '#65a30d' },
            { label: 'Custo com Ração', value: `R$ ${kpis.custoTotal7dias.toLocaleString('pt-BR')}`, sub: 'últimos 7 registros', color: '#84cc16' },
            { label: 'Lotes Ativos', value: kpis.lotesAtivos, sub: 'sendo alimentados', color: '#a3e635' },
          ].map(k => (
            <div key={k.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '18px 20px' }}>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{k.label}</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: k.color, lineHeight: 1 }}>{k.value}</div>
              <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>{k.sub}</div>
            </div>
          ))}
        </div>
      )}

      {kpis && (
        <div style={{ marginBottom: 20 }}>
          <Benchmark
            label="Consumo por ave/dia vs. mercado (fase adulta)"
            valor={`${kpis.consumoMedioAveG}g`}
            referencia="110–120g/ave/dia"
            dentro={kpis.consumoMedioAveG >= 100 && kpis.consumoMedioAveG <= 130}
          />
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 380px) 1fr', gap: 20, alignItems: 'flex-start' }}>
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 22 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, color: '#f1f5f9' }}>Registrar Arraçoamento</h2>
          <form onSubmit={registrar} style={{ display: 'grid', gap: 12 }}>
            <div><label style={labelStyle}>Lote *</label>
              <select style={inputStyle} value={form.loteId} onChange={e => setForm(p => ({ ...p, loteId: e.target.value }))} required>
                <option value="">Selecionar lote...</option>
                {lotes.map(l => <option key={l.id} value={l.id}>{l.nome} ({l.especie})</option>)}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div><label style={labelStyle}>Tipo de ração</label><input style={inputStyle} value={form.tipoRacao} onChange={e => setForm(p => ({ ...p, tipoRacao: e.target.value }))} placeholder="Postura, Recria..." /></div>
              <div><label style={labelStyle}>Fase</label>
                <input style={inputStyle} list="fases-racao" value={form.faseAlimentar} onChange={e => setForm(p => ({ ...p, faseAlimentar: e.target.value }))} placeholder="Pré-inicial, inicial..." />
                <datalist id="fases-racao">
                  <option value="Pré-inicial" /><option value="Inicial" /><option value="Recria 1" /><option value="Recria 2" /><option value="Pré-postura" /><option value="Postura" />
                </datalist>
              </div>
            </div>
            <div><label style={labelStyle}>Quantidade (kg) *</label><input style={inputStyle} type="number" step="0.01" value={form.quantidadeKg} onChange={e => setForm(p => ({ ...p, quantidadeKg: e.target.value }))} placeholder="45" required /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div><label style={labelStyle}>Custo/kg (R$)</label><input style={inputStyle} type="number" step="0.01" value={form.custoKg} onChange={e => setForm(p => ({ ...p, custoKg: e.target.value }))} placeholder="2.10" /></div>
              <div><label style={labelStyle}>Água consumida (L)</label><input style={inputStyle} type="number" step="0.1" value={form.aguaConsumidaL} onChange={e => setForm(p => ({ ...p, aguaConsumidaL: e.target.value }))} /></div>
            </div>
            <div><label style={labelStyle}>Data</label><input style={inputStyle} type="date" value={form.data} onChange={e => setForm(p => ({ ...p, data: e.target.value }))} /></div>
            <div><label style={labelStyle}>Observação</label><textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 50 }} value={form.observacao} onChange={e => setForm(p => ({ ...p, observacao: e.target.value }))} /></div>
            <button type="submit" disabled={saving || !lotes.length} style={{ background: '#65a30d', color: '#fff', border: 'none', borderRadius: 10, padding: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: saving || !lotes.length ? 0.6 : 1 }}>
              {saving ? 'Salvando...' : 'Registrar'}
            </button>
            {!lotes.length && !loading && <div style={{ fontSize: 12, color: '#f87171', textAlign: 'center' }}>Cadastre um lote em AvesGestão primeiro</div>}
          </form>
        </div>

        <div>
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, color: '#f1f5f9' }}>Histórico de Arraçoamento</h2>
          {loading && <div style={{ height: 3, background: 'linear-gradient(90deg,#65a30d,#a3e635)', borderRadius: 2, marginBottom: 12, opacity: 0.8 }} />}
          {arracoamentos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#475569', background: 'rgba(255,255,255,0.02)', borderRadius: 16, border: '1px dashed rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🌾</div>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Nenhum registro ainda</div>
              <div style={{ fontSize: 13 }}>Registre o consumo de ração de hoje ao lado</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {arracoamentos.map(a => (
                <div key={a.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                  <div style={{ flex: '1 1 160px' }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#f1f5f9' }}>{a.lote.nome}</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>{new Date(a.data).toLocaleDateString('pt-BR')}{a.tipoRacao ? ` · ${a.tipoRacao}` : ''}</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 17, fontWeight: 800, color: '#84cc16' }}>{a.quantidadeKg}kg</div>
                    <div style={{ fontSize: 10, color: '#475569' }}>total</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 17, fontWeight: 800, color: '#a3e635' }}>{consumoPorAve(a)}g</div>
                    <div style={{ fontSize: 10, color: '#475569' }}>por ave</div>
                  </div>
                  {a.custoKg && (
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#94a3b8' }}>R$ {(a.quantidadeKg * a.custoKg).toFixed(2)}</div>
                      <div style={{ fontSize: 10, color: '#475569' }}>custo</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <GuiaRapido titulo="Referência: ração até o início da postura">
        Do 1º dia de vida até o início da postura, o consumo médio fica em torno de <strong style={{ color: '#a3e635' }}>8kg de ração por ave</strong>,
        divididos em 5 formulações (pré-inicial, inicial, recria 1, recria 2, pré-postura) — as rações iniciais custam mais caro e vão baixando de preço ao longo do crescimento.
        Com ração a R$2,50/kg, um lote de 100 aves custa cerca de <strong style={{ color: '#a3e635' }}>R$2.000</strong> nesse período. Use isso como referência de orçamento antes de alojar um novo lote.
      </GuiaRapido>
    </div>
  )
}

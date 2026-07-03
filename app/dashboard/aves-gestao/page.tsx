'use client'

import { useState, useEffect, useCallback } from 'react'

type Lote = {
  id: string; nome: string; especie: string; linhagem: string | null; instalacao: string | null
  quantidadeInicial: number; quantidadeAtual: number; faseProducao: string; status: string
  dataAlojamento: string; dataInicioPostura: string | null
  producoesOvos: { ovosColetados: number; data: string }[]
  _count: { mortalidades: number; sanidades: number }
}
type Kpis = { totalLotes: number; lotesAtivos: number; totalAves: number; lotesEmPostura: number }

const ESPECIES = ['Galinha Poedeira', 'Codorna', 'Galinha Caipira/Corte', 'Pato', 'Peru/Perua', 'Ganso', 'Outro']
const FASES = ['CRIA', 'RECRIA', 'POSTURA', 'DESCARTE']
const FASE_LABEL: Record<string, string> = { CRIA: 'Cria', RECRIA: 'Recria', POSTURA: 'Postura', DESCARTE: 'Descarte' }
const FASE_COR: Record<string, string> = { CRIA: '#38bdf8', RECRIA: '#a78bfa', POSTURA: '#f59e0b', DESCARTE: '#64748b' }

export default function AvesGestaoPage() {
  const [lotes, setLotes] = useState<Lote[]>([])
  const [kpis, setKpis] = useState<Kpis | null>(null)
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    nome: '', especie: 'Galinha Poedeira', linhagem: '', instalacao: '', quantidadeInicial: '',
    idadeInicialDias: '', dataAlojamento: '', faseProducao: 'CRIA', observacao: '',
  })

  const carregar = useCallback(() => {
    setLoading(true)
    fetch('/api/aves-gestao')
      .then(r => r.json())
      .then(d => { setLotes(d.lotes ?? []); setKpis(d.kpis ?? null) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { carregar() }, [carregar])

  async function salvar(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    await fetch('/api/aves-gestao', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'lote', ...form }) })
    setSaving(false); setModal(false)
    setForm({ nome: '', especie: 'Galinha Poedeira', linhagem: '', instalacao: '', quantidadeInicial: '', idadeInicialDias: '', dataAlojamento: '', faseProducao: 'CRIA', observacao: '' })
    carregar()
  }

  async function mudarFase(loteId: string, faseProducao: string) {
    await fetch('/api/aves-gestao', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'atualizar_fase', loteId, faseProducao }) })
    carregar()
  }

  async function encerrar(loteId: string) {
    if (!confirm('Encerrar este lote?')) return
    await fetch('/api/aves-gestao', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'encerrar_lote', loteId }) })
    carregar()
  }

  const inputStyle: React.CSSProperties = { background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, padding: '10px 13px', color: '#f1f5f9', fontSize: 13, width: '100%', outline: 'none' }
  const labelStyle: React.CSSProperties = { fontSize: 12, color: '#64748b', fontWeight: 600, marginBottom: 4, display: 'block' }

  const lotesAtivos = lotes.filter(l => l.status === 'ATIVO')

  return (
    <div style={{ background: '#0a0e1a', minHeight: '100vh', padding: '28px 24px', color: '#f1f5f9' }}>

      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #d97706, #b45309)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🐔</div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9', lineHeight: 1 }}>AvesGestão</h1>
            <p style={{ fontSize: 13, color: '#64748b', marginTop: 3 }}>Lotes, galpões e ciclo produtivo de poedeiras e codornas</p>
          </div>
        </div>
      </div>

      {kpis && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 28 }}>
          {[
            { label: 'Lotes Ativos', value: kpis.lotesAtivos, sub: `${kpis.totalLotes} no total`, color: '#d97706' },
            { label: 'Total de Aves', value: kpis.totalAves.toLocaleString('pt-BR'), sub: 'no plantel', color: '#f59e0b' },
            { label: 'Em Postura', value: kpis.lotesEmPostura, sub: 'lotes produzindo', color: '#fbbf24' },
          ].map(k => (
            <div key={k.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '18px 20px' }}>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{k.label}</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: k.color, lineHeight: 1 }}>{k.value}</div>
              <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>{k.sub}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
        <button onClick={() => setModal(true)} style={{ background: '#d97706', color: '#fff', border: 'none', borderRadius: 10, padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          + Novo Lote
        </button>
      </div>

      {loading && <div style={{ height: 3, background: 'linear-gradient(90deg,#d97706,#f59e0b)', borderRadius: 2, marginBottom: 4, opacity: 0.8 }} />}

      {lotesAtivos.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#475569', background: 'rgba(255,255,255,0.02)', borderRadius: 16, border: '1px dashed rgba(255,255,255,0.08)' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🥚</div>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Nenhum lote cadastrado</div>
          <div style={{ fontSize: 13 }}>Cadastre seu primeiro lote de galinhas poedeiras ou codornas</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {lotesAtivos.map(l => (
            <div key={l.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: '#f1f5f9' }}>{l.nome}</div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{l.especie}{l.linhagem ? ` · ${l.linhagem}` : ''}</div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: `${FASE_COR[l.faseProducao]}22`, color: FASE_COR[l.faseProducao] }}>
                  {FASE_LABEL[l.faseProducao]}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
                <div style={{ fontSize: 12, color: '#64748b' }}>Plantel: <span style={{ color: '#94a3b8' }}>{l.quantidadeAtual.toLocaleString('pt-BR')} aves</span></div>
                {l.instalacao && <div style={{ fontSize: 12, color: '#64748b' }}>Local: <span style={{ color: '#94a3b8' }}>{l.instalacao}</span></div>}
                <div style={{ fontSize: 12, color: '#64748b' }}>Mortes: <span style={{ color: '#94a3b8' }}>{l._count.mortalidades}</span></div>
                <div style={{ fontSize: 12, color: '#64748b' }}>Sanidade: <span style={{ color: '#94a3b8' }}>{l._count.sanidades} registros</span></div>
              </div>
              {l.producoesOvos[0] && (
                <div style={{ fontSize: 12, color: '#475569', marginBottom: 12 }}>
                  Última postura: <span style={{ color: '#fbbf24', fontWeight: 700 }}>{l.producoesOvos[0].ovosColetados} ovos</span>
                </div>
              )}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <select value={l.faseProducao} onChange={e => mudarFase(l.id, e.target.value)} style={{ ...inputStyle, flex: 1, fontSize: 12, padding: '6px 10px' }}>
                  {FASES.map(f => <option key={f} value={f}>{FASE_LABEL[f]}</option>)}
                </select>
                <button onClick={() => encerrar(l.id)} style={{ background: 'transparent', border: '1px solid #1e293b', borderRadius: 8, padding: '6px 12px', color: '#94a3b8', fontSize: 12, cursor: 'pointer' }}>Encerrar</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 20 }}>
          <div style={{ background: '#111827', border: '1px solid #1e293b', borderRadius: 18, padding: 28, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: 17, fontWeight: 800, marginBottom: 20, color: '#f1f5f9' }}>Novo Lote de Aves</h2>
            <form onSubmit={salvar} style={{ display: 'grid', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><label style={labelStyle}>Nome do Lote *</label><input style={inputStyle} value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} placeholder="Galpão 1 - Poedeiras" required /></div>
                <div><label style={labelStyle}>Espécie *</label>
                  <select style={inputStyle} value={form.especie} onChange={e => setForm(p => ({ ...p, especie: e.target.value }))}>
                    {ESPECIES.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><label style={labelStyle}>Linhagem</label><input style={inputStyle} value={form.linhagem} onChange={e => setForm(p => ({ ...p, linhagem: e.target.value }))} placeholder="Ex: Lohmann Brown, Hy-Line, Japonesa" /></div>
                <div><label style={labelStyle}>Instalação / Galpão</label><input style={inputStyle} value={form.instalacao} onChange={e => setForm(p => ({ ...p, instalacao: e.target.value }))} placeholder="Galpão A" /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><label style={labelStyle}>Quantidade inicial *</label><input style={inputStyle} type="number" value={form.quantidadeInicial} onChange={e => setForm(p => ({ ...p, quantidadeInicial: e.target.value }))} placeholder="500" required /></div>
                <div><label style={labelStyle}>Idade inicial (dias)</label><input style={inputStyle} type="number" value={form.idadeInicialDias} onChange={e => setForm(p => ({ ...p, idadeInicialDias: e.target.value }))} placeholder="120" /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><label style={labelStyle}>Data de alojamento</label><input style={inputStyle} type="date" value={form.dataAlojamento} onChange={e => setForm(p => ({ ...p, dataAlojamento: e.target.value }))} /></div>
                <div><label style={labelStyle}>Fase atual</label>
                  <select style={inputStyle} value={form.faseProducao} onChange={e => setForm(p => ({ ...p, faseProducao: e.target.value }))}>
                    {FASES.map(f => <option key={f} value={f}>{FASE_LABEL[f]}</option>)}
                  </select>
                </div>
              </div>
              <div><label style={labelStyle}>Observação</label><textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 60 }} value={form.observacao} onChange={e => setForm(p => ({ ...p, observacao: e.target.value }))} /></div>
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button type="button" onClick={() => setModal(false)} style={{ flex: 1, background: 'transparent', border: '1px solid #1e293b', borderRadius: 10, padding: 11, color: '#94a3b8', fontSize: 13, cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" disabled={saving} style={{ flex: 1, background: '#d97706', color: '#fff', border: 'none', borderRadius: 10, padding: 11, fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>{saving ? 'Salvando...' : 'Criar Lote'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

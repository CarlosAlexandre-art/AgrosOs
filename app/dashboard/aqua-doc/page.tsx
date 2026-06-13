'use client'

import { useState, useEffect, useCallback } from 'react'

type Doc = { id: string; tipo: string; numero: string | null; orgao: string | null; emissao: string | null; vencimento: string | null; status: string; observacao: string | null }
type DocPadrao = { tipo: string; label: string; orgao: string }
type Kpis = { total: number; vencendo: number; vencidos: number; vigentes: number }

const TIPO_CONFIG: Record<string, { label: string; color: string; desc: string }> = {
  RGP: { label: 'RGP', color: '#06b6d4', desc: 'Registro Geral da Pesca' },
  LICENCA_AMBIENTAL: { label: 'Lic. Ambiental', color: '#10b981', desc: 'IBAMA / SEMA' },
  OUTORGA_AGUA: { label: 'Outorga da Água', color: '#0891b2', desc: 'ANA / DAEE' },
  DIPOA: { label: 'DIPOA', color: '#7c3aed', desc: 'Inspeção Federal' },
  CFMV: { label: 'CFMV', color: '#f59e0b', desc: 'Resp. Técnico' },
  GTA: { label: 'GTA', color: '#ef4444', desc: 'Trânsito Animal' },
}

function docStatus(vencimento: string | null) {
  if (!vencimento) return { label: 'Sem vencimento', color: '#475569', bg: 'rgba(71,85,105,0.1)' }
  const diff = Math.ceil((new Date(vencimento).getTime() - Date.now()) / 86400000)
  if (diff < 0) return { label: 'Vencido', color: '#f87171', bg: 'rgba(239,68,68,0.1)' }
  if (diff <= 30) return { label: `Vence em ${diff}d`, color: '#fbbf24', bg: 'rgba(251,191,36,0.1)' }
  return { label: `Válido (${diff}d)`, color: '#34d399', bg: 'rgba(16,185,129,0.1)' }
}

export default function AquaDocPage() {
  const [docs, setDocs] = useState<Doc[]>([])
  const [docsPadrao, setDocsPadrao] = useState<DocPadrao[]>([])
  const [kpis, setKpis] = useState<Kpis | null>(null)
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ tipo: '', numero: '', orgao: '', emissao: '', vencimento: '', observacao: '' })

  const carregar = useCallback(() => {
    setLoading(true)
    fetch('/api/aqua-doc')
      .then(r => r.json())
      .then(d => { setDocs(d.documentos ?? []); setDocsPadrao(d.docsPadrao ?? []); setKpis(d.kpis ?? null) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { carregar() }, [carregar])

  function selecionarTipoDoc(tipo: string) {
    const dp = docsPadrao.find(d => d.tipo === tipo)
    setForm(p => ({ ...p, tipo, orgao: dp?.orgao || '' }))
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    await fetch('/api/aqua-doc', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setSaving(false); setModal(false); setForm({ tipo: '', numero: '', orgao: '', emissao: '', vencimento: '', observacao: '' }); carregar()
  }

  const tiposJaCadastrados = new Set(docs.map(d => d.tipo))
  const tiposFaltando = docsPadrao.filter(d => !tiposJaCadastrados.has(d.tipo))

  const inputStyle: React.CSSProperties = { background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, padding: '10px 13px', color: '#f1f5f9', fontSize: 13, width: '100%', outline: 'none' }
  const labelStyle: React.CSSProperties = { fontSize: 12, color: '#64748b', fontWeight: 600, marginBottom: 4, display: 'block' }

  return (
    <div style={{ background: '#0a0e1a', minHeight: '100vh', padding: '28px 24px', color: '#f1f5f9' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #475569, #0891b2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
        </div>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9', lineHeight: 1 }}>AquaDoc</h1>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 3 }}>Licenças, registros e documentação regulatória</p>
        </div>
      </div>

      {/* KPIs */}
      {kpis && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 14, marginBottom: 28 }}>
          {[
            { label: 'Total Docs', value: kpis.total, color: '#94a3b8' },
            { label: 'Vigentes', value: kpis.vigentes, color: '#34d399' },
            { label: 'Vencendo (30d)', value: kpis.vencendo, color: kpis.vencendo > 0 ? '#fbbf24' : '#34d399' },
            { label: 'Vencidos', value: kpis.vencidos, color: kpis.vencidos > 0 ? '#f87171' : '#34d399' },
          ].map(k => (
            <div key={k.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '14px 16px' }}>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{k.label}</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: k.color }}>{k.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Alerta documentos faltando */}
      {tiposFaltando.length > 0 && (
        <div style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 14, padding: 16, marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#fbbf24', marginBottom: 10 }}>⚠ Documentos recomendados não cadastrados</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {tiposFaltando.map(d => (
              <button key={d.tipo} onClick={() => { selecionarTipoDoc(d.tipo); setModal(true) }}
                style={{ padding: '6px 12px', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)', color: '#fbbf24', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                + {TIPO_CONFIG[d.tipo]?.desc || d.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
        <button onClick={() => setModal(true)} style={{ background: '#0891b2', color: '#fff', border: 'none', borderRadius: 10, padding: '8px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>+ Adicionar Documento</button>
      </div>

      {loading && <div style={{ textAlign: 'center', padding: 60, color: '#475569' }}>Carregando...</div>}

      {!loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {docs.length === 0 ? (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 60, color: '#475569', background: 'rgba(255,255,255,0.02)', borderRadius: 16, border: '1px dashed rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
              <div style={{ fontWeight: 700 }}>Nenhum documento cadastrado</div>
              <div style={{ fontSize: 13, marginTop: 6 }}>Cadastre os documentos de regularização da sua piscicultura</div>
            </div>
          ) : docs.map(doc => {
            const cfg = TIPO_CONFIG[doc.tipo]
            const st = docStatus(doc.vencimento)
            return (
              <div key={doc.id} style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid rgba(255,255,255,0.07)`, borderRadius: 16, padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: `rgba(${cfg?.color === '#06b6d4' ? '6,182,212' : cfg?.color === '#10b981' ? '16,185,129' : cfg?.color === '#7c3aed' ? '124,58,237' : '245,158,11'},0.15)`, color: cfg?.color || '#94a3b8', display: 'inline-block', marginBottom: 6 }}>
                      {cfg?.label || doc.tipo}
                    </span>
                    <div style={{ fontWeight: 700, color: '#f1f5f9', fontSize: 14 }}>{cfg?.desc || doc.tipo}</div>
                    {doc.orgao && <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{doc.orgao}</div>}
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 8, background: st.bg, color: st.color, whiteSpace: 'nowrap', marginLeft: 8 }}>{st.label}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  {doc.numero && <div><div style={{ fontSize: 11, color: '#475569' }}>Número</div><div style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8' }}>{doc.numero}</div></div>}
                  {doc.emissao && <div><div style={{ fontSize: 11, color: '#475569' }}>Emissão</div><div style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8' }}>{new Date(doc.emissao).toLocaleDateString('pt-BR')}</div></div>}
                  {doc.vencimento && <div><div style={{ fontSize: 11, color: '#475569' }}>Vencimento</div><div style={{ fontSize: 13, fontWeight: 600, color: st.color }}>{new Date(doc.vencimento).toLocaleDateString('pt-BR')}</div></div>}
                </div>
                {doc.observacao && <div style={{ fontSize: 12, color: '#64748b', marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.04)' }}>{doc.observacao}</div>}
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 20 }}>
          <div style={{ background: '#111827', border: '1px solid #1e293b', borderRadius: 18, padding: 28, width: '100%', maxWidth: 480 }}>
            <h2 style={{ fontSize: 17, fontWeight: 800, marginBottom: 20, color: '#f1f5f9' }}>Adicionar Documento</h2>
            <form onSubmit={salvar} style={{ display: 'grid', gap: 14 }}>
              <div><label style={labelStyle}>Tipo de Documento *</label>
                <select style={inputStyle} value={form.tipo} onChange={e => selecionarTipoDoc(e.target.value)} required>
                  <option value="">Selecionar tipo...</option>
                  {docsPadrao.map(d => <option key={d.tipo} value={d.tipo}>{TIPO_CONFIG[d.tipo]?.desc || d.label}</option>)}
                  <option value="OUTRO">Outro</option>
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><label style={labelStyle}>Número / Protocolo</label><input style={inputStyle} value={form.numero} onChange={e => setForm(p => ({ ...p, numero: e.target.value }))} placeholder="Nº do documento" /></div>
                <div><label style={labelStyle}>Órgão Emissor</label><input style={inputStyle} value={form.orgao} onChange={e => setForm(p => ({ ...p, orgao: e.target.value }))} placeholder="IBAMA, MAPA..." /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><label style={labelStyle}>Data de Emissão</label><input style={inputStyle} type="date" value={form.emissao} onChange={e => setForm(p => ({ ...p, emissao: e.target.value }))} /></div>
                <div><label style={labelStyle}>Vencimento</label><input style={inputStyle} type="date" value={form.vencimento} onChange={e => setForm(p => ({ ...p, vencimento: e.target.value }))} /></div>
              </div>
              <div><label style={labelStyle}>Observação</label><textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 60 }} value={form.observacao} onChange={e => setForm(p => ({ ...p, observacao: e.target.value }))} /></div>
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button type="button" onClick={() => setModal(false)} style={{ flex: 1, background: 'transparent', border: '1px solid #1e293b', borderRadius: 10, padding: 11, color: '#94a3b8', fontSize: 13, cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" disabled={saving} style={{ flex: 1, background: '#0891b2', color: '#fff', border: 'none', borderRadius: 10, padding: 11, fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>{saving ? 'Salvando...' : 'Salvar Documento'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

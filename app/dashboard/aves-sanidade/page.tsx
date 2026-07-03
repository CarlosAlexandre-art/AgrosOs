'use client'

import { useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react'

type LoteResumo = { id: string; nome: string; especie: string; quantidadeAtual: number }
type Mortalidade = { id: string; data: string; quantidade: number; causaSuspeita: string | null; observacao: string | null; lote: { nome: string; especie: string } }
type Sanidade = {
  id: string; data: string; tipo: string; produto: string; dosagem: string | null
  carenciaDias: number | null; proximaAplicacao: string | null; observacao: string | null
  lote: { nome: string; especie: string }
}
type Choco = {
  id: string; quantidadeAves: number; dataInicio: string; dataFim: string | null
  metodo: string | null; observacao: string | null; lote: { nome: string; especie: string }
}
type Kpis = { totalMortalidade: number; taxaMortalidade: number; proximasAplicacoes: number; emCarencia: number; emChoco: number }

const TIPOS_SANIDADE = ['VACINA', 'MEDICAMENTO', 'VERMIFUGO', 'BIOSSEGURANCA', 'OUTRO']
const TIPO_LABEL: Record<string, string> = { VACINA: 'Vacina', MEDICAMENTO: 'Medicamento', VERMIFUGO: 'Vermífugo', BIOSSEGURANCA: 'Biossegurança', OUTRO: 'Outro' }
const METODOS_CHOCO = ['Separação em ninho à parte', 'Separação + galo no lote', 'Redução da cama de maravalha', 'Ninho com queda de ovo (sem contato)']

export default function AvesSanidadePage() {
  const [tab, setTab] = useState<'mortalidade' | 'sanidade' | 'choco'>('mortalidade')
  const savedScroll = useRef<number | null>(null)
  const scroller = useRef<HTMLElement | null>(null)
  useLayoutEffect(() => { scroller.current = document.querySelector('main') }, [])
  useLayoutEffect(() => {
    if (savedScroll.current !== null && scroller.current) {
      scroller.current.scrollTop = savedScroll.current
      savedScroll.current = null
    }
  }, [tab])
  function changeTab(t: 'mortalidade' | 'sanidade' | 'choco') {
    if (scroller.current) savedScroll.current = scroller.current.scrollTop
    setTab(t)
  }

  const [lotes, setLotes] = useState<LoteResumo[]>([])
  const [mortalidades, setMortalidades] = useState<Mortalidade[]>([])
  const [sanidades, setSanidades] = useState<Sanidade[]>([])
  const [chocos, setChocos] = useState<Choco[]>([])
  const [kpis, setKpis] = useState<Kpis | null>(null)
  const [loading, setLoading] = useState(true)
  const [modalMort, setModalMort] = useState(false)
  const [modalSan, setModalSan] = useState(false)
  const [modalChoco, setModalChoco] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formMort, setFormMort] = useState({ loteId: '', quantidade: '', causaSuspeita: '', data: '', observacao: '' })
  const [formSan, setFormSan] = useState({ loteId: '', tipo: 'VACINA', produto: '', dosagem: '', viaAplicacao: '', carenciaDias: '', proximaAplicacao: '', data: '', observacao: '' })
  const [formChoco, setFormChoco] = useState({ loteId: '', quantidadeAves: '', dataInicio: '', metodo: METODOS_CHOCO[0], observacao: '' })

  const carregar = useCallback(() => {
    setLoading(true)
    fetch('/api/aves-sanidade')
      .then(r => r.json())
      .then(d => { setLotes(d.lotes ?? []); setMortalidades(d.mortalidades ?? []); setSanidades(d.sanidades ?? []); setChocos(d.chocos ?? []); setKpis(d.kpis ?? null) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { carregar() }, [carregar])

  async function salvarMort(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    await fetch('/api/aves-sanidade', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'mortalidade', ...formMort }) })
    setSaving(false); setModalMort(false); setFormMort({ loteId: '', quantidade: '', causaSuspeita: '', data: '', observacao: '' }); carregar()
  }

  async function salvarSan(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    await fetch('/api/aves-sanidade', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'sanidade', ...formSan }) })
    setSaving(false); setModalSan(false); setFormSan({ loteId: '', tipo: 'VACINA', produto: '', dosagem: '', viaAplicacao: '', carenciaDias: '', proximaAplicacao: '', data: '', observacao: '' }); carregar()
  }

  async function salvarChoco(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    await fetch('/api/aves-sanidade', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'choco', ...formChoco }) })
    setSaving(false); setModalChoco(false); setFormChoco({ loteId: '', quantidadeAves: '', dataInicio: '', metodo: METODOS_CHOCO[0], observacao: '' }); carregar()
  }

  async function encerrarChoco(chocoId: string) {
    await fetch('/api/aves-sanidade', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'encerrar_choco', chocoId }) })
    carregar()
  }

  const inputStyle: React.CSSProperties = { background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, padding: '10px 13px', color: '#f1f5f9', fontSize: 13, width: '100%', outline: 'none' }
  const labelStyle: React.CSSProperties = { fontSize: 12, color: '#64748b', fontWeight: 600, marginBottom: 4, display: 'block' }

  return (
    <div style={{ background: '#0a0e1a', minHeight: '100vh', padding: '28px 24px', color: '#f1f5f9' }}>

      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #dc2626, #b91c1c)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>💉</div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9', lineHeight: 1 }}>AvesSanidade</h1>
            <p style={{ fontSize: 13, color: '#64748b', marginTop: 3 }}>Mortalidade, vacinas e tratamentos do plantel</p>
          </div>
        </div>
      </div>

      {kpis && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 28 }}>
          {[
            { label: 'Mortalidade Total', value: kpis.totalMortalidade, sub: 'aves', color: '#ef4444' },
            { label: 'Taxa de Mortalidade', value: `${kpis.taxaMortalidade}%`, sub: 'acumulada', color: '#f87171' },
            { label: 'Próximas Aplicações', value: kpis.proximasAplicacoes, sub: 'agendadas', color: '#fbbf24' },
            { label: 'Em Carência', value: kpis.emCarencia, sub: 'tratamentos ativos', color: '#a78bfa' },
            { label: 'Em Choco', value: kpis.emChoco, sub: 'aves separadas agora', color: '#fb923c' },
          ].map(k => (
            <div key={k.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '18px 20px' }}>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{k.label}</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: k.color, lineHeight: 1 }}>{k.value}</div>
              <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>{k.sub}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {(['mortalidade', 'sanidade', 'choco'] as const).map(t => (
          <button key={t} onMouseDown={(e) => e.preventDefault()} onClick={() => changeTab(t)} style={{ padding: '8px 18px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: tab === t ? '#dc2626' : '#111827', color: tab === t ? '#fff' : '#64748b', transition: 'all .15s' }}>
            {t === 'mortalidade' ? 'Mortalidade' : t === 'sanidade' ? 'Vacinas & Tratamentos' : 'Choco'}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        {tab === 'mortalidade' && (
          <button onClick={() => setModalMort(true)} style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: 10, padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>+ Registrar Morte</button>
        )}
        {tab === 'sanidade' && (
          <button onClick={() => setModalSan(true)} style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: 10, padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>+ Nova Aplicação</button>
        )}
        {tab === 'choco' && (
          <button onClick={() => setModalChoco(true)} style={{ background: '#fb923c', color: '#111827', border: 'none', borderRadius: 10, padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>+ Registrar Choco</button>
        )}
      </div>

      {loading && <div style={{ height: 3, background: 'linear-gradient(90deg,#dc2626,#f59e0b)', borderRadius: 2, marginBottom: 4, opacity: 0.8 }} />}

      <div style={{ minHeight: 'calc(100vh - 380px)' }}>
        {tab === 'mortalidade' && (
          mortalidades.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#475569', background: 'rgba(255,255,255,0.02)', borderRadius: 16, border: '1px dashed rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>✅</div>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Nenhuma morte registrada</div>
              <div style={{ fontSize: 13 }}>Ótimo sinal — continue monitorando o plantel</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {mortalidades.map(m => (
                <div key={m.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                  <div style={{ flex: '1 1 160px' }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#f1f5f9' }}>{m.lote.nome}</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>{new Date(m.data).toLocaleDateString('pt-BR')} · {m.lote.especie}</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 17, fontWeight: 800, color: '#ef4444' }}>{m.quantidade}</div>
                    <div style={{ fontSize: 10, color: '#475569' }}>aves</div>
                  </div>
                  {m.causaSuspeita && <div style={{ fontSize: 12, color: '#94a3b8' }}>{m.causaSuspeita}</div>}
                </div>
              ))}
            </div>
          )
        )}

        {tab === 'choco' && (
          <div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 14, padding: '10px 14px', background: 'rgba(251,146,60,0.08)', borderRadius: 10, border: '1px solid rgba(251,146,60,0.15)' }}>
              🐣 Sempre vai ter galinhas chocas no lote, independente da linhagem. Prevenção: ninho com queda do ovo (sem contato com a galinha) e cama de maravalha mais fina. Para tirar do choco: separe em um ninho à parte dentro do galpão (vendo as outras aves), com água e ração à vontade e sem acesso ao ninho — em 3–4 dias a maioria sai do choco. Um galo no lote acelera o processo.
            </div>
            {chocos.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60, color: '#475569', background: 'rgba(255,255,255,0.02)', borderRadius: 16, border: '1px dashed rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>🐣</div>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>Nenhum registro de choco</div>
                <div style={{ fontSize: 13 }}>Registre quando separar aves chocas do lote</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {chocos.map(c => (
                  <div key={c.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                    <div style={{ flex: '1 1 160px' }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: '#f1f5f9' }}>{c.lote.nome}</div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>Desde {new Date(c.dataInicio).toLocaleDateString('pt-BR')}{c.metodo ? ` · ${c.metodo}` : ''}</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 17, fontWeight: 800, color: '#fb923c' }}>{c.quantidadeAves}</div>
                      <div style={{ fontSize: 10, color: '#475569' }}>aves</div>
                    </div>
                    {c.dataFim ? (
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: 'rgba(52,211,153,0.15)', color: '#34d399' }}>
                        Saiu do choco em {new Date(c.dataFim).toLocaleDateString('pt-BR')}
                      </span>
                    ) : (
                      <button onClick={() => encerrarChoco(c.id)} style={{ background: 'rgba(52,211,153,0.15)', color: '#34d399', border: '1px solid rgba(52,211,153,0.3)', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                        Marcar como voltou a produzir
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'sanidade' && (
          sanidades.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#475569', background: 'rgba(255,255,255,0.02)', borderRadius: 16, border: '1px dashed rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>💉</div>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Nenhum registro de sanidade</div>
              <div style={{ fontSize: 13 }}>Registre vacinas, vermífugos e tratamentos aplicados</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {sanidades.map(s => (
                <div key={s.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                  <div style={{ flex: '1 1 160px' }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#f1f5f9' }}>{s.lote.nome}</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>{new Date(s.data).toLocaleDateString('pt-BR')} · {s.lote.especie}</div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: 'rgba(220,38,38,0.15)', color: '#f87171' }}>{TIPO_LABEL[s.tipo]}</span>
                  <div style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 600 }}>{s.produto}</div>
                  {s.dosagem && <div style={{ fontSize: 12, color: '#64748b' }}>{s.dosagem}</div>}
                  {s.proximaAplicacao && (
                    <div style={{ fontSize: 11, color: '#fbbf24' }}>Próxima: {new Date(s.proximaAplicacao).toLocaleDateString('pt-BR')}</div>
                  )}
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {modalMort && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 20 }}>
          <div style={{ background: '#111827', border: '1px solid #1e293b', borderRadius: 18, padding: 28, width: '100%', maxWidth: 480 }}>
            <h2 style={{ fontSize: 17, fontWeight: 800, marginBottom: 20, color: '#f1f5f9' }}>Registrar Mortalidade</h2>
            <form onSubmit={salvarMort} style={{ display: 'grid', gap: 14 }}>
              <div><label style={labelStyle}>Lote *</label>
                <select style={inputStyle} value={formMort.loteId} onChange={e => setFormMort(p => ({ ...p, loteId: e.target.value }))} required>
                  <option value="">Selecionar lote...</option>
                  {lotes.map(l => <option key={l.id} value={l.id}>{l.nome} ({l.especie})</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><label style={labelStyle}>Quantidade *</label><input style={inputStyle} type="number" value={formMort.quantidade} onChange={e => setFormMort(p => ({ ...p, quantidade: e.target.value }))} required /></div>
                <div><label style={labelStyle}>Data</label><input style={inputStyle} type="date" value={formMort.data} onChange={e => setFormMort(p => ({ ...p, data: e.target.value }))} /></div>
              </div>
              <div><label style={labelStyle}>Causa suspeita</label><input style={inputStyle} value={formMort.causaSuspeita} onChange={e => setFormMort(p => ({ ...p, causaSuspeita: e.target.value }))} placeholder="Calor, doença, predador..." /></div>
              <div><label style={labelStyle}>Observação</label><textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 60 }} value={formMort.observacao} onChange={e => setFormMort(p => ({ ...p, observacao: e.target.value }))} /></div>
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button type="button" onClick={() => setModalMort(false)} style={{ flex: 1, background: 'transparent', border: '1px solid #1e293b', borderRadius: 10, padding: 11, color: '#94a3b8', fontSize: 13, cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" disabled={saving} style={{ flex: 1, background: '#dc2626', color: '#fff', border: 'none', borderRadius: 10, padding: 11, fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>{saving ? 'Salvando...' : 'Registrar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalSan && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 20 }}>
          <div style={{ background: '#111827', border: '1px solid #1e293b', borderRadius: 18, padding: 28, width: '100%', maxWidth: 520 }}>
            <h2 style={{ fontSize: 17, fontWeight: 800, marginBottom: 20, color: '#f1f5f9' }}>Nova Vacina / Tratamento</h2>
            <form onSubmit={salvarSan} style={{ display: 'grid', gap: 14 }}>
              <div><label style={labelStyle}>Lote *</label>
                <select style={inputStyle} value={formSan.loteId} onChange={e => setFormSan(p => ({ ...p, loteId: e.target.value }))} required>
                  <option value="">Selecionar lote...</option>
                  {lotes.map(l => <option key={l.id} value={l.id}>{l.nome} ({l.especie})</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><label style={labelStyle}>Tipo</label>
                  <select style={inputStyle} value={formSan.tipo} onChange={e => setFormSan(p => ({ ...p, tipo: e.target.value }))}>
                    {TIPOS_SANIDADE.map(t => <option key={t} value={t}>{TIPO_LABEL[t]}</option>)}
                  </select>
                </div>
                <div><label style={labelStyle}>Produto *</label><input style={inputStyle} value={formSan.produto} onChange={e => setFormSan(p => ({ ...p, produto: e.target.value }))} placeholder="Newcastle, Coriza..." required /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><label style={labelStyle}>Dosagem</label><input style={inputStyle} value={formSan.dosagem} onChange={e => setFormSan(p => ({ ...p, dosagem: e.target.value }))} /></div>
                <div><label style={labelStyle}>Via de aplicação</label><input style={inputStyle} value={formSan.viaAplicacao} onChange={e => setFormSan(p => ({ ...p, viaAplicacao: e.target.value }))} placeholder="Água, ocular, injetável..." /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><label style={labelStyle}>Data</label><input style={inputStyle} type="date" value={formSan.data} onChange={e => setFormSan(p => ({ ...p, data: e.target.value }))} /></div>
                <div><label style={labelStyle}>Carência (dias)</label><input style={inputStyle} type="number" value={formSan.carenciaDias} onChange={e => setFormSan(p => ({ ...p, carenciaDias: e.target.value }))} /></div>
              </div>
              <div><label style={labelStyle}>Próxima aplicação</label><input style={inputStyle} type="date" value={formSan.proximaAplicacao} onChange={e => setFormSan(p => ({ ...p, proximaAplicacao: e.target.value }))} /></div>
              <div><label style={labelStyle}>Observação</label><textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 60 }} value={formSan.observacao} onChange={e => setFormSan(p => ({ ...p, observacao: e.target.value }))} /></div>
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button type="button" onClick={() => setModalSan(false)} style={{ flex: 1, background: 'transparent', border: '1px solid #1e293b', borderRadius: 10, padding: 11, color: '#94a3b8', fontSize: 13, cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" disabled={saving} style={{ flex: 1, background: '#dc2626', color: '#fff', border: 'none', borderRadius: 10, padding: 11, fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>{saving ? 'Salvando...' : 'Registrar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalChoco && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 20 }}>
          <div style={{ background: '#111827', border: '1px solid #1e293b', borderRadius: 18, padding: 28, width: '100%', maxWidth: 480 }}>
            <h2 style={{ fontSize: 17, fontWeight: 800, marginBottom: 20, color: '#f1f5f9' }}>Registrar Choco</h2>
            <form onSubmit={salvarChoco} style={{ display: 'grid', gap: 14 }}>
              <div><label style={labelStyle}>Lote *</label>
                <select style={inputStyle} value={formChoco.loteId} onChange={e => setFormChoco(p => ({ ...p, loteId: e.target.value }))} required>
                  <option value="">Selecionar lote...</option>
                  {lotes.map(l => <option key={l.id} value={l.id}>{l.nome} ({l.especie})</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><label style={labelStyle}>Quantidade de aves *</label><input style={inputStyle} type="number" value={formChoco.quantidadeAves} onChange={e => setFormChoco(p => ({ ...p, quantidadeAves: e.target.value }))} required /></div>
                <div><label style={labelStyle}>Data de início</label><input style={inputStyle} type="date" value={formChoco.dataInicio} onChange={e => setFormChoco(p => ({ ...p, dataInicio: e.target.value }))} /></div>
              </div>
              <div><label style={labelStyle}>Método usado</label>
                <select style={inputStyle} value={formChoco.metodo} onChange={e => setFormChoco(p => ({ ...p, metodo: e.target.value }))}>
                  {METODOS_CHOCO.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div><label style={labelStyle}>Observação</label><textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 60 }} value={formChoco.observacao} onChange={e => setFormChoco(p => ({ ...p, observacao: e.target.value }))} /></div>
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button type="button" onClick={() => setModalChoco(false)} style={{ flex: 1, background: 'transparent', border: '1px solid #1e293b', borderRadius: 10, padding: 11, color: '#94a3b8', fontSize: 13, cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" disabled={saving} style={{ flex: 1, background: '#fb923c', color: '#111827', border: 'none', borderRadius: 10, padding: 11, fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>{saving ? 'Salvando...' : 'Registrar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

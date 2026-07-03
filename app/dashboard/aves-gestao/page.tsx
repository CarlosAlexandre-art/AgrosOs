'use client'

import { useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react'
import { useModoIniciante, ModoInicianteToggle, Dica, GuiaRapido, Benchmark } from '@/components/aves/AvesHelpers'
import { AvesNav } from '@/components/aves/AvesNav'

type Lote = {
  id: string; nome: string; especie: string; linhagem: string | null; instalacao: string | null
  quantidadeInicial: number; quantidadeAtual: number; faseProducao: string; status: string
  dataAlojamento: string; dataInicioPostura: string | null
  areaM2: number | null; peDireitoM: number | null
  numBebedouros: number | null; tipoBebedouro: string | null
  numComedouros: number | null; tipoComedouro: string | null; capacidadeComedouroKg: number | null
  horasLuzMeta: number | null; horasLuzNaturalMeta: number | null; horasLuzArtificialMeta: number | null
  horaAcenderLuz: string | null; horaApagarLuz: string | null
  producoesOvos: { ovosColetados: number; data: string }[]
  _count: { mortalidades: number; sanidades: number }
}
type KpisLotes = { totalLotes: number; lotesAtivos: number; totalAves: number; lotesEmPostura: number; densidadeMedia: number | null }

type LoteResumo = {
  id: string; nome: string; especie: string; quantidadeAtual: number; faseProducao: string
  horasLuzMeta: number | null; horaAcenderLuz: string | null; horaApagarLuz: string | null
}
type Producao = {
  id: string; data: string; ovosColetados: number; ovosQuebrados: number | null; ovosSujos: number | null
  ovosDescartados: number | null; pesoMedioG: number | null; horasLuz: number | null; observacao: string | null
  lote: { nome: string; especie: string; quantidadeAtual: number }
}
type KpisPostura = { ovosHoje: number; taxaPosturaMedia: number; lotesEmPostura: number }

const ESPECIES = ['Galinha Poedeira', 'Codorna', 'Galinha Caipira/Corte', 'Pato', 'Peru/Perua', 'Ganso', 'Outro']
const FASES = ['CRIA', 'RECRIA', 'POSTURA', 'DESCARTE']
const FASE_LABEL: Record<string, string> = { CRIA: 'Cria', RECRIA: 'Recria', POSTURA: 'Postura', DESCARTE: 'Descarte' }
const FASE_COR: Record<string, string> = { CRIA: '#38bdf8', RECRIA: '#a78bfa', POSTURA: '#f59e0b', DESCARTE: '#64748b' }

// Referência para dimensionamento: ~6 aves/m², ninho com 25cm de profundidade
// e 30cm de largura, testeira baixa para os ovos rolarem já limpos para fora.
const LINHAGENS_REFERENCIA = [
  { nome: 'Isa Brown', duziasPorCiclo: 21250 },
  { nome: 'Hy-Line Brown', duziasPorCiclo: 20709 },
  { nome: 'Postura Creme', duziasPorCiclo: 19584 },
  { nome: 'Embrapa 051', duziasPorCiclo: 12500 },
]

const inputStyle: React.CSSProperties = { background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, padding: '10px 13px', color: '#f1f5f9', fontSize: 13, width: '100%', outline: 'none' }
const labelStyle: React.CSSProperties = { fontSize: 12, color: '#64748b', fontWeight: 600, marginBottom: 4, display: 'block' }

export default function AvesGestaoPage() {
  const [modoIniciante, setModoIniciante] = useModoIniciante()
  const [tab, setTab] = useState<'lotes' | 'postura' | 'calculadora'>('lotes')
  const savedScroll = useRef<number | null>(null)
  const scroller = useRef<HTMLElement | null>(null)
  useLayoutEffect(() => { scroller.current = document.querySelector('main') }, [])
  useLayoutEffect(() => {
    if (savedScroll.current !== null && scroller.current) {
      scroller.current.scrollTop = savedScroll.current
      savedScroll.current = null
    }
  }, [tab])
  function changeTab(t: 'lotes' | 'postura' | 'calculadora') {
    if (scroller.current) savedScroll.current = scroller.current.scrollTop
    setTab(t)
  }

  return (
    <div style={{ background: '#0a0e1a', minHeight: '100vh', padding: '28px 24px', color: '#f1f5f9' }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #d97706, #b45309)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🐔</div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9', lineHeight: 1 }}>AvesGestão</h1>
            <p style={{ fontSize: 13, color: '#64748b', marginTop: 3 }}>Lotes, postura diária e planejamento — poedeiras e codornas</p>
          </div>
        </div>
        <ModoInicianteToggle ativo={modoIniciante} onChange={setModoIniciante} />
      </div>

      <AvesNav />

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {(['lotes', 'postura', 'calculadora'] as const).map(t => (
          <button key={t} onMouseDown={(e) => e.preventDefault()} onClick={() => changeTab(t)} style={{ padding: '8px 18px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: tab === t ? '#d97706' : '#111827', color: tab === t ? '#fff' : '#64748b', transition: 'all .15s' }}>
            {t === 'lotes' ? 'Lotes & Galpão' : t === 'postura' ? 'Postura Diária' : 'Calculadora'}
          </button>
        ))}
      </div>

      {tab === 'lotes' && <AbaLotes modoIniciante={modoIniciante} />}
      {tab === 'postura' && <AbaPostura modoIniciante={modoIniciante} />}
      {tab === 'calculadora' && <AbaCalculadora modoIniciante={modoIniciante} />}
    </div>
  )
}

function AbaLotes({ modoIniciante }: { modoIniciante: boolean }) {
  const [lotes, setLotes] = useState<Lote[]>([])
  const [kpis, setKpis] = useState<KpisLotes | null>(null)
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    nome: '', especie: 'Galinha Poedeira', linhagem: '', instalacao: '', quantidadeInicial: '',
    idadeInicialDias: '', dataAlojamento: '', faseProducao: 'CRIA', observacao: '',
    areaM2: '', peDireitoM: '', numBebedouros: '', tipoBebedouro: 'Pendular',
    numComedouros: '', tipoComedouro: 'Tubular', capacidadeComedouroKg: '',
    horasLuzMeta: '16', horasLuzNaturalMeta: '12', horasLuzArtificialMeta: '4',
    horaAcenderLuz: '', horaApagarLuz: '',
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
    setForm({
      nome: '', especie: 'Galinha Poedeira', linhagem: '', instalacao: '', quantidadeInicial: '',
      idadeInicialDias: '', dataAlojamento: '', faseProducao: 'CRIA', observacao: '',
      areaM2: '', peDireitoM: '', numBebedouros: '', tipoBebedouro: 'Pendular',
      numComedouros: '', tipoComedouro: 'Tubular', capacidadeComedouroKg: '',
      horasLuzMeta: '16', horasLuzNaturalMeta: '12', horasLuzArtificialMeta: '4',
      horaAcenderLuz: '', horaApagarLuz: '',
    })
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

  const lotesAtivos = lotes.filter(l => l.status === 'ATIVO')

  return (
    <div>
      <Dica ativo={modoIniciante}>
        Cada lote representa um grupo de aves alojado junto (mesmo galpão, mesma idade). Cadastre um lote pra cada grupo que você for acompanhar — é a partir dele que você registra postura, sanidade, ração e vendas.
      </Dica>

      {kpis && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, margin: '16px 0 20px' }}>
          {[
            { label: 'Lotes Ativos', value: kpis.lotesAtivos, sub: `${kpis.totalLotes} no total`, color: '#d97706' },
            { label: 'Total de Aves', value: kpis.totalAves.toLocaleString('pt-BR'), sub: 'no plantel', color: '#f59e0b' },
            { label: 'Em Postura', value: kpis.lotesEmPostura, sub: 'lotes produzindo', color: '#fbbf24' },
            ...(kpis.densidadeMedia != null ? [{ label: 'Densidade Média', value: `${kpis.densidadeMedia}/m²`, sub: 'referência: ~6 aves/m²', color: kpis.densidadeMedia > 7 ? '#ef4444' : '#34d399' }] : []),
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
                {l.areaM2 && <div style={{ fontSize: 12, color: '#64748b' }}>Área: <span style={{ color: '#94a3b8' }}>{l.areaM2}m² ({(l.quantidadeAtual / l.areaM2).toFixed(1)} aves/m²)</span></div>}
                {l.peDireitoM && <div style={{ fontSize: 12, color: '#64748b' }}>Pé direito: <span style={{ color: '#94a3b8' }}>{l.peDireitoM}m</span></div>}
                {l.numBebedouros && <div style={{ fontSize: 12, color: '#64748b' }}>Bebedouros: <span style={{ color: '#94a3b8' }}>{l.numBebedouros}{l.tipoBebedouro ? ` (${l.tipoBebedouro})` : ''}</span></div>}
                {l.numComedouros && <div style={{ fontSize: 12, color: '#64748b' }}>Comedouros: <span style={{ color: '#94a3b8' }}>{l.numComedouros}{l.capacidadeComedouroKg ? ` (${l.capacidadeComedouroKg}kg)` : ''}</span></div>}
                <div style={{ fontSize: 12, color: '#64748b' }}>Mortes: <span style={{ color: '#94a3b8' }}>{l._count.mortalidades}</span></div>
                <div style={{ fontSize: 12, color: '#64748b' }}>Sanidade: <span style={{ color: '#94a3b8' }}>{l._count.sanidades} registros</span></div>
              </div>
              {(l.horasLuzMeta || l.horaAcenderLuz) && (
                <div style={{ fontSize: 12, color: '#64748b', marginBottom: 10, padding: '8px 10px', background: 'rgba(245,158,11,0.08)', borderRadius: 8 }}>
                  💡 Programa de luz: <span style={{ color: '#fbbf24', fontWeight: 700 }}>{l.horasLuzMeta ?? 16}h/dia</span>
                  {l.horasLuzNaturalMeta && l.horasLuzArtificialMeta ? ` (${l.horasLuzNaturalMeta}h natural + ${l.horasLuzArtificialMeta}h artificial)` : ''}
                  {l.horaAcenderLuz && l.horaApagarLuz ? ` · timer ${l.horaAcenderLuz}–${l.horaApagarLuz}` : ''}
                </div>
              )}
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

              <div style={{ borderTop: '1px solid #1e293b', paddingTop: 14, marginTop: 4 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 10 }}>Instalação / Galpão (opcional)</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                  <div><label style={labelStyle}>Área (m²)</label><input style={inputStyle} type="number" step="0.01" value={form.areaM2} onChange={e => setForm(p => ({ ...p, areaM2: e.target.value }))} placeholder="78" /></div>
                  <div><label style={labelStyle}>Pé direito (m)</label><input style={inputStyle} type="number" step="0.1" value={form.peDireitoM} onChange={e => setForm(p => ({ ...p, peDireitoM: e.target.value }))} placeholder="3" /></div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                  <div><label style={labelStyle}>Bebedouros</label><input style={inputStyle} type="number" value={form.numBebedouros} onChange={e => setForm(p => ({ ...p, numBebedouros: e.target.value }))} placeholder="8" /></div>
                  <div><label style={labelStyle}>Tipo de bebedouro</label><input style={inputStyle} value={form.tipoBebedouro} onChange={e => setForm(p => ({ ...p, tipoBebedouro: e.target.value }))} placeholder="Pendular" /></div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  <div><label style={labelStyle}>Comedouros</label><input style={inputStyle} type="number" value={form.numComedouros} onChange={e => setForm(p => ({ ...p, numComedouros: e.target.value }))} placeholder="15" /></div>
                  <div><label style={labelStyle}>Tipo de comedouro</label><input style={inputStyle} value={form.tipoComedouro} onChange={e => setForm(p => ({ ...p, tipoComedouro: e.target.value }))} placeholder="Tubular" /></div>
                  <div><label style={labelStyle}>Capacidade (kg)</label><input style={inputStyle} type="number" step="0.1" value={form.capacidadeComedouroKg} onChange={e => setForm(p => ({ ...p, capacidadeComedouroKg: e.target.value }))} placeholder="10" /></div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid #1e293b', paddingTop: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 10 }}>Programa de Luz (opcional)</div>
                <div style={{ fontSize: 11, color: '#64748b', marginBottom: 10 }}>Poedeiras precisam de ~16h de luz/dia. Complete a luz natural com luz artificial via timer, sempre no mesmo horário — mudanças de rotina derrubam a produção.</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
                  <div><label style={labelStyle}>Meta total (h)</label><input style={inputStyle} type="number" step="0.5" value={form.horasLuzMeta} onChange={e => setForm(p => ({ ...p, horasLuzMeta: e.target.value }))} placeholder="16" /></div>
                  <div><label style={labelStyle}>Luz natural (h)</label><input style={inputStyle} type="number" step="0.5" value={form.horasLuzNaturalMeta} onChange={e => setForm(p => ({ ...p, horasLuzNaturalMeta: e.target.value }))} placeholder="12" /></div>
                  <div><label style={labelStyle}>Luz artificial (h)</label><input style={inputStyle} type="number" step="0.5" value={form.horasLuzArtificialMeta} onChange={e => setForm(p => ({ ...p, horasLuzArtificialMeta: e.target.value }))} placeholder="4" /></div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div><label style={labelStyle}>Timer acende às</label><input style={inputStyle} type="time" value={form.horaAcenderLuz} onChange={e => setForm(p => ({ ...p, horaAcenderLuz: e.target.value }))} /></div>
                  <div><label style={labelStyle}>Timer apaga às</label><input style={inputStyle} type="time" value={form.horaApagarLuz} onChange={e => setForm(p => ({ ...p, horaApagarLuz: e.target.value }))} /></div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button type="button" onClick={() => setModal(false)} style={{ flex: 1, background: 'transparent', border: '1px solid #1e293b', borderRadius: 10, padding: 11, color: '#94a3b8', fontSize: 13, cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" disabled={saving} style={{ flex: 1, background: '#d97706', color: '#fff', border: 'none', borderRadius: 10, padding: 11, fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>{saving ? 'Salvando...' : 'Criar Lote'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <GuiaRapido titulo="Referência: linhagens de poedeiras">
        Produção estimada por ciclo completo para um lote de 500 aves — use para comparar antes de escolher a linhagem. Ninho de referência: 25cm de profundidade, 30cm de largura, testeira baixa para o ovo rolar já limpo para fora.
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, marginTop: 14 }}>
          {LINHAGENS_REFERENCIA.map(l => (
            <div key={l.nome} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0' }}>{l.nome}</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#f59e0b', marginTop: 2 }}>{l.duziasPorCiclo.toLocaleString('pt-BR')}</div>
              <div style={{ fontSize: 10, color: '#475569' }}>dúzias/ciclo (500 aves)</div>
            </div>
          ))}
        </div>
      </GuiaRapido>
    </div>
  )
}

function AbaPostura({ modoIniciante }: { modoIniciante: boolean }) {
  const [lotes, setLotes] = useState<LoteResumo[]>([])
  const [producoes, setProducoes] = useState<Producao[]>([])
  const [kpis, setKpis] = useState<KpisPostura | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    loteId: '', data: '', ovosColetados: '', ovosQuebrados: '', ovosSujos: '',
    ovosDescartados: '', pesoMedioG: '', horasLuz: '', observacao: '',
  })

  const carregar = useCallback(() => {
    setLoading(true)
    fetch('/api/aves-postura')
      .then(r => r.json())
      .then(d => { setLotes(d.lotes ?? []); setProducoes(d.producoes ?? []); setKpis(d.kpis ?? null) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { carregar() }, [carregar])

  async function registrar(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    await fetch('/api/aves-postura', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setSaving(false)
    setForm({ loteId: form.loteId, data: '', ovosColetados: '', ovosQuebrados: '', ovosSujos: '', ovosDescartados: '', pesoMedioG: '', horasLuz: '', observacao: '' })
    carregar()
  }

  const taxaPostura = (p: Producao) => p.lote.quantidadeAtual > 0 ? ((p.ovosColetados / p.lote.quantidadeAtual) * 100).toFixed(1) : '—'

  return (
    <div>
      <Dica ativo={modoIniciante}>
        <strong>Taxa de postura</strong> é o percentual de ovos coletados em relação ao total de aves do lote hoje (ovos ÷ aves × 100). Poedeiras comerciais chegam a 90–95% no pico e vão caindo gradualmente até o descarte — quedas bruscas geralmente indicam problema de luz, ração ou sanidade.
      </Dica>

      {kpis && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, margin: '16px 0 20px' }}>
          {[
            { label: 'Ovos Hoje', value: kpis.ovosHoje.toLocaleString('pt-BR'), sub: 'coletados', color: '#f59e0b' },
            { label: 'Taxa de Postura', value: `${kpis.taxaPosturaMedia}%`, sub: 'média últimos registros', color: '#fbbf24' },
            { label: 'Lotes em Postura', value: kpis.lotesEmPostura, sub: 'produzindo agora', color: '#d97706' },
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
            label="Taxa de postura atual vs. mercado"
            valor={`${kpis.taxaPosturaMedia}%`}
            referencia="90–95% no pico"
            dentro={kpis.taxaPosturaMedia >= 75}
          />
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(340px, 100%), 1fr))', gap: 20, alignItems: 'flex-start' }}>
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 22 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, color: '#f1f5f9' }}>Registrar Postura de Hoje</h2>
          <form onSubmit={registrar} style={{ display: 'grid', gap: 12 }}>
            <div><label style={labelStyle}>Lote *</label>
              <select style={inputStyle} value={form.loteId} onChange={e => setForm(p => ({ ...p, loteId: e.target.value }))} required>
                <option value="">Selecionar lote...</option>
                {lotes.map(l => <option key={l.id} value={l.id}>{l.nome} ({l.especie})</option>)}
              </select>
            </div>
            {(() => {
              const loteSel = lotes.find(l => l.id === form.loteId)
              if (!loteSel || !loteSel.horasLuzMeta) return null
              return (
                <div style={{ fontSize: 11, color: '#94a3b8', padding: '8px 10px', background: 'rgba(245,158,11,0.08)', borderRadius: 8 }}>
                  💡 Meta de luz deste lote: <strong style={{ color: '#fbbf24' }}>{loteSel.horasLuzMeta}h/dia</strong>
                  {loteSel.horaAcenderLuz && loteSel.horaApagarLuz ? ` · timer ${loteSel.horaAcenderLuz}–${loteSel.horaApagarLuz}` : ''} — mantenha sempre no mesmo horário, mudanças de rotina derrubam a postura.
                </div>
              )
            })()}
            <div><label style={labelStyle}>Data</label><input style={inputStyle} type="date" value={form.data} onChange={e => setForm(p => ({ ...p, data: e.target.value }))} /></div>
            <div><label style={labelStyle}>Ovos coletados *</label><input style={inputStyle} type="number" value={form.ovosColetados} onChange={e => setForm(p => ({ ...p, ovosColetados: e.target.value }))} placeholder="420" required /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div><label style={labelStyle}>Quebrados</label><input style={inputStyle} type="number" value={form.ovosQuebrados} onChange={e => setForm(p => ({ ...p, ovosQuebrados: e.target.value }))} /></div>
              <div><label style={labelStyle}>Sujos</label><input style={inputStyle} type="number" value={form.ovosSujos} onChange={e => setForm(p => ({ ...p, ovosSujos: e.target.value }))} /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div><label style={labelStyle}>Descartados</label><input style={inputStyle} type="number" value={form.ovosDescartados} onChange={e => setForm(p => ({ ...p, ovosDescartados: e.target.value }))} /></div>
              <div><label style={labelStyle}>Peso médio (g)</label><input style={inputStyle} type="number" step="0.1" value={form.pesoMedioG} onChange={e => setForm(p => ({ ...p, pesoMedioG: e.target.value }))} placeholder="62" /></div>
            </div>
            <div><label style={labelStyle}>Horas de luz no dia</label><input style={inputStyle} type="number" step="0.5" value={form.horasLuz} onChange={e => setForm(p => ({ ...p, horasLuz: e.target.value }))} placeholder="16" /></div>
            <div><label style={labelStyle}>Observação</label><textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 50 }} value={form.observacao} onChange={e => setForm(p => ({ ...p, observacao: e.target.value }))} /></div>
            <button type="submit" disabled={saving || !lotes.length} style={{ background: '#f59e0b', color: '#111827', border: 'none', borderRadius: 10, padding: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: saving || !lotes.length ? 0.6 : 1 }}>
              {saving ? 'Salvando...' : 'Registrar Postura'}
            </button>
            {!lotes.length && !loading && <div style={{ fontSize: 12, color: '#f87171', textAlign: 'center' }}>Cadastre um lote na aba Lotes & Galpão primeiro</div>}
          </form>
        </div>

        <div>
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, color: '#f1f5f9' }}>Histórico de Postura</h2>
          {loading && <div style={{ height: 3, background: 'linear-gradient(90deg,#f59e0b,#d97706)', borderRadius: 2, marginBottom: 12, opacity: 0.8 }} />}
          {producoes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#475569', background: 'rgba(255,255,255,0.02)', borderRadius: 16, border: '1px dashed rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Nenhum registro ainda</div>
              <div style={{ fontSize: 13 }}>Registre a coleta de hoje ao lado</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {producoes.map(p => (
                <div key={p.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                  <div style={{ flex: '1 1 160px' }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#f1f5f9' }}>{p.lote.nome}</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>{new Date(p.data).toLocaleDateString('pt-BR')} · {p.lote.especie}</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 17, fontWeight: 800, color: '#fbbf24' }}>{p.ovosColetados}</div>
                    <div style={{ fontSize: 10, color: '#475569' }}>ovos</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 17, fontWeight: 800, color: '#f59e0b' }}>{taxaPostura(p)}%</div>
                    <div style={{ fontSize: 10, color: '#475569' }}>postura</div>
                  </div>
                  {p.pesoMedioG && (
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 17, fontWeight: 800, color: '#a78bfa' }}>{p.pesoMedioG}g</div>
                      <div style={{ fontSize: 10, color: '#475569' }}>peso médio</div>
                    </div>
                  )}
                  {(p.ovosQuebrados || p.ovosSujos) && (
                    <div style={{ fontSize: 11, color: '#64748b' }}>
                      {p.ovosQuebrados ? `${p.ovosQuebrados} quebrados` : ''}{p.ovosQuebrados && p.ovosSujos ? ' · ' : ''}{p.ovosSujos ? `${p.ovosSujos} sujos` : ''}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function AbaCalculadora({ modoIniciante }: { modoIniciante: boolean }) {
  const [numAves, setNumAves] = useState('500')
  const [custoRacaoKg, setCustoRacaoKg] = useState('2.50')
  const [precoDuzia, setPrecoDuzia] = useState('8.00')
  const [taxaPostura, setTaxaPostura] = useState('80')

  const aves = Number(numAves) || 0
  const custoKg = Number(custoRacaoKg) || 0
  const preco = Number(precoDuzia) || 0
  const taxa = (Number(taxaPostura) || 0) / 100

  const custoPreLay = aves * 8 * custoKg
  const consumoDiarioAdultoKg = aves * 0.115
  const custoMensalRacao = consumoDiarioAdultoKg * 30 * custoKg
  const ovosDia = aves * taxa
  const duziasMes = (ovosDia * 30) / 12
  const receitaMensal = duziasMes * preco
  const lucroMensal = receitaMensal - custoMensalRacao
  const paybackMeses = lucroMensal > 0 ? custoPreLay / lucroMensal : null

  return (
    <div>
      <Dica ativo={modoIniciante}>
        Essa calculadora é uma estimativa simplificada pra quem está avaliando se vale a pena investir — considera só o custo de ração (o maior custo da criação) contra a receita de venda de ovos. Custos de mão de obra, energia, vacinas e depreciação de instalação não entram na conta.
      </Dica>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px, 100%), 1fr))', gap: 20, alignItems: 'flex-start', marginTop: 16 }}>
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 22 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, color: '#f1f5f9' }}>Parâmetros</h2>
          <div style={{ display: 'grid', gap: 12 }}>
            <div><label style={labelStyle}>Quantidade de aves</label><input style={inputStyle} type="number" value={numAves} onChange={e => setNumAves(e.target.value)} /></div>
            <div><label style={labelStyle}>Custo da ração (R$/kg)</label><input style={inputStyle} type="number" step="0.01" value={custoRacaoKg} onChange={e => setCustoRacaoKg(e.target.value)} /></div>
            <div><label style={labelStyle}>Preço de venda (R$/dúzia)</label><input style={inputStyle} type="number" step="0.01" value={precoDuzia} onChange={e => setPrecoDuzia(e.target.value)} /></div>
            <div><label style={labelStyle}>Taxa de postura esperada (%)</label><input style={inputStyle} type="number" value={taxaPostura} onChange={e => setTaxaPostura(e.target.value)} /></div>
          </div>
        </div>

        <div style={{ display: 'grid', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '18px 20px' }}>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Investimento em ração (até início da postura)</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#f59e0b' }}>R$ {custoPreLay.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</div>
              <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>~8kg de ração por ave, do 1º dia até a postura</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '18px 20px' }}>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Custo mensal de ração (fase adulta)</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#84cc16' }}>R$ {custoMensalRacao.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</div>
              <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>~115g/ave/dia em produção</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '18px 20px' }}>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Receita mensal estimada</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#facc15' }}>R$ {receitaMensal.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</div>
              <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>{duziasMes.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} dúzias/mês</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '18px 20px' }}>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Lucro mensal estimado (só ração)</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: lucroMensal >= 0 ? '#34d399' : '#f87171' }}>R$ {lucroMensal.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</div>
              <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>
                {paybackMeses ? `payback do investimento inicial em ~${paybackMeses.toFixed(1)} meses` : 'ajuste os parâmetros — lucro estimado negativo'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <GuiaRapido titulo="Como pensar o negócio antes de investir">
        Com 100 galinhas poedeiras bem manejadas é possível tirar em torno de um salário mínimo por mês — mas só com um lote não dá: a produção cai ao longo do ciclo (de um pico de ~95% para ~75%),
        então pra ter ovo o ano todo é preciso trabalhar com pelo menos 4 lotes escalonados. E pra vender formalmente (mercado, distribuidora, indústria) o ovo precisa passar por inspeção sanitária — a informalidade
        está cada vez mais difícil de sustentar como negócio.
      </GuiaRapido>
    </div>
  )
}

'use client'

import { useState, useEffect, useCallback } from 'react'

const TIPO_LABELS: Record<string, string> = {
  CIO_DETECTADO: 'Cio Detectado', INSEMINACAO_ARTIFICIAL: 'Inseminação IA',
  MONTA_NATURAL: 'Monta Natural', DIAGNOSTICO_PRENHEZ: 'Diagnóstico Prenhez',
  CONFIRMACAO_PRENHEZ: 'Prenhez Confirmada', PARTO: 'Parto',
  ABORTO: 'Aborto', DESMAME: 'Desmame', DESCARTE_REPRODUTIVO: 'Descarte',
}
const STATUS_COLOR: Record<string, string> = {
  VAZIA: '#64748b', PRENHA: '#10b981', INCERTA: '#fbbf24', PARIDA: '#60a5fa',
}
const ALERTA_COR: Record<string, string> = { verde: '#10b981', amarelo: '#fbbf24', vermelho: '#f87171' }
const ALERTA_BG: Record<string, string> = { verde: '#10b98115', amarelo: '#fbbf2415', vermelho: '#f8717115' }
const ALERTA_LABEL: Record<string, string> = { verde: '✅ Situação Normal', amarelo: '⚠️ Atenção Necessária', vermelho: '🚨 Ação Urgente' }

export default function SaudeReproducaoPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'reproducao' | 'protocolos' | 'eventos'>('reproducao')
  const [showForm, setShowForm] = useState<null | 'protocolo' | 'evento'>(null)
  const [saving, setSaving] = useState(false)
  const [formProtocolo, setFormProtocolo] = useState({ nome: '', doenca: '', frequencia: 'ANUAL', produto: '', dose: '' })
  const [formEvento, setFormEvento] = useState({ animalId: '', tipo: 'INSEMINACAO_ARTIFICIAL', veterinario: '', resultado: '', pesoBezerro: '', observacao: '' })
  const [analiseIA, setAnaliseIA] = useState<any>(null)
  const [loadingIA, setLoadingIA] = useState(false)
  const [erroForm, setErroForm] = useState('')

  async function analisarComIA() {
    setLoadingIA(true)
    try {
      const r = await fetch('/api/ai/agrovet-analise')
      const d = await r.json()
      setAnaliseIA(d)
    } catch {}
    setLoadingIA(false)
  }

  const carregar = useCallback(() => {
    setLoading(true)
    fetch('/api/saude-reproducao')
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { carregar() }, [carregar])

  async function salvar(e: React.SyntheticEvent) {
    e.preventDefault()
    setSaving(true)
    setErroForm('')
    try {
      const body = showForm === 'protocolo'
        ? { _type: 'protocolo', ...formProtocolo }
        : { _type: 'evento', animalIdentificacao: formEvento.animalId, tipo: formEvento.tipo, veterinario: formEvento.veterinario, resultado: formEvento.resultado, pesoBezerro: formEvento.pesoBezerro, observacao: formEvento.observacao }
      const res = await fetch('/api/saude-reproducao', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await res.json()
      if (!res.ok) { setErroForm(data.error || 'Erro ao salvar'); return }
      setShowForm(null)
      setFormEvento({ animalId: '', tipo: 'INSEMINACAO_ARTIFICIAL', veterinario: '', resultado: '', pesoBezerro: '', observacao: '' })
      carregar()
    } catch {
      setErroForm('Erro de conexão. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  const kpis = data?.kpis ?? {}

  return (
    <div style={{ background: '#0a0e1a', minHeight: '100vh', padding: '28px 24px', color: '#f1f5f9' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5 }}>AgroVet — Saúde & Reprodução</h1>
        <p style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>Gestão reprodutiva, protocolos vacinais e histórico sanitário do rebanho</p>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10, marginBottom: 20 }}>
        {[
          { label: 'Animais Prenhes', val: kpis.prenhas ?? 0, color: '#10b981', icon: '🐄' },
          { label: 'Partos em 30 dias', val: kpis.partosPrevistos ?? 0, color: '#60a5fa', icon: '🍼' },
          { label: 'Protocolos Ativos', val: kpis.vacinasPendentes ?? 0, color: '#fbbf24', icon: '💉' },
          { label: 'Total do Rebanho', val: kpis.totalAnimais ?? 0, color: '#a78bfa', icon: '🐂' },
        ].map(k => (
          <div key={k.label} style={{ background: '#111827', border: '1px solid #1e293b', borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>{k.icon} {k.label}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: k.color }}>{k.val}</div>
          </div>
        ))}
      </div>

      {/* Painel IA */}
      <div style={{ background: '#0d1117', border: '1px solid #1e293b', borderRadius: 14, padding: '16px 20px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: analiseIA ? 14 : 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 18 }}>🤖</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9' }}>AgroVet Intelligence</div>
              <div style={{ fontSize: 11, color: '#475569' }}>IA + QUBO Annealing — análise veterinária e reprodutiva</div>
            </div>
            {analiseIA && (
              <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: ALERTA_BG[analiseIA.nivel_alerta] ?? '#1e293b', color: ALERTA_COR[analiseIA.nivel_alerta] ?? '#94a3b8', fontWeight: 600 }}>
                {ALERTA_LABEL[analiseIA.nivel_alerta] ?? analiseIA.nivel_alerta}
              </span>
            )}
          </div>
          <button onClick={analisarComIA} disabled={loadingIA}
            style={{ background: loadingIA ? '#1e293b' : '#10b981', color: '#fff', border: 'none', borderRadius: 9, padding: '8px 16px', fontSize: 12, fontWeight: 600, cursor: loadingIA ? 'default' : 'pointer', opacity: loadingIA ? 0.7 : 1, transition: 'all 0.2s' }}>
            {loadingIA ? '⏳ Analisando...' : '⚡ Analisar com IA'}
          </button>
        </div>
        {analiseIA?.error === 'UPGRADE_REQUIRED' && (
          <div style={{ marginTop: 14, background: '#1e1a0e', border: '1px solid #fbbf2430', borderRadius: 10, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 22 }}>🔒</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#fbbf24' }}>Recurso do Plano Pro</div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>A análise com IA + QUBO está disponível no plano Pro ou Empresas. <a href="/dashboard/planos" style={{ color: '#fbbf24', textDecoration: 'underline' }}>Fazer upgrade →</a></div>
            </div>
          </div>
        )}
        {analiseIA && !analiseIA.error && (
          <div style={{ display: 'grid', gap: 10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div style={{ background: '#111827', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>Diagnóstico</div>
                <div style={{ fontSize: 13, color: '#e2e8f0', lineHeight: 1.5 }}>{analiseIA.diagnostico}</div>
              </div>
              <div style={{ background: '#111827', borderRadius: 10, padding: '12px 14px', borderLeft: `3px solid ${ALERTA_COR[analiseIA.nivel_alerta] ?? '#64748b'}` }}>
                <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>Ação Prioritária</div>
                <div style={{ fontSize: 13, color: '#fbbf24', fontWeight: 600, lineHeight: 1.5 }}>{analiseIA.acao_prioritaria}</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              {analiseIA.previsao_partos && (
                <div style={{ background: '#111827', borderRadius: 10, padding: '10px 14px' }}>
                  <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>🍼 Partos Previstos</div>
                  <div style={{ fontSize: 12, color: '#60a5fa', lineHeight: 1.4 }}>{analiseIA.previsao_partos}</div>
                </div>
              )}
              {analiseIA.risco_sanitario && (
                <div style={{ background: '#111827', borderRadius: 10, padding: '10px 14px' }}>
                  <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>🦠 Risco Sanitário</div>
                  <div style={{ fontSize: 12, color: '#f87171', lineHeight: 1.4 }}>{analiseIA.risco_sanitario}</div>
                </div>
              )}
              {analiseIA.dica_reproducao && (
                <div style={{ background: '#111827', borderRadius: 10, padding: '10px 14px' }}>
                  <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>💡 Dica Reprodutiva</div>
                  <div style={{ fontSize: 12, color: '#34d399', lineHeight: 1.4 }}>{analiseIA.dica_reproducao}</div>
                </div>
              )}
            </div>
            {(analiseIA.agendaOtimizada ?? []).length > 0 && (
              <div style={{ background: '#111827', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontSize: 10, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>
                  ⚛️ QUBO — Agenda Vacinal Otimizada {analiseIA.quantum && <span style={{ color: '#475569', marginLeft: 4 }}>· {analiseIA.quantum.convergencia}% convergência</span>}
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {(analiseIA.agendaOtimizada as any[]).slice(0, 6).map((item: any, i: number) => (
                    <div key={i} style={{ background: '#0f172a', border: `1px solid ${item.prioridade === 'alta' ? '#f87171' : item.prioridade === 'media' ? '#fbbf24' : '#334155'}30`, borderRadius: 8, padding: '8px 12px', minWidth: 160 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: item.prioridade === 'alta' ? '#f87171' : item.prioridade === 'media' ? '#fbbf24' : '#94a3b8' }}>{item.protocolo}</div>
                      <div style={{ fontSize: 10, color: '#475569', marginTop: 2 }}>{item.grupoOtimizado}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {[['reproducao', 'Reprodução'], ['protocolos', 'Protocolos Vacinais'], ['eventos', 'Eventos']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id as any)}
            style={{ padding: '8px 16px', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              background: tab === id ? '#10b981' : '#111827', color: tab === id ? '#fff' : '#64748b' }}>
            {label}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <button onClick={() => { setShowForm(tab === 'protocolos' ? 'protocolo' : 'evento'); setErroForm('') }}
          style={{ background: '#10b981', color: '#fff', border: 'none', borderRadius: 9, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          + {tab === 'protocolos' ? 'Protocolo' : 'Evento'}
        </button>
      </div>

      {loading && <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>Carregando...</div>}

      {/* Tab: Reprodução */}
      {!loading && tab === 'reproducao' && (
        <div style={{ display: 'grid', gap: 8 }}>
          {(data?.statusReprodutivos ?? []).length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#475569' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🐄</div>
              <p style={{ fontWeight: 600 }}>Nenhum status reprodutivo registrado</p>
              <p style={{ fontSize: 13 }}>Registre eventos reprodutivos nos animais para ativar o rastreamento</p>
            </div>
          ) : (data?.statusReprodutivos ?? []).map((s: any) => (
            <div key={s.id} style={{ background: '#111827', border: '1px solid #1e293b', borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: STATUS_COLOR[s.status] ?? '#64748b', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{s.animal.identificacao}</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>{s.animal.raca || 'Raça não informada'}</div>
              </div>
              <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: (STATUS_COLOR[s.status] ?? '#64748b') + '20', color: STATUS_COLOR[s.status] ?? '#64748b', fontWeight: 600 }}>
                {s.status}
              </span>
              {s.dataPrevistoParto && (
                <span style={{ fontSize: 11, color: '#fbbf24' }}>
                  🍼 {new Date(s.dataPrevistoParto).toLocaleDateString('pt-BR')}
                </span>
              )}
              <span style={{ fontSize: 11, color: '#64748b' }}>{s.paricoes} parições</span>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Protocolos */}
      {!loading && tab === 'protocolos' && (
        <div style={{ display: 'grid', gap: 8 }}>
          {(data?.protocolos ?? []).length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#475569' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>💉</div>
              <p style={{ fontWeight: 600 }}>Nenhum protocolo vacinal cadastrado</p>
              <p style={{ fontSize: 13 }}>Crie protocolos para organizar o calendário de vacinação do rebanho</p>
            </div>
          ) : (data?.protocolos ?? []).map((p: any) => (
            <div key={p.id} style={{ background: '#111827', border: '1px solid #1e293b', borderRadius: 12, padding: '14px 18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{p.nome}</div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>Doença: {p.doenca} · {p.frequencia}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  {p.produto && <div style={{ fontSize: 11, color: '#a78bfa' }}>{p.produto} {p.dose && `— ${p.dose}`}</div>}
                  <div style={{ fontSize: 10, color: '#475569' }}>Meses: {(p.mesesAplicar as number[]).join(', ')}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Eventos */}
      {!loading && tab === 'eventos' && (
        <div style={{ display: 'grid', gap: 8 }}>
          {(data?.eventosRecentes ?? []).length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#475569' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
              <p style={{ fontWeight: 600 }}>Nenhum evento reprodutivo registrado</p>
            </div>
          ) : (data?.eventosRecentes ?? []).map((ev: any) => (
            <div key={ev.id} style={{ background: '#111827', border: '1px solid #1e293b', borderRadius: 12, padding: '12px 18px', display: 'flex', gap: 14, alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: '#64748b', minWidth: 70 }}>{new Date(ev.data).toLocaleDateString('pt-BR')}</span>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 12, fontWeight: 600 }}>{ev.animal.identificacao}</span>
                <span style={{ fontSize: 11, color: '#64748b' }}> · {ev.animal.raca || '—'}</span>
              </div>
              <span style={{ fontSize: 11, background: '#10b98120', color: '#10b981', padding: '2px 9px', borderRadius: 20 }}>
                {TIPO_LABELS[ev.tipo] ?? ev.tipo}
              </span>
              {ev.veterinario && <span style={{ fontSize: 11, color: '#64748b' }}>Dr. {ev.veterinario}</span>}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}>
          <div style={{ background: '#111827', border: '1px solid #1e293b', borderRadius: 16, padding: 28, width: '100%', maxWidth: 480 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>
              {showForm === 'protocolo' ? 'Novo Protocolo Vacinal' : 'Registrar Evento Reprodutivo'}
            </h2>
            <form onSubmit={salvar} style={{ display: 'grid', gap: 12 }}>
              {showForm === 'protocolo' ? (
                <>
                  {[{ l: 'Nome do protocolo *', k: 'nome', p: 'Ex: Vacinação aftosa' }, { l: 'Doença / alvo *', k: 'doenca', p: 'Febre Aftosa, Brucelose...' }, { l: 'Produto', k: 'produto', p: 'Nome comercial' }, { l: 'Dose', k: 'dose', p: '2 mL/animal' }].map(f => (
                    <div key={f.k}>
                      <label style={{ fontSize: 12, color: '#94a3b8', display: 'block', marginBottom: 4 }}>{f.l}</label>
                      <input value={formProtocolo[f.k as keyof typeof formProtocolo]} placeholder={f.p}
                        onChange={e => setFormProtocolo(p => ({ ...p, [f.k]: e.target.value }))} required={f.l.includes('*')}
                        style={{ width: '100%', background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, padding: '9px 12px', color: '#f1f5f9', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                    </div>
                  ))}
                  <div>
                    <label style={{ fontSize: 12, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Frequência</label>
                    <select value={formProtocolo.frequencia} onChange={e => setFormProtocolo(p => ({ ...p, frequencia: e.target.value }))}
                      style={{ width: '100%', background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, padding: '9px 12px', color: '#f1f5f9', fontSize: 13, outline: 'none' }}>
                      <option value="ANUAL">Anual</option>
                      <option value="SEMESTRAL">Semestral</option>
                      <option value="TRIMESTRAL">Trimestral</option>
                    </select>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label style={{ fontSize: 12, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Identificação do Animal * (código, SISBOV, brinco ou RFID)</label>
                    <input value={formEvento.animalId} placeholder="Ex: #0055, brinco, SISBOV..."
                      onChange={e => setFormEvento(p => ({ ...p, animalId: e.target.value }))} required
                      style={{ width: '100%', background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, padding: '9px 12px', color: '#f1f5f9', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Tipo de Evento *</label>
                    <select value={formEvento.tipo} onChange={e => setFormEvento(p => ({ ...p, tipo: e.target.value }))}
                      style={{ width: '100%', background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, padding: '9px 12px', color: '#f1f5f9', fontSize: 13, outline: 'none' }}>
                      {Object.entries(TIPO_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </div>
                  {[{ l: 'Veterinário', k: 'veterinario', p: 'Nome do veterinário' }, { l: 'Resultado', k: 'resultado', p: 'Positivo, Negativo...' }, { l: 'Peso do bezerro (kg)', k: 'pesoBezerro', p: '35' }, { l: 'Observação', k: 'observacao', p: 'Detalhes adicionais' }].map(f => (
                    <div key={f.k}>
                      <label style={{ fontSize: 12, color: '#94a3b8', display: 'block', marginBottom: 4 }}>{f.l}</label>
                      <input value={formEvento[f.k as keyof typeof formEvento]} placeholder={f.p}
                        onChange={e => setFormEvento(p => ({ ...p, [f.k]: e.target.value }))}
                        style={{ width: '100%', background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, padding: '9px 12px', color: '#f1f5f9', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                    </div>
                  ))}
                </>
              )}
              {erroForm && (
                <div style={{ background: '#1a0a0a', border: '1px solid #ef444430', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#f87171', lineHeight: 1.5 }}>
                  {erroForm}
                </div>
              )}
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button type="button" onClick={() => { setShowForm(null); setErroForm('') }}
                  style={{ flex: 1, background: 'transparent', border: '1px solid #1e293b', borderRadius: 10, padding: 10, color: '#94a3b8', fontSize: 13, cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" disabled={saving}
                  style={{ flex: 1, background: '#10b981', color: '#fff', border: 'none', borderRadius: 10, padding: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

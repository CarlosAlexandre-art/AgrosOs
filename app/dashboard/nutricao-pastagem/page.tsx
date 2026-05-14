'use client'

import { useState, useEffect, useCallback } from 'react'

const STATUS_PASTAGEM: Record<string, { label: string; color: string }> = {
  DISPONIVEL: { label: 'Disponível', color: '#10b981' },
  OCUPADA: { label: 'Ocupada', color: '#fbbf24' },
  DESCANSO: { label: 'Descanso', color: '#60a5fa' },
}
const ALERTA_COR: Record<string, string> = { verde: '#10b981', amarelo: '#fbbf24', vermelho: '#f87171' }
const ALERTA_BG: Record<string, string> = { verde: '#10b98115', amarelo: '#fbbf2415', vermelho: '#f8717115' }
const ALERTA_LABEL: Record<string, string> = { verde: '✅ Situação Normal', amarelo: '⚠️ Atenção Necessária', vermelho: '🚨 Ação Urgente' }

export default function NutricaoPastagemPage() {
  const [nutricao, setNutricao] = useState<any>(null)
  const [pastagens, setPastagens] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'planos' | 'pastagens'>('planos')
  const [showForm, setShowForm] = useState<null | 'plano' | 'pastagem' | 'rotacao'>(null)
  const [saving, setSaving] = useState(false)
  const [formPlano, setFormPlano] = useState({ nome: '', objetivo: 'GANHO_PESO', loteId: '', racaoKgDia: '', custoKgRacao: '', mineralKgDia: '', custoKgMineral: '', proteinaBruta: '' })
  const [formPastagem, setFormPastagem] = useState({ nome: '', areaHectares: '', forrageira: '', capacidadeUA: '', cicloDescanso: '' })
  const [formRotacao, setFormRotacao] = useState({ pastagemId: '', loteId: '', cabecas: '' })
  const [analiseIA, setAnaliseIA] = useState<any>(null)
  const [loadingIA, setLoadingIA] = useState(false)

  async function analisarComIA() {
    setLoadingIA(true)
    try {
      const r = await fetch('/api/ai/nutribov-analise')
      const d = await r.json()
      setAnaliseIA(d)
    } catch {}
    setLoadingIA(false)
  }

  const carregar = useCallback(() => {
    setLoading(true)
    Promise.all([
      fetch('/api/nutricao').then(r => r.json()),
      fetch('/api/pastagem').then(r => r.json()),
    ]).then(([n, p]) => { setNutricao(n); setPastagens(p) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { carregar() }, [carregar])

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    if (showForm === 'plano') {
      await fetch('/api/nutricao', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formPlano) })
    } else if (showForm === 'pastagem') {
      await fetch('/api/pastagem', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formPastagem) })
    } else if (showForm === 'rotacao') {
      await fetch('/api/pastagem', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ _type: 'rotacao', ...formRotacao }) })
    }
    setShowForm(null)
    carregar()
    setSaving(false)
  }

  async function liberarPastagem(pastagemId: string) {
    await fetch('/api/pastagem', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ _type: 'liberar', pastagemId }) })
    carregar()
  }

  return (
    <div style={{ background: '#0a0e1a', minHeight: '100vh', padding: '28px 24px', color: '#f1f5f9' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5 }}>NutriBov — Nutrição & Pastagem</h1>
        <p style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>Planos nutricionais, custo alimentar e gestão de pastagens com rotação</p>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
        {[
          { label: 'Custo Diário Total', val: `R$${(nutricao?.kpis?.custoTotal ?? 0).toFixed(2)}`, color: '#fbbf24', icon: '💰' },
          { label: 'Planos Ativos', val: (nutricao?.planos ?? []).filter((p: any) => p.ativo).length, color: '#10b981', icon: '📋' },
          { label: 'Pastagens', val: pastagens?.kpis?.total ?? 0, color: '#60a5fa', icon: '🌿' },
          { label: 'Disponíveis', val: pastagens?.kpis?.disponiveis ?? 0, color: '#34d399', icon: '✅' },
        ].map(k => (
          <div key={k.label} style={{ background: '#111827', border: '1px solid #1e293b', borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>{k.icon} {k.label}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: k.color }}>{k.val}</div>
          </div>
        ))}
      </div>

      {/* Painel IA */}
      <div style={{ background: '#0d1117', border: '1px solid #1e293b', borderRadius: 14, padding: '16px 20px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: analiseIA ? 14 : 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 18 }}>🤖</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9' }}>NutriBov Intelligence</div>
              <div style={{ fontSize: 11, color: '#475569' }}>IA + QUBO TSP — nutrição e rotação de pastagem otimizada</div>
            </div>
            {analiseIA && (
              <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: ALERTA_BG[analiseIA.nivel_alerta] ?? '#1e293b', color: ALERTA_COR[analiseIA.nivel_alerta] ?? '#94a3b8', fontWeight: 600 }}>
                {ALERTA_LABEL[analiseIA.nivel_alerta] ?? analiseIA.nivel_alerta}
              </span>
            )}
          </div>
          <button onClick={analisarComIA} disabled={loadingIA}
            style={{ background: loadingIA ? '#1e293b' : '#f59e0b', color: '#fff', border: 'none', borderRadius: 9, padding: '8px 16px', fontSize: 12, fontWeight: 600, cursor: loadingIA ? 'default' : 'pointer', opacity: loadingIA ? 0.7 : 1 }}>
            {loadingIA ? '⏳ Analisando...' : '⚡ Analisar com IA'}
          </button>
        </div>
        {analiseIA && (
          <div style={{ display: 'grid', gap: 10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div style={{ background: '#111827', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>Diagnóstico Nutricional</div>
                <div style={{ fontSize: 13, color: '#e2e8f0', lineHeight: 1.5 }}>{analiseIA.diagnostico}</div>
              </div>
              <div style={{ background: '#111827', borderRadius: 10, padding: '12px 14px', borderLeft: `3px solid ${ALERTA_COR[analiseIA.nivel_alerta] ?? '#64748b'}` }}>
                <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>Ação Prioritária</div>
                <div style={{ fontSize: 13, color: '#fbbf24', fontWeight: 600, lineHeight: 1.5 }}>{analiseIA.acao_prioritaria}</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              {analiseIA.eficiencia_pastagem && (
                <div style={{ background: '#111827', borderRadius: 10, padding: '10px 14px' }}>
                  <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>🌿 Eficiência Pastagem</div>
                  <div style={{ fontSize: 12, color: '#34d399', lineHeight: 1.4 }}>{analiseIA.eficiencia_pastagem}</div>
                </div>
              )}
              {analiseIA.custo_oportunidade && (
                <div style={{ background: '#111827', borderRadius: 10, padding: '10px 14px' }}>
                  <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>💸 Custo / Oportunidade</div>
                  <div style={{ fontSize: 12, color: '#f87171', lineHeight: 1.4 }}>{analiseIA.custo_oportunidade}</div>
                </div>
              )}
              {analiseIA.sugestao_dieta && (
                <div style={{ background: '#111827', borderRadius: 10, padding: '10px 14px' }}>
                  <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>🌾 Sugestão de Dieta</div>
                  <div style={{ fontSize: 12, color: '#60a5fa', lineHeight: 1.4 }}>{analiseIA.sugestao_dieta}</div>
                </div>
              )}
            </div>
            {(analiseIA.rotacaoOtimizada ?? []).length > 0 && (
              <div style={{ background: '#111827', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontSize: 10, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>
                  ⚛️ QUBO TSP — Rotação de Pastagem Otimizada {analiseIA.quantum && <span style={{ color: '#475569', marginLeft: 4 }}>· {analiseIA.quantum.convergencia}% convergência</span>}
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {(analiseIA.rotacaoOtimizada as any[]).filter((r: any) => r.prioridade !== 'baixa').slice(0, 6).map((item: any, i: number) => (
                    <div key={i} style={{ background: '#0f172a', border: `1px solid ${item.prioridade === 'alta' ? '#34d39930' : '#1e293b'}`, borderRadius: 8, padding: '8px 12px', minWidth: 150 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: item.prioridade === 'alta' ? '#34d399' : '#94a3b8' }}>{item.pastagem}</div>
                      <div style={{ fontSize: 10, color: '#475569', marginTop: 2 }}>{item.area} ha · {item.loteIndicado}</div>
                      {item.diasParaEntrada === 0 && <div style={{ fontSize: 10, color: '#10b981', marginTop: 2 }}>Pronta para entrada</div>}
                      {item.diasParaEntrada > 0 && <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>Em {item.diasParaEntrada}d</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[['planos', 'Planos Nutricionais'], ['pastagens', 'Pastagens']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id as any)}
            style={{ padding: '8px 16px', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              background: tab === id ? '#f59e0b' : '#111827', color: tab === id ? '#fff' : '#64748b' }}>
            {label}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <button onClick={() => setShowForm(tab === 'planos' ? 'plano' : 'pastagem')}
          style={{ background: '#f59e0b', color: '#fff', border: 'none', borderRadius: 9, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          + {tab === 'planos' ? 'Plano' : 'Pastagem'}
        </button>
        {tab === 'pastagens' && (
          <button onClick={() => setShowForm('rotacao')}
            style={{ background: '#10b981', color: '#fff', border: 'none', borderRadius: 9, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            + Rotação
          </button>
        )}
      </div>

      {loading && <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>Carregando...</div>}

      {/* Planos Nutricionais */}
      {!loading && tab === 'planos' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
          {(nutricao?.planos ?? []).length === 0 ? (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px 0', color: '#475569' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🌾</div>
              <p style={{ fontWeight: 600 }}>Nenhum plano nutricional cadastrado</p>
              <p style={{ fontSize: 13 }}>Crie planos para controlar custo e eficiência alimentar por lote</p>
            </div>
          ) : (nutricao?.planos ?? []).map((p: any) => {
            const cabecas = p.lote?.cabecas ?? 0
            const custoDia = ((p.racaoKgDia ?? 0) * (p.custoKgRacao ?? 0) + (p.mineralKgDia ?? 0) * (p.custoKgMineral ?? 0)) * cabecas
            return (
              <div key={p.id} style={{ background: '#111827', border: '1px solid #1e293b', borderRadius: 14, padding: '18px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{p.nome}</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>{p.objetivo.replace('_', ' ')} {p.lote ? `· ${p.lote.nome}` : ''}</div>
                  </div>
                  <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: p.ativo ? '#10b98120' : '#64748b20', color: p.ativo ? '#10b981' : '#64748b' }}>
                    {p.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {p.racaoKgDia && <div style={{ fontSize: 11, color: '#94a3b8' }}>🌾 {p.racaoKgDia} kg/cab/dia</div>}
                  {p.mineralKgDia && <div style={{ fontSize: 11, color: '#94a3b8' }}>⚗️ {p.mineralKgDia} kg mineral</div>}
                  {p.proteinaBruta && <div style={{ fontSize: 11, color: '#94a3b8' }}>🧬 {p.proteinaBruta}% PB</div>}
                  {custoDia > 0 && <div style={{ fontSize: 11, color: '#fbbf24' }}>💰 R${custoDia.toFixed(2)}/dia lote</div>}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Pastagens */}
      {!loading && tab === 'pastagens' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
          {(pastagens?.pastagens ?? []).length === 0 ? (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px 0', color: '#475569' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🌿</div>
              <p style={{ fontWeight: 600 }}>Nenhuma pastagem cadastrada</p>
              <p style={{ fontSize: 13 }}>Cadastre pastagens para gerenciar a rotação e disponibilidade de pasto</p>
            </div>
          ) : (pastagens?.pastagens ?? []).map((p: any) => {
            const st = STATUS_PASTAGEM[p.status] ?? { label: p.status, color: '#64748b' }
            const rotacaoAtiva = p.rotacoes?.[0]
            return (
              <div key={p.id} style={{ background: '#111827', border: `1px solid ${st.color}40`, borderRadius: 14, padding: '18px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{p.nome}</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>{p.areaHectares} ha {p.forrageira ? `· ${p.forrageira}` : ''}</div>
                  </div>
                  <span style={{ fontSize: 10, padding: '3px 9px', borderRadius: 20, background: st.color + '20', color: st.color, fontWeight: 600 }}>{st.label}</span>
                </div>
                {p.capacidadeUA && <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 6 }}>🐂 Cap: {p.capacidadeUA} UA/ha</div>}
                {rotacaoAtiva && (
                  <div style={{ fontSize: 11, color: '#fbbf24', marginBottom: 8 }}>
                    🐄 Lote: {rotacaoAtiva.lote?.nome ?? 'Sem nome'} · {rotacaoAtiva.cabecas ?? '?'} cabeças
                  </div>
                )}
                {p.status === 'OCUPADA' && (
                  <button onClick={() => liberarPastagem(p.id)}
                    style={{ fontSize: 11, background: '#1e293b', color: '#64748b', border: '1px solid #334155', borderRadius: 7, padding: '5px 12px', cursor: 'pointer' }}>
                    Liberar (descanso)
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}>
          <div style={{ background: '#111827', border: '1px solid #1e293b', borderRadius: 16, padding: 28, width: '100%', maxWidth: 480 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>
              {showForm === 'plano' ? 'Novo Plano Nutricional' : showForm === 'rotacao' ? 'Iniciar Rotação de Pastagem' : 'Cadastrar Pastagem'}
            </h2>
            <form onSubmit={salvar} style={{ display: 'grid', gap: 12 }}>
              {showForm === 'plano' && (
                <>
                  {[
                    { l: 'Nome do plano *', k: 'nome', p: 'Ex: Engorda intensiva Nelore' },
                    { l: 'Ração (kg/cab/dia)', k: 'racaoKgDia', p: '8.5' },
                    { l: 'Custo ração (R$/kg)', k: 'custoKgRacao', p: '1.20' },
                    { l: 'Mineral (kg/cab/dia)', k: 'mineralKgDia', p: '0.08' },
                    { l: 'Custo mineral (R$/kg)', k: 'custoKgMineral', p: '4.50' },
                    { l: 'Proteína bruta (%)', k: 'proteinaBruta', p: '14' },
                  ].map(f => (
                    <div key={f.k}>
                      <label style={{ fontSize: 12, color: '#94a3b8', display: 'block', marginBottom: 4 }}>{f.l}</label>
                      <input value={formPlano[f.k as keyof typeof formPlano]} placeholder={f.p}
                        onChange={e => setFormPlano(p => ({ ...p, [f.k]: e.target.value }))} required={f.l.includes('*')}
                        style={{ width: '100%', background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, padding: '9px 12px', color: '#f1f5f9', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                    </div>
                  ))}
                  <div>
                    <label style={{ fontSize: 12, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Lote vinculado</label>
                    <select value={formPlano.loteId} onChange={e => setFormPlano(p => ({ ...p, loteId: e.target.value }))}
                      style={{ width: '100%', background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, padding: '9px 12px', color: '#f1f5f9', fontSize: 13, outline: 'none' }}>
                      <option value="">Sem lote (geral)</option>
                      {(nutricao?.lotes ?? []).map((l: any) => <option key={l.id} value={l.id}>{l.nome} ({l.cabecas} cab.)</option>)}
                    </select>
                  </div>
                </>
              )}
              {showForm === 'pastagem' && (
                <>
                  {[
                    { l: 'Nome da pastagem *', k: 'nome', p: 'Pasto A, Braquiária Sul...' },
                    { l: 'Área (hectares) *', k: 'areaHectares', p: '12.5' },
                    { l: 'Forrageira', k: 'forrageira', p: 'Brachiaria, Tifton, Mombaça...' },
                    { l: 'Capacidade (UA/ha)', k: 'capacidadeUA', p: '1.5' },
                    { l: 'Ciclo de descanso (dias)', k: 'cicloDescanso', p: '30' },
                  ].map(f => (
                    <div key={f.k}>
                      <label style={{ fontSize: 12, color: '#94a3b8', display: 'block', marginBottom: 4 }}>{f.l}</label>
                      <input value={formPastagem[f.k as keyof typeof formPastagem]} placeholder={f.p}
                        onChange={e => setFormPastagem(p => ({ ...p, [f.k]: e.target.value }))} required={f.l.includes('*')}
                        style={{ width: '100%', background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, padding: '9px 12px', color: '#f1f5f9', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                    </div>
                  ))}
                </>
              )}
              {showForm === 'rotacao' && (
                <>
                  <div>
                    <label style={{ fontSize: 12, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Pastagem *</label>
                    <select value={formRotacao.pastagemId} onChange={e => setFormRotacao(p => ({ ...p, pastagemId: e.target.value }))} required
                      style={{ width: '100%', background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, padding: '9px 12px', color: '#f1f5f9', fontSize: 13, outline: 'none' }}>
                      <option value="">Selecionar pastagem...</option>
                      {(pastagens?.pastagens ?? []).filter((p: any) => p.status !== 'OCUPADA').map((p: any) => (
                        <option key={p.id} value={p.id}>{p.nome} ({p.status})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Lote</label>
                    <select value={formRotacao.loteId} onChange={e => setFormRotacao(p => ({ ...p, loteId: e.target.value }))}
                      style={{ width: '100%', background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, padding: '9px 12px', color: '#f1f5f9', fontSize: 13, outline: 'none' }}>
                      <option value="">Sem lote</option>
                      {(nutricao?.lotes ?? []).map((l: any) => <option key={l.id} value={l.id}>{l.nome}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Nº de cabeças</label>
                    <input value={formRotacao.cabecas} placeholder="120" onChange={e => setFormRotacao(p => ({ ...p, cabecas: e.target.value }))}
                      style={{ width: '100%', background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, padding: '9px 12px', color: '#f1f5f9', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                </>
              )}
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button type="button" onClick={() => setShowForm(null)}
                  style={{ flex: 1, background: 'transparent', border: '1px solid #1e293b', borderRadius: 10, padding: 10, color: '#94a3b8', fontSize: 13, cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" disabled={saving}
                  style={{ flex: 1, background: '#f59e0b', color: '#fff', border: 'none', borderRadius: 10, padding: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
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

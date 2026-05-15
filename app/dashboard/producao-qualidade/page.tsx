'use client'

import { useState, useEffect, useCallback } from 'react'

const ALERTA_COR: Record<string, string> = { verde: '#10b981', amarelo: '#fbbf24', vermelho: '#f87171' }
const ALERTA_BG: Record<string, string> = { verde: '#10b98115', amarelo: '#fbbf2415', vermelho: '#f8717115' }
const ALERTA_LABEL: Record<string, string> = { verde: '✅ Situação Normal', amarelo: '⚠️ Atenção Necessária', vermelho: '🚨 Ação Urgente' }

export default function ProducaoQualidadePage() {
  const [leite, setLeite] = useState<any>(null)
  const [carcaca, setCarcaca] = useState<any>(null)
  const [animais, setAnimais] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'leite' | 'carcaca'>('leite')
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formLeite, setFormLeite] = useState({ animalId: '', litrosManha: '', litrosTarde: '', ccs: '', gordura: '', proteina: '' })
  const [formCarcaca, setFormCarcaca] = useState({ animalId: '', pesoVivo: '', pesoCarcaca: '', classificacao: '', tipificacao: '', frigorificoNome: '', valorArroba: '', observacao: '' })
  const [analiseIA, setAnaliseIA] = useState<any>(null)
  const [loadingIA, setLoadingIA] = useState(false)

  async function analisarComIA() {
    setLoadingIA(true)
    try {
      const r = await fetch('/api/ai/agrograde-analise')
      const d = await r.json()
      setAnaliseIA(d)
    } catch {}
    setLoadingIA(false)
  }

  const carregar = useCallback(() => {
    setLoading(true)
    Promise.all([
      fetch('/api/producao/leite').then(r => r.json()),
      fetch('/api/producao/carcaca').then(r => r.json()),
      fetch('/api/carteira-animal').then(r => r.json()),
    ]).then(([l, c, a]) => { setLeite(l); setCarcaca(c); if (!a.error) setAnimais(a) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { carregar() }, [carregar])

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    if (tab === 'leite') {
      await fetch('/api/producao/leite', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formLeite) })
    } else {
      await fetch('/api/producao/carcaca', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formCarcaca) })
    }
    setShowForm(false)
    carregar()
    setSaving(false)
  }

  return (
    <div style={{ background: '#0a0e1a', minHeight: '100vh', padding: '28px 24px', color: '#f1f5f9' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5 }}>AgroGrade — Produção & Qualidade</h1>
        <p style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>Produção leiteira, rendimento de carcaça e classificação animal</p>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10, marginBottom: 20 }}>
        {[
          { label: 'Litros Hoje', val: `${(leite?.kpis?.totalHoje ?? 0).toFixed(0)} L`, color: '#60a5fa', icon: '🥛' },
          { label: 'Média/Animal', val: `${(leite?.kpis?.mediaAnimal ?? 0).toFixed(1)} L`, color: '#34d399', icon: '🐄' },
          { label: 'Rend. Médio', val: `${(carcaca?.kpis?.rendMedio ?? 0).toFixed(1)}%`, color: '#fbbf24', icon: '🥩' },
          { label: 'Receita Abates', val: `R$${(carcaca?.kpis?.receitaTotal ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`, color: '#10b981', icon: '💰' },
        ].map(k => (
          <div key={k.label} style={{ background: '#111827', border: '1px solid #1e293b', borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>{k.icon} {k.label}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: k.color }}>{k.val}</div>
          </div>
        ))}
      </div>

      {/* Painel IA */}
      <div style={{ background: '#0d1117', border: '1px solid #1e293b', borderRadius: 14, padding: '16px 20px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: analiseIA ? 14 : 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 18 }}>🤖</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9' }}>AgroGrade Intelligence</div>
              <div style={{ fontSize: 11, color: '#475569' }}>IA + QUBO Seleção — qualidade de leite e seleção de abate otimizada</div>
            </div>
            {analiseIA && (
              <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: ALERTA_BG[analiseIA.nivel_alerta] ?? '#1e293b', color: ALERTA_COR[analiseIA.nivel_alerta] ?? '#94a3b8', fontWeight: 600 }}>
                {ALERTA_LABEL[analiseIA.nivel_alerta] ?? analiseIA.nivel_alerta}
              </span>
            )}
          </div>
          <button onClick={analisarComIA} disabled={loadingIA}
            style={{ background: loadingIA ? '#1e293b' : '#60a5fa', color: '#fff', border: 'none', borderRadius: 9, padding: '8px 16px', fontSize: 12, fontWeight: 600, cursor: loadingIA ? 'default' : 'pointer', opacity: loadingIA ? 0.7 : 1 }}>
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
                <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>Diagnóstico de Produção</div>
                <div style={{ fontSize: 13, color: '#e2e8f0', lineHeight: 1.5 }}>{analiseIA.diagnostico}</div>
              </div>
              <div style={{ background: '#111827', borderRadius: 10, padding: '12px 14px', borderLeft: `3px solid ${ALERTA_COR[analiseIA.nivel_alerta] ?? '#64748b'}` }}>
                <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>Ação Prioritária</div>
                <div style={{ fontSize: 13, color: '#fbbf24', fontWeight: 600, lineHeight: 1.5 }}>{analiseIA.acao_prioritaria}</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              {analiseIA.qualidade_leite && (
                <div style={{ background: '#111827', borderRadius: 10, padding: '10px 14px' }}>
                  <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>🥛 Qualidade do Leite</div>
                  <div style={{ fontSize: 12, color: '#60a5fa', lineHeight: 1.4 }}>{analiseIA.qualidade_leite}</div>
                </div>
              )}
              {analiseIA.oportunidade_abate && (
                <div style={{ background: '#111827', borderRadius: 10, padding: '10px 14px' }}>
                  <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>🥩 Oportunidade de Abate</div>
                  <div style={{ fontSize: 12, color: '#fbbf24', lineHeight: 1.4 }}>{analiseIA.oportunidade_abate}</div>
                </div>
              )}
              {analiseIA.melhoria_rend && (
                <div style={{ background: '#111827', borderRadius: 10, padding: '10px 14px' }}>
                  <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>📈 Melhorar Rendimento</div>
                  <div style={{ fontSize: 12, color: '#34d399', lineHeight: 1.4 }}>{analiseIA.melhoria_rend}</div>
                </div>
              )}
            </div>
            {(analiseIA.selecaoAbate ?? []).length > 0 && (
              <div style={{ background: '#111827', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontSize: 10, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>
                  ⚛️ QUBO — Seleção de Abate Otimizada {analiseIA.quantum && <span style={{ color: '#475569', marginLeft: 4 }}>· {analiseIA.quantum.convergencia}% convergência</span>}
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {(analiseIA.selecaoAbate as any[]).slice(0, 6).map((item: any, i: number) => (
                    <div key={i} style={{ background: '#0f172a', border: `1px solid ${item.prioridade === 'alta' ? '#fbbf2430' : item.prioridade === 'media' ? '#60a5fa20' : '#1e293b'}`, borderRadius: 8, padding: '8px 12px', minWidth: 150 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: item.prioridade === 'alta' ? '#fbbf24' : '#94a3b8' }}>{item.animal}</div>
                      <div style={{ fontSize: 10, color: '#475569', marginTop: 2 }}>{item.peso} kg</div>
                      <div style={{ fontSize: 10, color: item.prioridade === 'alta' ? '#f87171' : '#60a5fa', marginTop: 3 }}>{item.recomendacao}</div>
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
        {[['leite', '🥛 Produção Leiteira'], ['carcaca', '🥩 Controle de Carcaça']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id as any)}
            style={{ padding: '8px 16px', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              background: tab === id ? '#60a5fa' : '#111827', color: tab === id ? '#fff' : '#64748b' }}>
            {label}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <button onClick={() => setShowForm(true)}
          style={{ background: '#60a5fa', color: '#fff', border: 'none', borderRadius: 9, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          + Registrar
        </button>
      </div>

      {loading && <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>Carregando...</div>}

      {/* Leite */}
      {!loading && tab === 'leite' && (
        <div style={{ display: 'grid', gap: 8 }}>
          {(leite?.registros ?? []).length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#475569' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🥛</div>
              <p style={{ fontWeight: 600 }}>Nenhum registro de produção leiteira</p>
              <p style={{ fontSize: 13 }}>Registre a produção diária de cada vaca leiteira</p>
            </div>
          ) : (leite?.registros ?? []).map((r: any) => (
            <div key={r.id} style={{ background: '#111827', border: '1px solid #1e293b', borderRadius: 12, padding: '12px 18px', display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, color: '#64748b', minWidth: 70 }}>{new Date(r.data).toLocaleDateString('pt-BR')}</span>
              <span style={{ fontSize: 12, fontWeight: 600, flex: 1 }}>{r.animal.identificacao}</span>
              <span style={{ fontSize: 12, color: '#60a5fa' }}>🥛 {r.totalLitros.toFixed(1)} L</span>
              <span style={{ fontSize: 11, color: '#94a3b8' }}>{r.litrosManha}L manhã + {r.litrosTarde}L tarde</span>
              {r.gordura && <span style={{ fontSize: 11, color: '#fbbf24' }}>🧈 {r.gordura}% gord.</span>}
              {r.ccs && <span style={{ fontSize: 11, color: r.ccs > 400000 ? '#f87171' : '#34d399' }}>CCS: {(r.ccs / 1000).toFixed(0)}k</span>}
            </div>
          ))}
        </div>
      )}

      {/* Carcaça */}
      {!loading && tab === 'carcaca' && (
        <div style={{ display: 'grid', gap: 8 }}>
          {(carcaca?.registros ?? []).length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#475569' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🥩</div>
              <p style={{ fontWeight: 600 }}>Nenhum registro de abate</p>
              <p style={{ fontSize: 13 }}>Registre os dados de carcaça após o abate para análise de rendimento</p>
            </div>
          ) : (carcaca?.registros ?? []).map((r: any) => (
            <div key={r.id} style={{ background: '#111827', border: '1px solid #1e293b', borderRadius: 12, padding: '14px 18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <div>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>{r.animal.identificacao}</span>
                  {r.classificacao && <span style={{ fontSize: 11, color: '#fbbf24', marginLeft: 8, background: '#fbbf2420', padding: '2px 8px', borderRadius: 20 }}>{r.classificacao}</span>}
                </div>
                <span style={{ fontSize: 11, color: '#64748b' }}>{new Date(r.dataAbate).toLocaleDateString('pt-BR')}</span>
              </div>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, color: '#94a3b8' }}>⚖️ {r.pesoVivo} kg vivo</span>
                {r.pesoCarcaca && <span style={{ fontSize: 12, color: '#94a3b8' }}>🥩 {r.pesoCarcaca} kg carcaça</span>}
                {r.rendimentoCarcaca && <span style={{ fontSize: 12, color: '#10b981', fontWeight: 600 }}>📊 {r.rendimentoCarcaca.toFixed(1)}% rend.</span>}
                {r.valorArroba && <span style={{ fontSize: 12, color: '#fbbf24' }}>@ R${r.valorArroba}</span>}
                {r.receitaTotal && <span style={{ fontSize: 12, color: '#22c55e', fontWeight: 700 }}>R${r.receitaTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>}
              </div>
              {r.frigorificoNome && <div style={{ fontSize: 11, color: '#475569', marginTop: 6 }}>🏭 {r.frigorificoNome}</div>}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16, overflowY: 'auto' }}>
          <div style={{ background: '#111827', border: '1px solid #1e293b', borderRadius: 16, padding: 28, width: '100%', maxWidth: 480, margin: 'auto' }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>
              {tab === 'leite' ? 'Registrar Produção de Leite' : 'Registrar Abate / Carcaça'}
            </h2>
            <form onSubmit={salvar} style={{ display: 'grid', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Animal *</label>
                <select
                  value={tab === 'leite' ? formLeite.animalId : formCarcaca.animalId}
                  onChange={e => tab === 'leite' ? setFormLeite(p => ({ ...p, animalId: e.target.value })) : setFormCarcaca(p => ({ ...p, animalId: e.target.value }))}
                  required style={{ width: '100%', background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, padding: '9px 12px', color: '#f1f5f9', fontSize: 13, outline: 'none' }}>
                  <option value="">Selecionar animal...</option>
                  {animais.map((a: any) => <option key={a.id} value={a.id}>{a.identificacao} {a.raca ? `(${a.raca})` : ''}</option>)}
                </select>
              </div>
              {tab === 'leite' ? (
                <>
                  {[
                    { l: 'Litros manhã', k: 'litrosManha', p: '12' },
                    { l: 'Litros tarde', k: 'litrosTarde', p: '10' },
                    { l: 'CCS (células/mL)', k: 'ccs', p: '200000' },
                    { l: 'Gordura (%)', k: 'gordura', p: '3.8' },
                    { l: 'Proteína (%)', k: 'proteina', p: '3.2' },
                  ].map(f => (
                    <div key={f.k}>
                      <label style={{ fontSize: 12, color: '#94a3b8', display: 'block', marginBottom: 4 }}>{f.l}</label>
                      <input value={formLeite[f.k as keyof typeof formLeite]} placeholder={f.p}
                        onChange={e => setFormLeite(p => ({ ...p, [f.k]: e.target.value }))}
                        style={{ width: '100%', background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, padding: '9px 12px', color: '#f1f5f9', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                    </div>
                  ))}
                </>
              ) : (
                <>
                  {[
                    { l: 'Peso vivo (kg) *', k: 'pesoVivo', p: '480' },
                    { l: 'Peso carcaça (kg)', k: 'pesoCarcaca', p: '256' },
                    { l: 'Classificação', k: 'classificacao', p: 'Gordo, Médio, Magro' },
                    { l: 'Tipificação', k: 'tipificacao', p: 'A, B, C' },
                    { l: 'Frigorífico', k: 'frigorificoNome', p: 'Nome do frigorífico' },
                    { l: 'Valor da arroba (R$)', k: 'valorArroba', p: '320' },
                    { l: 'Observação', k: 'observacao', p: 'Observações gerais' },
                  ].map(f => (
                    <div key={f.k}>
                      <label style={{ fontSize: 12, color: '#94a3b8', display: 'block', marginBottom: 4 }}>{f.l}</label>
                      <input value={formCarcaca[f.k as keyof typeof formCarcaca]} placeholder={f.p} required={f.l.includes('*')}
                        onChange={e => setFormCarcaca(p => ({ ...p, [f.k]: e.target.value }))}
                        style={{ width: '100%', background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, padding: '9px 12px', color: '#f1f5f9', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                    </div>
                  ))}
                </>
              )}
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button type="button" onClick={() => setShowForm(false)}
                  style={{ flex: 1, background: 'transparent', border: '1px solid #1e293b', borderRadius: 10, padding: 10, color: '#94a3b8', fontSize: 13, cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" disabled={saving}
                  style={{ flex: 1, background: '#60a5fa', color: '#fff', border: 'none', borderRadius: 10, padding: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
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

'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'

const TIPO_COLOR: Record<string, string> = {
  COMPRA: '#f87171', LEILAO_COMPRA: '#fb923c',
  VENDA: '#10b981', LEILAO_VENDA: '#34d399',
}
const TIPO_LABEL: Record<string, string> = {
  COMPRA: 'Compra', LEILAO_COMPRA: 'Leilão Compra',
  VENDA: 'Venda', LEILAO_VENDA: 'Leilão Venda',
}
const ALERTA_COR: Record<string, string> = { verde: '#10b981', amarelo: '#fbbf24', vermelho: '#f87171' }
const ALERTA_BG: Record<string, string> = { verde: '#10b98115', amarelo: '#fbbf2415', vermelho: '#f8717115' }
const ALERTA_LABEL: Record<string, string> = { verde: '✅ Situação Normal', amarelo: '⚠️ Atenção Necessária', vermelho: '🚨 Ação Urgente' }

const SCORE_COR: Record<string, string> = { VERDE: '#10b981', AMARELO: '#fbbf24', VERMELHO: '#f87171' }
const SCORE_BG: Record<string, string> = { VERDE: 'rgba(16,185,129,0.1)', AMARELO: 'rgba(251,191,36,0.1)', VERMELHO: 'rgba(248,113,113,0.1)' }
const SCORE_LABEL: Record<string, string> = { VERDE: 'Negócio Viável', AMARELO: 'Avaliar com Cuidado', VERMELHO: 'Alto Risco — Revisar' }
const VIAB_COR: Record<string, string> = { RECOMENDADO: '#10b981', ATENCAO: '#fbbf24', RISCO: '#f87171' }
const VIAB_BG: Record<string, string> = { RECOMENDADO: 'rgba(16,185,129,0.08)', ATENCAO: 'rgba(251,191,36,0.08)', RISCO: 'rgba(248,113,113,0.08)' }

const CALC_INIT = {
  origem: 'LEILAO',
  finalidade: 'ENGORDA',
  cabecas: '', pesoMedio: '', pesoMeta: '', raca: '', categoria: 'NOVILHO',
  precoPorArroba: '', frete: '', comissaoPerc: '5',
  funruralPerc: '2.3', icmsPerc: '', outrosCustos: '',
  precoVendaArroba: '', diasCiclo: '', custoDiarioCab: '',
  checkGTA: false, checkNF: false, checkSISBOV: false,
  checkBrucelose: false, checkTuberculose: false, checkIDAROM: false,
}

export default function FinanceiroPecuarioPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'transacoes' | 'valuation' | 'calculadora'>('transacoes')
  const [showForm, setShowForm] = useState<null | 'transacao' | 'valuation'>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ tipo: 'VENDA', cabecas: '', pesoTotal: '', valorArroba: '', valorTotal: '', contraparte: '', gta: '', comissao: '', observacao: '' })
  const [arrobaRef, setArrobaRef] = useState('320')
  const [analiseIA, setAnaliseIA] = useState<any>(null)
  const [loadingIA, setLoadingIA] = useState(false)

  // Calculadora de Compra
  const [calc, setCalcState] = useState({ ...CALC_INIT })
  const [calcIA, setCalcIA] = useState<any>(null)
  const [calcIALoading, setCalcIALoading] = useState(false)

  const setCalc = (k: string, v: string | boolean) => setCalcState(p => ({ ...p, [k]: v }))

  const cr = useMemo(() => {
    const cab  = Math.max(0, Number(calc.cabecas) || 0)
    const pm   = Math.max(0, Number(calc.pesoMedio) || 0)
    const ptot = cab * pm
    const arComp = ptot / 15

    const pArr  = Math.max(0, Number(calc.precoPorArroba) || 0)
    const frete = Math.max(0, Number(calc.frete) || 0)
    const comP  = Math.max(0, Number(calc.comissaoPerc) || 0)
    const funP  = Math.max(0, Number(calc.funruralPerc) || 0)
    const icmP  = Math.max(0, Number(calc.icmsPerc) || 0)
    const outR  = Math.max(0, Number(calc.outrosCustos) || 0)

    const cBase = arComp * pArr
    const comR  = cBase * comP / 100
    const funR  = cBase * funP / 100
    const icmR  = cBase * icmP / 100
    const ctot  = cBase + frete + comR + funR + icmR + outR
    const cPorCab = cab > 0 ? ctot / cab : 0
    const cArroba = arComp > 0 ? ctot / arComp : 0

    const pmeta = Math.max(0, Number(calc.pesoMeta) || 0)
    const pVend = Math.max(0, Number(calc.precoVendaArroba) || 0)
    const dias  = Math.max(0, Number(calc.diasCiclo) || 0)
    const cDia  = Math.max(0, Number(calc.custoDiarioCab) || 0)

    const arVend = cab > 0 && pmeta > 0 ? (cab * pmeta) / 15 : 0
    const recEst = arVend * pVend
    const cProd  = cab * cDia * dias
    const lucro  = recEst - ctot - cProd
    const margem = recEst > 0 ? (lucro / recEst) * 100 : 0
    const gmd    = dias > 0 && pmeta > pm ? (pmeta - pm) / dias : 0
    const temProj = pVend > 0 && arVend > 0

    let score: 'VERDE' | 'AMARELO' | 'VERMELHO' = 'AMARELO'
    if (temProj) {
      score = margem > 15 ? 'VERDE' : margem < 5 ? 'VERMELHO' : 'AMARELO'
    } else if (cArroba > 0 && pArr > 0) {
      const r = cArroba / pArr
      score = r <= 1.05 ? 'VERDE' : r > 1.15 ? 'VERMELHO' : 'AMARELO'
    }

    return { cab, pm, ptot, arComp, cBase, comR, funR, icmR, frete, outR, ctot, cPorCab, cArroba, arVend, recEst, cProd, lucro, margem, gmd, temProj, score, pVend, pmeta }
  }, [calc])

  async function analisarComIA() {
    setLoadingIA(true)
    try {
      const r = await fetch('/api/ai/agrotrade-analise')
      const d = await r.json()
      setAnaliseIA(d)
    } catch {}
    setLoadingIA(false)
  }

  async function analisarCompraIA() {
    setCalcIALoading(true); setCalcIA(null)
    try {
      const r = await fetch('/api/ai/calculadora-compra', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origem: calc.origem, finalidade: calc.finalidade,
          cabecas: cr.cab, raca: calc.raca, categoria: calc.categoria,
          pesoMedio: Number(calc.pesoMedio), precoPorArroba: Number(calc.precoPorArroba),
          custoTotal: cr.ctot, custoPorCab: cr.cPorCab, custoArrobaReal: cr.cArroba,
          arrobasCompradas: cr.arComp, precoVendaArroba: cr.pVend, arrobasVenda: cr.arVend,
          receitaEstimada: cr.recEst, lucroEstimado: cr.lucro, margemBruta: cr.margem,
          diasCiclo: Number(calc.diasCiclo), gmd: cr.gmd, score: cr.score,
        }),
      })
      setCalcIA(await r.json())
    } catch { setCalcIA({ error: 'Erro ao analisar. Tente novamente.' }) }
    setCalcIALoading(false)
  }

  function usarNoRegistro() {
    setForm({
      tipo: calc.origem === 'LEILAO' ? 'LEILAO_COMPRA' : 'COMPRA',
      cabecas: calc.cabecas,
      pesoTotal: cr.ptot > 0 ? cr.ptot.toFixed(0) : '',
      valorArroba: calc.precoPorArroba,
      valorTotal: cr.ctot > 0 ? cr.ctot.toFixed(2) : '',
      contraparte: '',
      gta: '',
      comissao: cr.comR > 0 ? cr.comR.toFixed(2) : '0',
      observacao: `Calculadora · ${calc.finalidade} · ${calc.raca || ''} ${calc.categoria}`.trim(),
    })
    setShowForm('transacao')
  }

  const carregar = useCallback(() => {
    setLoading(true)
    fetch('/api/financeiro-pecuario')
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { carregar() }, [carregar])

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

  const R = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  const N = (v: number, d = 1) => v.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d })

  const inputStyle = { width: '100%', background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, padding: '8px 10px', color: '#f1f5f9', fontSize: 13, outline: 'none', boxSizing: 'border-box' as const }
  const inputAccent = { ...inputStyle, border: '1px solid rgba(245,158,11,0.3)' }
  const inputPurple = { ...inputStyle, border: '1px solid rgba(167,139,250,0.25)' }

  const breakdownItems = [
    { l: 'Custo base (arrobas × R$/@)', v: cr.cBase },
    ...(cr.frete > 0 ? [{ l: 'Frete total', v: cr.frete }] : []),
    ...(cr.comR > 0 ? [{ l: 'Comissão leiloeiro', v: cr.comR }] : []),
    ...(cr.funR > 0 ? [{ l: 'FUNRURAL', v: cr.funR }] : []),
    ...(cr.icmR > 0 ? [{ l: 'ICMS', v: cr.icmR }] : []),
    ...(cr.outR > 0 ? [{ l: 'Outros custos', v: cr.outR }] : []),
  ]

  const checklist = [
    { k: 'checkGTA', l: 'GTA — Guia de Trânsito Animal', info: 'obrigatório por lei federal' },
    { k: 'checkNF', l: 'Nota Fiscal de Compra', info: 'comprovante fiscal' },
    { k: 'checkSISBOV', l: 'SISBOV / brinco rastreável', info: 'rastreabilidade individual' },
    { k: 'checkBrucelose', l: 'Atestado de Brucelose', info: 'exigido para fêmeas bovinas' },
    { k: 'checkTuberculose', l: 'Atestado de Tuberculose', info: 'exigido em várias UFs' },
    { k: 'checkIDAROM', l: 'IDARON / IMA / ADAPEC', info: 'órgão estadual de defesa animal' },
  ]

  return (
    <div style={{ background: '#0a0e1a', minHeight: '100vh', padding: '28px 24px', color: '#f1f5f9' }}>
      <style>{`
        .calc-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .calc-kpis { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .calc-docs { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 8px; }
        .calc-bottom { display: grid; grid-template-columns: 1fr auto; gap: 12px; align-items: start; margin-top: 16px; }
        @media (max-width: 768px) {
          .calc-layout { grid-template-columns: 1fr; }
          .calc-bottom { grid-template-columns: 1fr; }
        }
      `}</style>

      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5 }}>AgroTrade — Financeiro Pecuário</h1>
        <p style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>Compra e venda de gado, custo por cabeça, margem e valuation do rebanho</p>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10, marginBottom: 20 }}>
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

      {/* Painel IA (AgroTrade Intelligence) */}
      <div style={{ background: '#0d1117', border: '1px solid #1e293b', borderRadius: 14, padding: '16px 20px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: analiseIA ? 14 : 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 18 }}>🤖</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9' }}>AgroTrade Intelligence</div>
              <div style={{ fontSize: 11, color: '#475569' }}>IA + QUBO Markowitz — portfolio e timing de mercado pecuário</div>
            </div>
            {analiseIA && (
              <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: ALERTA_BG[analiseIA.nivel_alerta] ?? '#1e293b', color: ALERTA_COR[analiseIA.nivel_alerta] ?? '#94a3b8', fontWeight: 600 }}>
                {ALERTA_LABEL[analiseIA.nivel_alerta] ?? analiseIA.nivel_alerta}
              </span>
            )}
          </div>
          <button onClick={analisarComIA} disabled={loadingIA}
            style={{ background: loadingIA ? '#1e293b' : '#a78bfa', color: '#fff', border: 'none', borderRadius: 9, padding: '8px 16px', fontSize: 12, fontWeight: 600, cursor: loadingIA ? 'default' : 'pointer', opacity: loadingIA ? 0.7 : 1 }}>
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
        {analiseIA?.error && analiseIA.error !== 'UPGRADE_REQUIRED' && (
          <div style={{ marginTop: 14, background: '#1e0e0e', border: '1px solid #f8717130', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 18 }}>⚠️</span>
            <div style={{ fontSize: 12, color: '#f87171' }}>Erro ao analisar: {analiseIA.error}</div>
          </div>
        )}
        {analiseIA && !analiseIA.error && (
          <div style={{ display: 'grid', gap: 10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div style={{ background: '#111827', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>Diagnóstico Financeiro</div>
                <div style={{ fontSize: 13, color: '#e2e8f0', lineHeight: 1.5 }}>{analiseIA.diagnostico}</div>
              </div>
              <div style={{ background: '#111827', borderRadius: 10, padding: '12px 14px', borderLeft: `3px solid ${ALERTA_COR[analiseIA.nivel_alerta] ?? '#64748b'}` }}>
                <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>Ação Prioritária</div>
                <div style={{ fontSize: 13, color: '#fbbf24', fontWeight: 600, lineHeight: 1.5 }}>{analiseIA.acao_prioritaria}</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              {analiseIA.timing_mercado && (
                <div style={{ background: '#111827', borderRadius: 10, padding: '10px 14px' }}>
                  <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>📊 Timing de Mercado</div>
                  <div style={{ fontSize: 12, color: '#10b981', lineHeight: 1.4 }}>{analiseIA.timing_mercado}</div>
                </div>
              )}
              {analiseIA.otimizacao_rebanho && (
                <div style={{ background: '#111827', borderRadius: 10, padding: '10px 14px' }}>
                  <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>🐂 Otimização do Rebanho</div>
                  <div style={{ fontSize: 12, color: '#a78bfa', lineHeight: 1.4 }}>{analiseIA.otimizacao_rebanho}</div>
                </div>
              )}
              {analiseIA.alerta_fluxo && (
                <div style={{ background: '#111827', borderRadius: 10, padding: '10px 14px' }}>
                  <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>⚠️ Alerta de Fluxo</div>
                  <div style={{ fontSize: 12, color: '#f87171', lineHeight: 1.4 }}>{analiseIA.alerta_fluxo}</div>
                </div>
              )}
            </div>
            {(analiseIA.portfolioOtimizado ?? []).length > 0 && (
              <div style={{ background: '#111827', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontSize: 10, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>
                  ⚛️ QUBO Markowitz — Portfolio Pecuário Otimizado {analiseIA.quantum && <span style={{ color: '#475569', marginLeft: 4 }}>· {analiseIA.quantum.convergencia}% convergência</span>}
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {(analiseIA.portfolioOtimizado as any[]).map((item: any, i: number) => (
                    <div key={i} style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, padding: '8px 12px', minWidth: 170 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#e2e8f0' }}>{item.categoria.replace(/_/g, ' ')}</div>
                      <div style={{ fontSize: 10, color: '#475569', marginTop: 2 }}>{item.quantidade} animais</div>
                      <div style={{ fontSize: 10, color: '#a78bfa', marginTop: 3, fontWeight: 600 }}>{item.estrategiaRecomendada}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Valuation card */}
      {valuation && (
        <div style={{ background: '#111827', border: '1px solid #a78bfa40', borderRadius: 14, padding: '16px 20px', marginBottom: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 12 }}>
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
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {([['transacoes', 'Transações'], ['valuation', 'Valuation'], ['calculadora', '🧮 Calculadora de Compra']] as [string, string][]).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id as any)}
            style={{ padding: '8px 16px', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              background: tab === id ? (id === 'calculadora' ? '#f59e0b' : '#a78bfa') : '#111827',
              color: tab === id ? '#fff' : '#64748b' }}>
            {label}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        {tab !== 'calculadora' && (
          <>
            <button onClick={() => setShowForm('valuation')}
              style={{ background: '#1e293b', color: '#a78bfa', border: '1px solid #a78bfa40', borderRadius: 9, padding: '8px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              Calcular Valuation
            </button>
            <button onClick={() => setShowForm('transacao')}
              style={{ background: '#a78bfa', color: '#fff', border: 'none', borderRadius: 9, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              + Nova Transação
            </button>
          </>
        )}
      </div>

      {loading && <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>Carregando...</div>}

      {/* Tab: Transações */}
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
                    <span style={{ fontSize: 11, padding: '2px 9px', borderRadius: 20, background: corTipo + '20', color: corTipo, fontWeight: 700 }}>{TIPO_LABEL[t.tipo]}</span>
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

      {/* Tab: Valuation */}
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

      {/* Tab: Calculadora de Compra */}
      {tab === 'calculadora' && (
        <div>
          <div className="calc-layout">
            {/* COLUNA ESQUERDA — Inputs */}
            <div style={{ display: 'grid', gap: 12 }}>

              {/* Origem da Compra */}
              <div style={{ background: '#111827', border: '1px solid #1e293b', borderRadius: 12, padding: '14px 16px' }}>
                <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10, fontWeight: 600 }}>Origem da Compra</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {[['LEILAO', 'Leilão'], ['LOJISTA', 'Lojista'], ['PRODUTOR_DIRETO', 'Produtor Direto'], ['FAZENDA', 'Visita à Fazenda']].map(([v, l]) => (
                    <button key={v} onClick={() => setCalc('origem', v)}
                      style={{ padding: '6px 12px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                        background: calc.origem === v ? '#f59e0b' : 'rgba(255,255,255,0.05)',
                        color: calc.origem === v ? '#000' : '#94a3b8' }}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Finalidade */}
              <div style={{ background: '#111827', border: '1px solid #1e293b', borderRadius: 12, padding: '14px 16px' }}>
                <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10, fontWeight: 600 }}>Finalidade</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {[['ABATE', 'Abate'], ['ENGORDA', 'Engorda'], ['CRIA', 'Cria'], ['RECRIA', 'Recria'], ['REPRODUCAO', 'Reprodução'], ['EXPOSICAO', 'Exposição']].map(([v, l]) => (
                    <button key={v} onClick={() => setCalc('finalidade', v)}
                      style={{ padding: '6px 12px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                        background: calc.finalidade === v ? '#a78bfa' : 'rgba(255,255,255,0.05)',
                        color: calc.finalidade === v ? '#fff' : '#94a3b8' }}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dados do Lote */}
              <div style={{ background: '#111827', border: '1px solid #1e293b', borderRadius: 12, padding: '14px 16px' }}>
                <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10, fontWeight: 600 }}>Dados do Lote</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[
                    { k: 'cabecas', l: 'Cabeças', p: '50', t: 'number' },
                    { k: 'pesoMedio', l: 'Peso médio (kg)', p: '400', t: 'number' },
                    { k: 'pesoMeta', l: 'Peso meta / abate (kg)', p: '520', t: 'number' },
                    { k: 'raca', l: 'Raça', p: 'Nelore, Angus...', t: 'text' },
                  ].map(f => (
                    <div key={f.k}>
                      <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 3 }}>{f.l}</label>
                      <input type={f.t} min={f.t === 'number' ? '0' : undefined} step={f.t === 'number' ? 'any' : undefined}
                        placeholder={f.p}
                        value={(calc as any)[f.k]}
                        onChange={e => setCalc(f.k, e.target.value)}
                        style={inputStyle} />
                    </div>
                  ))}
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 3 }}>Categoria</label>
                    <select value={calc.categoria} onChange={e => setCalc('categoria', e.target.value)}
                      style={{ ...inputStyle, appearance: 'none' }}>
                      {[['BEZERRO', 'Bezerro(a)'], ['GARROTE', 'Garrote'], ['NOVILHO', 'Novilho / Novilha'], ['BOI_GORDO', 'Boi Gordo'], ['VACA', 'Vaca'], ['TOURO', 'Touro / Reprodutor']].map(([v, l]) => (
                        <option key={v} value={v}>{l}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Custos de Entrada */}
              <div style={{ background: '#111827', border: '1px solid #1e293b', borderRadius: 12, padding: '14px 16px' }}>
                <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10, fontWeight: 600 }}>Custos de Entrada</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 11, color: '#fbbf24', display: 'block', marginBottom: 3 }}>R$/@ compra *</label>
                    <input type="number" min="0" step="any" placeholder="320"
                      value={calc.precoPorArroba} onChange={e => setCalc('precoPorArroba', e.target.value)}
                      style={inputAccent} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 3 }}>Frete total (R$)</label>
                    <input type="number" min="0" step="any" placeholder="2500"
                      value={calc.frete} onChange={e => setCalc('frete', e.target.value)}
                      style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 3 }}>Comissão leiloeiro (%)</label>
                    <input type="number" min="0" max="100" step="any" placeholder="5"
                      value={calc.comissaoPerc} onChange={e => setCalc('comissaoPerc', e.target.value)}
                      style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 3 }}>FUNRURAL (%)</label>
                    <input type="number" min="0" max="100" step="any" placeholder="2.3"
                      value={calc.funruralPerc} onChange={e => setCalc('funruralPerc', e.target.value)}
                      style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 3 }}>ICMS (%)</label>
                    <input type="number" min="0" max="100" step="any" placeholder="0"
                      value={calc.icmsPerc} onChange={e => setCalc('icmsPerc', e.target.value)}
                      style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 3 }}>Outros custos (R$)</label>
                    <input type="number" min="0" step="any" placeholder="0"
                      value={calc.outrosCustos} onChange={e => setCalc('outrosCustos', e.target.value)}
                      style={inputStyle} />
                  </div>
                </div>
              </div>

              {/* Projeção de Saída */}
              <div style={{ background: '#111827', border: '1px solid rgba(167,139,250,0.2)', borderRadius: 12, padding: '14px 16px' }}>
                <div style={{ fontSize: 11, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4, fontWeight: 600 }}>Projeção de Saída</div>
                <div style={{ fontSize: 10, color: '#475569', marginBottom: 10 }}>opcional — habilita score de viabilidade completo</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 3 }}>R$/@ venda esperado</label>
                    <input type="number" min="0" step="any" placeholder="380"
                      value={calc.precoVendaArroba} onChange={e => setCalc('precoVendaArroba', e.target.value)}
                      style={inputPurple} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 3 }}>Dias de ciclo</label>
                    <input type="number" min="0" placeholder="90"
                      value={calc.diasCiclo} onChange={e => setCalc('diasCiclo', e.target.value)}
                      style={inputStyle} />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 3 }}>Custo diário / cabeça (R$)</label>
                    <input type="number" min="0" step="any" placeholder="12.50"
                      value={calc.custoDiarioCab} onChange={e => setCalc('custoDiarioCab', e.target.value)}
                      style={inputStyle} />
                  </div>
                </div>
              </div>
            </div>

            {/* COLUNA DIREITA — Resultados */}
            <div style={{ display: 'grid', gap: 12, alignContent: 'start' }}>

              {cr.ctot === 0 ? (
                <div style={{ background: '#111827', border: '1px solid #1e293b', borderRadius: 12, padding: '40px 20px', textAlign: 'center', color: '#475569' }}>
                  <div style={{ fontSize: 36, marginBottom: 12 }}>🧮</div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6, color: '#64748b' }}>Preencha os dados do lote</div>
                  <div style={{ fontSize: 12 }}>Os resultados aparecem aqui em tempo real</div>
                </div>
              ) : (
                <>
                  {/* Score de Viabilidade */}
                  <div style={{ background: SCORE_BG[cr.score], border: `1px solid ${SCORE_COR[cr.score]}40`, borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: SCORE_COR[cr.score] + '25', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
                      {cr.score === 'VERDE' ? '✅' : cr.score === 'AMARELO' ? '⚠️' : '🚨'}
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: SCORE_COR[cr.score] }}>{SCORE_LABEL[cr.score]}</div>
                      <div style={{ fontSize: 11, color: '#64748b', marginTop: 3 }}>
                        {cr.temProj ? `Margem bruta estimada: ${N(cr.margem, 1)}%` : 'Informe R$/@ venda para análise completa'}
                      </div>
                    </div>
                  </div>

                  {/* KPIs principais */}
                  <div className="calc-kpis">
                    {[
                      { l: 'Custo/@ Real', v: cr.cArroba > 0 ? R(cr.cArroba) : '—', c: '#fbbf24', s: 'com todos os encargos' },
                      { l: 'Custo/Cabeça', v: cr.cPorCab > 0 ? R(cr.cPorCab) : '—', c: '#f87171', s: 'total investido por animal' },
                      { l: 'Custo Total', v: cr.ctot > 0 ? R(cr.ctot) : '—', c: '#a78bfa', s: `${N(cr.arComp, 1)} @ compradas` },
                      { l: 'Arrobas Compradas', v: cr.arComp > 0 ? `${N(cr.arComp, 1)} @` : '—', c: '#60a5fa', s: cr.ptot > 0 ? `${N(cr.ptot, 0)} kg total` : '' },
                    ].map(k => (
                      <div key={k.l} style={{ background: '#111827', border: '1px solid #1e293b', borderRadius: 10, padding: '12px 14px' }}>
                        <div style={{ fontSize: 10, color: '#64748b', marginBottom: 4 }}>{k.l}</div>
                        <div style={{ fontSize: 17, fontWeight: 800, color: k.c }}>{k.v}</div>
                        <div style={{ fontSize: 10, color: '#475569', marginTop: 2 }}>{k.s}</div>
                      </div>
                    ))}
                  </div>

                  {/* KPIs projeção */}
                  {cr.temProj && (
                    <div className="calc-kpis">
                      {[
                        { l: 'Receita Estimada', v: R(cr.recEst), c: '#10b981', s: `${N(cr.arVend, 1)} @ @ R$${N(cr.pVend, 0)}` },
                        { l: 'Custo de Produção', v: R(cr.cProd), c: '#f87171', s: 'ração + manejo' },
                        { l: 'Lucro Estimado', v: R(cr.lucro), c: cr.lucro >= 0 ? '#34d399' : '#f87171', s: cr.lucro >= 0 ? 'projeção positiva' : 'projeção negativa' },
                        { l: 'Margem Bruta', v: `${N(cr.margem, 1)}%`, c: cr.margem > 15 ? '#10b981' : cr.margem > 5 ? '#fbbf24' : '#f87171', s: cr.gmd > 0 ? `GMD: ${N(cr.gmd, 3)} kg/dia` : '' },
                      ].map(k => (
                        <div key={k.l} style={{ background: '#111827', border: '1px solid rgba(167,139,250,0.15)', borderRadius: 10, padding: '12px 14px' }}>
                          <div style={{ fontSize: 10, color: '#64748b', marginBottom: 4 }}>{k.l}</div>
                          <div style={{ fontSize: 17, fontWeight: 800, color: k.c }}>{k.v}</div>
                          <div style={{ fontSize: 10, color: '#475569', marginTop: 2 }}>{k.s}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Composição do Custo */}
                  <div style={{ background: '#111827', border: '1px solid #1e293b', borderRadius: 12, padding: '14px 16px' }}>
                    <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10, fontWeight: 600 }}>Composição do Custo</div>
                    <div style={{ display: 'grid', gap: 0 }}>
                      {breakdownItems.map((item, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: '1px solid #0f172a' }}>
                          <span style={{ fontSize: 11, color: '#64748b' }}>{item.l}</span>
                          <span style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8' }}>{R(item.v)}</span>
                        </div>
                      ))}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0 2px' }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#f1f5f9' }}>Total</span>
                        <span style={{ fontSize: 15, fontWeight: 800, color: '#fbbf24' }}>{R(cr.ctot)}</span>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Painel IA da Calculadora */}
              <div style={{ background: '#0d1117', border: '1px solid #1e293b', borderRadius: 12, padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: calcIA ? 12 : 0 }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#f1f5f9' }}>🤖 Análise com IA</div>
                    <div style={{ fontSize: 10, color: '#475569', marginTop: 2 }}>LLaMA 3.3 70B avalia a viabilidade desta compra</div>
                  </div>
                  <button onClick={analisarCompraIA} disabled={calcIALoading || cr.ctot === 0}
                    style={{ background: calcIALoading ? '#1e293b' : 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 600, cursor: cr.ctot === 0 ? 'not-allowed' : 'pointer', opacity: (cr.ctot === 0 && !calcIALoading) ? 0.5 : 1, flexShrink: 0 }}>
                    {calcIALoading ? '⏳ Analisando...' : '⚡ Analisar'}
                  </button>
                </div>
                {calcIA && !calcIA.error && (
                  <div style={{ display: 'grid', gap: 8 }}>
                    <div style={{ background: VIAB_BG[calcIA.viabilidade] ?? '#1e293b', border: `1px solid ${VIAB_COR[calcIA.viabilidade] ?? '#475569'}40`, borderRadius: 8, padding: '10px 14px', textAlign: 'center' }}>
                      <div style={{ fontSize: 15, fontWeight: 800, color: VIAB_COR[calcIA.viabilidade] ?? '#f1f5f9' }}>
                        {calcIA.viabilidade === 'RECOMENDADO' ? '✅ ' : calcIA.viabilidade === 'ATENCAO' ? '⚠️ ' : '🚨 '}{calcIA.viabilidade}
                      </div>
                      <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4, lineHeight: 1.4 }}>{calcIA.diagnostico}</div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <div style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 8, padding: '8px 10px' }}>
                        <div style={{ fontSize: 9, color: '#10b981', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4, fontWeight: 700 }}>Ponto Forte</div>
                        <div style={{ fontSize: 11, color: '#e2e8f0', lineHeight: 1.5 }}>{calcIA.ponto_forte}</div>
                      </div>
                      <div style={{ background: 'rgba(248,113,113,0.07)', border: '1px solid rgba(248,113,113,0.15)', borderRadius: 8, padding: '8px 10px' }}>
                        <div style={{ fontSize: 9, color: '#f87171', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4, fontWeight: 700 }}>Ponto de Risco</div>
                        <div style={{ fontSize: 11, color: '#e2e8f0', lineHeight: 1.5 }}>{calcIA.ponto_risco}</div>
                      </div>
                    </div>
                    <div style={{ background: '#111827', borderRadius: 8, padding: '8px 12px' }}>
                      <div style={{ fontSize: 9, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4, fontWeight: 700 }}>Recomendação</div>
                      <div style={{ fontSize: 12, color: '#fbbf24', fontWeight: 500, lineHeight: 1.5 }}>{calcIA.recomendacao}</div>
                    </div>
                    {calcIA.preco_justo_ref && calcIA.preco_justo_ref !== 'null' && (
                      <div style={{ fontSize: 11, color: '#64748b', textAlign: 'center', padding: '4px 0' }}>
                        Preço justo estimado: <span style={{ color: '#10b981', fontWeight: 700 }}>{calcIA.preco_justo_ref}</span>
                      </div>
                    )}
                  </div>
                )}
                {calcIA?.error && <div style={{ marginTop: 10, fontSize: 12, color: '#f87171' }}>{calcIA.error}</div>}
              </div>
            </div>
          </div>

          {/* Documentação + Botão Registrar */}
          <div className="calc-bottom">
            <div style={{ background: '#111827', border: '1px solid #1e293b', borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10, fontWeight: 600 }}>Documentação Exigida</div>
              <div className="calc-docs">
                {checklist.map(doc => {
                  const checked = !!(calc as any)[doc.k]
                  return (
                    <label key={doc.k} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', padding: '8px 10px', borderRadius: 8, background: checked ? 'rgba(16,185,129,0.07)' : 'rgba(255,255,255,0.02)', border: `1px solid ${checked ? 'rgba(16,185,129,0.25)' : '#1e293b'}` }}>
                      <input type="checkbox" checked={checked} onChange={e => setCalc(doc.k, e.target.checked)}
                        style={{ accentColor: '#10b981', width: 14, height: 14, flexShrink: 0, marginTop: 1 }} />
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: checked ? '#10b981' : '#94a3b8' }}>{doc.l}</div>
                        <div style={{ fontSize: 10, color: '#475569', marginTop: 1 }}>{doc.info}</div>
                      </div>
                    </label>
                  )
                })}
              </div>
            </div>
            {cr.ctot > 0 && (
              <div>
                <button onClick={usarNoRegistro}
                  style={{ background: 'linear-gradient(135deg,#10b981,#34d399)', color: '#fff', border: 'none', borderRadius: 12, padding: '14px 22px', fontSize: 13, fontWeight: 700, cursor: 'pointer', textAlign: 'center', boxShadow: '0 4px 20px rgba(16,185,129,0.3)', whiteSpace: 'nowrap' }}>
                  ✅ Registrar<br /><span style={{ fontSize: 11, fontWeight: 400, opacity: 0.9 }}>como Compra</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modais (transação + valuation) */}
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

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

interface LoteDetalhe {
  id: string; nome: string; cabecas: number; racaPredominante?: string
  pesoMedioEntrada: number; objetivo: string; status: string
  custoTotal: number; dataEntrada: string; dataSaidaPrevista?: string
  registrosDiarios: Array<{ id: string; data: string; consumoRacaoKg?: number; consumoAguaL?: number; pesoMedio?: number; mortalidade: number; medicacao?: string; observacoes?: string; custoDia?: number }>
  animais: Array<{ id: string; identificacao: string; raca?: string; sexo: string; pesoAtual?: number }>
}
interface Kpis {
  gmd: number; conversaoAlimentar: number; eficienciaAlimentar: number
  custoArroba: number; arrobasProduzidasLote: number
  diasRestantesAbate: number; dataPrevisaoAbate?: string
  margemEstimadaReais: number; scorePerformance: number; alertas: string[]
}
interface Tendencia { tendencia: 'subindo' | 'estavel' | 'caindo'; gmdUltimos7d: number }

const TENDENCIA_ICON = { subindo: '↑', estavel: '→', caindo: '↓' }
const TENDENCIA_COLOR = { subindo: '#10b981', estavel: '#fbbf24', caindo: '#f87171' }

export default function LoteDashboardPage() {
  const params = useParams()
  const id = params?.id as string
  const [data, setData] = useState<{ lote: LoteDetalhe; kpis: Kpis; tendencia: Tendencia; diasConfinamento: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [showDiario, setShowDiario] = useState(false)
  const [saving, setSaving] = useState(false)
  const [diario, setDiario] = useState({ consumoRacaoKg: '', consumoAguaL: '', pesoMedio: '', mortalidade: '0', medicacao: '', observacoes: '', custoDia: '' })

  const carregar = useCallback(() => {
    if (!id) return
    fetch(`/api/confinamento/lotes/${id}`)
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => { carregar() }, [carregar])

  async function salvarDiario(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await fetch(`/api/confinamento/lotes/${id}/diario`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(diario),
    })
    setShowDiario(false)
    setDiario({ consumoRacaoKg: '', consumoAguaL: '', pesoMedio: '', mortalidade: '0', medicacao: '', observacoes: '', custoDia: '' })
    carregar()
    setSaving(false)
  }

  if (loading) return <div style={{ padding: 40, color: '#64748b', textAlign: 'center' }}>Carregando...</div>
  if (!data) return <div style={{ padding: 40, color: '#f87171', textAlign: 'center' }}>Lote não encontrado</div>

  const { lote, kpis, tendencia, diasConfinamento } = data
  const graficoPeso = lote.registrosDiarios.filter(r => r.pesoMedio).map(r => ({
    data: new Date(r.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    peso: r.pesoMedio,
  }))

  const scoreColor = kpis.scorePerformance >= 75 ? '#10b981' : kpis.scorePerformance >= 50 ? '#fbbf24' : '#f87171'

  return (
    <div style={{ background: '#0a0e1a', minHeight: '100vh', padding: '24px', color: '#f1f5f9' }}>
      {/* Breadcrumb + Header */}
      <div style={{ marginBottom: 20 }}>
        <Link href="/dashboard/confinamento" style={{ fontSize: 12, color: '#64748b', textDecoration: 'none' }}>← Confinamento</Link>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.5 }}>{lote.nome}</h1>
            <p style={{ fontSize: 12, color: '#64748b' }}>{lote.cabecas} cabeças · {lote.racaPredominante || 'Mista'} · {diasConfinamento} dias</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setShowDiario(true)}
              style={{ background: '#10b981', color: '#fff', border: 'none', borderRadius: 9, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              + Registro Diário
            </button>
          </div>
        </div>
      </div>

      {/* Score geral */}
      <div style={{ background: '#111827', border: `2px solid ${scoreColor}30`, borderRadius: 14, padding: '16px 20px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 60, height: 60, borderRadius: '50%', background: `${scoreColor}20`, border: `3px solid ${scoreColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: 18, fontWeight: 900, color: scoreColor }}>{kpis.scorePerformance}</span>
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700 }}>Score de Performance</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>
            Tendência {TENDENCIA_ICON[tendencia.tendencia]} {tendencia.gmdUltimos7d > 0 ? `GMD 7d: ${tendencia.gmdUltimos7d} kg/dia` : ''}
          </div>
          {kpis.alertas.length > 0 && (
            <div style={{ marginTop: 6, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {kpis.alertas.map((a, i) => (
                <span key={i} style={{ fontSize: 10, color: '#fbbf24', background: 'rgba(251,191,36,0.1)', padding: '2px 8px', borderRadius: 20 }}>⚠ {a}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* KPIs grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 16 }}>
        {[
          { label: 'GMD', valor: `${kpis.gmd} kg/dia`, sub: 'Ganho Médio Diário', color: '#10b981' },
          { label: 'Conv. Alimentar', valor: `${kpis.conversaoAlimentar}`, sub: 'kg MS / kg ganho', color: '#60a5fa' },
          { label: 'Custo / @', valor: `R$${kpis.custoArroba.toFixed(0)}`, sub: 'Por arroba produzida', color: '#fbbf24' },
          { label: 'Previsão abate', valor: kpis.diasRestantesAbate < 999 ? `${kpis.diasRestantesAbate} dias` : '—', sub: kpis.dataPrevisaoAbate ? new Date(kpis.dataPrevisaoAbate).toLocaleDateString('pt-BR') : 'Sem peso atual', color: '#a78bfa' },
          { label: 'Arrobas produzidas', valor: `${kpis.arrobasProduzidasLote.toFixed(1)} @`, sub: 'Total do lote', color: '#34d399' },
          { label: 'Margem estimada', valor: `R$${kpis.margemEstimadaReais.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`, sub: `Ref: R$320/@`, color: kpis.margemEstimadaReais >= 0 ? '#10b981' : '#f87171' },
        ].map(k => (
          <div key={k.label} style={{ background: '#111827', border: '1px solid #1e293b', borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ fontSize: 10, color: '#64748b', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.8 }}>{k.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: k.color }}>{k.valor}</div>
            <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Gráfico evolução de peso */}
      {graficoPeso.length > 1 && (
        <div style={{ background: '#111827', border: '1px solid #1e293b', borderRadius: 14, padding: '16px 20px', marginBottom: 16 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 14, color: '#94a3b8' }}>Evolução do Peso Médio (kg)</h3>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={graficoPeso}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="data" tick={{ fill: '#475569', fontSize: 10 }} />
              <YAxis tick={{ fill: '#475569', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9', fontSize: 12 }} />
              <Line type="monotone" dataKey="peso" stroke="#10b981" strokeWidth={2} dot={{ r: 3, fill: '#10b981' }} name="Peso médio (kg)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Últimos registros */}
      <div style={{ background: '#111827', border: '1px solid #1e293b', borderRadius: 14, padding: '16px 20px' }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 14, color: '#94a3b8' }}>Últimos Registros Diários</h3>
        {lote.registrosDiarios.length === 0 ? (
          <p style={{ fontSize: 12, color: '#475569', textAlign: 'center', padding: '20px 0' }}>Nenhum registro ainda. Adicione o primeiro registro diário.</p>
        ) : (
          <div style={{ display: 'grid', gap: 8 }}>
            {lote.registrosDiarios.slice(0, 7).map(r => (
              <div key={r.id} style={{ background: '#0f172a', borderRadius: 10, padding: '10px 14px', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, color: '#64748b', minWidth: 60 }}>{new Date(r.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span>
                {r.pesoMedio && <span style={{ fontSize: 12, color: '#10b981' }}>⚖ {r.pesoMedio} kg</span>}
                {r.consumoRacaoKg && <span style={{ fontSize: 12, color: '#60a5fa' }}>🌾 {r.consumoRacaoKg} kg/dia</span>}
                {r.mortalidade > 0 && <span style={{ fontSize: 12, color: '#f87171' }}>💀 {r.mortalidade} morte(s)</span>}
                {r.medicacao && <span style={{ fontSize: 12, color: '#fbbf24' }}>💉 {r.medicacao}</span>}
                {r.custoDia && <span style={{ fontSize: 12, color: '#a78bfa' }}>R${r.custoDia}/cab/dia</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal registro diário */}
      {showDiario && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}>
          <div style={{ background: '#111827', border: '1px solid #1e293b', borderRadius: 16, padding: 28, width: '100%', maxWidth: 480 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Registro Diário — {lote.nome}</h2>
            <form onSubmit={salvarDiario} style={{ display: 'grid', gap: 12 }}>
              {[
                { label: 'Consumo de ração (kg/cab/dia)', key: 'consumoRacaoKg', placeholder: '8.5', type: 'number' },
                { label: 'Consumo de água (L/cab/dia)', key: 'consumoAguaL', placeholder: '35', type: 'number' },
                { label: 'Peso médio hoje (kg)', key: 'pesoMedio', placeholder: '360', type: 'number' },
                { label: 'Mortalidade (cabeças)', key: 'mortalidade', placeholder: '0', type: 'number' },
                { label: 'Custo ração hoje (R$/cab/dia)', key: 'custoDia', placeholder: '12.50', type: 'number' },
                { label: 'Medicação aplicada', key: 'medicacao', placeholder: 'Ex: Ivermectina 1%' },
                { label: 'Observações', key: 'observacoes', placeholder: 'Qualquer ocorrência...' },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ fontSize: 12, color: '#94a3b8', display: 'block', marginBottom: 4 }}>{f.label}</label>
                  <input type={f.type || 'text'} placeholder={f.placeholder}
                    value={diario[f.key as keyof typeof diario]}
                    onChange={e => setDiario(p => ({ ...p, [f.key]: e.target.value }))}
                    style={{ width: '100%', background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, padding: '9px 12px', color: '#f1f5f9', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                </div>
              ))}
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button type="button" onClick={() => setShowDiario(false)}
                  style={{ flex: 1, background: 'transparent', border: '1px solid #1e293b', borderRadius: 10, padding: '10px', color: '#94a3b8', fontSize: 13, cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" disabled={saving}
                  style={{ flex: 1, background: '#10b981', color: '#fff', border: 'none', borderRadius: 10, padding: '10px', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
                  {saving ? 'Salvando...' : 'Salvar Registro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

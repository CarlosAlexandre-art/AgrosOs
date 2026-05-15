'use client'

import { useState, useEffect, useCallback } from 'react'
import HowToUse from '../../../components/HowToUse'

interface Raca {
  codigo: number
  nome: string
  sigla?: string
}

interface Transito {
  codigo: string
  animal?: {
    identificacao?: string
    especie?: string
    raca?: string
    sexo?: string
    nascimento?: string
  }
  estabelecimento_origem?: { nome?: string; municipio?: string; uf?: string }
  estabelecimento_destino?: { nome?: string; municipio?: string; uf?: string }
  data?: string
  status?: string
}

interface Transacao {
  token: string
  data?: string
  protocolo?: string
  status?: string
  animal?: { identificacao?: string }
  esg_score?: number
}

type Tab = 'animal' | 'racas' | 'transacoes' | 'cadastrar'

interface AnimalIA {
  identificacao: string
  sexo: 'MACHO' | 'FEMEA'
  raca?: string | null
  dataNascimento?: string | null
  pesoAtual?: number | null
  origemFazenda?: string | null
}

interface HistEntry {
  id: string
  ts: string
  codigo: string
  identificacao: string
  raca: string
}

const HIST_KEY = 'smartagroos_bovinos_history'
const MAX_HIST = 15

function saveHistory(entry: HistEntry) {
  try {
    const raw = localStorage.getItem(HIST_KEY)
    const prev: HistEntry[] = raw ? JSON.parse(raw) : []
    localStorage.setItem(HIST_KEY, JSON.stringify([entry, ...prev].slice(0, MAX_HIST)))
  } catch { /* ignore */ }
}

export default function BovinosPage() {
  const [tab, setTab] = useState<Tab>('animal')
  const [codigo, setCodigo] = useState('')
  const [transito, setTransito] = useState<Transito | null>(null)
  const [racas, setRacas] = useState<Raca[]>([])
  const [transacoes, setTransacoes] = useState<Transacao[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [pagina, setPagina] = useState(1)
  const [histOpen, setHistOpen] = useState(false)
  const [hist, setHist] = useState<HistEntry[]>([])

  // IA em massa
  const [descIA, setDescIA] = useState('')
  const [parsandoIA, setParsandoIA] = useState(false)
  const [animaisIA, setAnimaisIA] = useState<AnimalIA[] | null>(null)
  const [importando, setImportando] = useState(false)
  const [resultadoImport, setResultadoImport] = useState<{ criados: number; erros: string[]; total: number } | null>(null)
  const [erroIA, setErroIA] = useState('')

  useEffect(() => {
    try {
      const raw = localStorage.getItem(HIST_KEY)
      if (raw) setHist(JSON.parse(raw))
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    if (tab === 'racas' && racas.length === 0) carregarRacas()
    if (tab === 'transacoes') carregarTransacoes(1)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab])

  async function carregarRacas() {
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/embrapa/bovtrace/racas')
      if (!res.ok) throw new Error(await res.text())
      setRacas(await res.json())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro')
    } finally { setLoading(false) }
  }

  const carregarTransacoes = useCallback(async (p: number) => {
    setLoading(true); setError('')
    try {
      const params = new URLSearchParams({ pagina: String(p) })
      if (dataInicio) params.set('data_inicio', dataInicio)
      if (dataFim) params.set('data_fim', dataFim)
      const res = await fetch(`/api/embrapa/bovtrace/transacoes?${params}`)
      if (!res.ok) throw new Error(await res.text())
      setTransacoes(await res.json())
      setPagina(p)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro')
    } finally { setLoading(false) }
  }, [dataInicio, dataFim])

  async function buscarAnimal() {
    if (!codigo.trim()) return
    setLoading(true); setError(''); setTransito(null)
    try {
      const res = await fetch(`/api/embrapa/bovtrace/transitos/${encodeURIComponent(codigo.trim())}`)
      if (!res.ok) throw new Error('Animal não encontrado')
      const data: Transito = await res.json()
      setTransito(data)
      const entry: HistEntry = {
        id: Date.now().toString(),
        ts: new Date().toISOString(),
        codigo: codigo.trim(),
        identificacao: data.animal?.identificacao ?? codigo.trim(),
        raca: data.animal?.raca ?? '—',
      }
      saveHistory(entry)
      setHist(h => [entry, ...h].slice(0, MAX_HIST))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro')
    } finally { setLoading(false) }
  }

  async function parsearComIA() {
    if (!descIA.trim()) return
    setParsandoIA(true); setErroIA(''); setAnimaisIA(null); setResultadoImport(null)
    try {
      const res = await fetch('/api/carteira-animal/ai-parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ descricao: descIA }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao interpretar')
      setAnimaisIA(data.animais)
    } catch (e) {
      setErroIA(e instanceof Error ? e.message : 'Erro ao interpretar. Tente ser mais específico.')
    } finally { setParsandoIA(false) }
  }

  async function confirmarImport() {
    if (!animaisIA?.length) return
    setImportando(true); setErroIA('')
    try {
      const res = await fetch('/api/carteira-animal/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ animais: animaisIA }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao importar')
      setResultadoImport(data)
      setAnimaisIA(null)
      setDescIA('')
    } catch (e) {
      setErroIA(e instanceof Error ? e.message : 'Erro ao importar')
    } finally { setImportando(false) }
  }

  const TABS: { id: Tab; label: string; icon: string }[] = [
    { id: 'animal', label: 'Rastrear Animal', icon: '🐄' },
    { id: 'racas', label: 'Raças', icon: '📋' },
    { id: 'transacoes', label: 'Transações', icon: '📦' },
    { id: 'cadastrar', label: 'Cadastro em Massa', icon: '🤖' },
  ]

  return (
    <div className="min-h-screen" style={{ background: '#0a0e1a' }}>
      <style>{`@media print { body { background: white !important; color: black !important; } .print\\:hidden { display: none !important; } }`}</style>
      {/* Header */}
      <div className="border-b" style={{ background: 'rgba(10,14,26,0.97)', borderColor: 'rgba(255,255,255,0.07)' }}>
        <div className="px-6 py-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.3)' }}>
            <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
            </svg>
          </div>
          <div className="flex-1">
            <h1 className="text-sm font-bold text-white">Rastreabilidade Bovina</h1>
            <p className="text-[10px] text-slate-500">BovTrace · Embrapa — rastreamento e auditoria ESG</p>
          </div>
          <div className="flex items-center gap-2 print:hidden">
            <button onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)', color: '#fbbf24' }}>
              ⬇ PDF
            </button>
            {hist.length > 0 && (
              <button onClick={() => setHistOpen(o => !o)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={{ background: histOpen ? 'rgba(251,191,36,0.15)' : 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8' }}>
                🕐 Histórico ({hist.length})
              </button>
            )}
          </div>
        </div>

        {/* Painel de histórico */}
        {histOpen && hist.length > 0 && (
          <div className="border-t print:hidden" style={{ background: 'rgba(251,191,36,0.04)', borderColor: 'rgba(255,255,255,0.07)' }}>
            <div className="px-6 py-3">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Buscas recentes</div>
              <div className="flex flex-wrap gap-2">
                {hist.map(h => (
                  <button key={h.id} onClick={() => { setCodigo(h.codigo); setHistOpen(false); setTab('animal') }}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs transition-all"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <span className="text-amber-400 font-mono">{h.codigo}</span>
                    <span className="text-slate-400">{h.identificacao}</span>
                    <span className="text-slate-600">·</span>
                    <span className="text-slate-500">{h.raca}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="px-6 pb-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
          <HowToUse
            storageKey="bovinos"
            title="Rastreabilidade Bovina BovTrace"
            subtitle="Sistema de rastreamento e auditoria ESG da cadeia bovina — Embrapa"
            theme="dark"
            accentColor="#fbbf24"
            steps={[
              { icon: '🐄', title: 'Rastrear animal', description: 'Informe o código GTA ou identificação do animal para ver todo o histórico de trânsito e movimentações.' },
              { icon: '📋', title: 'Consultar raças', description: 'Veja a lista completa de raças bovinas cadastradas no sistema BovTrace com código e sigla.' },
              { icon: '📦', title: 'Transações', description: 'Consulte transações de rastreabilidade por período. Requer registro ativo no sistema SISBOV/BovTrace.' },
              { icon: '🌿', title: 'Auditoria ESG', description: 'Use o token de uma transação para verificar a pontuação ESG daquela movimentação na cadeia produtiva.' },
            ]}
            tip="Rastreamento e transações requerem registro ativo no sistema SISBOV. Entre em contato com a Embrapa para obter acesso ao BovTrace: https://www.embrapa.br/gado-de-corte/bovtrace"
          />
        </div>
      </div>

      <div className="p-6 max-w-5xl mx-auto space-y-5">
        {/* Tabs */}
        <div className="flex gap-2">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
              style={tab === t.id
                ? { background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.3)', color: '#fbbf24' }
                : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8' }
              }>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="px-4 py-3 rounded-xl text-sm text-red-400" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
            {error}
          </div>
        )}

        {/* Tab: Rastrear Animal */}
        {tab === 'animal' && (
          <div className="space-y-4">
            <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <label className="block text-xs text-slate-400 mb-2">Código GTA / Identificação do animal</label>
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Ex: 1234567890"
                  value={codigo}
                  onChange={e => setCodigo(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && buscarAnimal()}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm text-white placeholder-slate-500 outline-none"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                />
                <button onClick={buscarAnimal} disabled={loading || !codigo.trim()}
                  className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40"
                  style={{ background: '#d97706' }}>
                  {loading ? 'Buscando...' : 'Rastrear'}
                </button>
              </div>
            </div>

            {transito && (
              <div className="rounded-2xl p-5 space-y-4" style={{ background: 'rgba(251,191,36,0.05)', border: '1px solid rgba(251,191,36,0.2)' }}>
                <div className="flex items-center gap-2">
                  <span className="text-amber-400 font-bold text-sm">Animal encontrado</span>
                  {transito.status && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e' }}>{transito.status}</span>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Identificação', value: transito.animal?.identificacao ?? transito.codigo },
                    { label: 'Raça', value: transito.animal?.raca },
                    { label: 'Sexo', value: transito.animal?.sexo },
                    { label: 'Nascimento', value: transito.animal?.nascimento },
                  ].map(f => f.value && (
                    <div key={f.label} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.04)' }}>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider">{f.label}</div>
                      <div className="text-sm text-white font-medium mt-0.5">{f.value}</div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {transito.estabelecimento_origem && (
                    <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.04)' }}>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Origem</div>
                      <div className="text-sm text-white">{transito.estabelecimento_origem.nome}</div>
                      <div className="text-xs text-slate-400">{transito.estabelecimento_origem.municipio} — {transito.estabelecimento_origem.uf}</div>
                    </div>
                  )}
                  {transito.estabelecimento_destino && (
                    <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.04)' }}>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Destino</div>
                      <div className="text-sm text-white">{transito.estabelecimento_destino.nome}</div>
                      <div className="text-xs text-slate-400">{transito.estabelecimento_destino.municipio} — {transito.estabelecimento_destino.uf}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {!loading && !transito && !error && (
              <div className="text-center py-16">
                <div className="text-5xl mb-3">🐄</div>
                <div className="text-slate-500 text-sm">Informe o código para rastrear um animal na cadeia bovina</div>
              </div>
            )}
          </div>
        )}

        {/* Tab: Raças */}
        {tab === 'racas' && (
          <div>
            {loading && <div className="text-center py-10 text-slate-500 text-sm">Carregando raças...</div>}
            {racas.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {racas.map(r => (
                  <div key={r.codigo} className="rounded-xl px-4 py-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <div className="text-sm font-semibold text-white">{r.nome}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {r.sigla && <span className="text-[11px] text-amber-400 font-mono">{r.sigla}</span>}
                      <span className="text-[10px] text-slate-600">#{r.codigo}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab: Transações */}
        {tab === 'transacoes' && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3 items-end rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div>
                <label className="block text-[10px] text-slate-500 mb-1">Data início</label>
                <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)}
                  className="px-3 py-2 rounded-xl text-sm text-white outline-none"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 mb-1">Data fim</label>
                <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)}
                  className="px-3 py-2 rounded-xl text-sm text-white outline-none"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
              </div>
              <button onClick={() => carregarTransacoes(1)} disabled={loading}
                className="px-5 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-40"
                style={{ background: '#d97706' }}>
                {loading ? 'Carregando...' : 'Filtrar'}
              </button>
            </div>

            {transacoes.length > 0 && (
              <div className="space-y-2">
                {transacoes.map(t => (
                  <div key={t.token} className="rounded-xl px-4 py-3 flex items-center gap-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-amber-400 truncate">{t.token}</span>
                        {t.status && <span className="text-[10px] px-2 py-0.5 rounded-full text-green-400" style={{ background: 'rgba(34,197,94,0.1)' }}>{t.status}</span>}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {t.data && <span>{t.data}</span>}
                        {t.animal?.identificacao && <span className="ml-2">Animal: {t.animal.identificacao}</span>}
                      </div>
                    </div>
                    {t.esg_score !== undefined && (
                      <div className="text-right flex-shrink-0">
                        <div className="text-[10px] text-slate-500">ESG</div>
                        <div className="text-sm font-bold" style={{ color: t.esg_score >= 70 ? '#22c55e' : t.esg_score >= 40 ? '#fbbf24' : '#ef4444' }}>
                          {t.esg_score}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                <div className="flex items-center justify-center gap-2 pt-1">
                  <button onClick={() => carregarTransacoes(pagina - 1)} disabled={pagina <= 1}
                    className="px-3 py-1.5 rounded-lg text-xs text-slate-400 disabled:opacity-30"
                    style={{ background: 'rgba(255,255,255,0.06)' }}>← Anterior</button>
                  <span className="text-xs text-slate-500">Página {pagina}</span>
                  <button onClick={() => carregarTransacoes(pagina + 1)} disabled={transacoes.length < 10}
                    className="px-3 py-1.5 rounded-lg text-xs text-slate-400 disabled:opacity-30"
                    style={{ background: 'rgba(255,255,255,0.06)' }}>Próxima →</button>
                </div>
              </div>
            )}

            {!loading && transacoes.length === 0 && !error && (
              <div className="text-center py-16">
                <div className="text-5xl mb-3">📦</div>
                <div className="text-slate-500 text-sm">Nenhuma transação encontrada para o período</div>
              </div>
            )}
          </div>
        )}

        {/* Tab: Cadastro em Massa com IA */}
        {tab === 'cadastrar' && (
          <div className="space-y-4">
            {/* Banner explicativo */}
            <div className="rounded-2xl p-4 flex items-start gap-3" style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.2)' }}>
              <span className="text-2xl flex-shrink-0">🤖</span>
              <div>
                <div className="text-sm font-bold text-amber-400">Cadastro em Massa com Inteligência Artificial</div>
                <div className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Descreva seu lote em linguagem natural — o modelo LLaMA 3.3 70B interpreta e gera a lista de animais automaticamente.
                  Revise e confirme para cadastrar todos de uma vez na Carteira Animal.
                </div>
              </div>
            </div>

            {/* Resultado de importação */}
            {resultadoImport && (
              <div className="rounded-2xl p-5 space-y-3" style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)' }}>
                <div className="flex items-center gap-2">
                  <span className="text-xl">✅</span>
                  <span className="text-sm font-bold text-green-400">Importação concluída</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Total enviado', value: resultadoImport.total, color: '#94a3b8' },
                    { label: 'Criados', value: resultadoImport.criados, color: '#22c55e' },
                    { label: 'Com erro', value: resultadoImport.erros.length, color: resultadoImport.erros.length ? '#ef4444' : '#22c55e' },
                  ].map(s => (
                    <div key={s.label} className="rounded-xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
                      <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{s.label}</div>
                    </div>
                  ))}
                </div>
                {resultadoImport.erros.length > 0 && (
                  <div className="rounded-xl p-3" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
                    <div className="text-[10px] text-red-400 font-bold mb-1">Não cadastrados (identificação duplicada ou erro):</div>
                    <div className="text-xs text-slate-400">{resultadoImport.erros.join(', ')}</div>
                  </div>
                )}
                <button onClick={() => setResultadoImport(null)}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
                  style={{ background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.3)', color: '#fbbf24' }}>
                  Cadastrar mais animais
                </button>
              </div>
            )}

            {!resultadoImport && (
              <>
                {/* Textarea de descrição */}
                <div className="rounded-2xl p-5 space-y-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <label className="block text-xs font-semibold text-slate-300">Descreva o lote em linguagem natural</label>
                  <textarea
                    rows={5}
                    placeholder={'Exemplos:\n• "20 vacas Nelore com média de 380kg, nascidas em 2023, da Fazenda Bela Vista"\n• "10 bois Angus machos, peso 450kg, sem procedência"\n• "Lote 15 fêmeas Girolando #F001 a #F015, 280kg, 2 anos"'}
                    value={descIA}
                    onChange={e => setDescIA(e.target.value)}
                    disabled={parsandoIA}
                    className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-slate-600 outline-none resize-none disabled:opacity-50"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                  {erroIA && (
                    <div className="px-3 py-2 rounded-xl text-xs text-red-400" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                      {erroIA}
                    </div>
                  )}
                  <button
                    onClick={parsearComIA}
                    disabled={parsandoIA || !descIA.trim()}
                    className="w-full py-3 rounded-xl text-sm font-bold text-white disabled:opacity-40 transition-all"
                    style={{ background: parsandoIA ? 'rgba(251,191,36,0.2)' : 'linear-gradient(135deg, #d97706, #f59e0b)', boxShadow: parsandoIA ? 'none' : '0 4px 20px rgba(217,119,6,0.3)' }}>
                    {parsandoIA ? '⏳ Interpretando com IA...' : '✨ Interpretar com IA'}
                  </button>
                </div>

                {/* Preview dos animais interpretados */}
                {animaisIA && animaisIA.length > 0 && (
                  <div className="rounded-2xl p-5 space-y-4" style={{ background: 'rgba(251,191,36,0.04)', border: '1px solid rgba(251,191,36,0.2)' }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-bold text-amber-400">{animaisIA.length} animais interpretados</div>
                        <div className="text-xs text-slate-500 mt-0.5">Revise antes de confirmar</div>
                      </div>
                      <button onClick={() => setAnimaisIA(null)}
                        className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
                        Descartar
                      </button>
                    </div>

                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                      {animaisIA.map((a, i) => (
                        <div key={i} className="rounded-xl px-4 py-3 flex items-center gap-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold text-amber-400" style={{ background: 'rgba(251,191,36,0.12)' }}>
                            {i + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-semibold text-white">{a.identificacao}</span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                                style={a.sexo === 'MACHO'
                                  ? { background: 'rgba(59,130,246,0.15)', color: '#60a5fa' }
                                  : { background: 'rgba(236,72,153,0.15)', color: '#f472b6' }}>
                                {a.sexo === 'MACHO' ? '♂ Macho' : '♀ Fêmea'}
                              </span>
                              {a.raca && <span className="text-xs text-amber-400">{a.raca}</span>}
                            </div>
                            <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                              {a.pesoAtual && <span className="text-[11px] text-slate-400">{a.pesoAtual} kg</span>}
                              {a.dataNascimento && <span className="text-[11px] text-slate-500">{a.dataNascimento}</span>}
                              {a.origemFazenda && <span className="text-[11px] text-slate-500 truncate">{a.origemFazenda}</span>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={confirmarImport}
                      disabled={importando}
                      className="w-full py-3 rounded-xl text-sm font-bold text-white disabled:opacity-40 transition-all"
                      style={{ background: importando ? 'rgba(34,197,94,0.15)' : 'linear-gradient(135deg, #16a34a, #22c55e)', boxShadow: importando ? 'none' : '0 4px 20px rgba(34,197,94,0.25)' }}>
                      {importando ? '⏳ Cadastrando...' : `✅ Cadastrar ${animaisIA.length} animais na Carteira`}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

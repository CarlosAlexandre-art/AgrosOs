'use client'

import { useState, useEffect, useRef, use } from 'react'
import Link from 'next/link'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

interface LoteDiario {
  id: string
  data: string
  pesoMedio: number | null
  consumoRacaoKg: number | null
  mortalidade: number
  observacoes: string | null
  custoDia: number | null
}

interface Lote {
  id: string
  nome: string
  cabecas: number
  racaPredominante: string | null
  pesoMedioEntrada: number
  objetivo: string
  faseAtual: string | null
  metaGMD: number | null
  pesoMetaAbate: number | null
  pesoInicioEngorda: number | null
  dataInicioEngorda: string | null
  sistemaProducao: string | null
  numPiquetes: number | null
  areaHectares: number | null
  regiao: string | null
  status: string
  dataEntrada: string
  dataSaidaPrevista: string | null
  custoTotal: number
  registrosDiarios: LoteDiario[]
}

type Tab = 'monitor' | 'diario' | 'oryon' | 'financeiro'

type ChatMsg = { role: 'user' | 'assistant'; content: string }

const FASE_LABEL: Record<string, string> = { RECRIA: 'Recria', ENGORDA: 'Engorda' }
const FASE_COLOR: Record<string, string> = { RECRIA: 'bg-blue-100 text-blue-700', ENGORDA: 'bg-orange-100 text-orange-700' }

function calcGmdFromDiarios(diarios: LoteDiario[]): number | null {
  const pesados = [...diarios].filter(d => d.pesoMedio).sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
  if (pesados.length < 2) return null
  const diff = pesados[pesados.length - 1].pesoMedio! - pesados[0].pesoMedio!
  const days = Math.max(1, (new Date(pesados[pesados.length - 1].data).getTime() - new Date(pesados[0].data).getTime()) / 86400000)
  return (diff / days) * 1000
}

export default function LoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [lote, setLote] = useState<Lote | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('monitor')

  // Diário form
  const [pesoMedio, setPesoMedio] = useState('')
  const [consumoRacaoKg, setConsumoRacaoKg] = useState('')
  const [consumoAguaL, setConsumoAguaL] = useState('')
  const [mortalidade, setMortalidade] = useState('')
  const [observacoesDiario, setObservacoesDiario] = useState('')
  const [custoDia, setCustoDia] = useState('')
  const [savingDiario, setSavingDiario] = useState(false)
  const [diarioOk, setDiarioOk] = useState(false)

  // Transição
  const [showTransicao, setShowTransicao] = useState(false)
  const [pesoTransicao, setPesoTransicao] = useState('')
  const [savingTransicao, setSavingTransicao] = useState(false)

  // ORYON IA
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const chatRef = useRef<HTMLDivElement>(null)

  function loadLote() {
    fetch(`/api/recria-engorda/lotes/${id}`)
      .then(r => r.json())
      .then(data => { if (data.id) setLote(data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadLote() }, [id])

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight
  }, [messages])

  async function submitDiario(e: React.FormEvent) {
    e.preventDefault()
    setSavingDiario(true)
    try {
      const res = await fetch(`/api/recria-engorda/lotes/${id}/diario`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pesoMedio: pesoMedio || null, consumoRacaoKg: consumoRacaoKg || null, consumoAguaL: consumoAguaL || null, mortalidade: mortalidade || 0, observacoes: observacoesDiario || null, custoDia: custoDia || null }),
      })
      if (res.ok) {
        setDiarioOk(true)
        setPesoMedio(''); setConsumoRacaoKg(''); setConsumoAguaL(''); setMortalidade(''); setObservacoesDiario(''); setCustoDia('')
        setTimeout(() => setDiarioOk(false), 3000)
        loadLote()
      }
    } finally { setSavingDiario(false) }
  }

  async function submitTransicao() {
    setSavingTransicao(true)
    try {
      const res = await fetch(`/api/recria-engorda/lotes/${id}/transicao`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pesoTransicao: Number(pesoTransicao) }),
      })
      if (res.ok) { setShowTransicao(false); loadLote() }
    } finally { setSavingTransicao(false) }
  }

  async function sendChat() {
    if (!input.trim() || streaming) return
    const userMsg: ChatMsg = { role: 'user', content: input.trim() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setStreaming(true)

    const all: ChatMsg[] = [...messages, userMsg]
    setMessages(prev => [...prev, { role: 'assistant', content: '' }])

    try {
      const res = await fetch('/api/ai/recria-engorda', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: all, loteId: id }),
      })
      const reader = res.body?.getReader()
      const dec = new TextDecoder()
      if (!reader) return
      let text = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        text += dec.decode(value)
        setMessages(prev => [...prev.slice(0, -1), { role: 'assistant', content: text }])
      }
    } finally { setStreaming(false) }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-24 text-slate-400">
      <svg className="w-5 h-5 animate-spin mr-2" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      Carregando...
    </div>
  )

  if (!lote) return (
    <div className="p-6 text-center text-slate-500">
      Lote não encontrado. <Link href="/dashboard/recria-engorda" className="text-green-600 hover:underline">Voltar</Link>
    </div>
  )

  const diariosSorted = [...lote.registrosDiarios].sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
  const gmd = calcGmdFromDiarios(lote.registrosDiarios)
  const ultimoPeso = [...lote.registrosDiarios].filter(d => d.pesoMedio).sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())[0]?.pesoMedio ?? lote.pesoMedioEntrada
  const metaPeso = lote.pesoMetaAbate ?? (lote.faseAtual === 'RECRIA' ? 330 : 480)
  const progress = Math.min(100, Math.max(0, ((ultimoPeso - lote.pesoMedioEntrada) / Math.max(1, metaPeso - lote.pesoMedioEntrada)) * 100))

  const diasAtivos = Math.max(1, (Date.now() - new Date(lote.dataEntrada).getTime()) / 86400000)
  const custoPorKg = lote.custoTotal > 0 ? (lote.custoTotal / Math.max(1, (ultimoPeso - lote.pesoMedioEntrada) * lote.cabecas)).toFixed(2) : null
  const arrobas = (ultimoPeso * 0.52) / 15
  const custoArroba = lote.custoTotal > 0 ? (lote.custoTotal / Math.max(1, arrobas * lote.cabecas)).toFixed(2) : null

  // Chart data
  const chartData = diariosSorted.filter(d => d.pesoMedio).map(d => ({
    data: new Date(d.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    peso: d.pesoMedio,
    meta: lote.metaGMD && diariosSorted.indexOf(d) > 0
      ? (lote.pesoMedioEntrada + (lote.metaGMD / 1000) * ((new Date(d.data).getTime() - new Date(lote.dataEntrada).getTime()) / 86400000))
      : undefined,
  }))

  const TABS: { key: Tab; label: string; icon: string }[] = [
    { key: 'monitor', label: 'Monitoramento', icon: '📈' },
    { key: 'diario', label: 'Lançamento Diário', icon: '📋' },
    { key: 'oryon', label: 'ORYON IA', icon: '🤖' },
    { key: 'financeiro', label: 'Projeção', icon: '💰' },
  ]

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/recria-engorda" className="text-slate-400 hover:text-slate-600 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{lote.nome}</h1>
            <p className="text-slate-400 text-sm">{lote.racaPredominante ?? 'Raça não definida'} · {lote.cabecas} cabeças</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${FASE_COLOR[lote.faseAtual ?? ''] ?? 'bg-slate-100 text-slate-600'}`}>
            {FASE_LABEL[lote.faseAtual ?? ''] ?? lote.faseAtual ?? '—'}
          </span>
          {lote.faseAtual === 'RECRIA' && lote.objetivo === 'RECRIA_ENGORDA' && (
            <button onClick={() => setShowTransicao(true)}
              className="text-xs bg-orange-500 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-orange-600 transition-colors">
              → Ir para Engorda
            </button>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Peso atual', value: `${ultimoPeso.toFixed(0)} kg`, sub: `Entrada: ${lote.pesoMedioEntrada} kg` },
          { label: 'GMD médio', value: gmd !== null ? `${gmd.toFixed(0)} g/dia` : '—', sub: lote.metaGMD ? `Meta: ${lote.metaGMD} g/dia` : '' },
          { label: 'Dias ativos', value: Math.floor(diasAtivos).toString(), sub: `Desde ${new Date(lote.dataEntrada).toLocaleDateString('pt-BR')}` },
          { label: 'Custo/arroba', value: custoArroba ? `R$ ${custoArroba}` : '—', sub: `Total: R$ ${lote.custoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` },
        ].map(kpi => (
          <div key={kpi.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <div className="text-lg font-bold text-slate-900">{kpi.value}</div>
            <div className="text-xs text-slate-500">{kpi.label}</div>
            {kpi.sub && <div className="text-[10px] text-slate-400 mt-0.5">{kpi.sub}</div>}
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-6">
        <div className="flex justify-between text-xs text-slate-500 mb-2">
          <span>Progresso para abate</span>
          <span>{progress.toFixed(0)}% — {ultimoPeso.toFixed(0)} kg / {metaPeso} kg</span>
        </div>
        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all"
            style={{ width: `${progress}%` }} />
        </div>
        {gmd && lote.metaGMD && (
          <div className={`text-xs mt-2 font-medium ${gmd >= lote.metaGMD * 0.9 ? 'text-green-600' : 'text-red-500'}`}>
            {gmd >= lote.metaGMD * 0.9 ? '✓ GMD dentro da meta' : `⚠ GMD abaixo da meta (${(((lote.metaGMD - gmd) / lote.metaGMD) * 100).toFixed(0)}% abaixo)`}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-6 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              tab === t.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Monitor Tab */}
      {tab === 'monitor' && (
        <div className="space-y-4">
          {chartData.length > 1 ? (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <h3 className="font-semibold text-slate-900 mb-4">Evolução de Peso</h3>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="data" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} domain={['auto', 'auto']} unit=" kg" />
                  <Tooltip formatter={(v: number) => [`${v} kg`]} />
                  <Line type="monotone" dataKey="peso" stroke="#16a34a" strokeWidth={2.5} dot={{ r: 3 }} name="Peso real" />
                  {lote.metaGMD && <Line type="monotone" dataKey="meta" stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="5 5" dot={false} name="Projeção meta" />}
                  {lote.pesoMetaAbate && <ReferenceLine y={lote.pesoMetaAbate} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: 'Meta abate', position: 'right', fontSize: 10 }} />}
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-8 text-center text-slate-400 text-sm">
              Lance ao menos 2 pesagens para ver o gráfico de evolução
            </div>
          )}

          {/* Últimos registros */}
          {lote.registrosDiarios.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <h3 className="font-semibold text-slate-900 mb-3">Últimos Registros</h3>
              <div className="divide-y divide-slate-50">
                {[...lote.registrosDiarios].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()).slice(0, 10).map(d => (
                  <div key={d.id} className="py-2.5 grid grid-cols-4 text-sm">
                    <span className="text-slate-500 text-xs">{new Date(d.data).toLocaleDateString('pt-BR')}</span>
                    <span className="font-medium">{d.pesoMedio ? `${d.pesoMedio} kg` : '—'}</span>
                    <span className="text-slate-500">{d.consumoRacaoKg ? `${d.consumoRacaoKg} kg ração` : '—'}</span>
                    <span className={d.mortalidade > 0 ? 'text-red-500 font-medium' : 'text-slate-400'}>
                      {d.mortalidade > 0 ? `${d.mortalidade} morte(s)` : '—'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Diário Tab */}
      {tab === 'diario' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Lançamento Diário</h3>
          {diarioOk && (
            <div className="mb-4 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm font-medium">
              ✓ Registro salvo com sucesso!
            </div>
          )}
          <form onSubmit={submitDiario} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Peso médio (kg)</label>
                <input type="number" step="0.1" value={pesoMedio} onChange={e => setPesoMedio(e.target.value)}
                  placeholder="Ex: 285.5"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Consumo ração (kg/cab)</label>
                <input type="number" step="0.01" value={consumoRacaoKg} onChange={e => setConsumoRacaoKg(e.target.value)}
                  placeholder="Ex: 0.15"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Consumo água (L/cab)</label>
                <input type="number" step="0.1" value={consumoAguaL} onChange={e => setConsumoAguaL(e.target.value)}
                  placeholder="Ex: 25"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Mortalidade (nº animais)</label>
                <input type="number" min="0" value={mortalidade} onChange={e => setMortalidade(e.target.value)}
                  placeholder="0"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Custo do dia (R$ total)</label>
              <input type="number" step="0.01" value={custoDia} onChange={e => setCustoDia(e.target.value)}
                placeholder="Ex: 45.00"
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Observações</label>
              <textarea value={observacoesDiario} onChange={e => setObservacoesDiario(e.target.value)}
                rows={2} placeholder="Medicações, comportamento, condições do pasto..."
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" />
            </div>
            <button type="submit" disabled={savingDiario}
              className="w-full bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50">
              {savingDiario ? 'Salvando...' : 'Salvar Registro'}
            </button>
          </form>
        </div>
      )}

      {/* ORYON IA Tab */}
      {tab === 'oryon' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col" style={{ height: 480 }}>
          <div className="p-4 border-b border-slate-100 flex items-center gap-2">
            <span className="text-lg">🤖</span>
            <div>
              <span className="font-semibold text-slate-900 text-sm">ORYON Pecuário</span>
              <span className="text-xs text-slate-400 ml-2">Especialista em Recria & Engorda</span>
            </div>
          </div>
          <div ref={chatRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <div className="text-3xl mb-3">🐄</div>
                <p className="text-slate-500 text-sm mb-4">Pergunte ao ORYON sobre este lote:</p>
                <div className="space-y-2">
                  {[
                    'Como está o GMD em relação ao esperado para a raça?',
                    'Qual suplementação recomendar para a fase atual?',
                    'Quando devo fazer a transição para engorda?',
                    'Como dimensionar os piquetes para este lote?',
                  ].map(q => (
                    <button key={q} onClick={() => { setInput(q) }}
                      className="block w-full text-left text-xs bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-slate-600 transition-colors">
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user' ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-800'
                }`}>
                  {msg.content || <span className="opacity-50">●●●</span>}
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-slate-100 flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat() } }}
              placeholder="Pergunte sobre GMD, suplementação, pasto, projeção..."
              className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              disabled={streaming}
            />
            <button onClick={sendChat} disabled={!input.trim() || streaming}
              className="bg-green-600 text-white px-4 py-2.5 rounded-xl hover:bg-green-700 transition-colors disabled:opacity-40">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Financeiro Tab */}
      {tab === 'financeiro' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Projeção Financeira</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { label: 'Custo total acumulado', value: `R$ ${lote.custoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` },
                { label: 'Custo por cabeça', value: `R$ ${(lote.custoTotal / Math.max(1, lote.cabecas)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` },
                { label: 'Custo/kg ganho', value: custoPorKg ? `R$ ${custoPorKg}` : '—' },
                { label: 'Custo/@', value: custoArroba ? `R$ ${custoArroba}` : '—' },
                { label: 'Arrobas produzidas', value: `${(arrobas * lote.cabecas).toFixed(0)} @` },
                { label: 'Peso médio atual', value: `${ultimoPeso.toFixed(0)} kg` },
              ].map(item => (
                <div key={item.label} className="bg-slate-50 rounded-xl p-4">
                  <div className="text-lg font-bold text-slate-900">{item.value}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{item.label}</div>
                </div>
              ))}
            </div>

            {lote.pesoMetaAbate && gmd && (
              <div className="mt-6 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                <p className="text-sm font-bold text-emerald-800 mb-3">📅 Projeção para abate</p>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="font-bold text-emerald-700">
                      {Math.ceil((lote.pesoMetaAbate - ultimoPeso) / (gmd / 1000))} dias
                    </div>
                    <div className="text-xs text-emerald-600">Dias restantes estimados</div>
                  </div>
                  <div>
                    <div className="font-bold text-emerald-700">
                      {new Date(Date.now() + Math.ceil((lote.pesoMetaAbate - ultimoPeso) / (gmd / 1000)) * 86400000).toLocaleDateString('pt-BR')}
                    </div>
                    <div className="text-xs text-emerald-600">Data estimada de abate</div>
                  </div>
                  <div>
                    <div className="font-bold text-emerald-700">
                      {((lote.pesoMetaAbate * 0.52) / 15).toFixed(1)} @/cab
                    </div>
                    <div className="text-xs text-emerald-600">Arrobas esperadas (52% rend.)</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Transição */}
      {showTransicao && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="font-bold text-slate-900 mb-1">Iniciar Fase de Engorda</h3>
            <p className="text-sm text-slate-500 mb-4">Registre o peso de transição para iniciar o protocolo de engorda.</p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Peso médio de transição (kg) *</label>
              <input type="number" step="0.1" value={pesoTransicao} onChange={e => setPesoTransicao(e.target.value)}
                placeholder="Ex: 330" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowTransicao(false)}
                className="flex-1 border border-slate-200 text-slate-700 font-semibold py-2.5 rounded-xl hover:bg-slate-50">
                Cancelar
              </button>
              <button onClick={submitTransicao} disabled={!pesoTransicao || savingTransicao}
                className="flex-1 bg-orange-500 text-white font-bold py-2.5 rounded-xl hover:bg-orange-600 disabled:opacity-50">
                {savingTransicao ? 'Salvando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

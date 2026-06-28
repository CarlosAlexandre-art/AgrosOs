'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const RACAS = [
  { value: 'Nelore', label: 'Nelore', gmdRecria: 650, gmdEngorda: 750, pesoMeta: 480 },
  { value: 'Angus', label: 'Angus', gmdRecria: 750, gmdEngorda: 900, pesoMeta: 510 },
  { value: 'Brangus', label: 'Brangus', gmdRecria: 700, gmdEngorda: 850, pesoMeta: 500 },
  { value: 'Senepol', label: 'Senepol', gmdRecria: 700, gmdEngorda: 800, pesoMeta: 490 },
  { value: 'Canchim', label: 'Canchim', gmdRecria: 800, gmdEngorda: 900, pesoMeta: 500 },
  { value: 'Girolando', label: 'Girolando', gmdRecria: 600, gmdEngorda: 700, pesoMeta: 470 },
  { value: 'Cruzado', label: 'Cruzado (Nelore x)', gmdRecria: 720, gmdEngorda: 870, pesoMeta: 495 },
  { value: 'Outro', label: 'Outro', gmdRecria: 650, gmdEngorda: 750, pesoMeta: 480 },
]

const SISTEMAS = [
  { value: 'PASTO_ROTACIONADO', label: 'Pasto Rotacionado', icon: '🌿' },
  { value: 'SEMICONFINAMENTO', label: 'Semiconfinamento', icon: '🏠' },
  { value: 'CONFINAMENTO', label: 'Confinamento', icon: '🏭' },
]

const OBJETIVOS = [
  { value: 'RECRIA_ENGORDA', label: 'Recria + Engorda (ciclo completo)', icon: '🔄' },
  { value: 'RECRIA', label: 'Apenas Recria', icon: '🐮' },
  { value: 'ENGORDA', label: 'Apenas Engorda', icon: '⚖️' },
]

const REGIOES = [
  'Centro-Oeste', 'Sudeste', 'Sul', 'Norte', 'Nordeste',
]

type Step = 1 | 2 | 3

export default function NovoLotePage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Step 1
  const [nome, setNome] = useState('')
  const [cabecas, setCabecas] = useState('')
  const [idadeMediaMeses, setIdadeMediaMeses] = useState('')
  const [pesoMedioEntrada, setPesoMedioEntrada] = useState('')
  const [raca, setRaca] = useState('')
  const [objetivo, setObjetivo] = useState('RECRIA_ENGORDA')
  const [regiao, setRegiao] = useState('Centro-Oeste')

  // Step 2
  const [sistema, setSistema] = useState('PASTO_ROTACIONADO')
  const [areaHectares, setAreaHectares] = useState('')
  const [numPiquetes, setNumPiquetes] = useState('')
  const [metaGMD, setMetaGMD] = useState('')
  const [pesoMetaAbate, setPesoMetaAbate] = useState('')

  const racaData = RACAS.find(r => r.value === raca)

  function handleRacaChange(value: string) {
    setRaca(value)
    const r = RACAS.find(x => x.value === value)
    if (r) {
      const gmd = objetivo === 'ENGORDA' ? r.gmdEngorda : r.gmdRecria
      setMetaGMD(gmd.toString())
      setPesoMetaAbate(r.pesoMeta.toString())
    }
  }

  function handleObjetivoChange(value: string) {
    setObjetivo(value)
    if (racaData) {
      const gmd = value === 'ENGORDA' ? racaData.gmdEngorda : racaData.gmdRecria
      setMetaGMD(gmd.toString())
    }
  }

  function calcPiquetes() {
    if (!areaHectares || !cabecas || !pesoMedioEntrada) return
    const ua = (Number(pesoMedioEntrada) / 450) * Number(cabecas)
    const haNeeded = ua * 1.8
    const sugeridos = Math.ceil(42 / 7) + 1
    setNumPiquetes(sugeridos.toString())
    if (!areaHectares) setAreaHectares(haNeeded.toFixed(1))
  }

  async function handleSubmit() {
    setLoading(true)
    setError('')
    try {
      const faseAtual = objetivo === 'ENGORDA' ? 'ENGORDA' : 'RECRIA'
      const res = await fetch('/api/recria-engorda/lotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome, cabecas: Number(cabecas),
          racaPredominante: raca || null,
          idadeMediaMeses: idadeMediaMeses ? Number(idadeMediaMeses) : null,
          pesoMedioEntrada: Number(pesoMedioEntrada),
          objetivo, pesoMetaAbate: pesoMetaAbate ? Number(pesoMetaAbate) : null,
          faseAtual, metaGMD: metaGMD ? Number(metaGMD) : null,
          sistemaProducao: sistema, numPiquetes: numPiquetes ? Number(numPiquetes) : null,
          areaHectares: areaHectares ? Number(areaHectares) : null,
          regiao,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Erro ao criar lote'); setLoading(false); return }
      router.push(`/dashboard/recria-engorda/lotes/${data.id}`)
    } catch {
      setError('Erro de conexão')
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/recria-engorda" className="text-slate-400 hover:text-slate-600 transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Novo Lote</h1>
          <p className="text-slate-400 text-sm">Recria & Engorda</p>
        </div>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center gap-2 mb-8">
        {([1, 2, 3] as Step[]).map(s => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
              step === s ? 'bg-green-600 text-white' :
              step > s ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'
            }`}>{s}</div>
            {s < 3 && <div className={`h-0.5 w-12 transition-all ${step > s ? 'bg-green-400' : 'bg-slate-200'}`} />}
          </div>
        ))}
        <span className="text-sm text-slate-500 ml-2">
          {step === 1 ? 'Identificação do Lote' : step === 2 ? 'Protocolo & Pasto' : 'Revisar & Confirmar'}
        </span>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">{error}</div>
      )}

      {/* Step 1 */}
      {step === 1 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Nome do Lote *</label>
            <input
              value={nome} onChange={e => setNome(e.target.value)}
              placeholder="Ex: Lote Recria Nelore - Fazenda Norte"
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Cabeças *</label>
              <input type="number" min="1" value={cabecas} onChange={e => setCabecas(e.target.value)}
                placeholder="20" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Peso médio entrada (kg) *</label>
              <input type="number" min="1" value={pesoMedioEntrada} onChange={e => setPesoMedioEntrada(e.target.value)}
                placeholder="210" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Raça predominante</label>
              <select value={raca} onChange={e => handleRacaChange(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="">Selecionar...</option>
                {RACAS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Idade média (meses)</label>
              <input type="number" min="1" value={idadeMediaMeses} onChange={e => setIdadeMediaMeses(e.target.value)}
                placeholder="8" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Objetivo *</label>
            <div className="space-y-2">
              {OBJETIVOS.map(o => (
                <button key={o.value} type="button" onClick={() => handleObjetivoChange(o.value)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-all text-left ${
                    objetivo === o.value ? 'border-green-500 bg-green-50 text-green-800' : 'border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}>
                  <span>{o.icon}</span>
                  {o.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Região</label>
            <select value={regiao} onChange={e => setRegiao(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
              {REGIOES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <button
            onClick={() => { if (!nome || !cabecas || !pesoMedioEntrada) { setError('Preencha nome, cabeças e peso de entrada.'); return } setError(''); setStep(2) }}
            className="w-full bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 transition-colors"
          >
            Próximo →
          </button>
        </div>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Sistema de Produção</label>
            <div className="grid grid-cols-3 gap-2">
              {SISTEMAS.map(s => (
                <button key={s.value} type="button" onClick={() => setSistema(s.value)}
                  className={`flex flex-col items-center gap-1 px-3 py-4 rounded-xl border text-xs font-medium transition-all ${
                    sistema === s.value ? 'border-green-500 bg-green-50 text-green-800' : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}>
                  <span className="text-xl">{s.icon}</span>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Área disponível (ha)</label>
              <input type="number" min="0.1" step="0.1" value={areaHectares} onChange={e => setAreaHectares(e.target.value)}
                placeholder="15.0" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Nº de piquetes</label>
              <div className="flex gap-2">
                <input type="number" min="1" value={numPiquetes} onChange={e => setNumPiquetes(e.target.value)}
                  placeholder="7" className="flex-1 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                <button type="button" onClick={calcPiquetes}
                  className="px-3 py-3 bg-slate-100 text-slate-600 rounded-xl text-xs hover:bg-slate-200 transition-colors" title="Calcular sugerido">
                  Auto
                </button>
              </div>
            </div>
          </div>
          {racaData && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <p className="text-xs font-bold text-emerald-800 mb-2">📊 Benchmark para {racaData.label} (Embrapa)</p>
              <div className="grid grid-cols-3 gap-3 text-center text-xs">
                <div><div className="font-bold text-emerald-700">{racaData.gmdRecria} g/dia</div><div className="text-emerald-600">GMD Recria</div></div>
                <div><div className="font-bold text-emerald-700">{racaData.gmdEngorda} g/dia</div><div className="text-emerald-600">GMD Engorda</div></div>
                <div><div className="font-bold text-emerald-700">{racaData.pesoMeta} kg</div><div className="text-emerald-600">Peso Abate</div></div>
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Meta GMD (g/dia)</label>
              <input type="number" min="100" value={metaGMD} onChange={e => setMetaGMD(e.target.value)}
                placeholder="650" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Peso meta abate (kg)</label>
              <input type="number" min="200" value={pesoMetaAbate} onChange={e => setPesoMetaAbate(e.target.value)}
                placeholder="480" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => { setError(''); setStep(1) }}
              className="flex-1 border border-slate-200 text-slate-700 font-semibold py-3 rounded-xl hover:bg-slate-50 transition-colors">
              ← Voltar
            </button>
            <button onClick={() => { setError(''); setStep(3) }}
              className="flex-1 bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 transition-colors">
              Próximo →
            </button>
          </div>
        </div>
      )}

      {/* Step 3 - Review */}
      {step === 3 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="font-bold text-slate-900 mb-4">Confirmar dados do lote</h2>
          <div className="space-y-3 text-sm">
            {[
              ['Nome', nome],
              ['Cabeças', cabecas],
              ['Raça', raca || '—'],
              ['Peso entrada', `${pesoMedioEntrada} kg`],
              ['Idade média', idadeMediaMeses ? `${idadeMediaMeses} meses` : '—'],
              ['Objetivo', OBJETIVOS.find(o => o.value === objetivo)?.label ?? objetivo],
              ['Sistema', SISTEMAS.find(s => s.value === sistema)?.label ?? sistema],
              ['Área', areaHectares ? `${areaHectares} ha` : '—'],
              ['Piquetes', numPiquetes || '—'],
              ['Meta GMD', metaGMD ? `${metaGMD} g/dia` : '—'],
              ['Peso meta abate', pesoMetaAbate ? `${pesoMetaAbate} kg` : '—'],
              ['Região', regiao],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between border-b border-slate-50 pb-2">
                <span className="text-slate-500">{k}</span>
                <span className="font-medium text-slate-900">{v}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={() => { setError(''); setStep(2) }}
              className="flex-1 border border-slate-200 text-slate-700 font-semibold py-3 rounded-xl hover:bg-slate-50 transition-colors">
              ← Voltar
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Criando...' : 'Criar Lote ✓'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

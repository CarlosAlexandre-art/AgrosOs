'use client'

import { useState, useRef, useCallback } from 'react'

type NetfloraModel = {
  id: string
  biome: string
  category: string
  description: string
  n_classes: number
  downloaded: boolean
}

type Detection = {
  class_id: number
  class_name: string
  confidence: number
  x1: number; y1: number
  x2: number; y2: number
  width: number; height: number
}

type DetectionResult = {
  model_id: string
  biome: string
  category: string
  total: number
  detections: Detection[]
  summary: Record<string, { count: number; avg_confidence: number }>
  source: 'qgis-microservice' | 'demo'
  demo_notice?: string
}

const BIOMES = ['Amazônia', 'Cerrado', 'Mata Atlântica', 'Caatinga', 'Pantanal', 'Pampa']

const BIOME_COLORS: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  'Amazônia':       { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30', dot: '#10b981' },
  'Cerrado':        { bg: 'bg-amber-500/10',   text: 'text-amber-400',   border: 'border-amber-500/30',   dot: '#f59e0b' },
  'Mata Atlântica': { bg: 'bg-teal-500/10',    text: 'text-teal-400',    border: 'border-teal-500/30',    dot: '#14b8a6' },
  'Caatinga':       { bg: 'bg-orange-500/10',  text: 'text-orange-400',  border: 'border-orange-500/30',  dot: '#f97316' },
  'Pantanal':       { bg: 'bg-cyan-500/10',    text: 'text-cyan-400',    border: 'border-cyan-500/30',    dot: '#06b6d4' },
  'Pampa':          { bg: 'bg-lime-500/10',    text: 'text-lime-400',    border: 'border-lime-500/30',    dot: '#84cc16' },
}

function ConfidenceBadge({ value }: { value: number }) {
  const pct = Math.round(value * 100)
  const color = pct >= 80 ? 'text-emerald-400 bg-emerald-400/10' : pct >= 60 ? 'text-amber-400 bg-amber-400/10' : 'text-red-400 bg-red-400/10'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${color}`}>
      {pct}%
    </span>
  )
}

function DetectionOverlay({ detections, imageSize }: { detections: Detection[]; imageSize: { w: number; h: number } }) {
  const scaleX = imageSize.w / 640
  const scaleY = imageSize.h / 640
  const palette = ['#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6', '#f97316', '#06b6d4', '#ec4899']

  const classColors: Record<string, string> = {}
  let colorIdx = 0
  for (const d of detections) {
    if (!classColors[d.class_name]) {
      classColors[d.class_name] = palette[colorIdx % palette.length]
      colorIdx++
    }
  }

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox={`0 0 ${imageSize.w} ${imageSize.h}`}>
      {detections.map((d, i) => {
        const x = d.x1 * scaleX
        const y = d.y1 * scaleY
        const w = (d.x2 - d.x1) * scaleX
        const h = (d.y2 - d.y1) * scaleY
        const color = classColors[d.class_name]
        return (
          <g key={i}>
            <rect x={x} y={y} width={w} height={h} fill="none" stroke={color} strokeWidth="2" />
            <rect x={x} y={y - 18} width={Math.max(80, d.class_name.length * 7)} height={18} fill={color} fillOpacity="0.85" rx="2" />
            <text x={x + 4} y={y - 4} fill="white" fontSize="11" fontWeight="600">{d.class_name}</text>
          </g>
        )
      })}
    </svg>
  )
}

export default function InventarioPage() {
  const [models, setModels] = useState<NetfloraModel[] | null>(null)
  const [loadingModels, setLoadingModels] = useState(false)
  const [selectedBiome, setSelectedBiome] = useState<string>('Amazônia')
  const [selectedModel, setSelectedModel] = useState<string>('')
  const [confidence, setConfidence] = useState(0.5)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [imageSize, setImageSize] = useState({ w: 640, h: 640 })
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<DetectionResult | null>(null)
  const [error, setError] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const filteredModels = (models || []).filter(m => m.biome === selectedBiome)
  const chosenModel = (models || []).find(m => m.id === selectedModel)

  async function loadModels() {
    if (models) return
    setLoadingModels(true)
    try {
      const res = await fetch('/api/netflora')
      if (res.ok) setModels(await res.json())
    } finally {
      setLoadingModels(false)
    }
  }

  function handleFile(file: File) {
    if (!file.type.startsWith('image/')) return
    setImageFile(file)
    setResult(null)
    setError('')
    const url = URL.createObjectURL(file)
    setImagePreview(url)
    const img = new Image()
    img.onload = () => setImageSize({ w: img.naturalWidth, h: img.naturalHeight })
    img.src = url
    loadModels()
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [])

  async function runDetection() {
    if (!imageFile || !selectedModel) return
    setRunning(true)
    setError('')
    setResult(null)

    try {
      const buffer = await imageFile.arrayBuffer()
      const b64 = btoa(String.fromCharCode(...new Uint8Array(buffer)))

      const res = await fetch('/api/netflora', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model_id: selectedModel, image_b64: b64, confidence_threshold: confidence }),
      })

      if (!res.ok) {
        const err = await res.json()
        setError(err.error || 'Erro na detecção')
        return
      }

      setResult(await res.json())
    } catch (e) {
      setError('Erro de rede. Tente novamente.')
    } finally {
      setRunning(false)
    }
  }

  const topSpecies = result
    ? Object.entries(result.summary).sort((a, b) => b[1].count - a[1].count)
    : []

  return (
    <div className="min-h-screen bg-[#f1f5f9]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-5">
        <div className="max-w-6xl mx-auto flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Inventário Florestal</h1>
                <p className="text-sm text-slate-500 mt-0.5">Netflora — detecção automática de espécies por IA (Embrapa Acre)</p>
              </div>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5">
            <svg className="w-4 h-4 text-emerald-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs text-emerald-700 font-medium">12 modelos · 6 biomas brasileiros · YOLO/ONNX</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">
        {/* Biome selector */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">1. Selecione o bioma da propriedade</h2>
          <div className="flex flex-wrap gap-2">
            {BIOMES.map(biome => {
              const c = BIOME_COLORS[biome]
              const active = selectedBiome === biome
              return (
                <button
                  key={biome}
                  onClick={() => { setSelectedBiome(biome); setSelectedModel('') }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                    active
                      ? `${c.bg} ${c.text} ${c.border}`
                      : 'bg-gray-50 text-slate-500 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: active ? c.dot : '#94a3b8' }} />
                  {biome}
                </button>
              )
            })}
          </div>
        </div>

        {/* Model selector + Upload in a two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Model selector */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-slate-700 mb-3">2. Escolha o modelo de detecção</h2>
            {loadingModels ? (
              <div className="flex items-center gap-2 text-slate-400 text-sm py-4">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Carregando modelos...
              </div>
            ) : filteredModels.length > 0 ? (
              <div className="space-y-2">
                {filteredModels.map(m => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedModel(m.id)}
                    className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                      selectedModel === m.id
                        ? 'bg-emerald-50 border-emerald-300 ring-1 ring-emerald-300'
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-semibold ${selectedModel === m.id ? 'text-emerald-700' : 'text-slate-700'}`}>
                        {m.category}
                      </span>
                      <span className="text-xs text-slate-400">{m.n_classes} classes</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{m.description}</p>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 py-4 text-center">
                {models ? 'Nenhum modelo para este bioma' : 'Faça upload de uma imagem para carregar os modelos'}
              </p>
            )}

            {/* Confidence threshold */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-slate-600">Confiança mínima</label>
                <span className="text-xs font-semibold text-emerald-600">{Math.round(confidence * 100)}%</span>
              </div>
              <input
                type="range" min="0.1" max="0.95" step="0.05"
                value={confidence}
                onChange={e => setConfidence(parseFloat(e.target.value))}
                className="w-full accent-emerald-500"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>10% — mais detecções</span>
                <span>95% — mais preciso</span>
              </div>
            </div>
          </div>

          {/* Upload */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-slate-700 mb-3">3. Upload da imagem de drone ou satélite</h2>
            <div
              className={`relative border-2 border-dashed rounded-xl transition-colors cursor-pointer ${
                dragOver ? 'border-emerald-400 bg-emerald-50' : 'border-gray-200 hover:border-gray-300 bg-gray-50'
              }`}
              style={{ minHeight: imagePreview ? 'auto' : '180px' }}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
            >
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Imagem carregada"
                    className="w-full rounded-xl object-contain max-h-64"
                  />
                  {result && (
                    <DetectionOverlay detections={result.detections} imageSize={imageSize} />
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                  <svg className="w-10 h-10 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                  </svg>
                  <p className="text-sm text-slate-500 font-medium">Arraste ou clique para fazer upload</p>
                  <p className="text-xs text-slate-400 mt-1">JPEG, PNG — imagem de drone ou satélite</p>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
            />

            {imageFile && (
              <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
                {imageFile.name} — {(imageFile.size / 1024).toFixed(0)} KB
              </p>
            )}

            <button
              onClick={runDetection}
              disabled={!imageFile || !selectedModel || running}
              className="mt-4 w-full py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
            >
              {running ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Analisando...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                  Detectar espécies
                </>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 flex items-center gap-2">
            <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-4">
            {/* Demo notice */}
            {result.source === 'demo' && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700 flex items-start gap-2">
                <svg className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <span className="font-semibold">Modo demonstração</span> — {result.demo_notice}
                  <span className="block mt-0.5 text-xs text-amber-600">Configure <code className="font-mono">QGIS_SERVICE_URL</code> no ambiente para usar o microserviço real.</span>
                </div>
              </div>
            )}

            {/* Summary cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl border border-gray-200 p-4">
                <div className="text-2xl font-bold text-slate-900">{result.total}</div>
                <div className="text-xs text-slate-500 mt-0.5">Detecções totais</div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-200 p-4">
                <div className="text-2xl font-bold text-slate-900">{topSpecies.length}</div>
                <div className="text-xs text-slate-500 mt-0.5">Espécies identificadas</div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-200 p-4">
                <div className="text-2xl font-bold text-slate-900">
                  {result.total > 0
                    ? Math.round(result.detections.reduce((s, d) => s + d.confidence, 0) / result.total * 100)
                    : 0}%
                </div>
                <div className="text-xs text-slate-500 mt-0.5">Confiança média</div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-200 p-4">
                <div className={`text-xs font-bold px-2 py-1 rounded-full inline-block mt-1 ${
                  result.source === 'qgis-microservice'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-amber-100 text-amber-700'
                }`}>
                  {result.source === 'qgis-microservice' ? 'MICROSERVIÇO' : 'DEMO'}
                </div>
                <div className="text-xs text-slate-500 mt-1.5">Fonte dos dados</div>
              </div>
            </div>

            {/* Species breakdown */}
            {topSpecies.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <h3 className="text-sm font-semibold text-slate-700 mb-4">Espécies detectadas</h3>
                <div className="space-y-3">
                  {topSpecies.map(([name, stats]) => {
                    const maxCount = topSpecies[0][1].count
                    const pct = Math.round((stats.count / maxCount) * 100)
                    return (
                      <div key={name} className="flex items-center gap-3">
                        <div className="w-36 text-sm text-slate-700 font-medium flex-shrink-0 truncate">{name}</div>
                        <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="h-2 rounded-full bg-emerald-500 transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="text-xs text-slate-500 w-8 text-right">{stats.count}</div>
                        <ConfidenceBadge value={stats.avg_confidence} />
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Detection table */}
            {result.detections.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-slate-700">Todas as detecções</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">#</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Espécie</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Confiança</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Posição (px)</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Tamanho</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {result.detections.map((d, i) => (
                        <tr key={i} className="hover:bg-gray-50 transition-colors">
                          <td className="px-5 py-3 text-slate-400 font-mono text-xs">{i + 1}</td>
                          <td className="px-5 py-3">
                            <span className="font-semibold text-slate-800">{d.class_name}</span>
                          </td>
                          <td className="px-5 py-3">
                            <ConfidenceBadge value={d.confidence} />
                          </td>
                          <td className="px-5 py-3 text-slate-500 text-xs font-mono">
                            ({d.x1}, {d.y1}) → ({d.x2}, {d.y2})
                          </td>
                          <td className="px-5 py-3 text-slate-500 text-xs">
                            {d.width}×{d.height}px
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Info card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Sobre o Netflora</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-slate-600">
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
                </svg>
              </div>
              <div>
                <div className="font-semibold text-slate-800 mb-0.5">Origem</div>
                Desenvolvido pela Embrapa Acre com financiamento do Fundo JBS — detecção de espécies nativas em imagens de drone.
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 7.125C2.25 6.504 2.754 6 3.375 6h6c.621 0 1.125.504 1.125 1.125v3.75c0 .621-.504 1.125-1.125 1.125h-6a1.125 1.125 0 01-1.125-1.125v-3.75zM14.25 8.625c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125v8.25c0 .621-.504 1.125-1.125 1.125h-5.25a1.125 1.125 0 01-1.125-1.125v-8.25zM3.75 16.125c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125v2.25c0 .621-.504 1.125-1.125 1.125h-5.25a1.125 1.125 0 01-1.125-1.125v-2.25z" />
                </svg>
              </div>
              <div>
                <div className="font-semibold text-slate-800 mb-0.5">Tecnologia</div>
                Modelos YOLO exportados para ONNX Runtime — inferência CPU ou GPU, sem dependência de QGIS em produção.
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              <div>
                <div className="font-semibold text-slate-800 mb-0.5">Cobertura</div>
                12 modelos cobrindo Amazônia, Cerrado, Mata Atlântica, Caatinga, Pantanal e Pampa — mais de 70 espécies.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

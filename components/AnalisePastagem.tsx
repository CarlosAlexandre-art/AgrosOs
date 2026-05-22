'use client'

import { useState, useRef, useCallback } from 'react'

type Estado = 'idle' | 'analisando' | 'resultado' | 'erro'

type Recomendacao = { tipo: string; acao: string; justificativa: string }

type AnalisePastagemData = {
  coberturaVegetal: string
  alturaPasto: string
  estadio: string
  qualidade: 'excelente' | 'boa' | 'regular' | 'degradada' | 'critica'
  especiesIdentificadas: string[]
  plantasDaninhas: string[]
  sinaisDegradacao: string[]
  deficienciasNutricionais: string[]
  lotacaoEstimada: string
  diasDescanso: string
  recomendacoes: Recomendacao[]
  insumosSugeridos: string[]
  confianca: string
  observacoes: string
}

const QUALIDADE_CONFIG = {
  excelente: { label: 'Excelente', color: 'text-emerald-300', bg: 'bg-emerald-500/15', border: 'border-emerald-500/20', icon: '🌿' },
  boa: { label: 'Boa', color: 'text-green-300', bg: 'bg-green-500/15', border: 'border-green-500/20', icon: '🌱' },
  regular: { label: 'Regular', color: 'text-amber-300', bg: 'bg-amber-500/15', border: 'border-amber-500/20', icon: '⚠️' },
  degradada: { label: 'Degradada', color: 'text-orange-300', bg: 'bg-orange-500/15', border: 'border-orange-500/20', icon: '🔶' },
  critica: { label: 'Crítica', color: 'text-red-300', bg: 'bg-red-500/15', border: 'border-red-500/20', icon: '🚨' },
}

const TIPO_REC_COLOR: Record<string, string> = {
  imediata: 'text-red-300 bg-red-500/15',
  curto_prazo: 'text-amber-300 bg-amber-500/15',
  longo_prazo: 'text-blue-300 bg-blue-500/15',
}

const TIPOS_PASTAGEM = [
  '', 'Brachiaria decumbens', 'Brachiaria brizantha', 'Panicum maximum',
  'Cynodon (Tifton)', 'Pennisetum purpureum', 'Andropogon', 'Outro',
]

export default function AnalisePastagem() {
  const [estado, setEstado] = useState<Estado>('idle')
  const [modalAberto, setModalAberto] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [talhao, setTalhao] = useState('')
  const [tipoPastagem, setTipoPastagem] = useState('')
  const [analise, setAnalise] = useState<AnalisePastagemData | null>(null)
  const [erro, setErro] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const onFileChange = useCallback((f: File) => {
    if (!f.type.startsWith('image/')) { setErro('Apenas imagens aceitas'); return }
    if (f.size > 12 * 1024 * 1024) { setErro('Máximo 12 MB'); return }
    setFile(f)
    setErro('')
    const reader = new FileReader()
    reader.onload = e => setPreview(e.target?.result as string)
    reader.readAsDataURL(f)
  }, [])

  async function analisar() {
    if (!file) return
    setEstado('analisando')
    setErro('')
    try {
      const form = new FormData()
      form.append('foto', file)
      form.append('talhao', talhao)
      form.append('tipo', tipoPastagem)
      const res = await fetch('/api/ai/analise-pastagem', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok || !data.ok) throw new Error(data.error || 'Erro na análise')
      setAnalise(data.analise)
      setEstado('resultado')
    } catch (e: any) {
      setErro(e.message || 'Erro ao analisar imagem')
      setEstado('erro')
    }
  }

  function fechar() {
    setModalAberto(false)
    setEstado('idle')
    setPreview(null)
    setFile(null)
    setAnalise(null)
    setErro('')
  }

  const qual = analise ? (QUALIDADE_CONFIG[analise.qualidade] ?? QUALIDADE_CONFIG.regular) : null

  return (
    <>
      {/* Botão flutuante — acima do clima */}
      <button
        onClick={() => setModalAberto(true)}
        className="flex fixed z-[1100] w-12 h-12 rounded-2xl items-center justify-center transition-all hover:scale-105 active:scale-95"
        style={{
          bottom: '22.5rem',
          right: '1.5rem',
          background: 'linear-gradient(135deg,#15803d,#16a34a)',
          boxShadow: '0 0 16px rgba(21,128,61,.4)',
        }}
        title="Análise de Pastagem por Imagem — IA"
      >
        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
        </svg>
      </button>

      {/* Modal */}
      {modalAberto && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4 bg-black/60">
          <div
            className="w-full max-w-lg rounded-2xl overflow-hidden"
            style={{
              background: 'linear-gradient(180deg,#0f172a 0%,#051a0a 100%)',
              border: '1px solid rgba(255,255,255,.1)',
              boxShadow: '0 24px 64px rgba(0,0,0,.6)',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-white/8 flex items-center justify-between flex-shrink-0"
              style={{ background: 'rgba(21,128,61,.08)' }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(21,128,61,.2)' }}>
                  <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5z" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-bold text-white">Análise de Pastagem</div>
                  <div className="text-[10px] text-slate-500 font-mono">AgroPast IA · LLaMA 4 Scout Vision</div>
                </div>
              </div>
              <button onClick={fechar} className="text-slate-500 hover:text-white transition-colors p-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-5 space-y-4">
              {(estado === 'idle' || estado === 'erro') && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold block mb-1.5">Talhão (opcional)</label>
                      <input
                        type="text"
                        value={talhao}
                        onChange={e => setTalhao(e.target.value)}
                        placeholder="Ex: Talhão 3"
                        className="w-full rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-600 outline-none"
                        style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)' }}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold block mb-1.5">Espécie</label>
                      <select
                        value={tipoPastagem}
                        onChange={e => setTipoPastagem(e.target.value)}
                        className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none"
                        style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)' }}
                      >
                        <option value="" className="bg-[#0f172a]">Identificar automaticamente</option>
                        {TIPOS_PASTAGEM.slice(1).map(t => <option key={t} value={t} className="bg-[#0f172a]">{t}</option>)}
                      </select>
                    </div>
                  </div>

                  {!preview ? (
                    <div
                      className="rounded-xl border-2 border-dashed border-white/15 p-8 flex flex-col items-center gap-3 cursor-pointer hover:border-green-500/50 hover:bg-white/4 transition-all"
                      onClick={() => inputRef.current?.click()}
                    >
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(21,128,61,.15)' }}>
                        <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                        </svg>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-semibold text-white">Fotografe a pastagem</p>
                        <p className="text-[11px] text-slate-500 mt-1">De drone ou celular — JPG, PNG, WEBP</p>
                        <p className="text-[10px] text-green-400/70 mt-1">Melhor resultado: foto aérea ou panorâmica</p>
                      </div>
                    </div>
                  ) : (
                    <div className="relative rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,.08)' }}>
                      <img src={preview} alt="Pastagem" className="w-full max-h-48 object-cover" />
                      <button
                        onClick={() => { setPreview(null); setFile(null) }}
                        className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}

                  <input ref={inputRef} type="file" accept="image/*"
                    className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) onFileChange(f); e.target.value = '' }} />

                  {estado === 'erro' && (
                    <div className="rounded-xl p-3 bg-red-500/10 border border-red-500/20">
                      <p className="text-sm text-red-300">{erro}</p>
                    </div>
                  )}

                  <button onClick={analisar} disabled={!file}
                    className="w-full py-3 rounded-xl text-sm font-bold text-white disabled:opacity-40"
                    style={{ background: 'linear-gradient(135deg,#15803d,#16a34a)' }}>
                    Analisar Pastagem com IA
                  </button>
                </>
              )}

              {estado === 'analisando' && (
                <div className="flex flex-col items-center gap-4 py-8">
                  <div className="relative w-16 h-16">
                    <div className="absolute inset-0 rounded-full border-2 border-green-500/20" />
                    <div className="absolute inset-0 rounded-full border-2 border-t-green-500 animate-spin" />
                    <div className="absolute inset-3 rounded-full flex items-center justify-center" style={{ background: 'rgba(21,128,61,.15)' }}>
                      <span className="text-lg">🌱</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-white">Analisando pastagem...</p>
                    <p className="text-[11px] text-slate-500 mt-1">LLaMA 4 Scout avaliando cobertura e qualidade</p>
                  </div>
                </div>
              )}

              {estado === 'resultado' && analise && qual && (
                <div className="space-y-4">
                  <div className={`rounded-xl px-4 py-3 flex items-center gap-3 ${qual.bg} border ${qual.border}`}>
                    <span className="text-2xl">{qual.icon}</span>
                    <div className="flex-1">
                      <div className={`text-sm font-bold ${qual.color}`}>Pastagem {qual.label}</div>
                      <div className="text-[11px] text-slate-400">Confiança {analise.confianca}{talhao ? ` · ${talhao}` : ''}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'Cobertura', value: analise.coberturaVegetal },
                      { label: 'Altura', value: analise.alturaPasto },
                      { label: 'Lotação', value: analise.lotacaoEstimada },
                    ].map(({ label, value }) => (
                      <div key={label} className="rounded-xl p-2.5 text-center" style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.06)' }}>
                        <div className="text-[10px] text-slate-500 uppercase tracking-widest">{label}</div>
                        <div className="text-[12px] text-white font-semibold mt-0.5">{value || '—'}</div>
                      </div>
                    ))}
                  </div>

                  {analise.sinaisDegradacao?.length > 0 && analise.sinaisDegradacao[0] !== 'Nenhum sinal de degradação' && (
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-2">Sinais de degradação</div>
                      {analise.sinaisDegradacao.map((s, i) => (
                        <div key={i} className="flex items-start gap-2 text-[11px] text-orange-300 mb-1">
                          <span className="text-orange-400 flex-shrink-0">⚠</span>{s}
                        </div>
                      ))}
                    </div>
                  )}

                  {analise.recomendacoes?.length > 0 && (
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-2">Recomendações</div>
                      <div className="space-y-2">
                        {analise.recomendacoes.map((r, i) => (
                          <div key={i} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.06)' }}>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${TIPO_REC_COLOR[r.tipo] || 'text-slate-400 bg-slate-700'}`}>
                              {r.tipo.replace('_', ' ').toUpperCase()}
                            </span>
                            <p className="text-[12px] text-white font-medium mt-1">{r.acao}</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">{r.justificativa}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {analise.insumosSugeridos?.length > 0 && (
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-2">Insumos indicados</div>
                      {analise.insumosSugeridos.map((ins, i) => (
                        <div key={i} className="flex items-start gap-2 text-[11px] text-slate-300 mb-1">
                          <span className="text-green-400 flex-shrink-0">•</span>{ins}
                        </div>
                      ))}
                    </div>
                  )}

                  <button onClick={() => { setEstado('idle'); setPreview(null); setFile(null); setAnalise(null) }}
                    className="w-full py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:text-white transition-colors"
                    style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)' }}>
                    Nova análise
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

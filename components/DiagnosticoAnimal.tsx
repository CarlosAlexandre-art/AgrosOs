'use client'

import { useState, useRef, useCallback } from 'react'

type Estado = 'idle' | 'analisando' | 'resultado' | 'erro'

type Diagnostico = {
  condicaoCorporal: string
  aparenciaGeral: string
  sinaisClinicosVisiveis: string[]
  hipotesesDiagnosticas: string[]
  urgencia: 'baixa' | 'media' | 'alta' | 'emergencia'
  recomendacoes: string[]
  medicamentosComuns: string[]
  observacoes: string
  confianca: string
  aviso: string
}

const URGENCIA_CONFIG = {
  baixa: { label: 'Baixa urgência', color: 'text-emerald-300', bg: 'bg-emerald-500/15', border: 'border-emerald-500/20' },
  media: { label: 'Média urgência', color: 'text-amber-300', bg: 'bg-amber-500/15', border: 'border-amber-500/20' },
  alta: { label: 'Alta urgência', color: 'text-orange-300', bg: 'bg-orange-500/15', border: 'border-orange-500/20' },
  emergencia: { label: 'EMERGÊNCIA', color: 'text-red-300', bg: 'bg-red-500/15', border: 'border-red-500/20' },
}

const ESPECIES = ['bovino', 'suíno', 'ovino', 'caprino', 'equino', 'ave', 'outro']

export default function DiagnosticoAnimal() {
  const [estado, setEstado] = useState<Estado>('idle')
  const [modalAberto, setModalAberto] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [especie, setEspecie] = useState('bovino')
  const [contexto, setContexto] = useState('')
  const [diagnostico, setDiagnostico] = useState<Diagnostico | null>(null)
  const [erro, setErro] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const onFileChange = useCallback((f: File) => {
    if (!f.type.startsWith('image/')) { setErro('Apenas imagens (JPG, PNG, WEBP)'); return }
    if (f.size > 10 * 1024 * 1024) { setErro('Máximo 10 MB'); return }
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
      form.append('especie', especie)
      form.append('contexto', contexto)
      const res = await fetch('/api/ai/diagnostico-animal', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok || !data.ok) throw new Error(data.error || 'Erro na análise')
      setDiagnostico(data.diagnostico)
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
    setDiagnostico(null)
    setErro('')
    setContexto('')
    setEspecie('bovino')
  }

  function novaAnalise() {
    setEstado('idle')
    setPreview(null)
    setFile(null)
    setDiagnostico(null)
    setErro('')
  }

  const urg = diagnostico ? URGENCIA_CONFIG[diagnostico.urgencia] ?? URGENCIA_CONFIG.media : null

  return (
    <>
      {/* Botão flutuante — acima do documento */}
      <button
        onClick={() => setModalAberto(true)}
        className="flex fixed z-[1100] w-12 h-12 rounded-2xl items-center justify-center transition-all hover:scale-105 active:scale-95"
        style={{
          bottom: '14.5rem',
          right: '1.5rem',
          background: 'linear-gradient(135deg,#0f766e,#0d9488)',
          boxShadow: '0 0 16px rgba(15,118,110,.4)',
        }}
        title="Diagnóstico visual de animal com IA"
      >
        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
        </svg>
      </button>

      {/* Modal */}
      {modalAberto && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4 bg-black/60">
          <div
            className="w-full max-w-lg rounded-2xl overflow-hidden"
            style={{
              background: 'linear-gradient(180deg,#0f172a 0%,#0b1628 100%)',
              border: '1px solid rgba(255,255,255,.1)',
              boxShadow: '0 24px 64px rgba(0,0,0,.6)',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-white/8 flex items-center justify-between flex-shrink-0"
              style={{ background: 'rgba(15,118,110,.08)' }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(15,118,110,.2)' }}>
                  <svg className="w-4 h-4 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-bold text-white">Diagnóstico Visual Animal</div>
                  <div className="text-[10px] text-slate-500 font-mono">AgroVet IA · LLaMA 4 Scout Vision</div>
                </div>
              </div>
              <button onClick={fechar} className="text-slate-500 hover:text-white transition-colors p-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-5 space-y-4">
              {/* Upload */}
              {(estado === 'idle' || estado === 'erro') && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold block mb-1.5">Espécie</label>
                      <select
                        value={especie}
                        onChange={e => setEspecie(e.target.value)}
                        className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none capitalize"
                        style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)' }}
                      >
                        {ESPECIES.map(s => <option key={s} value={s} className="bg-[#0f172a]">{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold block mb-1.5">Contexto (opcional)</label>
                      <input
                        type="text"
                        value={contexto}
                        onChange={e => setContexto(e.target.value)}
                        placeholder="Ex: tosse há 3 dias"
                        className="w-full rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-600 outline-none"
                        style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)' }}
                      />
                    </div>
                  </div>

                  {!preview ? (
                    <div
                      className="rounded-xl border-2 border-dashed border-white/15 p-8 flex flex-col items-center gap-3 cursor-pointer hover:border-teal-500/50 hover:bg-white/4 transition-all"
                      onClick={() => inputRef.current?.click()}
                    >
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ background: 'rgba(15,118,110,.15)' }}>
                        <svg className="w-6 h-6 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                        </svg>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-semibold text-white">Fotografe ou selecione o animal</p>
                        <p className="text-[11px] text-slate-500 mt-1">JPG, PNG, WEBP — máx. 10 MB</p>
                        <p className="text-[10px] text-teal-400/70 mt-1">Melhor resultado: foto frontal com boa iluminação</p>
                      </div>
                    </div>
                  ) : (
                    <div className="relative rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,.08)' }}>
                      <img src={preview} alt="Animal" className="w-full max-h-48 object-cover" />
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

                  <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) onFileChange(f); e.target.value = '' }}
                  />

                  {estado === 'erro' && (
                    <div className="rounded-xl p-3 bg-red-500/10 border border-red-500/20">
                      <p className="text-sm text-red-300">{erro}</p>
                    </div>
                  )}

                  <button
                    onClick={analisar}
                    disabled={!file}
                    className="w-full py-3 rounded-xl text-sm font-bold text-white disabled:opacity-40 transition-all"
                    style={{ background: 'linear-gradient(135deg,#0f766e,#0d9488)' }}
                  >
                    Analisar com IA Veterinária
                  </button>
                </>
              )}

              {/* Carregando */}
              {estado === 'analisando' && (
                <div className="flex flex-col items-center gap-4 py-8">
                  <div className="relative w-16 h-16">
                    <div className="absolute inset-0 rounded-full border-2 border-teal-500/20" />
                    <div className="absolute inset-0 rounded-full border-2 border-t-teal-500 animate-spin" />
                    <div className="absolute inset-3 rounded-full flex items-center justify-center"
                      style={{ background: 'rgba(15,118,110,.15)' }}>
                      <svg className="w-5 h-5 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                      </svg>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-white">Analisando imagem...</p>
                    <p className="text-[11px] text-slate-500 mt-1">LLaMA 4 Scout examinando sinais clínicos</p>
                  </div>
                </div>
              )}

              {/* Resultado */}
              {estado === 'resultado' && diagnostico && urg && (
                <div className="space-y-4">
                  {/* Urgência */}
                  <div className={`rounded-xl px-4 py-3 flex items-center gap-3 ${urg.bg} border ${urg.border}`}>
                    <span className="text-2xl">
                      {diagnostico.urgencia === 'emergencia' ? '🚨' : diagnostico.urgencia === 'alta' ? '⚠️' : diagnostico.urgencia === 'media' ? '🔶' : '✅'}
                    </span>
                    <div>
                      <div className={`text-sm font-bold ${urg.color}`}>{urg.label}</div>
                      <div className="text-[11px] text-slate-400">Confiança da análise: {diagnostico.confianca}</div>
                    </div>
                  </div>

                  {/* Condição corporal */}
                  <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.06)' }}>
                    <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Condição corporal</div>
                    <p className="text-[12px] text-slate-200">{diagnostico.condicaoCorporal}</p>
                  </div>

                  {/* Aparência */}
                  <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.06)' }}>
                    <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Aparência geral</div>
                    <p className="text-[12px] text-slate-300 leading-relaxed">{diagnostico.aparenciaGeral}</p>
                  </div>

                  {/* Sinais clínicos */}
                  {diagnostico.sinaisClinicosVisiveis?.length > 0 && (
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-2">Sinais clínicos visíveis</div>
                      <div className="space-y-1">
                        {diagnostico.sinaisClinicosVisiveis.map((s, i) => (
                          <div key={i} className="flex items-start gap-2 text-[12px] text-slate-300">
                            <span className="text-teal-400 flex-shrink-0 mt-0.5">•</span>
                            {s}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Hipóteses */}
                  {diagnostico.hipotesesDiagnosticas?.length > 0 && (
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-2">Hipóteses diagnósticas</div>
                      <div className="space-y-1">
                        {diagnostico.hipotesesDiagnosticas.map((h, i) => (
                          <div key={i} className="flex items-start gap-2 rounded-lg px-3 py-1.5"
                            style={{ background: 'rgba(15,118,110,.08)', border: '1px solid rgba(15,118,110,.15)' }}>
                            <span className="text-teal-400 flex-shrink-0 mt-0.5 text-[11px]">{i + 1}.</span>
                            <p className="text-[11px] text-slate-300">{h}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recomendações */}
                  {diagnostico.recomendacoes?.length > 0 && (
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-2">Recomendações</div>
                      <div className="space-y-1.5">
                        {diagnostico.recomendacoes.map((r, i) => (
                          <div key={i} className="flex items-start gap-2 rounded-lg px-3 py-2 bg-amber-500/10 border border-amber-500/15">
                            <span className="text-amber-400 flex-shrink-0 mt-0.5">→</span>
                            <p className="text-[11px] text-amber-200">{r}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Aviso legal */}
                  <div className="rounded-xl p-3 bg-white/4 border border-white/8">
                    <p className="text-[10px] text-slate-500 leading-relaxed">⚕️ {diagnostico.aviso}</p>
                  </div>

                  <div className="flex gap-2">
                    <button onClick={novaAnalise}
                      className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:text-white transition-colors"
                      style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)' }}>
                      Nova análise
                    </button>
                    <button onClick={fechar}
                      className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all"
                      style={{ background: 'linear-gradient(135deg,#0f766e,#0d9488)' }}>
                      Fechar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

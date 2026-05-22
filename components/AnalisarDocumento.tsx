'use client'

import { useState, useRef, useCallback } from 'react'

type Estado = 'idle' | 'analisando' | 'resultado' | 'erro'

type DadosDocumento = {
  tipoDocumento: string
  resumo: string
  dadosPrincipais: Record<string, unknown>
  alertas: string[]
  acoesSugeridas: string[]
  confianca: string
}

type Resultado = {
  ok: boolean
  nomeArquivo: string
  tamanho: number
  mimeType: string
  dados: DadosDocumento
}

const TIPO_ICONS: Record<string, string> = {
  GTA: '🐄',
  'Nota Fiscal': '📄',
  'Laudo Veterinário': '🩺',
  'Análise de Solo': '🌱',
  'Receituário Agronômico': '💊',
  'Boletim Meteorológico': '🌤️',
  Contrato: '📝',
  Outro: '📋',
}

function formatarValor(val: unknown): string {
  if (val === null || val === undefined) return '—'
  if (Array.isArray(val)) return val.join(', ')
  if (typeof val === 'object') return JSON.stringify(val, null, 1)
  return String(val)
}

export default function AnalisarDocumento() {
  const [estado, setEstado] = useState<Estado>('idle')
  const [resultado, setResultado] = useState<Resultado | null>(null)
  const [erro, setErro] = useState('')
  const [modalAberto, setModalAberto] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const analisar = useCallback(async (file: File) => {
    if (!file) return
    const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowed.includes(file.type)) {
      setErro('Formato não suportado. Use PDF, JPG, PNG ou WEBP.')
      setEstado('erro')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setErro('Arquivo muito grande. Máximo 10 MB.')
      setEstado('erro')
      return
    }

    setEstado('analisando')
    setErro('')
    try {
      const form = new FormData()
      form.append('documento', file)
      const res = await fetch('/api/ai/analisar-documento', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok || !data.ok) throw new Error(data.error || 'Erro na análise')
      setResultado(data)
      setEstado('resultado')
    } catch (e: any) {
      setErro(e.message || 'Erro ao analisar documento')
      setEstado('erro')
    }
  }, [])

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) analisar(file)
    e.target.value = ''
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) analisar(file)
  }

  function fechar() {
    setModalAberto(false)
    setEstado('idle')
    setResultado(null)
    setErro('')
  }

  function abrirModal() {
    setModalAberto(true)
    setEstado('idle')
    setResultado(null)
    setErro('')
  }

  const dados = resultado?.dados

  return (
    <>
      {/* Botão flutuante — acima do microfone */}
      <button
        onClick={abrirModal}
        className="flex fixed z-[1100] w-12 h-12 rounded-2xl items-center justify-center transition-all hover:scale-105 active:scale-95"
        style={{
          bottom: '10.5rem',
          right: '1.5rem',
          background: 'linear-gradient(135deg,#7c3aed,#6d28d9)',
          boxShadow: '0 0 16px rgba(124,58,237,.4)',
        }}
        title="Analisar documento agrícola com IA"
      >
        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
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
              style={{ background: 'rgba(124,58,237,.08)' }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(124,58,237,.2)' }}>
                  <svg className="w-4 h-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-bold text-white">Análise de Documento</div>
                  <div className="text-[10px] text-slate-500 font-mono">AgroGPT OCR · LLaMA 4 Scout Vision</div>
                </div>
              </div>
              <button onClick={fechar} className="text-slate-500 hover:text-white transition-colors p-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-5 space-y-4">
              {/* Upload zone */}
              {(estado === 'idle' || estado === 'erro') && (
                <>
                  <div
                    className={`rounded-xl border-2 border-dashed p-8 flex flex-col items-center gap-3 cursor-pointer transition-all ${
                      dragOver ? 'border-violet-500 bg-violet-500/10' : 'border-white/15 hover:border-violet-500/50 hover:bg-white/4'
                    }`}
                    onClick={() => inputRef.current?.click()}
                    onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={onDrop}
                  >
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ background: 'rgba(124,58,237,.15)' }}>
                      <svg className="w-6 h-6 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                      </svg>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-white">Clique ou arraste o documento aqui</p>
                      <p className="text-[11px] text-slate-500 mt-1">PDF, JPG, PNG, WEBP — máx. 10 MB</p>
                    </div>
                    <div className="flex flex-wrap gap-2 justify-center mt-1">
                      {['📄 GTA', '🐄 Laudo Veterinário', '🧪 Análise de Solo', '🧾 Nota Fiscal', '💊 Receituário'].map(t => (
                        <span key={t} className="text-[10px] px-2 py-1 rounded-full text-violet-300"
                          style={{ background: 'rgba(124,58,237,.15)', border: '1px solid rgba(124,58,237,.2)' }}>
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                  <input ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" className="hidden" onChange={onFileChange} />

                  {estado === 'erro' && (
                    <div className="rounded-xl p-3 bg-red-500/10 border border-red-500/20">
                      <p className="text-sm text-red-300">{erro}</p>
                    </div>
                  )}
                </>
              )}

              {/* Carregando */}
              {estado === 'analisando' && (
                <div className="flex flex-col items-center gap-4 py-8">
                  <div className="relative w-16 h-16">
                    <div className="absolute inset-0 rounded-full border-2 border-violet-500/20" />
                    <div className="absolute inset-0 rounded-full border-2 border-t-violet-500 animate-spin" />
                    <div className="absolute inset-3 rounded-full flex items-center justify-center"
                      style={{ background: 'rgba(124,58,237,.15)' }}>
                      <svg className="w-5 h-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21a48.25 48.25 0 01-8.135-.687c-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
                      </svg>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-white">Analisando documento...</p>
                    <p className="text-[11px] text-slate-500 mt-1">LLaMA 4 Scout lendo e estruturando os dados</p>
                  </div>
                </div>
              )}

              {/* Resultado */}
              {estado === 'resultado' && dados && (
                <div className="space-y-4">
                  {/* Tipo + confiança */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{TIPO_ICONS[dados.tipoDocumento] || '📋'}</span>
                      <span className="text-sm font-bold text-white">{dados.tipoDocumento}</span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      dados.confianca === 'alta' ? 'text-green-300 bg-green-500/15 border border-green-500/20' :
                      dados.confianca === 'media' ? 'text-amber-300 bg-amber-500/15 border border-amber-500/20' :
                      'text-red-300 bg-red-500/15 border border-red-500/20'
                    }`}>
                      Confiança {dados.confianca}
                    </span>
                  </div>

                  {/* Resumo */}
                  <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.06)' }}>
                    <p className="text-[12px] text-slate-300 leading-relaxed">{dados.resumo}</p>
                  </div>

                  {/* Dados principais */}
                  {Object.keys(dados.dadosPrincipais || {}).length > 0 && (
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-2">Dados extraídos</div>
                      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,.08)' }}>
                        {Object.entries(dados.dadosPrincipais).map(([key, val], i) => (
                          <div key={key} className="flex gap-3 px-3 py-2.5 border-b border-white/5 last:border-0"
                            style={{ background: i % 2 === 0 ? 'rgba(255,255,255,.02)' : 'transparent' }}>
                            <span className="text-[11px] text-slate-500 w-28 flex-shrink-0 mt-0.5 capitalize">
                              {key.replace(/_/g, ' ')}
                            </span>
                            <span className="text-[12px] text-slate-200 font-medium break-all">
                              {formatarValor(val)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Alertas */}
                  {dados.alertas?.length > 0 && (
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-2">Alertas</div>
                      <div className="space-y-1.5">
                        {dados.alertas.map((a, i) => (
                          <div key={i} className="flex items-start gap-2 rounded-lg px-3 py-2 bg-amber-500/10 border border-amber-500/20">
                            <span className="text-amber-400 mt-0.5 flex-shrink-0">⚠️</span>
                            <p className="text-[11px] text-amber-200">{a}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Ações sugeridas */}
                  {dados.acoesSugeridas?.length > 0 && (
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-2">Ações sugeridas</div>
                      <div className="space-y-1.5">
                        {dados.acoesSugeridas.map((a, i) => (
                          <div key={i} className="flex items-start gap-2 rounded-lg px-3 py-2"
                            style={{ background: 'rgba(124,58,237,.08)', border: '1px solid rgba(124,58,237,.15)' }}>
                            <span className="text-violet-400 mt-0.5 flex-shrink-0">→</span>
                            <p className="text-[11px] text-slate-300">{a}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => { setEstado('idle'); setResultado(null) }}
                    className="w-full py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:text-white transition-colors"
                    style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)' }}
                  >
                    Analisar outro documento
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

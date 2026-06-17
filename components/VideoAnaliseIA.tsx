'use client'

import { useState, useRef, useCallback } from 'react'

export type ModoAnalise = 'drone' | 'visita' | 'animal' | 'servico'

interface VideoAnalysisResult {
  modo: ModoAnalise
  frames: number
  analise: string
  geradoEm: string
  modeloUsado: string
}

interface Props {
  modo: ModoAnalise
  titulo?: string
  descricao?: string
  onResultado?: (resultado: VideoAnalysisResult) => void
}

const MODO_CONFIG = {
  drone: { icon: '🚁', label: 'Vídeo de Drone', cor: '#34d399', dica: 'Vídeos aéreos da lavoura — MP4, MOV ou imagens JPG/PNG' },
  visita: { icon: '🌾', label: 'Visita Técnica', cor: '#60a5fa', dica: 'Grave um vídeo caminhando no campo ou envie fotos da visita' },
  animal: { icon: '🐄', label: 'Análise Animal', cor: '#f59e0b', dica: 'Vídeo ou fotos do animal para avaliação de condição corporal' },
  servico: { icon: '✅', label: 'Comprovante de Serviço', cor: '#a78bfa', dica: 'Fotos ou vídeo do campo após execução do serviço' },
}

function extrairFramesDoVideo(file: File, maxFrames = 8): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    const frames: string[] = []
    const url = URL.createObjectURL(file)

    // Precisa estar no DOM para funcionar em todos os browsers
    video.style.cssText = 'position:fixed;opacity:0;pointer-events:none;width:1px;height:1px'
    document.body.appendChild(video)

    const cleanup = () => {
      URL.revokeObjectURL(url)
      if (document.body.contains(video)) document.body.removeChild(video)
    }

    video.src = url
    video.muted = true
    video.playsInline = true
    video.preload = 'auto'

    const onReady = () => {
      const duration = video.duration
      if (!duration || !isFinite(duration)) {
        cleanup()
        reject(new Error('Não foi possível determinar a duração do vídeo. Tente um formato MP4.'))
        return
      }

      canvas.width = 640
      canvas.height = video.videoHeight > 0
        ? Math.round(640 * (video.videoHeight / video.videoWidth))
        : 360

      const intervalos = Array.from({ length: maxFrames }, (_, i) =>
        Math.min((duration / (maxFrames + 1)) * (i + 1), duration - 0.1)
      )

      let idx = 0

      const capturarProximo = () => {
        if (idx >= intervalos.length) {
          cleanup()
          resolve(frames)
          return
        }
        video.currentTime = intervalos[idx]
      }

      video.addEventListener('seeked', () => {
        try {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
          const base64 = canvas.toDataURL('image/jpeg', 0.75).split(',')[1]
          if (base64) frames.push(base64)
        } catch {
          // frame com erro — pula e continua
        }
        idx++
        capturarProximo()
      })

      capturarProximo()
    }

    video.addEventListener('loadeddata', onReady)
    video.addEventListener('canplay', onReady, { once: true })

    video.addEventListener('error', (e) => {
      const codigo = (e.target as HTMLVideoElement).error?.code
      const msgs: Record<number, string> = {
        1: 'Carregamento abortado.',
        2: 'Erro de rede ao carregar o vídeo.',
        3: 'Formato de vídeo não suportado pelo browser. Tente converter para MP4 H.264.',
        4: 'Formato não suportado. Use MP4 (H.264) ou envie uma imagem JPG/PNG.',
      }
      cleanup()
      reject(new Error(msgs[codigo ?? 4] ?? 'Erro ao carregar o vídeo. Use MP4 ou envie uma imagem.'))
    })

    video.load()
  })
}

function imagemParaBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => {
      const base64 = (e.target?.result as string).split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function VideoAnaliseIA({ modo, titulo, descricao, onResultado }: Props) {
  const config = MODO_CONFIG[modo]
  const [estado, setEstado] = useState<'idle' | 'processando' | 'analisando' | 'concluido' | 'erro'>('idle')
  const [resultado, setResultado] = useState<VideoAnalysisResult | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [progresso, setProgresso] = useState('')
  const [preview, setPreview] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const processar = useCallback(async (files: FileList) => {
    const file = files[0]
    if (!file) return

    setEstado('processando')
    setErro(null)
    setResultado(null)

    try {
      let frames: string[] = []
      const isVideo = file.type.startsWith('video/')
      const isImage = file.type.startsWith('image/')

      if (!isVideo && !isImage) {
        throw new Error('Formato não suportado. Use vídeo (MP4, MOV) ou imagem (JPG, PNG).')
      }

      // Preview
      const previewUrl = URL.createObjectURL(file)
      setPreview(previewUrl)

      if (isVideo) {
        setProgresso('Extraindo frames do vídeo...')
        frames = await extrairFramesDoVideo(file, 8)
        setProgresso(`${frames.length} frames extraídos. Enviando para análise IA...`)
      } else {
        setProgresso('Processando imagem...')
        const b64 = await imagemParaBase64(file)
        frames = [b64]
        setProgresso('Imagem processada. Enviando para análise IA...')
      }

      setEstado('analisando')
      setProgresso('IA analisando... isso pode levar até 30 segundos')

      const res = await fetch('/api/ai/analisar-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ frames, modo }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Erro na análise')
      }

      const data: VideoAnalysisResult = await res.json()
      setResultado(data)
      setEstado('concluido')
      onResultado?.(data)
    } catch (e: any) {
      setErro(e.message ?? 'Erro desconhecido')
      setEstado('erro')
    }
  }, [modo, onResultado])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer.files.length) processar(e.dataTransfer.files)
  }, [processar])

  const resetar = () => {
    setEstado('idle')
    setResultado(null)
    setErro(null)
    setProgresso('')
    setPreview(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  const formatarAnalise = (texto: string) => {
    return texto.split('\n').map((linha, i) => {
      if (linha.startsWith('**') && linha.endsWith('**')) {
        return <p key={i} className="font-bold text-white mt-4 mb-1">{linha.replace(/\*\*/g, '')}</p>
      }
      if (/^\d+\.\s\*\*/.test(linha)) {
        const clean = linha.replace(/\*\*/g, '')
        return <p key={i} className="font-semibold text-white mt-3 mb-1">{clean}</p>
      }
      if (linha.trim() === '') return <br key={i} />
      return <p key={i} className="text-slate-300 text-sm leading-relaxed">{linha.replace(/\*\*/g, '')}</p>
    })
  }

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,.03)', border: `1px solid ${config.cor}22` }}>
      {/* Header */}
      <div className="px-5 py-4 flex items-center gap-3" style={{ borderBottom: `1px solid ${config.cor}15` }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl" style={{ background: `${config.cor}18`, border: `1px solid ${config.cor}30` }}>
          {config.icon}
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">{titulo ?? config.label}</h3>
          <p className="text-xs text-slate-500">{descricao ?? config.dica}</p>
        </div>
        <div className="ml-auto">
          <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: `${config.cor}15`, color: config.cor, border: `1px solid ${config.cor}25` }}>
            IA Vision
          </span>
        </div>
      </div>

      <div className="p-5">
        {estado === 'idle' && (
          <div
            className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all hover:border-opacity-60"
            style={{ borderColor: `${config.cor}30` }}
            onDragOver={e => e.preventDefault()}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
          >
            <input
              ref={inputRef}
              type="file"
              accept="video/mp4,video/mov,video/quicktime,image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={e => e.target.files && processar(e.target.files)}
            />
            <div className="text-4xl mb-3">📤</div>
            <p className="text-white font-medium mb-1">Arraste ou clique para enviar</p>
            <p className="text-xs text-slate-500">Vídeo (MP4, MOV) ou imagem (JPG, PNG) · máx. 100MB</p>
          </div>
        )}

        {(estado === 'processando' || estado === 'analisando') && (
          <div className="text-center py-10">
            <div className="w-12 h-12 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-4" style={{ borderColor: config.cor, borderTopColor: 'transparent' }} />
            <p className="text-white font-medium mb-1">{estado === 'processando' ? 'Processando arquivo...' : 'Analisando com IA...'}</p>
            <p className="text-xs text-slate-500">{progresso}</p>
          </div>
        )}

        {estado === 'erro' && (
          <div className="text-center py-8">
            <div className="text-3xl mb-3">⚠️</div>
            <p className="text-red-400 font-medium mb-1">Erro na análise</p>
            <p className="text-xs text-slate-500 mb-4">{erro}</p>
            <button onClick={resetar} className="text-sm px-4 py-2 rounded-lg font-medium transition-colors" style={{ background: `${config.cor}18`, color: config.cor, border: `1px solid ${config.cor}30` }}>
              Tentar novamente
            </button>
          </div>
        )}

        {estado === 'concluido' && resultado && (
          <div>
            {/* Metadados */}
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <span className="text-xs px-2 py-1 rounded-full" style={{ background: `${config.cor}15`, color: config.cor }}>
                {resultado.frames} frame{resultado.frames > 1 ? 's' : ''} analisado{resultado.frames > 1 ? 's' : ''}
              </span>
              <span className="text-xs text-slate-600">
                {new Date(resultado.geradoEm).toLocaleString('pt-BR')}
              </span>
              <span className="text-xs text-slate-700 font-mono truncate max-w-[200px]">
                {resultado.modeloUsado}
              </span>
            </div>

            {/* Resultado */}
            <div className="rounded-xl p-4 mb-4" style={{ background: 'rgba(0,0,0,.3)', border: '1px solid rgba(255,255,255,.06)' }}>
              <div className="prose prose-invert max-w-none">
                {formatarAnalise(resultado.analise)}
              </div>
            </div>

            {/* Ações */}
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => {
                  const blob = new Blob([resultado.analise], { type: 'text/plain' })
                  const a = document.createElement('a')
                  a.href = URL.createObjectURL(blob)
                  a.download = `analise-${modo}-${new Date().toISOString().split('T')[0]}.txt`
                  a.click()
                }}
                className="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors"
                style={{ background: `${config.cor}18`, color: config.cor, border: `1px solid ${config.cor}30` }}
              >
                Baixar relatório
              </button>
              <button
                onClick={() => navigator.clipboard.writeText(resultado.analise)}
                className="text-xs px-3 py-1.5 rounded-lg font-medium text-slate-400 hover:text-white transition-colors"
                style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)' }}
              >
                Copiar texto
              </button>
              <button
                onClick={resetar}
                className="text-xs px-3 py-1.5 rounded-lg font-medium text-slate-500 hover:text-white transition-colors"
                style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)' }}
              >
                Nova análise
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

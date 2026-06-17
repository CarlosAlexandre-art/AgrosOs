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
  drone:   { icon: '🚁', label: 'Vídeo de Drone',        cor: '#34d399', dica: 'Vídeos aéreos da lavoura — MP4 H.264' },
  visita:  { icon: '🌾', label: 'Visita Técnica',         cor: '#60a5fa', dica: 'Grave um vídeo caminhando no campo' },
  animal:  { icon: '🐄', label: 'Análise Animal',         cor: '#f59e0b', dica: 'Vídeo do animal para avaliação de condição corporal' },
  servico: { icon: '✅', label: 'Comprovante de Serviço', cor: '#a78bfa', dica: 'Vídeo do campo após execução do serviço' },
}

// Extrai frames via canvas (rápido, funciona com H.264)
function extrairFramesCanvas(file: File, maxFrames = 5, onProgresso?: (msg: string) => void): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.muted = true
    video.playsInline = true
    video.style.cssText = 'position:fixed;opacity:0;pointer-events:none;width:1px;height:1px'
    document.body.appendChild(video)

    const url = URL.createObjectURL(file)
    video.src = url

    const cleanup = () => {
      URL.revokeObjectURL(url)
      if (document.body.contains(video)) document.body.removeChild(video)
    }

    video.onerror = () => {
      cleanup()
      reject(new Error('CODEC_NOT_SUPPORTED'))
    }

    video.onloadedmetadata = async () => {
      const duration = video.duration
      if (!isFinite(duration) || duration <= 0) {
        cleanup()
        reject(new Error('Não foi possível determinar a duração do vídeo.'))
        return
      }

      const canvas = document.createElement('canvas')
      canvas.width = 640
      canvas.height = 360
      const ctx = canvas.getContext('2d')!
      const frames: string[] = []
      const posicoes = Array.from({ length: maxFrames }, (_, i) =>
        Math.min((duration * (i + 1)) / (maxFrames + 1), duration - 0.1)
      )

      for (let i = 0; i < posicoes.length; i++) {
        onProgresso?.(`Extraindo frame ${i + 1} de ${maxFrames}...`)
        await new Promise<void>((res) => {
          const t = setTimeout(res, 5000)
          video.onseeked = () => {
            clearTimeout(t)
            try {
              ctx.drawImage(video, 0, 0, 640, 360)
              const b64 = canvas.toDataURL('image/jpeg', 0.75).split(',')[1]
              if (b64 && b64.length > 500) frames.push(b64)
            } catch { /* frame em branco */ }
            res()
          }
          video.currentTime = posicoes[i]
        })
      }

      cleanup()
      if (frames.length === 0) reject(new Error('Nenhum frame extraído.'))
      else resolve(frames)
    }

    video.load()
  })
}

// Fallback via ffmpeg WASM — suporta HEVC/H.265 e outros codecs
async function extrairFramesFFmpeg(file: File, onProgresso?: (msg: string) => void): Promise<string[]> {
  onProgresso?.('Carregando suporte a HEVC (pode levar ~15s na primeira vez)...')
  const { FFmpeg } = await import('@ffmpeg/ffmpeg')
  const { fetchFile } = await import('@ffmpeg/util')

  const ffmpeg = new FFmpeg()
  await ffmpeg.load({
    coreURL: '/ffmpeg/ffmpeg-core.js',
    wasmURL: '/ffmpeg/ffmpeg-core.wasm',
  })

  onProgresso?.('Lendo arquivo de vídeo...')
  await ffmpeg.writeFile('input', await fetchFile(file))

  const frames: string[] = []
  const posicoes = [1, 3, 6, 10, 15]

  for (let i = 0; i < posicoes.length; i++) {
    const nome = `f${i}.jpg`
    onProgresso?.(`Extraindo frame ${i + 1} de ${posicoes.length}...`)
    try {
      await ffmpeg.exec(['-ss', String(posicoes[i]), '-i', 'input', '-frames:v', '1', '-vf', 'scale=640:-2', '-q:v', '4', nome])
      const data = await ffmpeg.readFile(nome) as Uint8Array
      let binary = ''
      for (let j = 0; j < data.length; j += 8192) binary += String.fromCharCode(...data.subarray(j, j + 8192))
      const b64 = btoa(binary)
      if (b64.length > 500) frames.push(b64)
      await ffmpeg.deleteFile(nome).catch(() => {})
    } catch { break }
  }

  await ffmpeg.deleteFile('input').catch(() => {})
  return frames
}

// Tenta canvas primeiro (rápido), cai no ffmpeg WASM se codec não suportado
async function extrairFrames(file: File, maxFrames = 5, onProgresso?: (msg: string) => void): Promise<string[]> {
  try {
    return await extrairFramesCanvas(file, maxFrames, onProgresso)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : ''
    if (msg !== 'CODEC_NOT_SUPPORTED') throw e
    onProgresso?.('Codec HEVC detectado — usando motor alternativo...')
    return extrairFramesFFmpeg(file, onProgresso)
  }
}

function imagemParaBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => resolve((e.target?.result as string).split(',')[1])
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
  const inputRef = useRef<HTMLInputElement>(null)

  const processar = useCallback(async (files: FileList) => {
    const file = files[0]
    if (!file) return

    setEstado('processando')
    setErro(null)
    setResultado(null)

    try {
      const isVideo = file.type.startsWith('video/') || /\.(mp4|mov|avi|mkv|webm|m4v|3gp)$/i.test(file.name)
      const isImage = file.type.startsWith('image/')

      if (!isVideo && !isImage) {
        throw new Error('Formato não suportado. Envie um vídeo (MP4 H.264, MOV, WebM) ou imagem (JPG, PNG).')
      }

      let frames: string[]

      if (isVideo) {
        setProgresso('Carregando vídeo...')
        frames = await extrairFrames(file, 5, (msg) => setProgresso(msg))
      } else {
        setProgresso('Processando imagem...')
        const b64 = await imagemParaBase64(file)
        frames = [b64]
      }

      setEstado('analisando')
      setProgresso(`${frames.length} frame${frames.length > 1 ? 's' : ''} extraído${frames.length > 1 ? 's' : ''} — IA analisando...`)

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
    } catch (e: unknown) {
      console.error('[AgroVision]', e)
      const msg = e instanceof Error ? e.message : 'Erro desconhecido'
      setErro(msg)
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
    if (inputRef.current) inputRef.current.value = ''
  }

  const formatarAnalise = (texto: string) => {
    return texto.split('\n').map((linha, i) => {
      if (/^\d+\.\s\*\*/.test(linha) || (linha.startsWith('**') && linha.endsWith('**'))) {
        return <p key={i} className="font-bold text-white mt-4 mb-1">{linha.replace(/\*\*/g, '')}</p>
      }
      if (linha.trim() === '') return <br key={i} />
      return <p key={i} className="text-slate-300 text-sm leading-relaxed">{linha.replace(/\*\*/g, '')}</p>
    })
  }

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,.03)', border: `1px solid ${config.cor}22` }}>
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
            className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all"
            style={{ borderColor: `${config.cor}30` }}
            onDragOver={e => e.preventDefault()}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
          >
            <input
              ref={inputRef}
              type="file"
              accept="video/mp4,video/quicktime,video/webm,video/avi,image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={e => e.target.files && processar(e.target.files)}
            />
            <div className="text-4xl mb-3">🎬</div>
            <p className="text-white font-medium mb-1">Arraste ou clique para enviar</p>
            <p className="text-xs text-slate-500">Vídeo MP4 (H.264), MOV, WebM ou imagem JPG/PNG</p>
            <p className="text-xs text-slate-600 mt-1">Processamento local — sem upload pesado</p>
          </div>
        )}

        {(estado === 'processando' || estado === 'analisando') && (
          <div className="text-center py-10">
            <div className="w-12 h-12 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-4" style={{ borderColor: config.cor, borderTopColor: 'transparent' }} />
            <p className="text-white font-medium mb-2">
              {estado === 'processando' ? 'Processando vídeo...' : 'IA analisando...'}
            </p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">{progresso}</p>
          </div>
        )}

        {estado === 'erro' && (
          <div className="text-center py-8">
            <div className="text-3xl mb-3">⚠️</div>
            <p className="text-red-400 font-medium mb-2">Erro na análise</p>
            <p className="text-xs text-slate-400 mb-4 max-w-sm mx-auto leading-relaxed">{erro}</p>
            <button onClick={resetar} className="text-sm px-4 py-2 rounded-lg font-medium transition-colors" style={{ background: `${config.cor}18`, color: config.cor, border: `1px solid ${config.cor}30` }}>
              Tentar novamente
            </button>
          </div>
        )}

        {estado === 'concluido' && resultado && (
          <div>
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <span className="text-xs px-2 py-1 rounded-full" style={{ background: `${config.cor}15`, color: config.cor }}>
                {resultado.frames} frame{resultado.frames > 1 ? 's' : ''} analisado{resultado.frames > 1 ? 's' : ''}
              </span>
              <span className="text-xs text-slate-600">{new Date(resultado.geradoEm).toLocaleString('pt-BR')}</span>
            </div>

            <div className="rounded-xl p-4 mb-4" style={{ background: 'rgba(0,0,0,.3)', border: '1px solid rgba(255,255,255,.06)' }}>
              {formatarAnalise(resultado.analise)}
            </div>

            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => {
                  const blob = new Blob([resultado.analise], { type: 'text/plain' })
                  const a = document.createElement('a')
                  a.href = URL.createObjectURL(blob)
                  a.download = `analise-${modo}-${new Date().toISOString().split('T')[0]}.txt`
                  a.click()
                }}
                className="text-xs px-3 py-1.5 rounded-lg font-medium"
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
              <button onClick={resetar} className="text-xs px-3 py-1.5 rounded-lg font-medium text-slate-500 hover:text-white transition-colors" style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)' }}>
                Nova análise
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

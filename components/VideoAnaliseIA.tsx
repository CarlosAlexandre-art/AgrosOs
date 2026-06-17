'use client'

import { useState, useRef, useCallback } from 'react'
import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'

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
  drone:   { icon: '🚁', label: 'Vídeo de Drone',        cor: '#34d399', dica: 'Vídeos aéreos da lavoura — MP4, MOV, qualquer formato' },
  visita:  { icon: '🌾', label: 'Visita Técnica',         cor: '#60a5fa', dica: 'Grave um vídeo caminhando no campo' },
  animal:  { icon: '🐄', label: 'Análise Animal',         cor: '#f59e0b', dica: 'Vídeo do animal para avaliação de condição corporal' },
  servico: { icon: '✅', label: 'Comprovante de Serviço', cor: '#a78bfa', dica: 'Vídeo do campo após execução do serviço' },
}

let ffmpegInstance: FFmpeg | null = null
let ffmpegLoaded = false

async function getFFmpeg(onLog?: (msg: string) => void): Promise<FFmpeg> {
  if (ffmpegInstance && ffmpegLoaded) return ffmpegInstance

  const ffmpeg = new FFmpeg()

  if (onLog) {
    ffmpeg.on('log', ({ message }) => {
      if (message.includes('time=') || message.includes('frame=')) {
        onLog('Processando vídeo...')
      }
    })
  }

  // Carrega os arquivos WASM do CDN jsDelivr (evita problemas de CORS)
  const baseURL = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.9/dist/umd'
  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
  })

  ffmpegInstance = ffmpeg
  ffmpegLoaded = true
  return ffmpeg
}

async function extrairFramesDoVideo(
  file: File,
  maxFrames = 6,
  onProgresso?: (msg: string) => void
): Promise<string[]> {
  onProgresso?.('Carregando motor de vídeo (primeira vez pode levar ~20s)...')
  const ffmpeg = await getFFmpeg(onProgresso)

  onProgresso?.('Lendo arquivo de vídeo...')
  await ffmpeg.writeFile('input', await fetchFile(file))

  // Extrai 1 frame a cada N segundos usando ffmpeg
  onProgresso?.('Extraindo frames...')
  await ffmpeg.exec([
    '-i', 'input',
    '-vf', `fps=1/${Math.ceil(30 / maxFrames)},scale=640:-1`,
    '-frames:v', String(maxFrames),
    '-q:v', '3',
    'frame%02d.jpg',
  ])

  const frames: string[] = []
  for (let i = 1; i <= maxFrames; i++) {
    const num = String(i).padStart(2, '0')
    try {
      const data = await ffmpeg.readFile(`frame${num}.jpg`) as Uint8Array
      const b64 = btoa(String.fromCharCode(...data))
      if (b64.length > 100) frames.push(b64)
      await ffmpeg.deleteFile(`frame${num}.jpg`)
    } catch {
      break
    }
  }

  await ffmpeg.deleteFile('input').catch(() => {})

  if (frames.length === 0) throw new Error('Nenhum frame extraído do vídeo. Tente um arquivo diferente.')
  return frames
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
      let frames: string[] = []
      const isVideo = file.type.startsWith('video/') || /\.(mp4|mov|avi|mkv|webm|m4v|3gp)$/i.test(file.name)

      if (isVideo) {
        frames = await extrairFramesDoVideo(file, 6, setProgresso)
        setProgresso(`${frames.length} frames extraídos. Enviando para análise IA...`)
      } else if (file.type.startsWith('image/')) {
        setProgresso('Processando imagem...')
        frames = [await imagemParaBase64(file)]
        setProgresso('Enviando para análise IA...')
      } else {
        throw new Error('Formato não suportado. Envie um vídeo (MP4, MOV, AVI) ou imagem (JPG, PNG).')
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
      console.error('[AgroVision]', e)
      const msg = e?.message || e?.toString() || JSON.stringify(e) || 'Erro desconhecido'
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
            className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all"
            style={{ borderColor: `${config.cor}30` }}
            onDragOver={e => e.preventDefault()}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
          >
            <input
              ref={inputRef}
              type="file"
              accept="video/mp4,video/quicktime,video/avi,video/x-matroska,video/webm,video/x-m4v,image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={e => e.target.files && processar(e.target.files)}
            />
            <div className="text-4xl mb-3">🎬</div>
            <p className="text-white font-medium mb-1">Arraste ou clique para enviar</p>
            <p className="text-xs text-slate-500">Vídeo (MP4, MOV, AVI, MKV) ou imagem (JPG, PNG)</p>
            <p className="text-xs text-slate-600 mt-1">Primeira análise de vídeo carrega o motor (~20s) · após isso é rápido</p>
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

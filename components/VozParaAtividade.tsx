'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'

type Estado = 'idle' | 'gravando' | 'processando' | 'confirmando' | 'erro'

type AtividadeExtraida = {
  type: string
  description: string
  status: string
  startDate: string
  endDate: string | null
  fieldId: string | null
  assignedToId: string | null
  propertyId: string
  confianca: string
}

const TIPO_LABELS: Record<string, string> = {
  PLANTIO: '🌱 Plantio', COLHEITA: '🌾 Colheita', PULVERIZACAO: '💨 Pulverização',
  ADUBACAO: '🌿 Adubação', IRRIGACAO: '💧 Irrigação', MANUTENCAO: '🔧 Manutenção',
  MONITORAMENTO: '👁️ Monitoramento', VACINACAO: '💉 Vacinação', VERMIFUGACAO: '🐛 Vermifugação',
  PESAGEM: '⚖️ Pesagem', MANEJO: '🐄 Manejo', TRANSPORTE: '🚛 Transporte', OUTROS: '📋 Outros',
}

export default function VozParaAtividade() {
  const [estado, setEstado] = useState<Estado>('idle')
  const [transcricao, setTranscricao] = useState('')
  const [atividade, setAtividade] = useState<AtividadeExtraida | null>(null)
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const router = useRouter()

  const iniciarGravacao = useCallback(async () => {
    setErro('')
    setTranscricao('')
    setAtividade(null)

    // 1) Verifica disponibilidade da API
    if (!navigator.mediaDevices?.getUserMedia) {
      setErro(
        window.isSecureContext === false
          ? 'Microfone requer HTTPS. Acesse o site pelo endereço seguro (https://).'
          : 'Microfone não suportado neste navegador. Use Chrome, Firefox ou Safari.'
      )
      setEstado('erro')
      return
    }

    // 2) Tenta obter microfone — deixa o browser decidir mostrar ou não o diálogo
    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch (e: any) {
      const nome = e?.name ?? ''
      if (nome === 'NotFoundError' || nome === 'DevicesNotFoundError') {
        setErro('Nenhum microfone encontrado neste dispositivo.')
      } else if (nome === 'NotReadableError' || nome === 'TrackStartError') {
        setErro('Microfone em uso por outro aplicativo. Feche-o e tente novamente.')
      } else if (nome === 'NotAllowedError' || nome === 'PermissionDeniedError') {
        // Consulta o estado real para dar a mensagem certa
        let bloqueadoPermanente = false
        try {
          const perm = await navigator.permissions.query({ name: 'microphone' as PermissionName })
          bloqueadoPermanente = perm.state === 'denied'
        } catch { /* sem suporte à API de permissões */ }

        setErro(
          bloqueadoPermanente
            ? 'Microfone bloqueado. Para desbloquear: clique no 🔒 na barra de endereço → "Microfone" → "Permitir" → recarregue a página.'
            : 'Permissão negada. Clique em "Permitir" quando o navegador pedir acesso ao microfone.'
        )
      } else {
        setErro('Não foi possível acessar o microfone. Verifique as permissões do navegador.')
      }
      setEstado('erro')
      return
    }

    // 2) Detecta codec suportado (iOS/Safari não suporta audio/webm)
    const TIPOS = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg', '']
    const mimeType = TIPOS.find(t => !t || MediaRecorder.isTypeSupported(t)) ?? ''
    const ext = mimeType.includes('mp4') ? 'mp4' : mimeType.includes('ogg') ? 'ogg' : 'webm'

    // 3) Inicia gravação — erros aqui são de codec/dispositivo
    try {
      const mrOpts = mimeType ? { mimeType } : {}
      const mr = new MediaRecorder(stream, mrOpts)
      chunksRef.current = []
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        const blob = new Blob(chunksRef.current, { type: mimeType || 'audio/webm' })
        await processarAudio(blob, ext)
      }
      mediaRecorderRef.current = mr
      mr.start()
      setEstado('gravando')
    } catch {
      stream.getTracks().forEach(t => t.stop())
      setErro('Gravação de áudio não suportada neste navegador/dispositivo.')
      setEstado('erro')
    }
  }, [])

  const pararGravacao = useCallback(() => {
    mediaRecorderRef.current?.stop()
    setEstado('processando')
  }, [])

  async function processarAudio(blob: Blob, ext = 'webm') {
    try {
      const form = new FormData()
      form.append('audio', blob, `audio.${ext}`)
      const res = await fetch('/api/ai/voz-para-atividade', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro no servidor')
      if (data.erro || !data.atividade) {
        setTranscricao(data.transcricao || '')
        setErro(data.erro || 'Não foi possível extrair dados da fala')
        setEstado('erro')
        return
      }
      setTranscricao(data.transcricao)
      setAtividade(data.atividade)
      setEstado('confirmando')
    } catch (e: any) {
      setErro(e.message || 'Erro ao processar áudio')
      setEstado('erro')
    }
  }

  async function confirmarAtividade() {
    if (!atividade) return
    setSalvando(true)
    try {
      const res = await fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: atividade.type,
          description: atividade.description,
          status: atividade.status,
          startDate: atividade.startDate,
          endDate: atividade.endDate,
          fieldId: atividade.fieldId,
          assignedToId: atividade.assignedToId,
          propertyId: atividade.propertyId,
        }),
      })
      if (!res.ok) throw new Error('Erro ao salvar atividade')
      setEstado('idle')
      setAtividade(null)
      setTranscricao('')
      router.refresh()
    } catch (e: any) {
      setErro(e.message || 'Erro ao salvar')
      setEstado('erro')
    } finally {
      setSalvando(false)
    }
  }

  function cancelar() {
    setEstado('idle')
    setAtividade(null)
    setTranscricao('')
    setErro('')
  }

  return (
    <>
      {/* Botão microfone flutuante — posicionado acima do AgroGPT */}
      <button
        onClick={estado === 'gravando' ? pararGravacao : estado === 'idle' ? iniciarGravacao : undefined}
        disabled={estado === 'processando'}
        className="flex fixed bottom-24 right-6 z-[1100] w-12 h-12 rounded-2xl items-center justify-center transition-all hover:scale-105 active:scale-95 disabled:opacity-60"
        style={{
          background: estado === 'gravando'
            ? 'linear-gradient(135deg,#dc2626,#b91c1c)'
            : 'linear-gradient(135deg,#0369a1,#0284c7)',
          boxShadow: estado === 'gravando'
            ? '0 0 20px rgba(220,38,38,.5)'
            : '0 0 16px rgba(3,105,161,.4)',
          bottom: '6.5rem',
        }}
        title={estado === 'gravando' ? 'Parar gravação' : 'Registrar atividade por voz'}
      >
        {estado === 'processando' ? (
          <svg className="w-5 h-5 text-white animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : estado === 'gravando' ? (
          <span className="w-4 h-4 bg-white rounded-sm" />
        ) : (
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        )}
        {/* Pulse enquanto grava */}
        {estado === 'gravando' && (
          <span className="absolute inset-0 rounded-2xl bg-red-500 animate-ping opacity-30" />
        )}
      </button>

      {/* Modal de confirmação / erro */}
      {(estado === 'confirmando' || estado === 'erro') && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4 bg-black/60">
          <div
            className="w-full max-w-md rounded-2xl overflow-hidden"
            style={{
              background: 'linear-gradient(180deg,#0f172a 0%,#0b1628 100%)',
              border: '1px solid rgba(255,255,255,.1)',
              boxShadow: '0 24px 64px rgba(0,0,0,.6)',
            }}
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-white/8 flex items-center gap-3"
              style={{ background: estado === 'erro' ? 'rgba(220,38,38,.08)' : 'rgba(3,105,161,.08)' }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: estado === 'erro' ? 'rgba(220,38,38,.2)' : 'rgba(3,105,161,.2)' }}>
                {estado === 'erro' ? (
                  <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                )}
              </div>
              <div>
                <div className="text-sm font-bold text-white">
                  {estado === 'erro' ? 'Erro na transcrição' : 'Confirmar atividade por voz'}
                </div>
                <div className="text-[10px] text-slate-500 font-mono">AgroGPT Whisper · LLaMA 3.3 70B</div>
              </div>
            </div>

            <div className="p-5 space-y-4">
              {/* Transcrição */}
              {transcricao && (
                <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.06)' }}>
                  <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1.5">O que você disse</div>
                  <p className="text-sm text-slate-300 italic">"{transcricao}"</p>
                </div>
              )}

              {estado === 'erro' && (
                <div className="rounded-xl p-3 bg-red-500/10 border border-red-500/20">
                  <p className="text-sm text-red-300">{erro}</p>
                </div>
              )}

              {estado === 'confirmando' && atividade && (
                <div className="space-y-2">
                  <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Atividade identificada</div>

                  <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,.08)' }}>
                    {[
                      { label: 'Tipo', value: TIPO_LABELS[atividade.type] || atividade.type },
                      { label: 'Descrição', value: atividade.description },
                      { label: 'Data', value: new Date(atividade.startDate + 'T12:00:00').toLocaleDateString('pt-BR') },
                      { label: 'Status', value: atividade.status },
                      { label: 'Confiança IA', value: atividade.confianca },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex gap-3 px-3 py-2.5 border-b border-white/5 last:border-0"
                        style={{ background: 'rgba(255,255,255,.02)' }}>
                        <span className="text-[11px] text-slate-500 w-20 flex-shrink-0 mt-0.5">{label}</span>
                        <span className="text-[12px] text-slate-200 font-medium">{value || '—'}</span>
                      </div>
                    ))}
                  </div>

                  {atividade.confianca === 'baixa' && (
                    <p className="text-[11px] text-amber-400/80">
                      ⚠️ Confiança baixa — revise os dados antes de confirmar.
                    </p>
                  )}
                </div>
              )}

              {/* Ações */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={cancelar}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:text-white transition-colors"
                  style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)' }}
                >
                  {estado === 'erro' ? 'Fechar' : 'Cancelar'}
                </button>
                {estado === 'confirmando' && (
                  <button
                    onClick={confirmarAtividade}
                    disabled={salvando}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-60 transition-all"
                    style={{ background: 'linear-gradient(135deg,#16a34a,#059669)' }}
                  >
                    {salvando ? 'Salvando...' : 'Criar atividade'}
                  </button>
                )}
                {estado === 'erro' && (
                  <button
                    onClick={() => { setEstado('idle'); iniciarGravacao() }}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all"
                    style={{ background: 'linear-gradient(135deg,#0369a1,#0284c7)' }}
                  >
                    Tentar novamente
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

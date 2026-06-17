'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePlan } from '@/lib/hooks/usePlan'
import ProPaywall from '@/components/ProPaywall'
import VideoAnaliseIA, { ModoAnalise } from '@/components/VideoAnaliseIA'

const ABAS: { modo: ModoAnalise; icon: string; label: string; sub: string }[] = [
  { modo: 'drone',   icon: '🚁', label: 'Drone / Aéreo',     sub: 'Analisa vídeo ou foto aérea da lavoura' },
  { modo: 'visita',  icon: '🌾', label: 'Visita Técnica',    sub: 'Gera relatório automático da visita ao campo' },
  { modo: 'animal',  icon: '🐄', label: 'Saúde Animal',      sub: 'Avalia condição corporal e alertas do rebanho' },
  { modo: 'servico', icon: '✅', label: 'Prova de Serviço',  sub: 'Laudo visual de serviço executado (integração AgroCore)' },
]

const COR_MODO: Record<ModoAnalise, string> = {
  drone:   '#34d399',
  visita:  '#60a5fa',
  animal:  '#f59e0b',
  servico: '#a78bfa',
}

export default function AgroVisionPage() {
  const { loading: planLoading, isPro } = usePlan()
  const [abaAtiva, setAbaAtiva] = useState<ModoAnalise>('drone')

  if (planLoading) return null
  if (!isPro) return <ProPaywall feature="AgroVision IA" />

  const cor = COR_MODO[abaAtiva]

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #020c14 0%, #040d0a 60%, #020c14 100%)' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=DM+Sans:wght@300;400;500;600&display=swap');
        .av-page { font-family: 'DM Sans', sans-serif; }
        .av-mono { font-family: 'Space Mono', monospace; }
        .grid-bg { background-image: linear-gradient(rgba(52,211,153,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(52,211,153,.04) 1px, transparent 1px); background-size: 32px 32px; }
      `}</style>

      <div className="av-page grid-bg min-h-screen">
        <div className="max-w-4xl mx-auto px-6 py-8">

          {/* Header */}
          <div className="mb-8 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl" style={{ background: 'rgba(52,211,153,.15)', border: '1px solid rgba(52,211,153,.3)' }}>
                  👁️
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white av-mono">AgroVision IA</h1>
                  <p className="text-xs text-slate-500 mt-0.5">Análise visual inteligente — drone, campo, animais e serviços</p>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(52,211,153,.12)', color: '#34d399', border: '1px solid rgba(52,211,153,.2)' }}>
                  Groq Vision · Llama 4 Scout
                </span>
                <span className="text-xs text-slate-600">Processa vídeos e imagens com IA multimodal</span>
              </div>
            </div>
            <Link href="/dashboard" className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              Dashboard
            </Link>
          </div>

          {/* Seletor de modo */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            {ABAS.map(aba => (
              <button
                key={aba.modo}
                onClick={() => setAbaAtiva(aba.modo)}
                className="text-left rounded-xl p-4 transition-all"
                style={{
                  background: abaAtiva === aba.modo ? `${COR_MODO[aba.modo]}18` : 'rgba(255,255,255,.03)',
                  border: `1px solid ${abaAtiva === aba.modo ? COR_MODO[aba.modo] + '50' : 'rgba(255,255,255,.08)'}`,
                }}
              >
                <div className="text-2xl mb-2">{aba.icon}</div>
                <div className="text-sm font-semibold text-white mb-1">{aba.label}</div>
                <div className="text-xs text-slate-500 leading-snug">{aba.sub}</div>
              </button>
            ))}
          </div>

          {/* Componente de análise */}
          <VideoAnaliseIA
            key={abaAtiva}
            modo={abaAtiva}
          />

          {/* Info */}
          <div className="mt-6 rounded-xl p-4" style={{ background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.05)' }}>
            <p className="text-xs text-slate-600 leading-relaxed">
              <span style={{ color: cor }}>Como funciona:</span> O vídeo é processado localmente no seu navegador — frames são extraídos e enviados para análise. Imagens são enviadas diretamente. O resultado é gerado pelo modelo Llama 4 Scout Vision via Groq e não é armazenado nos servidores da OryonAG.
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}

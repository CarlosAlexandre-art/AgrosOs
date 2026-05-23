'use client'
import { useState, useEffect } from 'react'

const TOUR_KEY = 'smartagroos_tour_v1'

type Step = {
  title: string
  desc: string
  note?: string
  emoji: string
  spot: { bottom: string; right: string; w: string; h: string } | null
}

const STEPS: Step[] = [
  {
    emoji: '🌱',
    title: 'Bem-vindo ao SmartAgroOS',
    desc: 'Seu sistema operacional da fazenda com Inteligência Artificial integrada. Vamos conhecer as principais funcionalidades em menos de 2 minutos.',
    spot: null,
  },
  {
    emoji: '🗂️',
    title: 'Menu de Navegação',
    desc: 'Navegue entre todos os módulos pelo menu lateral: Visão Geral, Operacional, Financeiro, Clima, Bovinos, Confinamento, AgroToken, Equipe e muito mais.',
    note: 'Toque o ☰ no canto superior esquerdo para abrir o menu.',
    spot: null,
  },
  {
    emoji: '✨',
    title: 'AgroGPT — Assistente IA 24h',
    desc: 'O botão verde brilhante no canto inferior direito abre o AgroGPT. Converse com IA especializada em agricultura: planejamento de safra, análise de dados da fazenda e dúvidas técnicas — disponível 24 horas.',
    spot: { bottom: '1.5rem', right: '1.5rem', w: '3.5rem', h: '3.5rem' },
  },
  {
    emoji: '⚡',
    title: 'Ferramentas IA — Acesso Rápido',
    desc: 'O botão ☰ verde acima do AgroGPT abre 5 ferramentas de IA especializadas para o campo. No desktop ficam sempre visíveis na lateral direita da tela.',
    note: 'Toque este botão para abrir o menu de ferramentas.',
    spot: { bottom: '6rem', right: '1.5rem', w: '3rem', h: '3rem' },
  },
  {
    emoji: '🎙️',
    title: 'Gravar Atividade por Voz',
    desc: 'Segure o microfone e descreva o que você fez na fazenda. A IA transcreve o áudio e cria a atividade automaticamente no sistema — sem precisar digitar nada.',
    note: 'Toque ☰ para abrir o menu e acesse o microfone (1ª ferramenta).',
    spot: { bottom: '6rem', right: '1.5rem', w: '3rem', h: '3rem' },
  },
  {
    emoji: '📷',
    title: 'Analisar Fotos e Documentos',
    desc: 'Fotografe lavoura, animal ou documento. A IA identifica pragas, doenças e extrai dados de notas fiscais e contratos automaticamente.',
    note: 'Toque ☰ para abrir o menu e acesse a câmera (2ª ferramenta).',
    spot: { bottom: '10.5rem', right: '1.5rem', w: '3rem', h: '3rem' },
  },
  {
    emoji: '🐄',
    title: 'Diagnóstico Animal',
    desc: 'Fotografe ou descreva sintomas de um animal. A IA analisa e sugere diagnóstico indicando a urgência do atendimento — bovinos, suínos, aves e outros.',
    note: 'Toque ☰ para abrir o menu e acesse o diagnóstico (3ª ferramenta).',
    spot: { bottom: '14.5rem', right: '1.5rem', w: '3rem', h: '3rem' },
  },
  {
    emoji: '☁️',
    title: 'Monitor Climático IA',
    desc: 'Dados climáticos NASA em tempo real para sua propriedade. A IA interpreta e alerta sobre riscos de geada, seca, excesso de chuva e as melhores janelas de plantio.',
    note: 'Toque ☰ para abrir o menu e acesse o clima (4ª ferramenta).',
    spot: { bottom: '18.5rem', right: '1.5rem', w: '3rem', h: '3rem' },
  },
  {
    emoji: '🌿',
    title: 'Análise de Pastagem',
    desc: 'Fotografe a pastagem e a IA avalia condição, densidade e necessidade de intervenção. Combine com imagens de satélite para monitorar toda a propriedade.',
    note: 'Toque ☰ para abrir o menu e acesse a pastagem (5ª ferramenta).',
    spot: { bottom: '22.5rem', right: '1.5rem', w: '3rem', h: '3rem' },
  },
  {
    emoji: '🎉',
    title: 'Tudo pronto para usar!',
    desc: 'Você conhece as principais ferramentas do SmartAgroOS. Explore os módulos pelo menu lateral e use as ferramentas de IA sempre que precisar. Boa produção!',
    spot: null,
  },
]

export default function TourOnboarding() {
  const [step, setStep] = useState(0)
  const [show, setShow] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem(TOUR_KEY)) setShow(true)
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  if (!show) return null

  const s = STEPS[step]
  const total = STEPS.length
  const isFirst = step === 0
  const isLast = step === total - 1
  const progress = ((step + 1) / total) * 100

  // No mobile: spotlight só para AgroGPT (step 2) e toggle (step 3) — sempre visíveis
  // Para FABs ocultos (steps 4-8), exibe card centralizado com instrução
  const showSpot = s.spot !== null && (!isMobile || step === 2 || step === 3)
  const cardOnLeft = showSpot

  function next() { isLast ? finish() : setStep(i => i + 1) }
  function prev() { setStep(i => i - 1) }
  function finish() {
    localStorage.setItem(TOUR_KEY, '1')
    setShow(false)
  }

  const card = (
    <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
      {/* Barra de progresso */}
      <div className="h-1.5 bg-gray-100">
        <div
          className="h-full bg-green-500 transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="p-5">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-2xl leading-none">{s.emoji}</span>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 tabular-nums font-medium">
              {step + 1} / {total}
            </span>
            <button
              onClick={finish}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              Pular
            </button>
          </div>
        </div>

        <h3 className="font-bold text-gray-900 leading-snug mb-1.5">{s.title}</h3>
        <p className="text-sm text-gray-600 leading-relaxed">{s.desc}</p>

        {s.note && (
          <div className="mt-2.5 flex gap-2 items-start px-3 py-2 bg-green-50 rounded-xl">
            <span className="text-green-600 shrink-0 text-sm">📱</span>
            <p className="text-xs text-green-700 leading-relaxed">{s.note}</p>
          </div>
        )}

        {/* Navegação */}
        <div className="flex gap-2 mt-4">
          {!isFirst && (
            <button
              onClick={prev}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              ← Voltar
            </button>
          )}
          <button
            onClick={next}
            className="flex-1 py-2.5 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 active:scale-95 transition-all"
          >
            {isLast ? '🚀 Começar a usar!' : 'Próximo →'}
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Bloqueia cliques no conteúdo abaixo */}
      <div className="fixed inset-0 z-[3000]" />

      {/* Spotlight ou overlay escuro */}
      {showSpot ? (
        <div
          className="fixed pointer-events-none z-[3001] rounded-2xl"
          style={{
            bottom: s.spot!.bottom,
            right: s.spot!.right,
            width: s.spot!.w,
            height: s.spot!.h,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.76)',
            border: '2.5px solid #16a34a',
            outline: '6px solid rgba(34,197,94,0.18)',
            outlineOffset: '3px',
          }}
        />
      ) : (
        <div
          className="fixed inset-0 pointer-events-none z-[3001]"
          style={{ background: 'rgba(0,0,0,0.76)' }}
        />
      )}

      {/* Card do tour */}
      {cardOnLeft ? (
        <div className="fixed top-4 left-4 z-[3002] w-[calc(100vw-6rem)] max-w-xs">
          {card}
        </div>
      ) : (
        <div className="fixed inset-0 z-[3002] flex items-center justify-center px-5 pointer-events-none">
          <div className="w-full max-w-sm pointer-events-auto">
            {card}
          </div>
        </div>
      )}
    </>
  )
}

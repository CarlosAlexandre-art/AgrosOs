'use client'

import { useState, useRef, useEffect } from 'react'

type Msg = { role: 'user' | 'assistant'; content: string }

const SUGESTOES = [
  'Como está minha fazenda hoje?',
  'Quais atividades estão atrasadas?',
  'Como está meu resultado financeiro este mês?',
  'O que devo priorizar esta semana?',
  'Analise meus custos por categoria.',
  'Quais metas estou próximo de atingir?',
]

export default function AIAssistant() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const pendingPrompt = useRef<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: 'Olá! Sou o **AgroGPT**, seu copiloto agrícola inteligente. Tenho acesso aos dados reais da sua fazenda — operacional, financeiro, metas e alertas. Como posso ajudar?',
      }])
    }
    if (open) setTimeout(() => inputRef.current?.focus(), 100)
    if (open && pendingPrompt.current) {
      const p = pendingPrompt.current
      pendingPrompt.current = null
      setTimeout(() => send(p), 400)
    }
  }, [open])

  useEffect(() => {
    function handlePrefill(e: Event) {
      const prompt = (e as CustomEvent<{ prompt: string }>).detail?.prompt
      if (!prompt) return
      pendingPrompt.current = prompt
      setMessages([])
      setOpen(true)
    }
    window.addEventListener('ai-prefill', handlePrefill)
    return () => window.removeEventListener('ai-prefill', handlePrefill)
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Renderiza markdown básico (negrito, itálico, listas)
  function renderContent(text: string) {
    const lines = text.split('\n')
    return lines.map((line, i) => {
      const parts = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/`(.+?)`/g, '<code class="bg-white/10 px-1 rounded text-green-300 text-xs">$1</code>')
      const isBullet = line.match(/^[\-\•]\s/)
      return (
        <span key={i} className={isBullet ? 'block pl-2' : 'block'}>
          {isBullet && <span className="text-green-400 mr-1">•</span>}
          <span dangerouslySetInnerHTML={{ __html: isBullet ? parts.replace(/^[\-\•]\s/, '') : parts }} />
        </span>
      )
    })
  }

  async function send(text?: string) {
    const userMsg = (text ?? input).trim()
    if (!userMsg || loading) return
    setInput('')

    const newMessages: Msg[] = [...messages, { role: 'user', content: userMsg }]
    setMessages(newMessages)
    setLoading(true)

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    // Placeholder da resposta que vai crescer com o stream
    setMessages(prev => [...prev, { role: 'assistant', content: '' }])

    try {
      const res = await fetch('/api/ai/agrogpt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages.map(m => ({ role: m.role, content: m.content })) }),
        signal: controller.signal,
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
        throw new Error(err.error || `HTTP ${res.status}`)
      }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (!line.startsWith('data: ') || line === 'data: [DONE]') continue
          try {
            const json = JSON.parse(line.slice(6))
            const delta = json.choices?.[0]?.delta?.content ?? ''
            accumulated += delta
            setMessages(prev => {
              const updated = [...prev]
              updated[updated.length - 1] = { role: 'assistant', content: accumulated }
              return updated
            })
          } catch { /* chunk parcial, ignorar */ }
        }
      }

      if (!accumulated) {
        setMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = { role: 'assistant', content: 'A IA não retornou resposta. Tente novamente.' }
          return updated
        })
      }
    } catch (e: any) {
      if (e.name === 'AbortError') return
      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = { role: 'assistant', content: `Erro ao conectar com o AgroGPT: ${e.message}` }
        return updated
      })
    } finally {
      setLoading(false)
    }
  }

  function handleClose() {
    abortRef.current?.abort()
    setMessages([])
    setOpen(false)
  }

  return (
    <>
      {/* Botão flutuante */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 z-[1100] w-14 h-14 rounded-2xl shadow-lg transition-all hover:scale-105 active:scale-95 flex items-center justify-center"
        style={{
          background: open
            ? 'linear-gradient(135deg,#15803d,#14532d)'
            : 'linear-gradient(135deg,#16a34a,#059669)',
          boxShadow: '0 0 24px rgba(22,163,74,.45)',
        }}
        title="AgroGPT — Copiloto IA"
      >
        {open ? (
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
          </svg>
        )}
      </button>

      {/* Painel de chat */}
      {open && (
        <div
          className="fixed bottom-24 right-6 z-[1100] flex flex-col overflow-hidden"
          style={{
            width: 380,
            maxWidth: 'calc(100vw - 2rem)',
            height: 560,
            maxHeight: 'calc(100vh - 8rem)',
            background: 'linear-gradient(180deg,#0b1628 0%,#0f172a 100%)',
            borderRadius: 20,
            border: '1px solid rgba(22,163,74,.2)',
            boxShadow: '0 0 60px rgba(22,163,74,.12), 0 24px 48px rgba(0,0,0,.5)',
          }}
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-white/8 flex items-center gap-3 flex-shrink-0"
            style={{ background: 'rgba(22,163,74,.07)' }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,#16a34a,#059669)', boxShadow: '0 0 12px rgba(22,163,74,.4)' }}>
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-white">AgroGPT</div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" style={{ boxShadow: '0 0 4px #4ade80' }} />
                <span className="text-[10px] text-slate-400 font-mono">ORYON Intelligence · dados reais da fazenda</span>
              </div>
            </div>
            <button onClick={handleClose} className="text-slate-500 hover:text-slate-300 transition-colors p-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Mensagens */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-lg bg-green-500/20 border border-green-500/20 flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">
                    <svg className="w-3 h-3 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                    </svg>
                  </div>
                )}
                <div
                  className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'text-white rounded-tr-sm'
                      : 'text-slate-200 rounded-tl-sm'
                  }`}
                  style={m.role === 'user'
                    ? { background: 'linear-gradient(135deg,#16a34a,#059669)' }
                    : { background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.06)' }
                  }
                >
                  {m.role === 'assistant'
                    ? <div className="space-y-0.5">{renderContent(m.content)}</div>
                    : m.content
                  }
                  {/* Cursor piscante durante streaming */}
                  {m.role === 'assistant' && loading && i === messages.length - 1 && (
                    <span className="inline-block w-0.5 h-3.5 bg-green-400 ml-0.5 animate-pulse align-middle" />
                  )}
                </div>
              </div>
            ))}

            {/* Loading inicial (antes do primeiro chunk) */}
            {loading && messages[messages.length - 1]?.content === '' && (
              <div className="flex justify-start">
                <div className="w-6 h-6 rounded-lg bg-green-500/20 border border-green-500/20 flex items-center justify-center flex-shrink-0 mr-2">
                  <svg className="w-3 h-3 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                </div>
                <div className="bg-white/6 border border-white/6 px-4 py-3 rounded-2xl rounded-tl-sm flex gap-1.5 items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}

            {/* Sugestões iniciais */}
            {messages.length === 1 && !loading && (
              <div className="grid grid-cols-2 gap-1.5 pt-1">
                {SUGESTOES.map(s => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="text-left text-[11px] text-slate-400 hover:text-white px-2.5 py-2 rounded-xl transition-all border border-white/5 hover:border-green-500/30 hover:bg-green-500/8"
                    style={{ background: 'rgba(255,255,255,.03)' }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-3 pb-3 pt-2 border-t border-white/8 flex-shrink-0">
            <div
              className="flex items-center gap-2 rounded-xl px-3 py-2"
              style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.08)' }}
            >
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
                placeholder="Pergunte sobre sua fazenda..."
                className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 outline-none"
                disabled={loading}
              />
              <button
                onClick={() => send()}
                disabled={loading || !input.trim()}
                className="w-7 h-7 rounded-lg flex items-center justify-center disabled:opacity-40 transition-all flex-shrink-0"
                style={{ background: 'linear-gradient(135deg,#16a34a,#059669)' }}
              >
                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
              </button>
            </div>
            <div className="text-[10px] text-slate-600 text-center mt-1.5 font-mono">
              AgroGPT · ORYON Intelligence · LLaMA 3.3 70B
            </div>
          </div>
        </div>
      )}
    </>
  )
}

'use client'

import { useEffect, useState } from 'react'

const STORAGE_KEY = 'agrotoken_launch_popup_dismissed'
const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ''

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)))
}

export default function LaunchPopup() {
  const [visible, setVisible] = useState(false)
  const [step, setStep] = useState<'idle' | 'requesting' | 'success' | 'denied'>('idle')

  useEffect(() => {
    if (typeof window === 'undefined') return

    const showOnEvent = () => setVisible(true)
    window.addEventListener('show-launch-popup', showOnEvent)

    if (!localStorage.getItem(STORAGE_KEY)) {
      const timer = setTimeout(() => setVisible(true), 2500)
      return () => { clearTimeout(timer); window.removeEventListener('show-launch-popup', showOnEvent) }
    }

    return () => window.removeEventListener('show-launch-popup', showOnEvent)
  }, [])

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, '1')
    setVisible(false)
  }

  async function subscribe() {
    setStep('requesting')
    try {
      if (!('Notification' in window) || !('serviceWorker' in navigator)) {
        setStep('denied')
        return
      }

      const permission = await Notification.requestPermission()
      if (permission !== 'granted') { setStep('denied'); return }

      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: VAPID_PUBLIC ? urlBase64ToUint8Array(VAPID_PUBLIC) : undefined,
      })

      const json = sub.toJSON()
      await fetch('/api/launch/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
      })

      setStep('success')
      localStorage.setItem(STORAGE_KEY, '1')
      setTimeout(() => setVisible(false), 2800)
    } catch {
      setStep('denied')
    }
  }

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-6">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={dismiss} />

      <div className="relative bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden">
        {/* Header gradient */}
        <div className="bg-gradient-to-br from-[#0f172a] to-[#1e3a2f] p-6 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-20"
            style={{ background: 'radial-gradient(circle at 70% 30%, #16a34a, transparent 60%)' }} />
          <div className="relative">
            <div className="inline-flex items-center gap-2 bg-green-500/20 border border-green-500/30 text-green-400 text-xs font-bold px-3 py-1.5 rounded-full mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              Em breve
            </div>
            <div className="text-4xl mb-2">🌾</div>
            <h2 className="text-xl font-black text-white mb-1">AgroToken está chegando</h2>
            <p className="text-sm text-slate-400">
              Tokenização de ativos agrícolas — invista e capte capital diretamente da fazenda.
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="p-5">
          {step === 'success' ? (
            <div className="text-center py-3">
              <div className="text-4xl mb-3">🎉</div>
              <div className="font-bold text-slate-800 mb-1">Você vai saber primeiro!</div>
              <p className="text-sm text-slate-500">Você será notificado assim que o AgroToken for lançado.</p>
            </div>
          ) : step === 'denied' ? (
            <div className="text-center py-3">
              <div className="text-3xl mb-3">📧</div>
              <div className="font-bold text-slate-800 mb-1">Notificações bloqueadas</div>
              <p className="text-sm text-slate-500">Fique de olho em nossas redes para saber do lançamento.</p>
              <button onClick={dismiss} className="mt-4 w-full bg-slate-100 text-slate-600 font-semibold py-2.5 rounded-xl text-sm hover:bg-slate-200 transition-colors">
                Fechar
              </button>
            </div>
          ) : (
            <>
              <div className="space-y-2.5 mb-4">
                {[
                  { icon: '🏦', text: 'Invista em tokens lastreados em produção agrícola real' },
                  { icon: '💰', text: 'Produtores captam capital tokenizando sua safra' },
                  { icon: '📊', text: 'Transparência total com laudo de capacidade produtiva' },
                ].map(item => (
                  <div key={item.text} className="flex items-start gap-3">
                    <span className="text-lg flex-shrink-0">{item.icon}</span>
                    <p className="text-sm text-slate-600 leading-snug">{item.text}</p>
                  </div>
                ))}
              </div>

              <button
                onClick={subscribe}
                disabled={step === 'requesting'}
                className="w-full bg-[#16a34a] text-white font-bold py-3.5 rounded-2xl text-sm hover:bg-[#15803d] transition-all shadow-lg shadow-green-200 disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {step === 'requesting' ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Ativando...
                  </>
                ) : (
                  <>
                    <span>🔔</span> Quero ser notificado no lançamento
                  </>
                )}
              </button>

              <button onClick={dismiss} className="mt-2 w-full text-slate-400 font-medium py-2 rounded-xl text-xs hover:text-slate-600 transition-colors">
                Agora não
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

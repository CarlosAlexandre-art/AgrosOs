'use client'

import { useState, useEffect } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function PWAInstaller() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [show, setShow] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isIOSPrompt, setIsIOSPrompt] = useState(false)

  useEffect(() => {
    // Registrar service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }

    // Detectar iOS
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent)
    const standalone = (navigator as unknown as { standalone?: boolean }).standalone
    setIsIOS(ios)

    if (ios && !standalone) {
      const dismissed = localStorage.getItem('pwa-ios-dismissed')
      if (!dismissed) setTimeout(() => setIsIOSPrompt(true), 3000)
    }

    // Android / Chrome
    const handler = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e as BeforeInstallPromptEvent)
      const dismissed = localStorage.getItem('pwa-dismissed')
      if (!dismissed) setTimeout(() => setShow(true), 3000)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  async function handleInstall() {
    if (!installPrompt) return
    await installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    if (outcome === 'accepted') setShow(false)
    setInstallPrompt(null)
  }

  function handleDismiss() {
    setShow(false)
    setIsIOSPrompt(false)
    localStorage.setItem('pwa-dismissed', '1')
    localStorage.setItem('pwa-ios-dismissed', '1')
  }

  if (isIOSPrompt) {
    return (
      <div className="fixed bottom-6 left-4 right-4 z-50 bg-[#0f172a] text-white rounded-2xl p-4 shadow-2xl border border-white/10 animate-in slide-in-from-bottom-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-[#16a34a] rounded-xl flex items-center justify-center flex-shrink-0 text-lg">🌾</div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm mb-0.5">Instalar AgroOS</div>
            <div className="text-xs text-slate-400 leading-relaxed">
              Toque em <span className="inline-flex items-center gap-0.5 text-white font-medium">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M13.75 7h-3v5.296l1.943-2.048a.75.75 0 011.114 1.004l-3.25 3.5a.75.75 0 01-1.114 0l-3.25-3.5a.75.75 0 111.114-1.004l1.943 2.048V7h-3a.75.75 0 010-1.5h8.5a.75.75 0 010 1.5z" /></svg>
                Compartilhar
              </span> e depois <strong className="text-white">"Adicionar à Tela de Início"</strong>
            </div>
          </div>
          <button onClick={handleDismiss} className="text-slate-500 hover:text-white transition-colors p-1 flex-shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      </div>
    )
  }

  if (!show) return null

  return (
    <div className="fixed bottom-6 left-4 right-4 z-50 bg-[#0f172a] text-white rounded-2xl p-4 shadow-2xl border border-white/10">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-[#16a34a] rounded-xl flex items-center justify-center flex-shrink-0 text-lg">🌾</div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm">Instalar AgroOS</div>
          <div className="text-xs text-slate-400">Acesse sua fazenda direto da tela inicial</div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={handleDismiss} className="text-xs text-slate-400 hover:text-white transition-colors px-2 py-1.5">
            Agora não
          </button>
          <button onClick={handleInstall} className="text-xs font-bold bg-[#16a34a] hover:bg-[#15803d] transition-colors px-3 py-1.5 rounded-lg">
            Instalar
          </button>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function PWAInstaller() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [show, setShow] = useState(false)
  const [isIOSPrompt, setIsIOSPrompt] = useState(false)

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) return
    if (localStorage.getItem('pwa-dismissed')) return

    // Evento pode ter sido capturado antes da hidratação (ver layout.tsx)
    if ((window as any).__bip) {
      setInstallPrompt((window as any).__bip)
      setTimeout(() => setShow(true), 3000)
    }

    const handler = (e: Event) => {
      e.preventDefault()
      ;(window as any).__bip = e
      setInstallPrompt(e as BeforeInstallPromptEvent)
      setTimeout(() => setShow(true), 3000)
    }
    window.addEventListener('beforeinstallprompt', handler)

    // iOS
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent)
    const standalone = (navigator as any).standalone
    if (ios && !standalone && !localStorage.getItem('pwa-ios-dismissed')) {
      setTimeout(() => setIsIOSPrompt(true), 3000)
    }

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  async function handleInstall() {
    if (!installPrompt) return
    await installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    if (outcome === 'accepted') {
      setShow(false)
      localStorage.setItem('pwa-dismissed', '1')
    }
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
      <div className="fixed bottom-6 left-4 right-4 z-50 bg-[#0f172a] text-white rounded-2xl p-4 shadow-2xl border border-white/10 animate-in slide-in-from-bottom-4 max-w-sm mx-auto">
        <div className="flex items-start gap-3">
          <img src="/icons/icon-192.png" alt="SmartAgroOS" className="w-10 h-10 rounded-xl flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm mb-0.5">Instalar SmartAgroOS</div>
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
    <div className="fixed bottom-6 left-4 right-4 z-50 bg-[#0f172a] text-white rounded-2xl overflow-hidden shadow-2xl border border-white/10 max-w-sm mx-auto">
      <div className="bg-[#16a34a] px-4 py-3 flex items-center gap-3">
        <img src="/icons/icon-192.png" alt="SmartAgroOS" className="w-10 h-10 rounded-xl flex-shrink-0" />
        <div>
          <div className="text-white font-bold text-sm">Instalar SmartAgroOS</div>
          <div className="text-green-200 text-xs">Sistema Operacional da Fazenda</div>
        </div>
      </div>
      <div className="px-4 py-3">
        <p className="text-slate-400 text-xs mb-3">
          Acesse sua fazenda direto da tela inicial — funciona sem abrir o navegador.
        </p>
        <button
          onClick={handleInstall}
          className="w-full py-2.5 bg-[#16a34a] hover:bg-[#15803d] text-white font-bold rounded-xl text-sm transition mb-2"
        >
          Instalar no celular
        </button>
        <button onClick={handleDismiss} className="w-full text-slate-500 text-xs py-1">
          Agora não
        </button>
      </div>
    </div>
  )
}

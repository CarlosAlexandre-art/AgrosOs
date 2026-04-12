'use client'

import { useState, useEffect } from 'react'

export default function PushNotificationButton() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'enabled' | 'denied' | 'unsupported'>('idle')

  useEffect(() => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      setStatus('unsupported')
      return
    }
    if (Notification.permission === 'granted') {
      setStatus('enabled')
    } else if (Notification.permission === 'denied') {
      setStatus('denied')
    }
  }, [])

  async function handleEnable() {
    if (!('serviceWorker' in navigator)) return
    setStatus('loading')

    try {
      const reg = await navigator.serviceWorker.register('/sw.js')
      const permission = await Notification.requestPermission()

      if (permission !== 'granted') {
        setStatus('denied')
        return
      }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
      })

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub.toJSON()),
      })

      setStatus('enabled')
    } catch {
      setStatus('idle')
    }
  }

  async function handleDisable() {
    setStatus('loading')
    try {
      const reg = await navigator.serviceWorker.getRegistration('/sw.js')
      const sub = await reg?.pushManager.getSubscription()
      if (sub) {
        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        })
        await sub.unsubscribe()
      }
      setStatus('idle')
    } catch {
      setStatus('idle')
    }
  }

  if (status === 'unsupported') return null

  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-100">
      <div>
        <div className="text-sm font-medium text-slate-900">Notificações push</div>
        <div className="text-xs text-slate-400 mt-0.5">
          {status === 'enabled' ? 'Ativadas — você receberá alertas e lembretes' :
           status === 'denied' ? 'Bloqueadas pelo navegador' :
           'Receba alertas de atividades e operações'}
        </div>
      </div>

      {status === 'enabled' ? (
        <button
          onClick={handleDisable}
          className="text-xs font-semibold text-red-600 hover:text-red-700 transition-colors px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50"
        >
          Desativar
        </button>
      ) : status === 'denied' ? (
        <span className="text-xs text-slate-400 bg-slate-100 px-3 py-1.5 rounded-lg">Bloqueado</span>
      ) : (
        <button
          onClick={handleEnable}
          disabled={status === 'loading'}
          className="text-xs font-semibold text-white bg-[#16a34a] hover:bg-[#15803d] transition-colors px-3 py-1.5 rounded-lg disabled:opacity-50"
        >
          {status === 'loading' ? 'Ativando...' : 'Ativar'}
        </button>
      )}
    </div>
  )
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)))
}

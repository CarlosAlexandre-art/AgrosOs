'use client'

import { useEffect, useState } from 'react'

export default function OfflineIndicator() {
  const [offline, setOffline] = useState(false)
  const [mostrarSync, setMostrarSync] = useState(false)

  useEffect(() => {
    function atualizar() {
      const estaOffline = !navigator.onLine
      if (!estaOffline && offline) setMostrarSync(true)
      setOffline(estaOffline)
    }

    atualizar()
    window.addEventListener('online', atualizar)
    window.addEventListener('offline', atualizar)
    return () => {
      window.removeEventListener('online', atualizar)
      window.removeEventListener('offline', atualizar)
    }
  }, [offline])

  useEffect(() => {
    if (mostrarSync) {
      const t = setTimeout(() => setMostrarSync(false), 4000)
      return () => clearTimeout(t)
    }
  }, [mostrarSync])

  if (mostrarSync) return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-green-600 text-white text-sm font-semibold px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-fade-in">
      ✅ Conexão restaurada — sincronizando dados...
    </div>
  )

  if (!offline) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-white text-sm font-semibold px-4 py-2 text-center flex items-center justify-center gap-2">
      <span className="animate-pulse">📡</span>
      Modo offline — dados podem estar desatualizados. Sincronizará quando a internet voltar.
    </div>
  )
}

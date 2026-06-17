'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function OfflinePage() {
  const [tentando, setTentando] = useState(false)
  const [online, setOnline] = useState(false)

  useEffect(() => {
    function handleOnline() { setOnline(true) }
    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [])

  useEffect(() => {
    if (online) window.location.href = '/dashboard'
  }, [online])

  async function tentar() {
    setTentando(true)
    try {
      await fetch('/api/ping', { cache: 'no-store' })
      window.location.href = '/dashboard'
    } catch {
      setTentando(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6 text-center">
      <div className="text-7xl mb-6">📡</div>
      <h1 className="text-2xl font-black text-gray-800 mb-2">Sem conexão</h1>
      <p className="text-gray-500 text-base mb-8 max-w-sm">
        Você está sem internet. As páginas que você acessou recentemente ainda estão disponíveis no modo offline.
      </p>

      <div className="space-y-3 w-full max-w-xs mb-8">
        <Link
          href="/dashboard"
          className="flex items-center justify-between w-full px-5 py-3.5 bg-white rounded-2xl shadow-sm border border-gray-100 hover:border-green-300 transition"
        >
          <span className="font-semibold text-gray-700 text-sm">🏠 Painel principal</span>
          <span className="text-gray-400">›</span>
        </Link>
        <Link
          href="/dashboard/operacoes"
          className="flex items-center justify-between w-full px-5 py-3.5 bg-white rounded-2xl shadow-sm border border-gray-100 hover:border-green-300 transition"
        >
          <span className="font-semibold text-gray-700 text-sm">⚙️ Operações</span>
          <span className="text-gray-400">›</span>
        </Link>
        <Link
          href="/dashboard/financeiro"
          className="flex items-center justify-between w-full px-5 py-3.5 bg-white rounded-2xl shadow-sm border border-gray-100 hover:border-green-300 transition"
        >
          <span className="font-semibold text-gray-700 text-sm">💰 Financeiro</span>
          <span className="text-gray-400">›</span>
        </Link>
        <Link
          href="/dashboard/estoque"
          className="flex items-center justify-between w-full px-5 py-3.5 bg-white rounded-2xl shadow-sm border border-gray-100 hover:border-green-300 transition"
        >
          <span className="font-semibold text-gray-700 text-sm">📦 Estoque</span>
          <span className="text-gray-400">›</span>
        </Link>
      </div>

      <button
        onClick={tentar}
        disabled={tentando}
        className="px-8 py-3 bg-green-700 text-white font-bold rounded-2xl hover:bg-green-800 transition disabled:opacity-50"
      >
        {tentando ? '⏳ Verificando...' : '🔄 Tentar novamente'}
      </button>

      <p className="text-xs text-gray-400 mt-6">
        Os dados serão sincronizados automaticamente quando a internet voltar.
      </p>
    </div>
  )
}

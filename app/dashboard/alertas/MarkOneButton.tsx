'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function MarkOneButton({ alertId }: { alertId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function mark() {
    setLoading(true)
    await fetch('/api/alerts/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ alertId }),
    })
    setDone(true)
    setLoading(false)
    router.refresh()
  }

  if (done) return null

  return (
    <button
      onClick={mark}
      disabled={loading}
      className="text-xs text-slate-400 hover:text-slate-700 font-medium transition-colors disabled:opacity-40 whitespace-nowrap"
    >
      {loading ? '...' : 'Marcar como lido'}
    </button>
  )
}

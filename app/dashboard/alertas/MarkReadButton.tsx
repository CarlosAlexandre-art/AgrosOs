'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function MarkReadButton({ propertyId }: { propertyId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function markAll() {
    setLoading(true)
    await fetch(`/api/alerts/read-all`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ propertyId }),
    })
    router.refresh()
    setLoading(false)
  }

  return (
    <button onClick={markAll} disabled={loading} className="text-sm text-slate-500 hover:text-slate-800 font-medium transition-colors disabled:opacity-50">
      {loading ? 'Marcando...' : 'Marcar todos como lidos'}
    </button>
  )
}

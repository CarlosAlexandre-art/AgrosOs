'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const TRANSITIONS: Record<string, { label: string; to: string; color: string }[]> = {
  PENDING:     [{ label: 'Iniciar', to: 'IN_PROGRESS', color: 'bg-blue-600 hover:bg-blue-700 text-white' }],
  IN_PROGRESS: [
    { label: 'Concluir', to: 'DONE', color: 'bg-green-600 hover:bg-green-700 text-white' },
    { label: 'Marcar como atrasado', to: 'LATE', color: 'bg-red-500 hover:bg-red-600 text-white' },
  ],
  LATE:        [{ label: 'Concluir mesmo assim', to: 'DONE', color: 'bg-green-600 hover:bg-green-700 text-white' }],
  DONE:        [],
  CANCELLED:   [],
}

export default function ActivityActions({ activity }: { activity: { id: string; status: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const transitions = TRANSITIONS[activity.status] || []

  async function updateStatus(to: string) {
    setLoading(true)
    await fetch(`/api/activities/${activity.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: to }),
    })
    router.refresh()
    setLoading(false)
  }

  async function deleteActivity() {
    if (!confirm('Excluir esta atividade? Esta ação não pode ser desfeita.')) return
    setDeleting(true)
    await fetch(`/api/activities/${activity.id}`, { method: 'DELETE' })
    router.push('/dashboard/operacoes')
    router.refresh()
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
      <h3 className="font-semibold text-slate-900 text-sm">Ações</h3>
      {transitions.map(t => (
        <button
          key={t.to}
          onClick={() => updateStatus(t.to)}
          disabled={loading}
          className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-colors ${t.color} disabled:opacity-50`}
        >
          {t.label}
        </button>
      ))}
      <button
        onClick={deleteActivity}
        disabled={deleting}
        className="w-full py-2.5 rounded-xl text-sm font-medium border-2 border-red-200 text-red-600 hover:bg-red-50 transition-colors"
      >
        {deleting ? 'Excluindo...' : 'Excluir atividade'}
      </button>
    </div>
  )
}

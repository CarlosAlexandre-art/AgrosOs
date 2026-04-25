'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const TYPES = [
  { value: 'REVENUE',      label: 'Faturamento',          icon: '📈' },
  { value: 'PRODUCTIVITY', label: 'Produtividade',         icon: '⚡' },
  { value: 'COST',         label: 'Redução de custos',     icon: '💰' },
  { value: 'ACTIVITIES',   label: 'Atividades concluídas', icon: '✅' },
  { value: 'CUSTOM',       label: 'Meta personalizada',    icon: '🎯' },
]

type Goal = {
  id: string
  title: string
  description?: string | null
  type: string
  targetValue: number
  deadline?: string | null
  isCompleted: boolean
}

export default function GoalActions({ goalId, goal }: { goalId: string; goal: Goal }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    title: goal.title,
    description: goal.description ?? '',
    type: goal.type,
    targetValue: String(goal.targetValue),
    deadline: goal.deadline ? goal.deadline.slice(0, 10) : '',
  })
  const [editError, setEditError] = useState('')

  function setF(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleComplete() {
    setLoading(true)
    await fetch(`/api/goals/${goalId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isCompleted: true }),
    })
    setLoading(false)
    setOpen(false)
    router.refresh()
  }

  async function handleDelete() {
    setLoading(true)
    await fetch(`/api/goals/${goalId}`, { method: 'DELETE' })
    setLoading(false)
    setOpen(false)
    router.refresh()
  }

  async function handleEdit(e: { preventDefault(): void }) {
    e.preventDefault()
    if (!form.title.trim() || !form.targetValue) {
      setEditError('Preencha título e valor alvo.')
      return
    }
    setLoading(true)
    setEditError('')
    const res = await fetch(`/api/goals/${goalId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: form.title.trim(),
        description: form.description || null,
        type: form.type,
        targetValue: Number(form.targetValue),
        deadline: form.deadline || null,
      }),
    })
    setLoading(false)
    if (res.ok) {
      setEditing(false)
      router.refresh()
    } else {
      setEditError('Erro ao salvar. Tente novamente.')
    }
  }

  return (
    <>
      <div className="relative flex-shrink-0">
        <button
          onClick={() => setOpen(v => !v)}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        </button>

        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <div className="absolute right-0 top-9 z-20 bg-white border border-slate-200 rounded-xl shadow-lg py-1 w-48">
              <button
                onClick={() => { setOpen(false); setEditing(true) }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Editar meta
              </button>
              {!goal.isCompleted && (
                <button
                  onClick={handleComplete}
                  disabled={loading}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Marcar concluída
                </button>
              )}
              <div className="h-px bg-slate-100 mx-2 my-1" />
              <button
                onClick={handleDelete}
                disabled={loading}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Excluir meta
              </button>
            </div>
          </>
        )}
      </div>

      {/* Modal de edição */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-900">Editar meta</h2>
              <button onClick={() => setEditing(false)} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleEdit} className="p-5 space-y-4">
              {/* Tipo */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Tipo</label>
                <div className="grid grid-cols-2 gap-2">
                  {TYPES.map(t => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setF('type', t.value)}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border text-left text-sm transition-all ${
                        form.type === t.value
                          ? 'border-[#16a34a] bg-green-50 ring-1 ring-[#16a34a] font-semibold text-slate-900'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <span>{t.icon}</span> {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Título */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Título</label>
                <input
                  value={form.title}
                  onChange={e => setF('title', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#16a34a]"
                />
              </div>

              {/* Valor alvo */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
                  {form.type === 'ACTIVITIES' ? 'Qtd. alvo' : 'Valor alvo (R$)'}
                </label>
                <input
                  type="number"
                  value={form.targetValue}
                  onChange={e => setF('targetValue', e.target.value)}
                  min="0"
                  step={form.type === 'ACTIVITIES' ? '1' : '0.01'}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#16a34a]"
                />
              </div>

              {/* Prazo */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
                  Prazo <span className="font-normal normal-case text-slate-400">(opcional)</span>
                </label>
                <input
                  type="date"
                  value={form.deadline}
                  onChange={e => setF('deadline', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#16a34a]"
                />
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
                  Descrição <span className="font-normal normal-case text-slate-400">(opcional)</span>
                </label>
                <textarea
                  value={form.description}
                  onChange={e => setF('description', e.target.value)}
                  rows={2}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#16a34a] resize-none"
                />
              </div>

              {editError && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">{editError}</div>
              )}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setEditing(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                  Cancelar
                </button>
                <button type="submit" disabled={loading}
                  className="flex-1 py-2.5 rounded-xl bg-[#16a34a] text-white text-sm font-semibold hover:bg-[#15803d] disabled:opacity-60">
                  {loading ? 'Salvando…' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

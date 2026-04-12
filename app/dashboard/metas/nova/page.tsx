'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const TYPES = [
  { value: 'REVENUE',      label: 'Aumento de faturamento', icon: '📈', desc: 'Meta de receita ou faturamento total' },
  { value: 'PRODUCTIVITY', label: 'Produtividade',           icon: '⚡', desc: 'Eficiência e rendimento da operação' },
  { value: 'COST',         label: 'Redução de custos',       icon: '💰', desc: 'Diminuir despesas operacionais' },
  { value: 'ACTIVITIES',   label: 'Atividades concluídas',   icon: '✅', desc: 'Número de atividades finalizadas' },
  { value: 'CUSTOM',       label: 'Meta personalizada',      icon: '🎯', desc: 'Defina seu próprio indicador' },
]

export default function NovaMeta() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'REVENUE',
    targetValue: '',
    deadline: '',
  })

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim() || !form.targetValue) {
      setError('Preencha o título e o valor alvo.')
      return
    }
    setLoading(true)
    setError('')
    const res = await fetch('/api/goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        targetValue: Number(form.targetValue),
      }),
    })
    setLoading(false)
    if (res.ok) {
      router.push('/dashboard/metas')
      router.refresh()
    } else {
      const data = await res.json()
      setError(data.error || 'Erro ao criar meta.')
    }
  }

  const selectedType = TYPES.find(t => t.value === form.type)

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/metas" className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Nova meta</h1>
          <p className="text-sm text-slate-500">Defina um objetivo para sua operação</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Tipo */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <label className="block text-sm font-semibold text-slate-700 mb-3">Tipo de meta</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {TYPES.map(t => (
              <button
                key={t.value}
                type="button"
                onClick={() => set('type', t.value)}
                className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                  form.type === t.value
                    ? 'border-[#16a34a] bg-green-50 ring-1 ring-[#16a34a]'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <span className="text-xl">{t.icon}</span>
                <div>
                  <div className="text-sm font-semibold text-slate-900">{t.label}</div>
                  <div className="text-xs text-slate-400">{t.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Detalhes */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Título</label>
            <input
              type="text"
              value={form.title}
              onChange={e => set('title', e.target.value)}
              placeholder={`Ex: ${selectedType?.label}`}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#16a34a] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              {form.type === 'ACTIVITIES' ? 'Quantidade alvo (atividades)' : 'Valor alvo (R$)'}
            </label>
            <input
              type="number"
              value={form.targetValue}
              onChange={e => set('targetValue', e.target.value)}
              placeholder={form.type === 'ACTIVITIES' ? '50' : '50000'}
              min="0"
              step={form.type === 'ACTIVITIES' ? '1' : '0.01'}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#16a34a] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Prazo <span className="font-normal text-slate-400">(opcional)</span></label>
            <input
              type="date"
              value={form.deadline}
              onChange={e => set('deadline', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#16a34a] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Descrição <span className="font-normal text-slate-400">(opcional)</span></label>
            <textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Contexto ou detalhes adicionais..."
              rows={3}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#16a34a] focus:border-transparent resize-none"
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <div className="flex gap-3">
          <Link href="/dashboard/metas" className="flex-1 text-center py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-[#16a34a] text-white text-sm font-semibold hover:bg-[#15803d] transition-colors disabled:opacity-60"
          >
            {loading ? 'Salvando...' : 'Criar meta'}
          </button>
        </div>
      </form>
    </div>
  )
}

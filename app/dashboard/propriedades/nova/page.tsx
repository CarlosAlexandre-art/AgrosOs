'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NovaPropriedadePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', location: '', sizeHectares: '' })

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, sizeHectares: parseFloat(form.sizeHectares) || 0 }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Erro ao criar')
      router.push('/dashboard/propriedades')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const inputCls = 'w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#16a34a] focus:border-transparent transition-all'
  const labelCls = 'block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5'

  return (
    <div className="p-6 max-w-xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/dashboard/propriedades" className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-all">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="m15 19-7-7 7-7" /></svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Nova propriedade</h1>
          <p className="text-sm text-slate-500">Cadastre uma fazenda ou área</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <div>
            <label className={labelCls}>Nome da propriedade *</label>
            <input value={form.name} onChange={set('name')} required placeholder="Ex: Fazenda Boa Vista" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Localização</label>
            <input value={form.location} onChange={set('location')} placeholder="Ex: Sorriso, MT" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Tamanho total (hectares)</label>
            <input type="number" step="0.01" min="0" value={form.sizeHectares} onChange={set('sizeHectares')} placeholder="0" className={inputCls} />
          </div>
        </div>

        {error && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">{error}</div>}

        <div className="flex gap-3 pt-2">
          <Link href="/dashboard/propriedades" className="flex-1 text-center py-3 rounded-xl border-2 border-slate-200 text-sm font-semibold text-slate-700 hover:border-slate-300 transition-all">Cancelar</Link>
          <button type="submit" disabled={loading} className="flex-1 bg-[#16a34a] text-white font-semibold py-3 rounded-xl hover:bg-[#15803d] transition-colors disabled:opacity-50">
            {loading ? 'Salvando...' : 'Criar propriedade'}
          </button>
        </div>
      </form>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AddFieldForm({ propertyId }: { propertyId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name: '', sizeHectares: '' })

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await fetch(`/api/properties/${propertyId}/fields`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, sizeHectares: parseFloat(form.sizeHectares) || 0 }),
    })
    setForm({ name: '', sizeHectares: '' })
    setOpen(false)
    setLoading(false)
    router.refresh()
  }

  if (!open) return (
    <button onClick={() => setOpen(true)} className="w-full flex items-center gap-2 justify-center py-2.5 border-2 border-dashed border-slate-200 rounded-xl text-sm text-slate-400 hover:border-[#16a34a] hover:text-[#16a34a] transition-all">
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
      Adicionar talhão
    </button>
  )

  return (
    <form onSubmit={handleSubmit} className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3">
      <div className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Novo talhão</div>
      <input value={form.name} onChange={set('name')} required placeholder="Nome do talhão" className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#16a34a]" />
      <input type="number" step="0.01" value={form.sizeHectares} onChange={set('sizeHectares')} placeholder="Tamanho (ha)" className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#16a34a]" />
      <div className="flex gap-2">
        <button type="button" onClick={() => setOpen(false)} className="flex-1 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-white transition-colors">Cancelar</button>
        <button type="submit" disabled={loading} className="flex-1 py-2 text-sm font-semibold text-white bg-[#16a34a] rounded-lg hover:bg-[#15803d] transition-colors disabled:opacity-50">
          {loading ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </form>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const CATEGORIAS = [
  { value: 'VENDA', label: 'Venda de produção' },
  { value: 'SERVICO', label: 'Prestação de serviço' },
  { value: 'SUBSIDIO', label: 'Subsídio / incentivo' },
  { value: 'ARRENDAMENTO', label: 'Arrendamento' },
  { value: 'OUTROS', label: 'Outros' },
]

export default function NovaReceitaButton({ propertyId }: { propertyId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    amount: '',
    category: 'VENDA',
    description: '',
    date: new Date().toISOString().split('T')[0],
  })

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.amount) return
    setLoading(true)
    await fetch('/api/revenues', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ propertyId, ...form, amount: parseFloat(form.amount) }),
    })
    setLoading(false)
    setOpen(false)
    setForm({ amount: '', category: 'VENDA', description: '', date: new Date().toISOString().split('T')[0] })
    router.refresh()
  }

  const inputCls = 'w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent'
  const labelCls = 'block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5'

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 bg-green-50 border border-green-200 text-green-700 text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-green-100 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
        Registrar receita
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-900">Nova receita</h2>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-700">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={labelCls}>Valor (R$) *</label>
                <input type="number" min="0.01" step="0.01" value={form.amount} onChange={set('amount')} required placeholder="0,00" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Categoria</label>
                <select value={form.category} onChange={set('category')} className={inputCls}>
                  {CATEGORIAS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Descrição</label>
                <input value={form.description} onChange={set('description')} placeholder="Ex: Venda de soja — safra 2024" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Data</label>
                <input type="date" value={form.date} onChange={set('date')} className={inputCls} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setOpen(false)} className="flex-1 border-2 border-slate-200 text-slate-700 font-semibold py-2.5 rounded-xl hover:border-slate-300 transition-colors text-sm">
                  Cancelar
                </button>
                <button type="submit" disabled={loading} className="flex-1 bg-green-600 text-white font-semibold py-2.5 rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 text-sm">
                  {loading ? 'Salvando...' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

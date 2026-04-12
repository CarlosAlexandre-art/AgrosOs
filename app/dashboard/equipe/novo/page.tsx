'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const CARGOS = ['Tratorista', 'Operador de máquinas', 'Peão', 'Agrônomo', 'Técnico agrícola', 'Gerente de campo', 'Motorista', 'Irrigador', 'Outro']

export default function NovoMembroPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [properties, setProperties] = useState<any[]>([])
  const [form, setForm] = useState({ propertyId: '', name: '', role: '', customRole: '', phone: '' })

  useEffect(() => {
    fetch('/api/properties').then(r => r.json()).then(data => {
      setProperties(data)
      if (data[0]) setForm(f => ({ ...f, propertyId: data[0].id }))
    })
  }, [])

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const finalRole = form.role === 'Outro' ? form.customRole : form.role
    if (!finalRole) { setError('Informe o cargo.'); setLoading(false); return }
    try {
      const res = await fetch(`/api/properties/${form.propertyId}/team`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, role: finalRole, phone: form.phone || null }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Erro ao salvar')
      router.push('/dashboard/equipe')
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
        <Link href="/dashboard/equipe" className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-all">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="m15 19-7-7 7-7" /></svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Novo membro</h1>
          <p className="text-sm text-slate-500">Adicione alguém à equipe da fazenda</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <div>
            <label className={labelCls}>Nome completo *</label>
            <input value={form.name} onChange={set('name')} required placeholder="Ex: João Ferreira" className={inputCls} />
          </div>

          <div>
            <label className={labelCls}>Cargo *</label>
            <select value={form.role} onChange={set('role')} required className={inputCls}>
              <option value="">Selecionar cargo...</option>
              {CARGOS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {form.role === 'Outro' && (
            <div>
              <label className={labelCls}>Descreva o cargo</label>
              <input value={form.customRole} onChange={set('customRole')} placeholder="Ex: Analista de solo" className={inputCls} />
            </div>
          )}

          <div>
            <label className={labelCls}>Telefone</label>
            <input value={form.phone} onChange={set('phone')} placeholder="(00) 00000-0000" className={inputCls} />
          </div>

          {properties.length > 0 && (
            <div>
              <label className={labelCls}>Propriedade *</label>
              <select value={form.propertyId} onChange={set('propertyId')} className={inputCls}>
                {properties.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          )}
        </div>

        {error && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">{error}</div>}

        <div className="flex gap-3 pt-2">
          <Link href="/dashboard/equipe" className="flex-1 text-center py-3 rounded-xl border-2 border-slate-200 text-sm font-semibold text-slate-700 hover:border-slate-300 transition-all">Cancelar</Link>
          <button type="submit" disabled={loading} className="flex-1 bg-[#16a34a] text-white font-semibold py-3 rounded-xl hover:bg-[#15803d] transition-colors disabled:opacity-50">
            {loading ? 'Salvando...' : 'Adicionar membro'}
          </button>
        </div>
      </form>
    </div>
  )
}

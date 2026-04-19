'use client'

import { useState, useEffect, Suspense, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

const CATEGORIAS = [
  { value: 'INSUMO', label: 'Insumo' },
  { value: 'MAO_DE_OBRA', label: 'Mão de obra' },
  { value: 'MAQUINARIO', label: 'Maquinário' },
  { value: 'AGROLINK', label: 'AgroCore' },
  { value: 'OUTROS', label: 'Outros' },
]

function NovoCustoForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const activityIdParam = searchParams.get('activityId')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [properties, setProperties] = useState<any[]>([])
  const [activities, setActivities] = useState<any[]>([])
  const [aiSugestao, setAiSugestao] = useState<{ categoria: string; valor_sugerido: number | null; justificativa: string } | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [form, setForm] = useState({
    propertyId: '',
    activityId: activityIdParam || '',
    amount: '',
    category: 'OUTROS',
    description: '',
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    fetch('/api/properties').then(r => r.json()).then(data => {
      setProperties(data)
      if (data[0]) setForm(f => ({ ...f, propertyId: data[0].id }))
    })
    fetch('/api/activities').then(r => r.json()).then(setActivities)
  }, [])

  function handleDescricaoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setForm(f => ({ ...f, description: val }))
    setAiSugestao(null)
    if (timerRef.current) clearTimeout(timerRef.current)
    if (val.length < 5) return
    timerRef.current = setTimeout(async () => {
      setAiLoading(true)
      try {
        const res = await fetch('/api/ai/custo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ descricao: val }),
        })
        const data = await res.json()
        if (!data.error) {
          setAiSugestao(data)
        }
      } catch { /* silencioso */ } finally {
        setAiLoading(false)
      }
    }, 800)
  }

  function aplicarSugestao() {
    if (!aiSugestao) return
    setForm(f => ({
      ...f,
      category: aiSugestao.categoria,
      amount: aiSugestao.valor_sugerido ? String(aiSugestao.valor_sugerido) : f.amount,
    }))
    setAiSugestao(null)
  }

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/costs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, amount: parseFloat(form.amount), activityId: form.activityId || null }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Erro ao salvar')
      router.push('/dashboard/financeiro')
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
        <Link href="/dashboard/financeiro" className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-all">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="m15 19-7-7 7-7" /></svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Lançar custo</h1>
          <p className="text-sm text-slate-500">Registre uma despesa da operação</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <div>
            <label className={labelCls}>Descrição</label>
            <div className="relative">
              <input
                value={form.description}
                onChange={handleDescricaoChange}
                placeholder="Ex: Herbicida campo 1, Diária peão..."
                className={inputCls}
              />
              {aiLoading && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <svg className="w-4 h-4 animate-spin text-[#16a34a]" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                </div>
              )}
            </div>
            {/* Sugestão IA */}
            {aiSugestao && (
              <div className="mt-2 bg-gradient-to-r from-[#0f172a] to-[#1e293b] rounded-xl p-3 border border-white/10 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <svg className="w-3 h-3 text-[#16a34a] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>
                    <span className="text-[10px] font-bold text-[#16a34a] uppercase tracking-wide">Sugestão IA</span>
                  </div>
                  <p className="text-xs text-slate-300 truncate">{aiSugestao.justificativa}</p>
                  {aiSugestao.valor_sugerido && (
                    <p className="text-xs text-slate-400">Valor típico: R$ {aiSugestao.valor_sugerido.toLocaleString('pt-BR')}</p>
                  )}
                </div>
                <button type="button" onClick={aplicarSugestao} className="flex-shrink-0 text-xs font-semibold text-[#16a34a] bg-[#16a34a]/10 hover:bg-[#16a34a]/20 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap">
                  Aplicar →
                </button>
              </div>
            )}
          </div>

          <div>
            <label className={labelCls}>Valor (R$) *</label>
            <input type="number" step="0.01" min="0" value={form.amount} onChange={set('amount')} required placeholder="0,00" className={inputCls} />
          </div>

          <div>
            <label className={labelCls}>Categoria</label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIAS.map(cat => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, category: cat.value }))}
                  className={`py-2.5 px-3 rounded-xl border-2 text-sm font-medium transition-all text-left ${form.category === cat.value ? 'border-[#16a34a] bg-green-50 text-[#16a34a]' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={labelCls}>Data</label>
            <input type="date" value={form.date} onChange={set('date')} className={inputCls} />
          </div>

          {properties.length > 0 && (
            <div>
              <label className={labelCls}>Propriedade *</label>
              <select value={form.propertyId} onChange={set('propertyId')} className={inputCls}>
                {properties.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          )}

          {activities.length > 0 && (
            <div>
              <label className={labelCls}>Vincular a atividade</label>
              <select value={form.activityId} onChange={set('activityId')} className={inputCls}>
                <option value="">Nenhuma</option>
                {activities.map((a: any) => <option key={a.id} value={a.id}>{a.type} — {new Date(a.startDate).toLocaleDateString('pt-BR')}</option>)}
              </select>
            </div>
          )}
        </div>

        {error && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">{error}</div>}

        <div className="flex gap-3 pt-2">
          <Link href="/dashboard/financeiro" className="flex-1 text-center py-3 rounded-xl border-2 border-slate-200 text-sm font-semibold text-slate-700 hover:border-slate-300 transition-all">Cancelar</Link>
          <button type="submit" disabled={loading} className="flex-1 bg-[#16a34a] text-white font-semibold py-3 rounded-xl hover:bg-[#15803d] transition-colors disabled:opacity-50">
            {loading ? 'Salvando...' : 'Lançar custo'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default function NovoCustoPage() {
  return (
    <Suspense>
      <NovoCustoForm />
    </Suspense>
  )
}

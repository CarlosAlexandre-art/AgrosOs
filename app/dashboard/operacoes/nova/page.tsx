'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const TIPOS = ['Pulverização', 'Plantio', 'Colheita', 'Irrigação', 'Adubação', 'Análise de solo', 'Capina', 'Transporte', 'Manutenção', 'Outro']
const EXECUTORES = [
  { value: 'INTERNAL', label: 'Equipe interna' },
  { value: 'AGROLINK', label: 'Via AgroCore' },
]

export default function NovaAtividadePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [properties, setProperties] = useState<any[]>([])
  const [fields, setFields] = useState<any[]>([])
  const [team, setTeam] = useState<any[]>([])

  const [form, setForm] = useState({
    propertyId: '',
    fieldId: '',
    assignedToId: '',
    type: '',
    customType: '',
    description: '',
    status: 'PENDING',
    executor: 'INTERNAL',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
  })

  useEffect(() => {
    fetch('/api/properties').then(r => r.json()).then(data => {
      setProperties(data)
      if (data[0]) setForm(f => ({ ...f, propertyId: data[0].id }))
    })
  }, [])

  useEffect(() => {
    if (!form.propertyId) return
    fetch(`/api/properties/${form.propertyId}/fields`).then(r => r.json()).then(setFields)
    fetch(`/api/properties/${form.propertyId}/team`).then(r => r.json()).then(setTeam)
  }, [form.propertyId])

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const finalType = form.type === 'Outro' ? form.customType : form.type
    if (!finalType) { setError('Informe o tipo de atividade.'); setLoading(false); return }
    if (!form.propertyId) { setError('Selecione uma propriedade.'); setLoading(false); return }
    try {
      const res = await fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, type: finalType, endDate: form.endDate || null }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Erro ao criar atividade')
      router.push('/dashboard/operacoes')
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
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link href="/dashboard/operacoes" className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-all">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="m15 19-7-7 7-7" /></svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Nova atividade</h1>
          <p className="text-sm text-slate-500">Registre uma nova atividade na fazenda</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Tipo */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <h2 className="font-semibold text-slate-900">Dados da atividade</h2>

          <div>
            <label className={labelCls}>Tipo de atividade *</label>
            <select value={form.type} onChange={set('type')} required className={inputCls}>
              <option value="">Selecionar tipo...</option>
              {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {form.type === 'Outro' && (
            <div>
              <label className={labelCls}>Descreva o tipo</label>
              <input value={form.customType} onChange={set('customType')} placeholder="Ex: Reparo de cerca..." className={inputCls} />
            </div>
          )}

          <div>
            <label className={labelCls}>Descrição</label>
            <textarea value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} rows={3} placeholder="Detalhes da atividade..." className={inputCls} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Data de início *</label>
              <input type="date" value={form.startDate} onChange={set('startDate')} required className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Previsão de término</label>
              <input type="date" value={form.endDate} onChange={set('endDate')} className={inputCls} />
            </div>
          </div>
        </div>

        {/* Execução */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <h2 className="font-semibold text-slate-900">Execução</h2>

          <div>
            <label className={labelCls}>Executor</label>
            <div className="grid grid-cols-2 gap-3">
              {EXECUTORES.map(ex => (
                <button
                  key={ex.value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, executor: ex.value }))}
                  className={`py-3 px-4 rounded-xl border-2 text-sm font-medium transition-all ${form.executor === ex.value ? 'border-[#16a34a] bg-green-50 text-[#16a34a]' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}
                >
                  {ex.label}
                </button>
              ))}
            </div>
          </div>

          {properties.length > 0 && (
            <div>
              <label className={labelCls}>Propriedade *</label>
              <select value={form.propertyId} onChange={set('propertyId')} className={inputCls}>
                {properties.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          )}

          {fields.length > 0 && (
            <div>
              <label className={labelCls}>Talhão</label>
              <select value={form.fieldId} onChange={set('fieldId')} className={inputCls}>
                <option value="">Nenhum</option>
                {fields.map((f: any) => <option key={f.id} value={f.id}>{f.name} {f.sizeHectares > 0 ? `(${f.sizeHectares} ha)` : ''}</option>)}
              </select>
            </div>
          )}

          {team.length > 0 && (
            <div>
              <label className={labelCls}>Atribuir para</label>
              <select value={form.assignedToId} onChange={set('assignedToId')} className={inputCls}>
                <option value="">Não atribuído</option>
                {team.map((m: any) => <option key={m.id} value={m.id}>{m.name} — {m.role}</option>)}
              </select>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <div className="flex gap-3 pt-2">
          <Link href="/dashboard/operacoes" className="flex-1 text-center py-3 rounded-xl border-2 border-slate-200 text-sm font-semibold text-slate-700 hover:border-slate-300 transition-all">
            Cancelar
          </Link>
          <button type="submit" disabled={loading} className="flex-1 bg-[#16a34a] text-white font-semibold py-3 rounded-xl hover:bg-[#15803d] transition-colors disabled:opacity-50">
            {loading ? 'Salvando...' : 'Criar atividade'}
          </button>
        </div>
      </form>
    </div>
  )
}

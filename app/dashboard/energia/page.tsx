'use client'

import { useState, useEffect, useCallback } from 'react'

type EnergySource = 'GRID' | 'SOLAR' | 'GERADOR' | 'HIBRIDO'
type EnergyRecord = {
  id: string
  month: number
  year: number
  source: EnergySource
  consumption: number
  production: number
  cost: number
  notes: string
}

const SOURCE_META: Record<EnergySource, { label: string; icon: string; color: string; bg: string }> = {
  GRID:     { label: 'Rede elétrica',  icon: '⚡', color: 'text-blue-700',   bg: 'bg-blue-50'   },
  SOLAR:    { label: 'Solar',          icon: '☀️', color: 'text-amber-700',  bg: 'bg-amber-50'  },
  GERADOR:  { label: 'Gerador',        icon: '🔋', color: 'text-slate-700',  bg: 'bg-slate-100' },
  HIBRIDO:  { label: 'Híbrido',        icon: '🔌', color: 'text-emerald-700',bg: 'bg-emerald-50'},
}

const MONTHS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

const curYear = new Date().getFullYear()
const curMonth = new Date().getMonth() + 1

export default function EnergiaPage() {
  const [records, setRecords] = useState<EnergyRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)

  const [month, setMonth] = useState(curMonth)
  const [year, setYear] = useState(curYear)
  const [source, setSource] = useState<EnergySource>('GRID')
  const [consumption, setConsumption] = useState('')
  const [production, setProduction] = useState('')
  const [cost, setCost] = useState('')
  const [notes, setNotes] = useState('')

  const loadRecords = useCallback(async () => {
    try {
      const res = await fetch('/api/energia')
      if (res.ok) setRecords(await res.json())
    } catch { /* ignore */ }
    setLoading(false)
  }, [])

  useEffect(() => { loadRecords() }, [loadRecords])

  function resetForm() {
    setEditId(null)
    setMonth(curMonth)
    setYear(curYear)
    setSource('GRID')
    setConsumption('')
    setProduction('')
    setCost('')
    setNotes('')
    setShowForm(false)
  }

  function openEdit(r: EnergyRecord) {
    setEditId(r.id)
    setMonth(r.month)
    setYear(r.year)
    setSource(r.source)
    setConsumption(String(r.consumption))
    setProduction(String(r.production))
    setCost(String(r.cost))
    setNotes(r.notes)
    setShowForm(true)
  }

  async function handleSave() {
    if (!consumption && !cost) return
    setSaving(true)
    const body = {
      month, year, source,
      consumption: Number(consumption) || 0,
      production: Number(production) || 0,
      cost: Number(cost) || 0,
      notes,
    }
    try {
      if (editId) {
        const res = await fetch(`/api/energia/${editId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (res.ok) {
          const updated = await res.json()
          setRecords(prev => prev.map(r => r.id === editId ? updated : r))
        }
      } else {
        const res = await fetch('/api/energia', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (res.ok) {
          const created = await res.json()
          setRecords(prev => [created, ...prev.filter(r => !(r.month === month && r.year === year))])
        }
      }
    } catch { /* ignore */ }
    setSaving(false)
    resetForm()
  }

  async function handleDelete(id: string) {
    setRecords(prev => prev.filter(r => r.id !== id))
    await fetch(`/api/energia/${id}`, { method: 'DELETE' })
  }

  // Agregados
  const yearRecords = records.filter(r => r.year === curYear)
  const totalCost = yearRecords.reduce((s, r) => s + r.cost, 0)
  const totalConsumption = yearRecords.reduce((s, r) => s + r.consumption, 0)
  const totalProduction = yearRecords.reduce((s, r) => s + r.production, 0)
  const selfSufficiency = totalConsumption > 0 ? Math.min(100, Math.round((totalProduction / totalConsumption) * 100)) : 0

  const lastRecord = [...yearRecords].sort((a, b) => b.month - a.month)[0]

  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v)

  if (loading) return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-4">
      {[1,2,3].map(i => <div key={i} className="h-24 bg-slate-100 rounded-2xl animate-pulse"/>)}
    </div>
  )

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Energia</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Consumo, produção e custo energético da propriedade</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true) }}
          className="flex items-center gap-1.5 bg-[#16a34a] text-white text-sm font-semibold px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl hover:bg-[#15803d] transition-colors flex-shrink-0"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
          <span className="hidden sm:inline">Registrar</span>
        </button>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Custo anual', value: fmt(totalCost), sub: `${curYear}`, icon: '💸', color: 'text-red-600' },
          { label: 'Consumo', value: `${totalConsumption.toLocaleString('pt-BR')} kWh`, sub: `${curYear}`, icon: '⚡', color: 'text-blue-600' },
          { label: 'Produção solar', value: `${totalProduction.toLocaleString('pt-BR')} kWh`, sub: `gerado`, icon: '☀️', color: 'text-amber-600' },
          { label: 'Autossuficiência', value: `${selfSufficiency}%`, sub: selfSufficiency >= 50 ? 'Excelente' : selfSufficiency > 0 ? 'Parcial' : 'Sem solar', icon: '🌿', color: selfSufficiency >= 50 ? 'text-emerald-600' : 'text-slate-500' },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-2xl border border-slate-200 p-4">
            <div className="text-lg mb-1">{c.icon}</div>
            <div className={`text-lg sm:text-xl font-black ${c.color}`}>{c.value}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">{c.label}</div>
            <div className="text-[10px] text-slate-300">{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Último registro */}
      {lastRecord && (
        <div className="bg-gradient-to-r from-[#052e16] to-[#14532d] rounded-2xl p-5 text-white flex items-center gap-5">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${SOURCE_META[lastRecord.source as EnergySource]?.bg}`}>
            {SOURCE_META[lastRecord.source as EnergySource]?.icon}
          </div>
          <div className="flex-1">
            <div className="text-xs text-white/60 mb-0.5">{MONTHS[lastRecord.month - 1]}/{lastRecord.year} — {SOURCE_META[lastRecord.source as EnergySource]?.label}</div>
            <div className="font-bold text-white">{lastRecord.consumption} kWh consumidos · {fmt(lastRecord.cost)}</div>
            {lastRecord.production > 0 && (
              <div className="text-xs text-emerald-300 mt-0.5">{lastRecord.production} kWh gerados via solar</div>
            )}
          </div>
          <div className="text-xs text-white/40">Último registro</div>
        </div>
      )}

      {/* Histórico */}
      {records.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Registros</div>
          </div>
          <div className="divide-y divide-slate-50">
            {[...records].sort((a, b) => b.year !== a.year ? b.year - a.year : b.month - a.month).map(r => {
              const meta = SOURCE_META[r.source as EnergySource] || SOURCE_META.GRID
              return (
                <div key={r.id} className="px-5 py-4 flex items-center gap-4">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${meta.bg}`}>
                    {meta.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-slate-800">{MONTHS[r.month - 1]}/{r.year} · {meta.label}</div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {r.consumption > 0 && <span>{r.consumption} kWh</span>}
                      {r.production > 0 && <span className="text-emerald-600 ml-2">+{r.production} kWh gerados</span>}
                      {r.notes && <span className="ml-2 text-slate-300">· {r.notes}</span>}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-bold text-sm text-slate-800">{fmt(r.cost)}</div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => openEdit(r)} className="w-7 h-7 rounded-lg bg-slate-50 hover:bg-slate-100 flex items-center justify-center transition-colors">
                      <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                    </button>
                    <button onClick={() => handleDelete(r.id)} className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors">
                      <svg className="w-3.5 h-3.5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <div className="text-4xl mb-3">⚡</div>
          <h2 className="font-bold text-slate-800 mb-1">Nenhum registro ainda</h2>
          <p className="text-sm text-slate-400 mb-4">Registre seu consumo e custo energético mensal para acompanhar a evolução.</p>
          <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 bg-[#16a34a] text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-[#15803d] transition-colors text-sm">
            Registrar primeiro mês
          </button>
        </div>
      )}

      {/* Dica ESG */}
      {totalProduction === 0 && records.length >= 2 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
          <span className="text-xl flex-shrink-0">💡</span>
          <div>
            <div className="font-semibold text-amber-800 text-sm">Energia solar pode melhorar seu AgroRate</div>
            <div className="text-xs text-amber-700 mt-0.5">Propriedades com geração própria têm pontuação ESG maior. Quando instalar, registre a produção aqui.</div>
          </div>
        </div>
      )}

      {/* Modal de formulário */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-900">{editId ? 'Editar registro' : 'Registrar energia'}</h2>
              <button onClick={resetForm} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Mês</label>
                  <select value={month} onChange={e => setMonth(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#16a34a]">
                    {MONTHS.map((m, i) => <option key={m} value={i+1}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Ano</label>
                  <select value={year} onChange={e => setYear(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#16a34a]">
                    {[curYear, curYear - 1, curYear - 2].map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Fonte de energia</label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(SOURCE_META) as EnergySource[]).map(s => (
                    <button key={s} type="button" onClick={() => setSource(s)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-semibold transition-colors ${source === s ? 'border-[#16a34a] bg-green-50 text-[#16a34a]' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                      <span>{SOURCE_META[s].icon}</span>
                      <span className="text-xs">{SOURCE_META[s].label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Consumo (kWh)</label>
                  <input type="number" min="0" step="0.1" value={consumption} onChange={e => setConsumption(e.target.value)}
                    placeholder="Ex: 450"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#16a34a]"/>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Custo (R$)</label>
                  <input type="number" min="0" step="0.01" value={cost} onChange={e => setCost(e.target.value)}
                    placeholder="Ex: 380"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#16a34a]"/>
                </div>
              </div>

              {(source === 'SOLAR' || source === 'HIBRIDO') && (
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Produção solar (kWh)</label>
                  <input type="number" min="0" step="0.1" value={production} onChange={e => setProduction(e.target.value)}
                    placeholder="Ex: 200"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#16a34a]"/>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Observações <span className="font-normal normal-case text-slate-400">(opcional)</span></label>
                <input type="text" value={notes} onChange={e => setNotes(e.target.value)}
                  placeholder="Ex: fatura de maio, gerador 8h/dia..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#16a34a]"/>
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={resetForm} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                Cancelar
              </button>
              <button onClick={handleSave} disabled={saving || (!consumption && !cost)}
                className="flex-1 py-2.5 rounded-xl bg-[#16a34a] text-white text-sm font-semibold hover:bg-[#15803d] transition-colors disabled:opacity-50">
                {saving ? 'Salvando...' : editId ? 'Salvar' : 'Registrar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const CULTURAS = ['Soja', 'Milho', 'Café', 'Cana-de-açúcar', 'Feijão', 'Trigo', 'Algodão', 'Arroz', 'Sorgo', 'Girassol', 'Outra']
const ESTADOS = ['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO']

type Fase = { nome: string; tipo: string; inicio_dia: number; duracao_dias: number; descricao: string; insumos: string | null; prioridade: 'alta' | 'media' | 'baixa'; responsavel?: string | null }
type QuantumMeta = { solver: string; iterations: number; energy: number; convergence: number; membersAnalyzed: number; optimized: boolean }
type Safra = { cultura: string; area: number; duracao_dias: number; fases: Fase[]; observacoes: string; quantum?: QuantumMeta }

const PRIO_COR = { alta: 'bg-red-100 text-red-700 border-red-200', media: 'bg-amber-100 text-amber-700 border-amber-200', baixa: 'bg-slate-100 text-slate-600 border-slate-200' }

export default function PlanejamentoSafraPage() {
  const router = useRouter()
  const [form, setForm] = useState({ cultura: '', outraCultura: '', area: '', dataInicio: new Date().toISOString().split('T')[0], estado: 'SP' })
  const [loading, setLoading] = useState(false)
  const [loadingQuantum, setLoadingQuantum] = useState(false)
  const [safra, setSafra] = useState<Safra | null>(null)
  const [criando, setCriando] = useState(false)
  const [criados, setCriados] = useState(0)

  async function planejar(e: React.SyntheticEvent) {
    e.preventDefault()
    setLoading(true)
    setSafra(null)
    try {
      const cultura = form.cultura === 'Outra' ? form.outraCultura : form.cultura
      const res = await fetch('/api/ai/safra', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cultura, area: Number(form.area), dataInicio: form.dataInicio, estado: form.estado }),
      })
      if (!res.ok) throw new Error('Erro ao planejar')
      setSafra(await res.json())
    } catch (e: any) {
      alert(e.message || 'Erro ao gerar planejamento')
    } finally {
      setLoading(false)
    }
  }

  async function planejarQuantum(e: React.SyntheticEvent) {
    e.preventDefault()
    setLoadingQuantum(true)
    setSafra(null)
    try {
      const cultura = form.cultura === 'Outra' ? form.outraCultura : form.cultura
      const res = await fetch('/api/ai/quantum-safra', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cultura, area: Number(form.area), dataInicio: form.dataInicio, estado: form.estado }),
      })
      if (!res.ok) throw new Error('Erro ao otimizar')
      setSafra(await res.json())
    } catch (e: any) {
      alert(e.message || 'Erro ao gerar planejamento quântico')
    } finally {
      setLoadingQuantum(false)
    }
  }

  async function importarAtividades() {
    if (!safra) return
    setCriando(true)
    setCriados(0)
    try {
      const propsRes = await fetch('/api/properties')
      const props = await propsRes.json()
      const propertyId = props[0]?.id
      if (!propertyId) throw new Error('Nenhuma propriedade encontrada')

      const inicio = new Date(form.dataInicio)
      let count = 0
      for (const fase of safra.fases) {
        const startDate = new Date(inicio)
        startDate.setDate(startDate.getDate() + fase.inicio_dia - 1)
        const endDate = new Date(startDate)
        endDate.setDate(endDate.getDate() + fase.duracao_dias)

        await fetch('/api/activities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            propertyId,
            type: fase.tipo,
            description: `${fase.descricao}${fase.insumos ? ` | Insumos: ${fase.insumos}` : ''}`,
            status: 'PENDING',
            executor: 'INTERNAL',
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0],
          }),
        })
        count++
        setCriados(count)
        await new Promise(r => setTimeout(r, 100))
      }
      alert(`✅ ${count} atividades criadas com sucesso!`)
      router.push('/dashboard/operacoes')
    } catch (e: any) {
      alert('Erro ao importar: ' + e.message)
    } finally {
      setCriando(false)
    }
  }

  const inputCls = 'w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#16a34a] focus:border-transparent transition-all'
  const labelCls = 'block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5'

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/operacoes" className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 transition-all">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="m15 19-7-7 7-7" /></svg>
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Planejamento de Safra</h1>
            <span className="text-[10px] font-bold bg-[#16a34a] text-white px-2 py-0.5 rounded-full uppercase tracking-wide">IA</span>
          </div>
          <p className="text-sm text-slate-500">Cronograma completo gerado por inteligência artificial</p>
        </div>
      </div>

      {/* Formulário */}
      <form onSubmit={planejar} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <h2 className="font-semibold text-slate-900">Configure sua safra</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Cultura *</label>
            <select value={form.cultura} onChange={e => setForm(f => ({ ...f, cultura: e.target.value }))} required className={inputCls}>
              <option value="">Selecionar...</option>
              {CULTURAS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          {form.cultura === 'Outra' && (
            <div>
              <label className={labelCls}>Qual cultura?</label>
              <input value={form.outraCultura} onChange={e => setForm(f => ({ ...f, outraCultura: e.target.value }))} placeholder="Ex: Mandioca..." className={inputCls} required />
            </div>
          )}
          <div>
            <label className={labelCls}>Área (hectares) *</label>
            <input type="number" min="0.1" step="0.1" value={form.area} onChange={e => setForm(f => ({ ...f, area: e.target.value }))} required placeholder="Ex: 50" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Data de início</label>
            <input type="date" value={form.dataInicio} onChange={e => setForm(f => ({ ...f, dataInicio: e.target.value }))} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Estado</label>
            <select value={form.estado} onChange={e => setForm(f => ({ ...f, estado: e.target.value }))} className={inputCls}>
              {ESTADOS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button type="submit" disabled={loading || loadingQuantum} className="w-full sm:w-auto bg-[#16a34a] text-white font-semibold px-8 py-3 rounded-xl hover:bg-[#15803d] transition-colors disabled:opacity-50 flex items-center gap-2 justify-center">
            {loading ? (
              <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Gerando cronograma...</>
            ) : (
              <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>Gerar com IA</>
            )}
          </button>
          <button type="button" onClick={planejarQuantum} disabled={loading || loadingQuantum || !form.cultura || !form.area} className="w-full sm:w-auto bg-indigo-600 text-white font-semibold px-8 py-3 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2 justify-center">
            {loadingQuantum ? (
              <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Otimizando...</>
            ) : (
              <>⚛️ Otimizar com IA Quântica</>
            )}
          </button>
        </div>
      </form>

      {/* Resultado */}
      {safra && (
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-[#0f172a] to-[#1e293b] rounded-2xl p-5 flex items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold text-[#16a34a] uppercase tracking-wide mb-1">Planejamento gerado</div>
              <h2 className="text-lg font-bold text-white">{safra.cultura} — {safra.area} ha</h2>
              <p className="text-sm text-slate-400">{safra.fases.length} fases · {safra.duracao_dias} dias de safra</p>
            </div>
            <button
              onClick={importarAtividades}
              disabled={criando}
              className="flex-shrink-0 bg-[#16a34a] hover:bg-[#15803d] text-white text-sm font-bold px-4 py-3 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {criando ? `Criando ${criados}/${safra.fases.length}...` : (
                <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>Importar atividades</>
              )}
            </button>
          </div>

          {safra.quantum?.optimized && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-2xl px-5 py-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base">⚛️</span>
                <span className="text-xs font-bold text-indigo-700 uppercase tracking-wide">Otimização Quântica</span>
                <span className="text-[10px] bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full font-semibold">{safra.quantum.solver}</span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="text-lg font-bold text-indigo-700">{safra.quantum.convergence}%</div>
                  <div className="text-[10px] text-indigo-500">convergência</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-indigo-700">{safra.quantum.iterations.toLocaleString()}</div>
                  <div className="text-[10px] text-indigo-500">iterações</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-indigo-700">{safra.quantum.membersAnalyzed}</div>
                  <div className="text-[10px] text-indigo-500">membros analisados</div>
                </div>
              </div>
            </div>
          )}

          {safra.observacoes && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 flex items-start gap-3">
              <span className="text-lg">💡</span>
              <p className="text-sm text-amber-800">{safra.observacoes}</p>
            </div>
          )}

          <div className="space-y-3">
            {safra.fases.map((fase, i) => {
              const inicioDate = new Date(form.dataInicio)
              inicioDate.setDate(inicioDate.getDate() + fase.inicio_dia - 1)
              return (
                <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-600 flex-shrink-0">{i + 1}</div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-slate-900">{fase.nome}</h3>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${PRIO_COR[fase.prioridade]}`}>
                            {fase.prioridade === 'alta' ? '🔴' : fase.prioridade === 'media' ? '🟡' : '🟢'} {fase.prioridade}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">{fase.tipo}</div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-xs font-semibold text-slate-700">{inicioDate.toLocaleDateString('pt-BR')}</div>
                      <div className="text-[10px] text-slate-400">{fase.duracao_dias} dias</div>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 ml-11">{fase.descricao}</p>
                  {fase.responsavel && (
                    <div className="ml-11 mt-2 flex items-center gap-1.5">
                      <span className="text-[10px] bg-indigo-50 text-indigo-600 border border-indigo-200 px-2 py-0.5 rounded-full font-semibold">⚛️ {fase.responsavel}</span>
                    </div>
                  )}
                  {fase.insumos && (
                    <div className="ml-11 mt-2 text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-1.5">
                      <span className="font-semibold">Insumos:</span> {fase.insumos}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

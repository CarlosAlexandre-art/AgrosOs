import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import CostPieChart from '@/components/CostPieChart'

const CATEGORY_LABEL: Record<string, string> = {
  INSUMO: 'Insumo',
  MAO_DE_OBRA: 'Mão de obra',
  MAQUINARIO: 'Maquinário',
  AGROLINK: 'AgroCore',
  OUTROS: 'Outros',
}
const CATEGORY_COLOR: Record<string, string> = {
  INSUMO: 'bg-green-100 text-green-700',
  MAO_DE_OBRA: 'bg-blue-100 text-blue-700',
  MAQUINARIO: 'bg-orange-100 text-orange-700',
  AGROLINK: 'bg-purple-100 text-purple-700',
  OUTROS: 'bg-slate-100 text-slate-600',
}

export default async function FinanceiroPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: {
      properties: {
        include: {
          costs: { orderBy: { date: 'desc' }, include: { activity: true } },
          fields: true,
        },
      },
    },
  })

  const property = dbUser?.properties[0]
  const costs = property?.costs || []
  const totalGeral = costs.reduce((acc, c) => acc + Number(c.amount), 0)
  const sizeHa = Number(property?.sizeHectares || 0)
  const costPerHa = sizeHa > 0 ? totalGeral / sizeHa : 0

  // Agrupamento por categoria
  const byCat: Record<string, number> = {}
  for (const c of costs) {
    byCat[c.category] = (byCat[c.category] || 0) + Number(c.amount)
  }


  // Mês atual
  const now = new Date()
  const mesAtual = costs.filter((c) => {
    const d = new Date(c.date)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).reduce((acc, c) => acc + Number(c.amount), 0)

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Financeiro</h1>
          <p className="text-sm text-slate-500 mt-0.5">Controle de custos e análise por categoria</p>
        </div>
        <Link href="/dashboard/financeiro/novo" className="flex items-center gap-1.5 bg-[#16a34a] text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-[#15803d] transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          Lançar custo
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total geral', value: `R$ ${totalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, sub: 'todos os lançamentos', icon: '💰', color: 'text-slate-900' },
          { label: 'Mês atual', value: `R$ ${mesAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, sub: now.toLocaleString('pt-BR', { month: 'long', year: 'numeric' }), icon: '📅', color: 'text-blue-700' },
          { label: 'Custo / ha', value: costPerHa > 0 ? `R$ ${costPerHa.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}` : '—', sub: `${sizeHa} ha cadastrados`, icon: '🌾', color: 'text-green-700' },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">{k.icon}</span>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{k.label}</span>
            </div>
            <div className={`text-2xl font-bold ${k.color}`}>{k.value}</div>
            <div className="text-xs text-slate-400 mt-1">{k.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Gráfico de pizza interativo */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Por categoria</h2>
          <CostPieChart
            data={Object.entries(byCat).map(([category, total]) => ({ category, total }))}
          />
        </div>

        {/* Lista de lançamentos */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Lançamentos</h2>
            <span className="text-xs text-slate-400">{costs.length} registros</span>
          </div>
          {costs.length === 0 ? (
            <div className="py-16 text-center">
              <div className="text-4xl mb-3">💰</div>
              <p className="text-sm text-slate-400">Nenhum custo registrado.</p>
              <Link href="/dashboard/financeiro/novo" className="mt-3 inline-block text-sm text-[#16a34a] font-medium hover:underline">Lançar primeiro custo →</Link>
            </div>
          ) : (
            <>
              <div className="px-6 py-3 border-b border-slate-50 grid grid-cols-12 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                <div className="col-span-4">Descrição</div>
                <div className="col-span-3 hidden md:block">Categoria</div>
                <div className="col-span-3">Data</div>
                <div className="col-span-2 text-right">Valor</div>
              </div>
              <div className="divide-y divide-slate-50">
                {costs.map((c: any) => (
                  <div key={c.id} className="px-6 py-3.5 grid grid-cols-12 items-center hover:bg-slate-50 transition-colors">
                    <div className="col-span-4 min-w-0">
                      <div className="text-sm font-medium text-slate-900 truncate">{c.description || CATEGORY_LABEL[c.category]}</div>
                      {c.activity && <div className="text-xs text-slate-400 truncate">{c.activity.type}</div>}
                    </div>
                    <div className="col-span-3 hidden md:block">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${CATEGORY_COLOR[c.category]}`}>{CATEGORY_LABEL[c.category]}</span>
                    </div>
                    <div className="col-span-3 text-sm text-slate-500">{new Date(c.date).toLocaleDateString('pt-BR')}</div>
                    <div className="col-span-2 text-sm font-semibold text-slate-900 text-right">R$ {Number(c.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                  </div>
                ))}
              </div>
              <div className="px-6 py-3.5 border-t border-slate-100 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-600">Total</span>
                <span className="text-sm font-bold text-slate-900">R$ {totalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

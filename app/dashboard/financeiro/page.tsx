import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import CostPieChart from '@/components/CostPieChart'
import FinanceiroExport from '@/components/reports/FinanceiroExport'
import NovaReceitaButton from './NovaReceitaButton'

const CATEGORY_LABEL: Record<string, string> = {
  INSUMO: 'Insumo', MAO_DE_OBRA: 'Mão de obra', MAQUINARIO: 'Maquinário',
  AGROLINK: 'AgroCore', OUTROS: 'Outros',
}
const REVENUE_CAT_LABEL: Record<string, string> = {
  VENDA: 'Venda', SERVICO: 'Serviço', SUBSIDIO: 'Subsídio',
  ARRENDAMENTO: 'Arrendamento', OUTROS: 'Outros',
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
          revenues: { orderBy: { date: 'desc' } },
          fields: true,
        },
      },
    },
  })

  const plan = (dbUser as any)?.plan ?? 'starter'
  const isPago = ['pro', 'enterprise', 'admin'].includes(plan)

  const property = dbUser?.properties[0]
  const costs = property?.costs || []
  const revenues = isPago ? ((property as any)?.revenues || []) : []
  const sizeHa = Number(property?.sizeHectares || 0)

  const totalCosts = costs.reduce((acc: number, c: any) => acc + Number(c.amount), 0)
  const totalRevenues = revenues.reduce((acc: number, r: any) => acc + Number(r.amount), 0)
  const resultado = totalRevenues - totalCosts
  const costPerHa = sizeHa > 0 ? totalCosts / sizeHa : 0
  const revenuePerHa = sizeHa > 0 ? totalRevenues / sizeHa : 0
  const lucroPerHa = sizeHa > 0 ? resultado / sizeHa : 0

  const now = new Date()
  const mesAtualCosts = costs.filter((c: any) => {
    const d = new Date(c.date)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).reduce((acc: number, c: any) => acc + Number(c.amount), 0)
  const mesAtualRevenues = revenues.filter((r: any) => {
    const d = new Date(r.date)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).reduce((acc: number, r: any) => acc + Number(r.amount), 0)

  const byCat: Record<string, number> = {}
  for (const c of costs) byCat[c.category] = (byCat[c.category] || 0) + Number(c.amount)

  const isPositive = resultado >= 0

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Financeiro</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 hidden sm:block">Receitas, custos e resultado por hectare</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="hidden sm:flex items-center gap-2">
            {isPago ? (
              <FinanceiroExport
                propertyName={property?.name || 'Fazenda'}
                costs={costs.map((c: any) => ({ ...c, amount: Number(c.amount), date: c.date.toISOString() }))}
                totalGeral={totalCosts}
                costPerHa={costPerHa}
                sizeHa={sizeHa}
              />
            ) : (
              <Link href="/dashboard/planos" className="flex items-center gap-1.5 border border-slate-200 text-slate-400 text-sm font-semibold px-4 py-2.5 rounded-xl hover:border-amber-300 hover:text-amber-600 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                Exportar (Pro)
              </Link>
            )}
            {isPago && <NovaReceitaButton propertyId={property?.id || ''} />}
            {!isPago && (
              <Link href="/dashboard/planos" className="flex items-center gap-1.5 border border-slate-200 text-slate-400 text-sm font-semibold px-4 py-2.5 rounded-xl hover:border-amber-300 hover:text-amber-600 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                Receitas (Pro)
              </Link>
            )}
          </div>
          <Link href="/dashboard/financeiro/novo" className="flex items-center gap-1.5 bg-[#16a34a] text-white text-sm font-semibold px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl hover:bg-[#15803d] transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            <span className="hidden sm:inline">Lançar custo</span>
          </Link>
        </div>
      </div>

      {/* Resultado líquido destaque */}
      <div className={`rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${isPositive ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
        <div>
          <div className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: isPositive ? '#16a34a' : '#dc2626' }}>
            {isPositive ? '📈 Resultado positivo' : '📉 Resultado negativo'}
          </div>
          <div className={`text-3xl font-bold ${isPositive ? 'text-green-800' : 'text-red-800'}`}>
            {isPositive ? '+' : ''}R$ {resultado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-sm mt-1" style={{ color: isPositive ? '#15803d' : '#b91c1c' }}>
            Receitas − Custos totais
          </div>
        </div>
        <div className="flex gap-6 text-center">
          <div>
            <div className="text-xs text-slate-500 mb-1">Receitas</div>
            <div className="text-lg font-bold text-green-700">R$ {totalRevenues.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</div>
          </div>
          <div className="w-px bg-slate-200" />
          <div>
            <div className="text-xs text-slate-500 mb-1">Custos</div>
            <div className="text-lg font-bold text-red-700">R$ {totalCosts.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</div>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Receita/ha', value: revenuePerHa > 0 ? `R$ ${revenuePerHa.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}` : '—', icon: '🌿', color: 'text-green-700' },
          { label: 'Custo/ha', value: costPerHa > 0 ? `R$ ${costPerHa.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}` : '—', icon: '💸', color: 'text-red-700' },
          { label: 'Lucro/ha', value: sizeHa > 0 ? `R$ ${lucroPerHa.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}` : '—', icon: '📊', color: lucroPerHa >= 0 ? 'text-green-700' : 'text-red-700' },
          { label: 'Resultado do mês', value: `R$ ${(mesAtualRevenues - mesAtualCosts).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`, icon: '📅', color: (mesAtualRevenues - mesAtualCosts) >= 0 ? 'text-green-700' : 'text-red-700' },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-2xl border border-slate-200 p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <span>{k.icon}</span>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{k.label}</span>
            </div>
            <div className={`text-xl font-bold ${k.color}`}>{k.value}</div>
            {sizeHa > 0 && <div className="text-xs text-slate-400 mt-0.5">{sizeHa} ha</div>}
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Gráfico */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Custos por categoria</h2>
          <CostPieChart data={Object.entries(byCat).map(([category, total]) => ({ category, total }))} />
        </div>

        {/* Receitas */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Receitas</h2>
            <span className="text-xs text-green-700 font-bold bg-green-50 px-2 py-0.5 rounded-full">{revenues.length} entradas</span>
          </div>
          {revenues.length === 0 ? (
            <div className="py-10 text-center">
              <div className="text-3xl mb-2">💵</div>
              <p className="text-xs text-slate-400">Nenhuma receita registrada.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50 max-h-80 overflow-y-auto">
              {revenues.map((r: any) => (
                <div key={r.id} className="px-5 py-3 flex items-center justify-between hover:bg-slate-50">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-slate-900 truncate">{r.description || REVENUE_CAT_LABEL[r.category] || r.category}</div>
                    <div className="text-xs text-slate-400">{new Date(r.date).toLocaleDateString('pt-BR')}</div>
                  </div>
                  <div className="text-sm font-bold text-green-700 ml-3 flex-shrink-0">
                    +R$ {Number(r.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="px-5 py-3 border-t border-slate-100 flex justify-between">
            <span className="text-sm font-semibold text-slate-600">Total</span>
            <span className="text-sm font-bold text-green-700">R$ {totalRevenues.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        {/* Custos */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Custos</h2>
            <span className="text-xs text-red-700 font-bold bg-red-50 px-2 py-0.5 rounded-full">{costs.length} saídas</span>
          </div>
          {costs.length === 0 ? (
            <div className="py-10 text-center">
              <div className="text-3xl mb-2">💰</div>
              <p className="text-xs text-slate-400">Nenhum custo registrado.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50 max-h-80 overflow-y-auto">
              {costs.map((c: any) => (
                <div key={c.id} className="px-5 py-3 flex items-center justify-between hover:bg-slate-50">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-slate-900 truncate">{c.description || CATEGORY_LABEL[c.category]}</div>
                    <div className="text-xs text-slate-400">{new Date(c.date).toLocaleDateString('pt-BR')}</div>
                  </div>
                  <div className="text-sm font-bold text-red-700 ml-3 flex-shrink-0">
                    −R$ {Number(c.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="px-5 py-3 border-t border-slate-100 flex justify-between">
            <span className="text-sm font-semibold text-slate-600">Total</span>
            <span className="text-sm font-bold text-red-700">R$ {totalCosts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

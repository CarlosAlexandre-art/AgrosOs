'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const COLORS: Record<string, string> = {
  INSUMO: '#16a34a',
  MAO_DE_OBRA: '#3b82f6',
  MAQUINARIO: '#f97316',
  AGROLINK: '#a855f7',
  OUTROS: '#94a3b8',
}

const LABELS: Record<string, string> = {
  INSUMO: 'Insumo',
  MAO_DE_OBRA: 'Mão de obra',
  MAQUINARIO: 'Maquinário',
  AGROLINK: 'AgroCore',
  OUTROS: 'Outros',
}

interface Props {
  data: { category: string; total: number }[]
}

export default function CostPieChart({ data }: Props) {
  if (!data.length) return (
    <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
      Nenhum dado disponível
    </div>
  )

  const chartData = data.map(d => ({
    name: LABELS[d.category] || d.category,
    value: d.total,
    category: d.category,
  }))

  const total = data.reduce((acc, d) => acc + d.total, 0)

  return (
    <div className="space-y-4">
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={90}
            paddingAngle={3}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[entry.category] || '#94a3b8'} stroke="none" />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => [`R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, '']}
            contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Legenda customizada */}
      <div className="space-y-2">
        {chartData.map(d => {
          const pct = total > 0 ? ((d.value / total) * 100).toFixed(0) : '0'
          return (
            <div key={d.category} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[d.category] || '#94a3b8' }} />
                <span className="text-xs text-slate-600">{d.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">{pct}%</span>
                <span className="text-xs font-semibold text-slate-900">R$ {d.value.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

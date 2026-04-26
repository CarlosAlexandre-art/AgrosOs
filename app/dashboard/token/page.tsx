'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type AgroToken = {
  id: string
  type: 'SAFRA' | 'MATERIAL' | 'MAQUINARIO'
  status: 'DRAFT' | 'PENDING_REVIEW' | 'ACTIVE' | 'REDEEMED' | 'CANCELLED'
  title: string
  description: string | null
  totalValue: number
  tokenPrice: number
  totalTokens: number
  soldTokens: number
  expectedReturn: number | null
  periodMonths: number | null
  commodity: string | null
  materialType: string | null
  machineType: string | null
  deliveryDate: string | null
  createdAt: string
  property: { name: string }
}

const TYPE_LABEL: Record<string, string> = {
  SAFRA: 'Safra',
  MATERIAL: 'Material',
  MAQUINARIO: 'Maquinário',
}

const TYPE_COLOR: Record<string, string> = {
  SAFRA: 'bg-green-100 text-green-800',
  MATERIAL: 'bg-amber-100 text-amber-800',
  MAQUINARIO: 'bg-blue-100 text-blue-800',
}

const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Rascunho',
  PENDING_REVIEW: 'Em análise',
  ACTIVE: 'Ativo',
  REDEEMED: 'Resgatado',
  CANCELLED: 'Cancelado',
}

const STATUS_COLOR: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  PENDING_REVIEW: 'bg-amber-100 text-amber-700',
  ACTIVE: 'bg-green-100 text-green-700',
  REDEEMED: 'bg-blue-100 text-blue-700',
  CANCELLED: 'bg-red-100 text-red-700',
}

const TYPE_ICON: Record<string, React.ReactNode> = {
  SAFRA: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
    </svg>
  ),
  MATERIAL: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
    </svg>
  ),
  MAQUINARIO: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
    </svg>
  ),
}

function fmt(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)
}

export default function TokenPage() {
  const [tokens, setTokens] = useState<AgroToken[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'ALL' | 'SAFRA' | 'MATERIAL' | 'MAQUINARIO'>('ALL')

  useEffect(() => {
    fetch('/api/tokens')
      .then(r => r.json())
      .then(d => { setTokens(Array.isArray(d) ? d : []); setLoading(false) })
  }, [])

  const filtered = filter === 'ALL' ? tokens : tokens.filter(t => t.type === filter)

  const stats = {
    total: tokens.length,
    ativos: tokens.filter(t => t.status === 'ACTIVE').length,
    captado: tokens.reduce((s, t) => s + (t.soldTokens * t.tokenPrice), 0),
    disponivel: tokens.reduce((s, t) => s + ((t.totalTokens - t.soldTokens) * t.tokenPrice), 0),
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">AgroToken</h1>
          <p className="text-sm text-slate-500 mt-1">Tokenize seus ativos agrícolas e capte investidores</p>
        </div>
        <Link
          href="/dashboard/token/novo"
          className="flex items-center gap-2 bg-[#16a34a] text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-[#15803d] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Novo token
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total emitidos', value: stats.total.toString(), sub: 'tokens criados' },
          { label: 'Ativos', value: stats.ativos.toString(), sub: 'em circulação' },
          { label: 'Captado', value: fmt(stats.captado), sub: 'de investidores' },
          { label: 'Disponível', value: fmt(stats.disponivel), sub: 'para captar' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-200 p-4">
            <div className="text-xs text-slate-500 font-medium">{s.label}</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{s.value}</div>
            <div className="text-xs text-slate-400 mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Infobanner */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
        <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
        <div className="text-sm text-amber-800">
          <span className="font-semibold">Fase piloto.</span> Os tokens criados aqui são simulados. A integração com blockchain Polygon e distribuição regulada via CVM estará disponível em breve. Crie e planeje agora — migraremos automaticamente quando a infraestrutura estiver pronta.
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        {(['ALL', 'SAFRA', 'MATERIAL', 'MAQUINARIO'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === f ? 'bg-[#16a34a] text-white' : 'bg-white border border-gray-200 text-slate-600 hover:border-[#16a34a]'}`}
          >
            {f === 'ALL' ? 'Todos' : TYPE_LABEL[f]}
          </button>
        ))}
      </div>

      {/* Lista */}
      {loading ? (
        <div className="text-center py-16 text-slate-400">Carregando...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 2.625c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125m16.5 5.625c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
            </svg>
          </div>
          <p className="text-slate-500 font-medium">Nenhum token criado ainda</p>
          <p className="text-slate-400 text-sm mt-1 mb-4">Tokenize sua safra, materiais ou maquinário</p>
          <Link href="/dashboard/token/novo" className="inline-flex items-center gap-2 bg-[#16a34a] text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-[#15803d] transition-colors">
            Criar primeiro token
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filtered.map(t => {
            const pct = t.totalTokens > 0 ? Math.round((t.soldTokens / t.totalTokens) * 100) : 0
            const captado = t.soldTokens * t.tokenPrice
            return (
              <Link
                key={t.id}
                href={`/dashboard/token/${t.id}`}
                className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-[#16a34a] hover:shadow-sm transition-all group"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${TYPE_COLOR[t.type].replace('text-', 'text-').split(' ')[0]} bg-opacity-50`}
                      style={{ backgroundColor: t.type === 'SAFRA' ? '#dcfce7' : t.type === 'MATERIAL' ? '#fef3c7' : '#dbeafe' }}
                    >
                      <span className={TYPE_COLOR[t.type].split(' ')[1]}>
                        {TYPE_ICON[t.type]}
                      </span>
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 text-sm group-hover:text-[#16a34a] transition-colors">{t.title}</div>
                      <div className="text-xs text-slate-400">{t.property.name}</div>
                    </div>
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLOR[t.type]}`}>{TYPE_LABEL[t.type]}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[t.status]}`}>{STATUS_LABEL[t.status]}</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div>
                    <div className="text-xs text-slate-400">Valor total</div>
                    <div className="text-sm font-bold text-slate-900">{fmt(Number(t.totalValue))}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Captado</div>
                    <div className="text-sm font-bold text-green-700">{fmt(captado)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Rendimento</div>
                    <div className="text-sm font-bold text-slate-900">
                      {t.expectedReturn ? `${t.expectedReturn}%` : '—'}{t.periodMonths ? ` / ${t.periodMonths}m` : ''}
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>{t.soldTokens} de {t.totalTokens} tokens vendidos</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#16a34a] rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* Bottom CTA */}
      {tokens.length > 0 && (
        <div className="bg-gradient-to-br from-[#0f172a] to-[#1e3a5f] rounded-2xl p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
            </svg>
            </div>
            <div className="font-semibold">Integração Blockchain em breve</div>
          </div>
          <p className="text-sm text-white/70">
            Em breve seus tokens serão publicados na rede Polygon com contratos ERC-1400, distribuição via plataforma regulada pela CVM e rastreabilidade on-chain de toda sua produção.
          </p>
        </div>
      )}
    </div>
  )
}

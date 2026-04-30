'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type Investment = {
  id: string
  quantity: number
  pricePerToken: number
  totalAmount: number
  createdAt: string
  token: {
    id: string
    title: string
    type: string
    status: string
    expectedReturn: number | null
    periodMonths: number | null
    deliveryDate: string | null
    tokenPrice: number
    totalTokens: number
    soldTokens: number
    property: { name: string }
  }
}

type Portfolio = {
  transactions: Investment[]
  totalInvestido: number
  totalTokens: number
  ativos: number
  resgatados: number
}

const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Rascunho', PENDING_REVIEW: 'Em análise', ACTIVE: 'Ativo', REDEEMED: 'Resgatado', CANCELLED: 'Cancelado',
}
const STATUS_COLOR: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  PENDING_REVIEW: 'bg-amber-100 text-amber-700',
  REDEEMED: 'bg-blue-100 text-blue-700',
  CANCELLED: 'bg-red-100 text-red-700',
  DRAFT: 'bg-gray-100 text-gray-600',
}
const TYPE_LABEL: Record<string, string> = { SAFRA: 'Safra', MATERIAL: 'Material', MAQUINARIO: 'Maquinário' }

function fmt(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)
}

export default function InvestimentosPage() {
  const [data, setData] = useState<Portfolio | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/tokens/meus-investimentos')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
  }, [])

  if (loading) return <div className="p-8 text-center text-slate-400">Carregando...</div>

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/token" className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Meus Investimentos</h1>
          <p className="text-sm text-slate-400">Tokens que você comprou</p>
        </div>
      </div>

      {/* Stats */}
      {data && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Total investido', value: fmt(data.totalInvestido) },
            { label: 'Tokens em carteira', value: data.totalTokens.toLocaleString('pt-BR') },
            { label: 'Ativos', value: data.ativos.toString() },
            { label: 'Resgatados', value: data.resgatados.toString() },
          ].map(s => (
            <div key={s.label} className="bg-white border border-gray-200 rounded-2xl p-4">
              <div className="text-xs text-slate-500">{s.label}</div>
              <div className="text-xl font-bold text-slate-900 mt-1">{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Blockchain live */}
      <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-xs text-green-700 flex items-center gap-2">
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#16a34a', display: 'inline-block', flexShrink: 0 }} />
        Tokens registrados on-chain na Polygon Mainnet. Posição visível no PolygonScan.
      </div>

      {/* List */}
      {!data || data.transactions.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">💼</div>
          <p className="text-slate-500 font-medium">Você ainda não investiu em nenhum token</p>
          <Link href="/dashboard/token/mercado" className="inline-block mt-3 bg-[#16a34a] text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-[#15803d] transition-colors">
            Ver mercado
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {data.transactions.map(inv => {
            const retornoEsperado = inv.token.expectedReturn
              ? (inv.totalAmount * (inv.token.expectedReturn / 100))
              : null
            return (
              <div key={inv.id} className="bg-white border border-gray-200 rounded-2xl p-5">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-slate-400">{TYPE_LABEL[inv.token.type]}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[inv.token.status]}`}>
                        {STATUS_LABEL[inv.token.status]}
                      </span>
                    </div>
                    <h3 className="font-semibold text-slate-900">{inv.token.title}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{inv.token.property.name}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-lg font-bold text-slate-900">{fmt(Number(inv.totalAmount))}</div>
                    <div className="text-xs text-slate-400">{inv.quantity.toLocaleString('pt-BR')} tokens</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 bg-slate-50 rounded-xl p-3 text-sm">
                  <div>
                    <div className="text-xs text-slate-400">Preço/token</div>
                    <div className="font-semibold text-slate-900">R$ {Number(inv.pricePerToken).toLocaleString('pt-BR')}</div>
                  </div>
                  {retornoEsperado && (
                    <div>
                      <div className="text-xs text-slate-400">Retorno esperado</div>
                      <div className="font-semibold text-green-700">{fmt(retornoEsperado)}</div>
                    </div>
                  )}
                  {inv.token.deliveryDate && (
                    <div>
                      <div className="text-xs text-slate-400">Vencimento</div>
                      <div className="font-semibold text-slate-900">{new Date(inv.token.deliveryDate).toLocaleDateString('pt-BR')}</div>
                    </div>
                  )}
                  {inv.token.periodMonths && (
                    <div>
                      <div className="text-xs text-slate-400">Prazo</div>
                      <div className="font-semibold text-slate-900">{inv.token.periodMonths} meses</div>
                    </div>
                  )}
                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                  <span>Comprado em {new Date(inv.createdAt).toLocaleDateString('pt-BR')}</span>
                  <Link href={`/dashboard/token/mercado`} className="text-[#16a34a] hover:underline">
                    Ver no mercado →
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

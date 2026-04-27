'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type MarketToken = {
  id: string
  type: 'SAFRA' | 'MATERIAL' | 'MAQUINARIO'
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
  property: { name: string; location: string | null }
}

const TYPE_LABEL: Record<string, string> = { SAFRA: 'Safra', MATERIAL: 'Material', MAQUINARIO: 'Maquinário' }
const TYPE_COLOR: Record<string, string> = {
  SAFRA: 'bg-green-100 text-green-700',
  MATERIAL: 'bg-blue-100 text-blue-700',
  MAQUINARIO: 'bg-orange-100 text-orange-700',
}

function fmt(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)
}

function BuyModal({ token, onClose, onSuccess }: {
  token: MarketToken
  onClose: () => void
  onSuccess: () => void
}) {
  const [qty, setQty] = useState('1')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const available = token.totalTokens - token.soldTokens
  const quantity = Math.max(1, Math.min(parseInt(qty) || 1, available))
  const total = quantity * Number(token.tokenPrice)

  async function handleBuy() {
    setLoading(true)
    setError('')
    const res = await fetch(`/api/tokens/${token.id}/buy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity }),
    })
    if (res.ok) {
      onSuccess()
    } else {
      const data = await res.json()
      setError(data.error || 'Erro ao processar compra')
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
        <h3 className="text-lg font-bold text-slate-900 mb-1">{token.title}</h3>
        <p className="text-sm text-slate-500 mb-5">{token.property.name}</p>

        <div className="bg-slate-50 rounded-xl p-4 mb-5 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Preço por token</span>
            <span className="font-semibold">{fmt(Number(token.tokenPrice))}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Disponíveis</span>
            <span className="font-semibold">{available.toLocaleString('pt-BR')} tokens</span>
          </div>
          {token.expectedReturn && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Rendimento esperado</span>
              <span className="font-semibold text-green-700">{token.expectedReturn}%{token.periodMonths ? ` / ${token.periodMonths} meses` : ''}</span>
            </div>
          )}
        </div>

        <div className="mb-5">
          <label className="block text-sm font-medium text-slate-700 mb-2">Quantidade de tokens</label>
          <input
            type="number"
            min="1"
            max={available}
            value={qty}
            onChange={e => setQty(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <div className="mt-2 text-right text-sm text-slate-500">
            Total: <span className="font-bold text-slate-900">{fmt(total)}</span>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4 text-xs text-amber-700">
          Fase piloto — transação simulada. Blockchain (Polygon) em breve.
        </div>

        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-200 text-slate-700 font-semibold py-3 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleBuy}
            disabled={loading || available === 0}
            className="flex-1 bg-[#16a34a] text-white font-semibold py-3 rounded-xl hover:bg-[#15803d] disabled:opacity-50 transition-colors"
          >
            {loading ? 'Processando...' : 'Confirmar compra'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function MercadoPage() {
  const [tokens, setTokens] = useState<MarketToken[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'ALL' | 'SAFRA' | 'MATERIAL' | 'MAQUINARIO'>('ALL')
  const [buying, setBuying] = useState<MarketToken | null>(null)
  const [success, setSuccess] = useState(false)

  function load() {
    setLoading(true)
    fetch('/api/tokens/mercado')
      .then(r => r.json())
      .then(d => { setTokens(d); setLoading(false) })
  }

  useEffect(() => { load() }, [])

  const filtered = filter === 'ALL' ? tokens : tokens.filter(t => t.type === filter)

  function handleSuccess() {
    setBuying(null)
    setSuccess(true)
    load()
    setTimeout(() => setSuccess(false), 3000)
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/token" className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Mercado de Tokens</h1>
          <p className="text-sm text-slate-400">Invista em ativos agrícolas tokenizados</p>
        </div>
      </div>

      {/* Success banner */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700 font-medium">
          Compra realizada com sucesso!
        </div>
      )}

      {/* Pilot banner */}
      <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-700">
        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
        Fase piloto — transações simuladas. Blockchain Polygon em breve.
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(['ALL', 'SAFRA', 'MATERIAL', 'MAQUINARIO'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              filter === f ? 'bg-[#16a34a] text-white' : 'bg-white border border-gray-200 text-slate-600 hover:border-gray-300'
            }`}
          >
            {f === 'ALL' ? 'Todos' : TYPE_LABEL[f]}
          </button>
        ))}
      </div>

      {/* Token cards */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Carregando...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">🌾</div>
          <p className="text-slate-500 font-medium">Nenhum token disponível no momento</p>
          <p className="text-sm text-slate-400 mt-1">Tokens ativos aparecerão aqui para investimento</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(token => {
            const pct = token.totalTokens > 0 ? Math.round((token.soldTokens / token.totalTokens) * 100) : 0
            const available = token.totalTokens - token.soldTokens
            const subtitle = token.type === 'SAFRA' ? token.commodity
              : token.type === 'MATERIAL' ? token.materialType
              : token.machineType
            return (
              <div key={token.id} className="bg-white border border-gray-200 rounded-2xl p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLOR[token.type]}`}>
                        {TYPE_LABEL[token.type]}
                      </span>
                      {subtitle && <span className="text-xs text-slate-400">{subtitle}</span>}
                    </div>
                    <h3 className="font-semibold text-slate-900">{token.title}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{token.property.name}{token.property.location ? ` • ${token.property.location}` : ''}</p>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <div className="text-lg font-bold text-slate-900">{fmt(Number(token.tokenPrice))}</div>
                    <div className="text-xs text-slate-400">por token</div>
                  </div>
                </div>

                {token.description && (
                  <p className="text-sm text-slate-500 mb-3 line-clamp-2">{token.description}</p>
                )}

                <div className="mb-3">
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>{token.soldTokens.toLocaleString('pt-BR')} vendidos de {token.totalTokens.toLocaleString('pt-BR')}</span>
                    <span className="font-medium">{pct}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#16a34a] rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex gap-4 text-sm">
                    {token.expectedReturn && (
                      <span className="text-green-700 font-semibold">{token.expectedReturn}% retorno{token.periodMonths ? ` / ${token.periodMonths}m` : ''}</span>
                    )}
                    <span className="text-slate-400">{available.toLocaleString('pt-BR')} disponíveis</span>
                  </div>
                  <button
                    onClick={() => setBuying(token)}
                    disabled={available === 0}
                    className="bg-[#16a34a] text-white text-sm font-semibold px-5 py-2 rounded-xl hover:bg-[#15803d] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {available === 0 ? 'Esgotado' : 'Comprar'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {buying && (
        <BuyModal
          token={buying}
          onClose={() => setBuying(null)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  )
}

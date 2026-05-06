'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type Token = {
  id: string
  title: string
  type: 'SAFRA' | 'MATERIAL' | 'MAQUINARIO'
  status: string
  totalValue: number
  tokenPrice: number
  totalTokens: number
  soldTokens: number
  expectedReturn: number | null
  periodMonths: number | null
  commodity: string | null
  deliveryDate: string | null
  property: { name: string; location: string | null }
}

const TYPE_LABEL: Record<string, string> = { SAFRA: 'Safra', MATERIAL: 'Material', MAQUINARIO: 'Maquinário' }
const TYPE_COLOR: Record<string, string> = {
  SAFRA: 'bg-green-100 text-green-700',
  MATERIAL: 'bg-amber-100 text-amber-700',
  MAQUINARIO: 'bg-blue-100 text-blue-700',
}

function fmt(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)
}

export default function MercadoPage() {
  const router = useRouter()
  const [tokens, setTokens] = useState<Token[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [buying, setBuying] = useState<string | null>(null)
  const [qty, setQty] = useState<Record<string, string>>({})

  useEffect(() => {
    fetch('/api/tokens/mercado')
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d)) setTokens(d)
        else setError(d?.error || 'Erro ao carregar mercado')
        setLoading(false)
      })
      .catch(() => { setError('Falha de conexão'); setLoading(false) })
  }, [])

  async function handleComprar(token: Token) {
    const q = parseInt(qty[token.id] || '1')
    if (!q || q < 1) return
    setBuying(token.id)
    try {
      const res = await fetch(`/api/tokens/${token.id}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: q }),
      })
      const data = await res.json()
      if (data.url) {
        router.push(data.url)
      } else {
        alert(data.error || 'Erro ao iniciar compra')
      }
    } catch {
      alert('Erro de conexão')
    } finally {
      setBuying(null)
    }
  }

  if (loading) return (
    <div className="p-8 flex items-center justify-center min-h-[400px]">
      <div className="text-slate-400 text-sm">Carregando mercado...</div>
    </div>
  )

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/token" className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Mercado AgroToken</h1>
          <p className="text-sm text-slate-400">Tokens ativos disponíveis para investimento</p>
        </div>
      </div>

      {/* Blockchain badge */}
      <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-xs text-green-700 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
        Tokens registrados on-chain na Polygon Mainnet — posição visível no PolygonScan
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">{error}</div>
      )}

      {!loading && !error && tokens.length === 0 && (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">🌾</div>
          <p className="text-slate-500 font-medium">Nenhum token ativo no momento</p>
          <p className="text-sm text-slate-400 mt-1">Seja o primeiro a tokenizar um ativo agrícola</p>
          <Link href="/dashboard/token/novo" className="inline-block mt-5 bg-[#16a34a] text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-[#15803d] transition-colors">
            Criar token
          </Link>
        </div>
      )}

      <div className="grid gap-4">
        {tokens.map(token => {
          const available = token.totalTokens - token.soldTokens
          const soldPct = token.totalTokens > 0 ? (token.soldTokens / token.totalTokens) * 100 : 0
          const q = parseInt(qty[token.id] || '1') || 1
          const total = q * Number(token.tokenPrice)

          return (
            <div key={token.id} className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-gray-300 transition-colors">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${TYPE_COLOR[token.type]}`}>
                      {TYPE_LABEL[token.type]}
                    </span>
                    {token.commodity && (
                      <span className="text-xs text-slate-400">{token.commodity}</span>
                    )}
                  </div>
                  <Link href={`/dashboard/token/${token.id}`} className="font-bold text-slate-900 hover:text-[#16a34a] transition-colors">
                    {token.title}
                  </Link>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {token.property.name}{token.property.location ? ` · ${token.property.location}` : ''}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-lg font-bold text-slate-900">{fmt(Number(token.tokenPrice))}</div>
                  <div className="text-xs text-slate-400">por token</div>
                </div>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-3 gap-3 bg-slate-50 rounded-xl p-3 text-sm mb-4">
                <div>
                  <div className="text-xs text-slate-400">Valor total</div>
                  <div className="font-semibold text-slate-800">{fmt(Number(token.totalValue))}</div>
                </div>
                {token.expectedReturn && (
                  <div>
                    <div className="text-xs text-slate-400">Rendimento esperado</div>
                    <div className="font-semibold text-green-700">{token.expectedReturn}%{token.periodMonths ? ` / ${token.periodMonths}m` : ''}</div>
                  </div>
                )}
                {token.deliveryDate && (
                  <div>
                    <div className="text-xs text-slate-400">Vencimento</div>
                    <div className="font-semibold text-slate-800">{new Date(token.deliveryDate).toLocaleDateString('pt-BR')}</div>
                  </div>
                )}
                <div>
                  <div className="text-xs text-slate-400">Disponíveis</div>
                  <div className="font-semibold text-slate-800">{available.toLocaleString('pt-BR')} tokens</div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mb-4">
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>{token.soldTokens.toLocaleString('pt-BR')} vendidos</span>
                  <span>{soldPct.toFixed(0)}% captado</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#16a34a] rounded-full transition-all" style={{ width: `${Math.min(soldPct, 100)}%` }} />
                </div>
              </div>

              {/* Buy controls */}
              {available > 0 ? (
                <div className="flex items-center gap-3">
                  <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setQty(prev => ({ ...prev, [token.id]: String(Math.max(1, (parseInt(prev[token.id] || '1') || 1) - 1) ) }))}
                      className="px-3 py-2 text-slate-500 hover:bg-gray-50 transition-colors font-medium"
                    >−</button>
                    <input
                      type="number"
                      min="1"
                      max={available}
                      value={qty[token.id] || '1'}
                      onChange={e => setQty(prev => ({ ...prev, [token.id]: e.target.value }))}
                      className="w-14 text-center py-2 text-sm font-semibold text-slate-900 focus:outline-none border-x border-gray-200"
                    />
                    <button
                      onClick={() => setQty(prev => ({ ...prev, [token.id]: String(Math.min(available, (parseInt(prev[token.id] || '1') || 1) + 1) ) }))}
                      className="px-3 py-2 text-slate-500 hover:bg-gray-50 transition-colors font-medium"
                    >+</button>
                  </div>
                  <div className="text-sm text-slate-500 flex-1">
                    Total: <span className="font-bold text-slate-900">{fmt(total)}</span>
                  </div>
                  <button
                    onClick={() => handleComprar(token)}
                    disabled={buying === token.id}
                    className="bg-[#16a34a] text-white font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-[#15803d] transition-colors disabled:opacity-60 flex items-center gap-2"
                  >
                    {buying === token.id ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Aguarde...
                      </>
                    ) : 'Comprar'}
                  </button>
                </div>
              ) : (
                <div className="text-center py-2 text-sm text-slate-400 font-medium">Token esgotado</div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type SecurityEvent = {
  id: string
  type: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  userId: string | null
  tokenId: string | null
  details: Record<string, unknown> | null
  resolved: boolean
  createdAt: string
}

type MonitoringData = {
  timestamp: string
  alerts: { critical24h: number; high24h: number; unresolved: number; status: 'OK' | 'WARNING' | 'CRITICAL' }
  tokens: Record<string, number>
  transactions7d: { count: number; volumeBRL: number }
  recentEvents: SecurityEvent[]
}

const SEVERITY_COLOR: Record<string, string> = {
  LOW: 'bg-slate-100 text-slate-600',
  MEDIUM: 'bg-amber-100 text-amber-700',
  HIGH: 'bg-orange-100 text-orange-700',
  CRITICAL: 'bg-red-100 text-red-700',
}

const TYPE_LABEL: Record<string, string> = {
  DISPUTE: '⚔️ Chargeback',
  PAYMENT_FAILED: '❌ Pagamento falhou',
  TRANSFER_FAILED: '🚨 Repasse falhou',
  RATE_LIMIT: '⚡ Rate limit',
  CONCENTRATION_RISK: '⚠️ Concentração',
  RESGATE_LOCK: '🔒 Lock resgate',
  ACCOUNT_SUSPENDED: '🚫 Conta suspensa',
  SUSPICIOUS_PURCHASE: '🕵️ Compra suspeita',
}

function fmt(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

export default function MonitoringPage() {
  const [data, setData] = useState<MonitoringData | null>(null)
  const [loading, setLoading] = useState(true)
  const [resolving, setResolving] = useState<string | null>(null)

  function load() {
    setLoading(true)
    fetch('/api/admin/monitoring')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  async function handleResolve(id: string) {
    setResolving(id)
    await fetch('/api/admin/monitoring', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    load()
    setResolving(null)
  }

  if (loading) return <div className="p-8 text-center text-slate-400">Carregando...</div>
  if (!data) return <div className="p-8 text-center text-red-400">Erro ao carregar dados.</div>

  const statusColor = data.alerts.status === 'OK'
    ? 'bg-green-100 text-green-700'
    : data.alerts.status === 'WARNING'
    ? 'bg-amber-100 text-amber-700'
    : 'bg-red-100 text-red-700'

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Monitoramento 24h</h1>
          <p className="text-xs text-slate-400 mt-0.5">Atualizado em {new Date(data.timestamp).toLocaleString('pt-BR')}</p>
        </div>
        <div className="flex gap-2">
          <span className={`text-sm px-3 py-1 rounded-full font-semibold ${statusColor}`}>
            {data.alerts.status}
          </span>
          <Link href="/dashboard/admin/tokens" className="text-sm border border-gray-200 px-4 py-2 rounded-xl text-slate-600 hover:bg-gray-50">
            Tokens
          </Link>
          <button onClick={load} className="text-sm border border-gray-200 px-4 py-2 rounded-xl text-slate-600 hover:bg-gray-50">
            ↻ Atualizar
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-4 text-center">
          <div className={`text-3xl font-bold ${data.alerts.critical24h > 0 ? 'text-red-600' : 'text-slate-900'}`}>
            {data.alerts.critical24h}
          </div>
          <div className="text-xs text-slate-400 mt-1">Críticos 24h</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-4 text-center">
          <div className={`text-3xl font-bold ${data.alerts.high24h > 0 ? 'text-orange-600' : 'text-slate-900'}`}>
            {data.alerts.high24h}
          </div>
          <div className="text-xs text-slate-400 mt-1">Altos 24h</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-4 text-center">
          <div className={`text-3xl font-bold ${data.alerts.unresolved > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
            {data.alerts.unresolved}
          </div>
          <div className="text-xs text-slate-400 mt-1">Não resolvidos</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-4 text-center">
          <div className="text-3xl font-bold text-slate-900">{data.transactions7d.count}</div>
          <div className="text-xs text-slate-400 mt-1">Compras 7d</div>
          <div className="text-xs text-green-600 font-medium">{fmt(data.transactions7d.volumeBRL)}</div>
        </div>
      </div>

      {/* Status tokens */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Status dos Tokens</h2>
        <div className="flex flex-wrap gap-3">
          {Object.entries(data.tokens).map(([status, count]) => (
            <div key={status} className="flex items-center gap-2 bg-slate-50 border border-gray-100 px-3 py-2 rounded-xl">
              <span className="text-sm font-bold text-slate-900">{count}</span>
              <span className="text-xs text-slate-500">{status}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Eventos recentes */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-700">Eventos últimas 24h</h2>
        {data.recentEvents.length === 0 ? (
          <div className="text-center py-10 text-slate-400 bg-white border border-gray-200 rounded-2xl">
            Nenhum evento de segurança nas últimas 24h ✅
          </div>
        ) : (
          data.recentEvents.map(evt => (
            <div key={evt.id} className={`bg-white border rounded-2xl p-4 ${evt.resolved ? 'opacity-50' : 'border-gray-200'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${SEVERITY_COLOR[evt.severity]}`}>
                      {evt.severity}
                    </span>
                    <span className="text-sm font-medium text-slate-800">
                      {TYPE_LABEL[evt.type] ?? evt.type}
                    </span>
                    {evt.resolved && <span className="text-xs text-slate-400">✓ resolvido</span>}
                  </div>
                  <div className="text-xs text-slate-400 space-x-3">
                    {evt.userId && <span>Usuário: {evt.userId.slice(0, 8)}…</span>}
                    {evt.tokenId && <span>Token: {evt.tokenId.slice(0, 8)}…</span>}
                    <span>{new Date(evt.createdAt).toLocaleString('pt-BR')}</span>
                  </div>
                  {evt.details && Object.keys(evt.details).length > 0 && (
                    <pre className="text-xs text-slate-500 mt-2 bg-slate-50 rounded-lg p-2 overflow-x-auto">
                      {JSON.stringify(evt.details, null, 2)}
                    </pre>
                  )}
                </div>
                {!evt.resolved && (
                  <button
                    onClick={() => handleResolve(evt.id)}
                    disabled={resolving === evt.id}
                    className="shrink-0 text-xs px-3 py-1.5 border border-green-200 text-green-700 rounded-xl hover:bg-green-50 disabled:opacity-50 transition-colors"
                  >
                    {resolving === evt.id ? '...' : 'Resolver'}
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

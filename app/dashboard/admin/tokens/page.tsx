'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type AdminToken = {
  id: string
  type: string
  status: string
  title: string
  totalValue: number
  tokenPrice: number
  totalTokens: number
  soldTokens: number
  createdAt: string
  _count: { transactions: number }
  property: {
    name: string
    user: { name: string; email: string; cpf: string | null; kycVerified: boolean }
  }
}

const STATUS_COLOR: Record<string, string> = {
  PENDING_REVIEW: 'bg-amber-100 text-amber-700',
  ACTIVE: 'bg-green-100 text-green-700',
  REDEEMED: 'bg-blue-100 text-blue-700',
  CANCELLED: 'bg-red-100 text-red-700',
}
const STATUS_LABEL: Record<string, string> = {
  PENDING_REVIEW: 'Em análise', ACTIVE: 'Ativo', REDEEMED: 'Resgatado', CANCELLED: 'Cancelado',
}
const TYPE_LABEL: Record<string, string> = { SAFRA: 'Safra', MATERIAL: 'Material', MAQUINARIO: 'Maquinário' }

function fmt(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)
}

export default function AdminTokensPage() {
  const [tokens, setTokens] = useState<AdminToken[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [filter, setFilter] = useState<'PENDING_REVIEW' | 'ALL'>('PENDING_REVIEW')
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    fetch('/api/user/role').then(r => r.json()).then(d => {
      if (d.role === 'ADMIN') {
        setIsAdmin(true)
        load()
      } else {
        setLoading(false)
      }
    })
  }, [])

  function load() {
    setLoading(true)
    fetch('/api/admin/tokens').then(r => r.json()).then(d => {
      setTokens(Array.isArray(d) ? d : [])
      setLoading(false)
    })
  }

  async function handleAction(id: string, action: 'approve' | 'reject') {
    if (action === 'reject' && !confirm('Rejeitar este token?')) return
    setProcessing(id)
    await fetch(`/api/admin/tokens/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    load()
    setProcessing(null)
  }

  const filtered = filter === 'ALL' ? tokens : tokens.filter(t => t.status === filter)
  const pending = tokens.filter(t => t.status === 'PENDING_REVIEW').length

  if (loading) return <div className="p-8 text-center text-slate-400">Carregando...</div>
  if (!isAdmin) return (
    <div className="p-8 text-center">
      <p className="text-slate-500">Acesso restrito a administradores.</p>
      <Link href="/dashboard/token" className="text-[#16a34a] text-sm mt-2 block">Voltar</Link>
    </div>
  )

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Admin — Tokens</h1>
          <p className="text-sm text-slate-400">{pending} aguardando aprovação</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/admin/comissoes" className="text-sm border border-gray-200 px-4 py-2 rounded-xl text-slate-600 hover:bg-gray-50 transition-colors">
            Comissões
          </Link>
          <Link href="/dashboard/token" className="text-sm border border-gray-200 px-4 py-2 rounded-xl text-slate-600 hover:bg-gray-50 transition-colors">
            Meus tokens
          </Link>
        </div>
      </div>

      <div className="flex gap-2">
        {(['PENDING_REVIEW', 'ALL'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${filter === f ? 'bg-[#16a34a] text-white' : 'bg-white border border-gray-200 text-slate-600 hover:border-gray-300'}`}>
            {f === 'PENDING_REVIEW' ? `Em análise (${pending})` : 'Todos'}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          {filter === 'PENDING_REVIEW' ? 'Nenhum token aguardando aprovação' : 'Nenhum token'}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(token => {
            const fee = Number(token.totalValue) * 0.02
            return (
              <div key={token.id} className="bg-white border border-gray-200 rounded-2xl p-5">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-slate-500">{TYPE_LABEL[token.type]}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[token.status]}`}>
                        {STATUS_LABEL[token.status]}
                      </span>
                      {token.property.user.kycVerified && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">KYC ✓</span>
                      )}
                    </div>
                    <h3 className="font-semibold text-slate-900 truncate">{token.title}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {token.property.name} — {token.property.user.name} ({token.property.user.email})
                      {token.property.user.cpf && ` • CPF: ${token.property.user.cpf}`}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-lg font-bold text-slate-900">{fmt(Number(token.totalValue))}</div>
                    <div className="text-xs text-green-600 font-medium">taxa: {fmt(fee)}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="flex gap-4 text-xs text-slate-400">
                    <span>{token.totalTokens.toLocaleString('pt-BR')} tokens × {fmt(Number(token.tokenPrice))}</span>
                    <span>{token._count.transactions} transações</span>
                    <span>Criado {new Date(token.createdAt).toLocaleDateString('pt-BR')}</span>
                  </div>
                  {token.status === 'PENDING_REVIEW' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAction(token.id, 'reject')}
                        disabled={processing === token.id}
                        className="px-4 py-2 text-sm border border-red-200 text-red-600 rounded-xl hover:bg-red-50 disabled:opacity-50 transition-colors"
                      >
                        Rejeitar
                      </button>
                      <button
                        onClick={() => handleAction(token.id, 'approve')}
                        disabled={processing === token.id}
                        className="px-4 py-2 text-sm bg-[#16a34a] text-white rounded-xl hover:bg-[#15803d] disabled:opacity-50 transition-colors font-semibold"
                      >
                        {processing === token.id ? '...' : 'Aprovar'}
                      </button>
                    </div>
                  )}
                  {token.status !== 'PENDING_REVIEW' && (
                    <Link href={`/dashboard/token/${token.id}`} className="text-xs text-[#16a34a] hover:underline">
                      Ver detalhe →
                    </Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

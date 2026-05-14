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
  carNumber: string | null
  clicksignDocKey: string | null
  clicksignSignerKey: string | null
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

  async function handleSign(id: string) {
    if (!confirm('Enviar acordo de investimento para assinatura digital do produtor via ClickSign?')) return
    setProcessing(id + '-sign')
    const res = await fetch(`/api/tokens/${id}/sign`, { method: 'POST' })
    const data = await res.json()
    if (res.ok) {
      alert(`✅ Acordo enviado! O produtor receberá o e-mail para assinar.\nDoc: ${data.docKey}`)
      load()
    } else {
      alert(`Erro: ${data.error}`)
    }
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
    <div className="pb-24 p-4 sm:p-6 max-w-4xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/dashboard/admin" className="text-xs text-slate-400 hover:text-slate-600 mb-1 block">← Admin Hub</Link>
          <h1 className="text-xl font-bold text-slate-900">Tokens</h1>
          <p className="text-sm text-slate-400">{pending} aguardando aprovação</p>
        </div>
        <Link href="/dashboard/token" className="text-sm border border-gray-200 px-3 py-2 rounded-xl text-slate-600 hover:bg-gray-50 transition-colors hidden sm:block">
          Meus tokens
        </Link>
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
              <div key={token.id} className="bg-white border border-gray-200 rounded-2xl p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                      <span className="text-xs font-medium text-slate-500">{TYPE_LABEL[token.type]}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[token.status]}`}>
                        {STATUS_LABEL[token.status]}
                      </span>
                      {token.property.user.kycVerified && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">KYC ✓</span>
                      )}
                    </div>
                    <h3 className="font-semibold text-slate-900 text-sm leading-tight">{token.title}</h3>
                    <p className="text-xs text-slate-400 mt-0.5 leading-tight">
                      {token.property.user.name} · {token.property.name}
                    </p>
                    {token.carNumber ? (
                      <a href="https://www.car.gov.br/publico/imoveis/index" target="_blank" rel="noopener"
                        className="text-xs text-blue-500 hover:underline mt-0.5 block font-mono truncate">
                        CAR: {token.carNumber}
                      </a>
                    ) : (
                      <p className="text-xs text-red-400 mt-0.5">⚠️ CAR não informado</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-base font-bold text-slate-900">{fmt(Number(token.totalValue))}</div>
                    <div className="text-xs text-green-600 font-medium">taxa: {fmt(fee)}</div>
                  </div>
                </div>

                <div className="text-xs text-slate-400 mb-3 flex flex-wrap gap-x-3 gap-y-0.5">
                  <span>{token.totalTokens.toLocaleString('pt-BR')} × {fmt(Number(token.tokenPrice))}</span>
                  <span>{token._count.transactions} tx</span>
                  <span>{new Date(token.createdAt).toLocaleDateString('pt-BR')}</span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                  {token.status === 'PENDING_REVIEW' && (
                    <div className="flex gap-2 w-full">
                      <button
                        onClick={() => handleAction(token.id, 'reject')}
                        disabled={processing === token.id}
                        className="flex-1 py-2.5 text-sm border border-red-200 text-red-600 rounded-xl hover:bg-red-50 disabled:opacity-50 transition-colors font-medium"
                      >
                        Rejeitar
                      </button>
                      <button
                        onClick={() => handleAction(token.id, 'approve')}
                        disabled={processing === token.id}
                        className="flex-1 py-2.5 text-sm bg-[#16a34a] text-white rounded-xl hover:bg-[#15803d] disabled:opacity-50 transition-colors font-semibold"
                      >
                        {processing === token.id ? '...' : '✓ Aprovar'}
                      </button>
                    </div>
                  )}
                  {token.status === 'ACTIVE' && (
                    <div className="flex items-center gap-2">
                      {token.clicksignDocKey ? (
                        <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 font-medium">
                          ✍️ Acordo enviado
                        </span>
                      ) : (
                        <button
                          onClick={() => handleSign(token.id)}
                          disabled={processing === token.id + '-sign'}
                          className="px-3 py-1.5 text-xs border border-blue-200 text-blue-600 rounded-xl hover:bg-blue-50 disabled:opacity-50 transition-colors font-medium"
                        >
                          {processing === token.id + '-sign' ? '...' : '✍️ Enviar acordo'}
                        </button>
                      )}
                      <Link href={`/dashboard/token/${token.id}`} className="text-xs text-[#16a34a] hover:underline">
                        Ver →
                      </Link>
                    </div>
                  )}
                  {token.status !== 'PENDING_REVIEW' && token.status !== 'ACTIVE' && (
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

      {/* Bottom nav mobile */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-2 pb-safe-bottom pt-2 z-50 flex justify-around">
        {[
          { href: '/dashboard/admin', icon: '⚡', label: 'Hub' },
          { href: '/dashboard/admin/tokens', icon: '🪙', label: 'Tokens' },
          { href: '/dashboard/admin/comissoes', icon: '💰', label: 'Comissões' },
          { href: '/dashboard/admin/monitoring', icon: '🔍', label: 'Monitor' },
          { href: '/dashboard', icon: '🏠', label: 'Dashboard' },
        ].map(item => (
          <Link key={item.href} href={item.href}
            className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl text-slate-500 hover:text-slate-900 transition-colors min-w-0">
            <span className="text-xl">{item.icon}</span>
            <span className="text-[9px] font-semibold truncate">{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type CommissionData = {
  totalBuy: number
  totalOriginacao: number
  totalSucesso: number
  totalGeral: number
  tokensAtivos: number
  tokensPendentes: number
  volumeTotal: number
  transactions: {
    id: string
    type: string
    totalAmount: number
    commission: number
    createdAt: string
    token: { title: string; type: string }
    buyer: { name: string }
  }[]
}

const TYPE_LABEL: Record<string, string> = { BUY: 'Compra', ORIGINACAO: 'Originação', SUCESSO: 'Liquidação' }
const TYPE_COLOR: Record<string, string> = {
  BUY: 'bg-blue-100 text-blue-700',
  ORIGINACAO: 'bg-purple-100 text-purple-700',
  SUCESSO: 'bg-green-100 text-green-700',
}

function fmt(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)
}

export default function ComissoesPage() {
  const [data, setData] = useState<CommissionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    fetch('/api/user/role').then(r => r.json()).then(d => {
      if (d.role === 'ADMIN') {
        setIsAdmin(true)
        fetch('/api/admin/comissoes').then(r => r.json()).then(d => { setData(d); setLoading(false) })
      } else {
        setLoading(false)
      }
    })
  }, [])

  if (loading) return <div className="p-8 text-center text-slate-400">Carregando...</div>
  if (!isAdmin) return (
    <div className="p-8 text-center">
      <p className="text-slate-500">Acesso restrito a administradores.</p>
    </div>
  )

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Admin — Comissões</h1>
          <p className="text-sm text-slate-400">Receita da plataforma</p>
        </div>
        <Link href="/dashboard/admin/tokens" className="text-sm border border-gray-200 px-4 py-2 rounded-xl text-slate-600 hover:bg-gray-50 transition-colors">
          Aprovações
        </Link>
      </div>

      {data && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total comissões', value: fmt(data.totalGeral), color: 'text-green-700' },
              { label: 'Originação (2%)', value: fmt(data.totalOriginacao), color: 'text-purple-700' },
              { label: 'Transações (2%)', value: fmt(data.totalBuy), color: 'text-blue-700' },
              { label: 'Liquidações (3%)', value: fmt(data.totalSucesso), color: 'text-emerald-700' },
            ].map(s => (
              <div key={s.label} className="bg-white border border-gray-200 rounded-2xl p-4">
                <div className="text-xs text-slate-500">{s.label}</div>
                <div className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white border border-gray-200 rounded-2xl p-4">
              <div className="text-xs text-slate-500">Volume tokenizado</div>
              <div className="text-xl font-bold text-slate-900 mt-1">{fmt(data.volumeTotal)}</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-4">
              <div className="text-xs text-slate-500">Tokens ativos</div>
              <div className="text-xl font-bold text-slate-900 mt-1">{data.tokensAtivos}</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-4">
              <div className="text-xs text-slate-500">Aguardando aprovação</div>
              <div className="text-xl font-bold text-amber-600 mt-1">{data.tokensPendentes}</div>
            </div>
          </div>

          {/* Histórico */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Histórico de transações</div>
            {data.transactions.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">Nenhuma transação ainda</p>
            ) : (
              <div className="space-y-0">
                {data.transactions.map(t => (
                  <div key={t.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLOR[t.type]}`}>
                        {TYPE_LABEL[t.type]}
                      </span>
                      <div>
                        <div className="text-sm font-medium text-slate-900">{t.token.title}</div>
                        <div className="text-xs text-slate-400">{t.buyer.name} • {new Date(t.createdAt).toLocaleDateString('pt-BR')}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-slate-900">{fmt(Number(t.totalAmount))}</div>
                      <div className="text-xs text-green-600">comissão {fmt(Number(t.commission))}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

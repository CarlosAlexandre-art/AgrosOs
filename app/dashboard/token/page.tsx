'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type Stats = {
  totalTokens: number
  activeTokens: number
  totalCaptado: number
  totalInvestido: number
}

export default function TokenHubPage() {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    fetch('/api/tokens/stats')
      .then(r => r.json())
      .then(d => { if (!d.error) setStats(d) })
      .catch(() => {})
  }, [])

  const cards = [
    {
      href: '/dashboard/token/mercado',
      title: 'Mercado',
      desc: 'Explore e invista em tokens agrícolas ativos',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
        </svg>
      ),
      color: 'border-green-200 hover:border-green-400 hover:bg-green-50',
      iconColor: 'text-green-600 bg-green-100',
    },
    {
      href: '/dashboard/token/novo',
      title: 'Tokenizar ativo',
      desc: 'Crie um token para sua safra, insumo ou maquinário',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      ),
      color: 'border-blue-200 hover:border-blue-400 hover:bg-blue-50',
      iconColor: 'text-blue-600 bg-blue-100',
    },
    {
      href: '/dashboard/token/investimentos',
      title: 'Meus investimentos',
      desc: 'Tokens que você comprou e sua posição atual',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
        </svg>
      ),
      color: 'border-violet-200 hover:border-violet-400 hover:bg-violet-50',
      iconColor: 'text-violet-600 bg-violet-100',
    },
    {
      href: '/dashboard/token',
      title: 'Meus tokens',
      desc: 'Tokens que você emitiu e status de captação',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 2.625c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125m0 5.625c0 2.278 3.694 4.125 8.25 4.125s8.25-1.847 8.25-4.125" />
        </svg>
      ),
      color: 'border-amber-200 hover:border-amber-400 hover:bg-amber-50',
      iconColor: 'text-amber-600 bg-amber-100',
      isSelf: true,
    },
  ]

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">AgroToken</h1>
        <p className="text-slate-500 text-sm mt-1">Tokenização de ativos agrícolas na Polygon Mainnet</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Seus tokens', value: stats.totalTokens.toString() },
            { label: 'Ativos', value: stats.activeTokens.toString() },
            { label: 'Total captado', value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(stats.totalCaptado) },
            { label: 'Total investido', value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(stats.totalInvestido) },
          ].map(s => (
            <div key={s.label} className="bg-white border border-gray-200 rounded-2xl p-4">
              <div className="text-xs text-slate-400">{s.label}</div>
              <div className="text-xl font-bold text-slate-900 mt-1">{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Navigation cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {cards.map(card => (
          <Link
            key={card.href + card.title}
            href={card.href}
            className={`flex items-start gap-4 p-5 bg-white border-2 rounded-2xl transition-all ${card.color}`}
          >
            <div className={`p-2.5 rounded-xl ${card.iconColor} flex-shrink-0`}>
              {card.icon}
            </div>
            <div>
              <div className="font-semibold text-slate-900">{card.title}</div>
              <div className="text-sm text-slate-500 mt-0.5 leading-snug">{card.desc}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Blockchain info */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-sm font-semibold text-slate-700">Polygon Mainnet</span>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          Tokens AgroToken são registrados on-chain na rede Polygon. Cada ativo tokenizado recebe um ID único (uint256) derivado do UUID do banco. Transferências são executadas via contrato ERC-1155 auditado.
        </p>
      </div>
    </div>
  )
}

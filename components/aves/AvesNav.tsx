'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const MODULOS = [
  { href: '/dashboard/aves-gestao', label: 'Gestão & Postura', emoji: '🐔' },
  { href: '/dashboard/aves-sanidade', label: 'Sanidade', emoji: '💉' },
  { href: '/dashboard/aves-nutricao', label: 'Nutrição', emoji: '🌾' },
  { href: '/dashboard/aves-mercado', label: 'Mercado', emoji: '💰' },
]

/** Navegação cruzada entre os 4 módulos de Avicultura — reforça que são as 4 abas de um único sistema. */
export function AvesNav() {
  const pathname = usePathname()
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
      {MODULOS.map(m => {
        const ativo = pathname === m.href
        return (
          <Link
            key={m.href}
            href={m.href}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 999,
              fontSize: 12, fontWeight: 600, textDecoration: 'none',
              background: ativo ? 'rgba(217,119,6,0.15)' : 'rgba(255,255,255,0.03)',
              color: ativo ? '#fbbf24' : '#64748b',
              border: `1px solid ${ativo ? 'rgba(217,119,6,0.35)' : 'rgba(255,255,255,0.07)'}`,
            }}
          >
            <span>{m.emoji}</span>{m.label}
          </Link>
        )
      })}
    </div>
  )
}

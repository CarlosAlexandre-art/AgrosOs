'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// Itens que exigem plano pago
const REQUIRES_PLAN = [
  '/dashboard/metas',
  '/dashboard/agrocore',
  '/dashboard/suporte',
]

const NAV = [
  {
    group: 'Principal',
    items: [
      {
        href: '/dashboard',
        label: 'Visão geral',
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        ),
      },
    ],
  },
  {
    group: 'Operação',
    items: [
      {
        href: '/dashboard/operacoes',
        label: 'Operacional',
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
        ),
      },
      {
        href: '/dashboard/financeiro',
        label: 'Financeiro',
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
      },
      {
        href: '/dashboard/propriedades',
        label: 'Propriedades',
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        ),
      },
      {
        href: '/dashboard/equipe',
        label: 'Equipe',
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        ),
      },
    ],
  },
  {
    group: 'Conteúdo',
    items: [
      {
        href: '/aprendizado',
        label: 'Aprendizado',
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        ),
      },
      {
        href: '/blog',
        label: 'Blog',
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
          </svg>
        ),
      },
    ],
  },
  {
    group: 'Inteligência',
    items: [
      {
        href: '/dashboard/alertas',
        label: 'Alertas',
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        ),
        badge: true,
      },
      {
        href: '/dashboard/metas',
        label: 'Metas',
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        ),
      },
      {
        href: '/dashboard/agrocore',
        label: 'AgroCore',
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        ),
      },
      {
        href: '/dashboard/agrorate',
        label: 'AgroRate',
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
        badge: true,
        featured: true,
      },
      {
        href: '/dashboard/planos',
        label: 'Planos',
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
        ),
      },
      {
        href: '/dashboard/suporte',
        label: 'Suporte',
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        ),
      },
    ],
  },
]

function SidebarLink({
  href, label, icon, badge, locked, onClick,
}: { href: string; label: string; icon: React.ReactNode; badge?: boolean; locked?: boolean; onClick?: () => void }) {
  const pathname = usePathname()
  const exact = href === '/dashboard'
  const active = exact ? pathname === href : pathname.startsWith(href)

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative ${
        active
          ? 'bg-[#16a34a] text-white shadow-sm'
          : 'text-slate-400 hover:text-white hover:bg-white/8'
      }`}
    >
      <span className={active ? 'text-white' : 'text-slate-500 group-hover:text-white transition-colors'}>
        {icon}
      </span>
      {label}
      {locked && (
        <span className="ml-auto">
          <svg className="w-3.5 h-3.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </span>
      )}
      {badge && !locked && (
        <span className="ml-auto w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
      )}
    </Link>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userName, setUserName] = useState('')
  const [userInitial, setUserInitial] = useState('U')
  const [properties, setProperties] = useState<{ id: string; name: string }[]>([])
  const [activePropertyId, setActivePropertyId] = useState<string>('')
  const [propMenuOpen, setPropMenuOpen] = useState(false)
  const [userPlan, setUserPlan] = useState<string>('starter')
  const router = useRouter()
  const pathname = usePathname()

  // Fechar sidebar ao navegar (mobile)
  useEffect(() => { setSidebarOpen(false) }, [pathname])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        const name = user.user_metadata?.name || user.email?.split('@')[0] || 'Usuário'
        setUserName(name)
        setUserInitial(name[0]?.toUpperCase() || 'U')
      }
    })
    fetch('/api/user/plan').then(r => r.json()).then((d: { plan: string }) => {
      if (d.plan) setUserPlan(d.plan)
    })
    fetch('/api/properties').then(r => r.json()).then((data: { id: string; name: string }[]) => {
      if (Array.isArray(data)) {
        setProperties(data)
        const cookie = document.cookie.split('; ').find(c => c.startsWith('activePropertyId='))?.split('=')[1]
        setActivePropertyId(cookie || data[0]?.id || '')
      }
    })
  }, [])

  async function handleSelectProperty(id: string) {
    await fetch('/api/properties/active', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ propertyId: id }),
    })
    setActivePropertyId(id)
    setPropMenuOpen(false)
    router.refresh()
  }

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  const Sidebar = ({ mobile }: { mobile?: boolean }) => (
    <aside className={`flex flex-col bg-[#0f172a] h-full ${mobile ? 'w-full' : 'w-64'}`}>
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/8 flex-shrink-0">
        <Link href="/" className="flex items-center gap-2.5">
          <svg width="34" height="34" viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="34" height="34" rx="10" fill="#16a34a"/>
            <path d="M17 8C17 8 10 12.5 10 19.5C10 23.6 13.1 26 17 26C20.9 26 24 23.6 24 19.5C24 12.5 17 8 17 8Z" fill="white" fillOpacity="0.2"/>
            <path d="M17 8C17 8 10 12.5 10 19.5C10 23.6 13.1 26 17 26" stroke="white" strokeWidth="1.6" strokeLinecap="round"/>
            <path d="M17 8C17 8 24 12.5 24 19.5C24 23.6 20.9 26 17 26" stroke="white" strokeWidth="1.6" strokeLinecap="round"/>
            <line x1="17" y1="8" x2="17" y2="26" stroke="white" strokeWidth="1.6" strokeLinecap="round"/>
            <path d="M17 14L13 11.5" stroke="white" strokeWidth="1.1" strokeLinecap="round" strokeOpacity="0.85"/>
            <path d="M17 14L21 11.5" stroke="white" strokeWidth="1.1" strokeLinecap="round" strokeOpacity="0.85"/>
            <path d="M17 18.5L12.5 16.5" stroke="white" strokeWidth="1.1" strokeLinecap="round" strokeOpacity="0.85"/>
            <path d="M17 18.5L21.5 16.5" stroke="white" strokeWidth="1.1" strokeLinecap="round" strokeOpacity="0.85"/>
          </svg>
          <div>
            <div className="font-bold text-white text-base leading-none">AgroOS</div>
            <div className="text-[10px] text-slate-500 mt-0.5 leading-none">Sistema Operacional</div>
          </div>
        </Link>
      </div>

      {/* Seletor de propriedade */}
      {properties.length > 1 && (
        <div className="px-3 py-3 border-b border-white/8 relative">
          <button
            onClick={() => setPropMenuOpen(o => !o)}
            className="w-full flex items-center justify-between gap-2 bg-white/5 hover:bg-white/10 px-3 py-2 rounded-xl transition-colors"
          >
            <div className="flex items-center gap-2 min-w-0">
              <svg className="w-4 h-4 text-[#16a34a] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-sm text-white font-medium truncate">
                {properties.find(p => p.id === activePropertyId)?.name || 'Selecionar fazenda'}
              </span>
            </div>
            <svg className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform ${propMenuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
            </svg>
          </button>
          {propMenuOpen && (
            <div className="absolute left-3 right-3 top-full mt-1 bg-[#1e293b] border border-white/10 rounded-xl overflow-hidden z-50 shadow-xl">
              {properties.map(p => (
                <button
                  key={p.id}
                  onClick={() => handleSelectProperty(p.id)}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${p.id === activePropertyId ? 'bg-[#16a34a] text-white font-semibold' : 'text-slate-300 hover:bg-white/8'}`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
        {NAV.map(section => (
          <div key={section.group}>
            <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest px-3 mb-2">
              {section.group}
            </div>
            <div className="space-y-0.5">
              {section.items.map(item => (
                <SidebarLink
                  key={item.href}
                  {...item}
                  locked={REQUIRES_PLAN.includes(item.href) && !['pro', 'enterprise', 'admin'].includes(userPlan)}
                  onClick={() => setSidebarOpen(false)}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-white/8 flex-shrink-0 space-y-1">
        <SidebarLink
          href="/dashboard/configuracoes"
          label="Configurações"
          onClick={() => setSidebarOpen(false)}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
        />
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl mt-1">
          <div className="w-8 h-8 rounded-lg bg-[#16a34a] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {userInitial}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm text-white font-medium truncate">{userName}</div>
            <button onClick={handleSignOut} className="text-xs text-slate-500 hover:text-red-400 transition-colors text-left">
              Sair
            </button>
          </div>
        </div>
      </div>
    </aside>
  )

  return (
    <div className="flex h-screen bg-[#f1f5f9] overflow-hidden">
      {/* Sidebar desktop */}
      <div className="hidden md:flex flex-shrink-0">
        <Sidebar />
      </div>

      {/* Sidebar mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-72 flex-shrink-0">
            <Sidebar mobile />
          </div>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0 h-16">
          <button
            className="md:hidden p-2 rounded-lg text-slate-500 hover:bg-gray-100 transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="hidden md:flex items-center gap-2 text-sm text-slate-500">
            <span className="font-medium text-slate-800">AgroOS</span>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <Link href="/dashboard/alertas" className="relative p-2 rounded-lg text-slate-500 hover:bg-gray-100 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
            </Link>
            <Link href="/dashboard/operacoes/nova" className="hidden sm:flex items-center gap-1.5 bg-[#16a34a] text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-[#15803d] transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Nova atividade
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  )
}

'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import AgroOSLogo from '@/components/AgroOSLogo'

const FUNCIONALIDADES = [
  { icon: '📋', label: 'Operacional', desc: 'Gestão de tarefas e execução no campo', href: '/funcionalidades/operacional' },
  { icon: '💰', label: 'Financeiro', desc: 'Custo por atividade e por hectare', href: '/funcionalidades/financeiro' },
  { icon: '👷', label: 'Equipe', desc: 'Produtividade e organização de times', href: '/funcionalidades/equipe' },
  { icon: '🌾', label: 'Propriedades', desc: 'Fazendas, talhões e culturas', href: '/funcionalidades/propriedades' },
  { icon: '🤖', label: 'Inteligência IA', desc: 'Alertas e insights automáticos', href: '/funcionalidades/inteligencia' },
  { icon: '🔗', label: 'AgroCore', desc: 'Serviços terceirizados integrados', href: '/agrocore' },
]

const RECURSOS = [
  { icon: '📝', label: 'Blog', desc: 'Dicas e estratégias para o agro', href: '/blog' },
  { icon: '📚', label: 'Documentação', desc: 'Guias e tutoriais do sistema', href: '/docs' },
  { icon: '❓', label: 'FAQ', desc: 'Perguntas frequentes', href: '/faq' },
  { icon: '🎓', label: 'Central de Aprendizado', desc: 'Conteúdo prático para gestão rural', href: '/aprendizado' },
]

function Dropdown({ items, onClose }: {
  items: { icon: string; label: string; desc: string; href: string }[]
  onClose: () => void
}) {
  return (
    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-[480px] bg-white rounded-2xl shadow-xl shadow-gray-200 border border-gray-100 overflow-hidden z-50">
      <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-l border-t border-gray-100 rotate-45" />
      <div className="p-4 grid grid-cols-2 gap-1">
        {items.map(item => (
          <Link
            key={item.label}
            href={item.href}
            onClick={onClose}
            className="flex items-start gap-3 p-3 rounded-xl hover:bg-[#f8fafc] transition-colors group"
          >
            <div className="w-10 h-10 rounded-xl bg-[#f0fdf4] flex items-center justify-center text-xl flex-shrink-0 group-hover:bg-green-100 transition-colors">
              {item.icon}
            </div>
            <div>
              <div className="font-semibold text-sm text-[#0f172a] group-hover:text-[#16a34a] transition-colors">{item.label}</div>
              <div className="text-xs text-[#94a3b8] mt-0.5 leading-tight">{item.desc}</div>
            </div>
          </Link>
        ))}
      </div>
      <div className="bg-[#f8fafc] border-t border-gray-100 px-4 py-3 flex items-center justify-between">
        <span className="text-xs text-[#94a3b8]">Explore todas as funcionalidades</span>
        <Link href="/login" onClick={onClose} className="text-xs font-bold text-[#16a34a] hover:underline flex items-center gap-1">
          Começar grátis →
        </Link>
      </div>
    </div>
  )
}

export default function Nav() {
  const [open, setOpen] = useState<'funcionalidades' | 'recursos' | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userName, setUserName] = useState<string | null>(null)
  const navRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setOpen(null)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const name = session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Usuário'
        setUserName(name)
      }
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const name = session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Usuário'
        setUserName(name)
      } else {
        setUserName(null)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between bg-white/90 backdrop-blur-md border-b border-gray-100">
      <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
        <AgroOSLogo size={34} />
        <span className="font-bold text-xl text-[#0f172a]">SmartAgroOS</span>
      </Link>

      <nav ref={navRef} className="hidden md:flex items-center gap-1 text-sm font-medium text-[#64748b]">
        <div className="relative">
          <button
            onClick={() => setOpen(open === 'funcionalidades' ? null : 'funcionalidades')}
            className={`flex items-center gap-1 px-4 py-2 rounded-xl hover:bg-[#f8fafc] hover:text-[#0f172a] transition-all ${open === 'funcionalidades' ? 'bg-[#f8fafc] text-[#0f172a]' : ''}`}
          >
            Funcionalidades
            <svg className={`w-3.5 h-3.5 transition-transform ${open === 'funcionalidades' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
            </svg>
          </button>
          {open === 'funcionalidades' && (
            <Dropdown items={FUNCIONALIDADES} onClose={() => setOpen(null)} />
          )}
        </div>

        <Link href="/como-funciona" className="px-4 py-2 rounded-xl hover:bg-[#f8fafc] hover:text-[#0f172a] transition-all">
          Como funciona
        </Link>

        <Link href="/agrocore" className="px-4 py-2 rounded-xl hover:bg-[#f8fafc] hover:text-[#0f172a] transition-all flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
          AgroCore
        </Link>

        <div className="relative">
          <button
            onClick={() => setOpen(open === 'recursos' ? null : 'recursos')}
            className={`flex items-center gap-1 px-4 py-2 rounded-xl hover:bg-[#f8fafc] hover:text-[#0f172a] transition-all ${open === 'recursos' ? 'bg-[#f8fafc] text-[#0f172a]' : ''}`}
          >
            Recursos
            <svg className={`w-3.5 h-3.5 transition-transform ${open === 'recursos' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
            </svg>
          </button>
          {open === 'recursos' && (
            <Dropdown items={RECURSOS} onClose={() => setOpen(null)} />
          )}
        </div>
      </nav>

      <div className="hidden md:flex items-center gap-3">
        {userName ? (
          <>
            <div className="flex items-center gap-2 text-sm text-[#64748b]">
              <div className="w-7 h-7 rounded-lg bg-[#16a34a] flex items-center justify-center text-white text-xs font-bold">
                {userName[0].toUpperCase()}
              </div>
              <span className="font-medium text-[#0f172a] max-w-[120px] truncate">{userName}</span>
            </div>
            <Link href="/dashboard" className="btn-primary text-sm font-bold bg-[#16a34a] text-white px-5 py-2.5 rounded-xl hover:bg-[#15803d] shadow-md shadow-green-200 hover:shadow-green-300/60 hover:shadow-lg flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
              Ir para o painel
            </Link>
          </>
        ) : (
          <>
            <Link href="/login" className="text-sm font-medium text-[#64748b] hover:text-[#0f172a] transition-colors px-4 py-2">
              Entrar
            </Link>
            <Link href="/login" className="btn-primary text-sm font-bold bg-[#16a34a] text-white px-5 py-2.5 rounded-xl hover:bg-[#15803d] shadow-md shadow-green-200 hover:shadow-green-300/60 hover:shadow-lg">
              Começar grátis
            </Link>
          </>
        )}
      </div>

      <button
        className="md:hidden p-2 rounded-xl hover:bg-[#f8fafc] transition-colors"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        <svg className="w-5 h-5 text-[#0f172a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          {mobileOpen
            ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            : <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          }
        </svg>
      </button>

      {mobileOpen && (
        <div className="absolute top-full left-0 right-0 bg-white border-b border-gray-100 shadow-xl md:hidden max-h-[calc(100vh-68px)] overflow-y-auto">
          <div className="px-4 py-4 space-y-1">
            <div className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider px-3 py-2">Funcionalidades</div>
            {FUNCIONALIDADES.map(item => (
              <Link key={item.label} href={item.href} onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#f8fafc] transition-colors">
                <span className="text-lg">{item.icon}</span>
                <span className="font-medium text-sm text-[#0f172a]">{item.label}</span>
              </Link>
            ))}
            <div className="border-t border-gray-100 my-2" />
            <Link href="/como-funciona" onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#f8fafc] transition-colors">
              <span className="text-lg">⚙️</span>
              <span className="font-medium text-sm text-[#0f172a]">Como funciona</span>
            </Link>
            <Link href="/agrocore" onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#f8fafc] transition-colors">
              <span className="text-lg">🔗</span>
              <span className="font-medium text-sm text-[#0f172a]">AgroCore</span>
            </Link>
            <div className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider px-3 py-2 mt-2">Recursos</div>
            {RECURSOS.map(item => (
              <Link key={item.label} href={item.href} onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#f8fafc] transition-colors">
                <span className="text-lg">{item.icon}</span>
                <span className="font-medium text-sm text-[#0f172a]">{item.label}</span>
              </Link>
            ))}
            <div className="border-t border-gray-100 pt-3 mt-2 flex flex-col gap-2">
              {userName ? (
                <>
                  <div className="flex items-center gap-2 px-3 py-2">
                    <div className="w-7 h-7 rounded-lg bg-[#16a34a] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {userName[0].toUpperCase()}
                    </div>
                    <span className="font-medium text-sm text-[#0f172a] truncate">{userName}</span>
                  </div>
                  <Link href="/dashboard" onClick={() => setMobileOpen(false)}
                    className="text-center py-3 font-bold text-sm bg-[#16a34a] text-white rounded-xl flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                    Ir para o painel
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/login" onClick={() => setMobileOpen(false)}
                    className="text-center py-3 font-medium text-sm text-[#64748b]">
                    Entrar
                  </Link>
                  <Link href="/login" onClick={() => setMobileOpen(false)}
                    className="text-center py-3 font-bold text-sm bg-[#16a34a] text-white rounded-xl">
                    Começar grátis
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

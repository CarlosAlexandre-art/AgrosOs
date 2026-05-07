'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import AgroOSLogo from '@/components/AgroOSLogo'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Email ou senha incorretos.')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <AgroOSLogo size={36} />
            <span className="font-bold text-2xl text-[#0f172a]">SmartAgroOS</span>
          </Link>
          <h1 className="text-2xl font-bold text-[#0f172a]">Bem-vindo de volta</h1>
          <p className="text-[#64748b] mt-1 text-sm">Entre na sua conta para continuar</p>
        </div>

        <div className="bg-white rounded-2xl border border-[#e2e8f0] p-8 shadow-sm">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#0f172a] mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="seu@email.com"
                className="w-full border border-[#e2e8f0] rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#16a34a] focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#0f172a] mb-1">Senha</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full border border-[#e2e8f0] rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#16a34a] focus:border-transparent transition-all"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full bg-[#16a34a] text-white font-bold py-3 rounded-xl hover:bg-[#15803d] shadow-sm shadow-green-200 hover:shadow-green-300/50 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-[#64748b]">
            Não tem conta?{' '}
            <Link href="/cadastro" className="text-[#16a34a] font-semibold hover:underline">
              Cadastre-se grátis
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

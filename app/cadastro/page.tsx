'use client'

import { useState } from 'react'
import Link from 'next/link'
import AgroOSLogo from '@/components/AgroOSLogo'
import GoogleButton from '@/components/GoogleButton'

export default function CadastroPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [emailSent, setEmailSent] = useState(false)

  async function handleCadastro(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/auth/cadastrar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error || 'Erro ao criar conta. Tente novamente.')
      setLoading(false)
      return
    }

    setEmailSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <AgroOSLogo size={36} />
            <span className="font-bold text-2xl text-[#0f172a]">SmartAgroOS</span>
          </Link>
          <h1 className="text-2xl font-bold text-[#0f172a]">Criar conta</h1>
          <p className="text-[#64748b] mt-1 text-sm">Comece a controlar sua operação hoje</p>
        </div>

        <div className="bg-white rounded-2xl border border-[#e2e8f0] p-8 shadow-sm">
          {emailSent ? (
            <div className="text-center space-y-4">
              <div className="text-5xl">📧</div>
              <h2 className="text-lg font-bold text-slate-900">Verifique seu e-mail</h2>
              <p className="text-sm text-slate-500 leading-relaxed">
                Enviamos um link de confirmação para{' '}
                <strong className="text-slate-800">{email}</strong>.
                Clique no link para ativar sua conta.
              </p>
              <p className="text-xs text-slate-400">
                Não recebeu? Verifique a pasta de spam.
              </p>
              <Link
                href="/login"
                className="inline-block mt-2 text-sm font-semibold text-[#16a34a] hover:underline"
              >
                Ir para o login →
              </Link>
            </div>
          ) : (
            <>
              <form onSubmit={handleCadastro} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#0f172a] mb-1">Nome completo</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                    placeholder="João da Silva"
                    className="w-full border border-[#e2e8f0] rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#16a34a] focus:border-transparent transition-all"
                  />
                </div>

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
                    minLength={6}
                    placeholder="Mínimo 6 caracteres"
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
                  className="w-full bg-[#16a34a] text-white font-bold py-3 rounded-lg hover:bg-[#15803d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Criando conta...' : 'Criar conta grátis'}
                </button>
              </form>

              <div className="flex items-center gap-3 my-1">
                <div className="flex-1 h-px bg-[#e2e8f0]" />
                <span className="text-xs text-[#94a3b8]">ou</span>
                <div className="flex-1 h-px bg-[#e2e8f0]" />
              </div>

              <GoogleButton label="Cadastrar com Google" next="/onboarding" />

              <div className="mt-4 text-center text-sm text-[#64748b]">
                Já tem conta?{' '}
                <Link href="/login" className="text-[#16a34a] font-semibold hover:underline">
                  Entrar
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

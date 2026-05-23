'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import AgroOSLogo from '@/components/AgroOSLogo'

export default function AtualizarSenhaPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('As senhas não coincidem.'); return }
    if (password.length < 6) { setError('A senha deve ter pelo menos 6 caracteres.'); return }

    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error: err } = await supabase.auth.updateUser({ password })

    if (err) {
      setError(err.message === 'Auth session missing!'
        ? 'Sessão expirada. Solicite um novo link de recuperação.'
        : 'Não foi possível atualizar a senha. Tente novamente.')
      setLoading(false)
      return
    }

    setDone(true)
    setTimeout(() => router.push('/dashboard'), 2500)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <AgroOSLogo size={36} />
            <span className="font-bold text-2xl text-[#0f172a]">SmartAgroOS</span>
          </Link>
          <h1 className="text-2xl font-bold text-[#0f172a]">Nova senha</h1>
          <p className="text-[#64748b] mt-1 text-sm">Escolha uma senha forte para sua conta</p>
        </div>

        <div className="bg-white rounded-2xl border border-[#e2e8f0] p-8 shadow-sm">
          {done ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-3xl mx-auto">✅</div>
              <h2 className="text-lg font-bold text-slate-900">Senha atualizada!</h2>
              <p className="text-sm text-slate-500">Redirecionando para o dashboard...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#0f172a] mb-1">Nova senha</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full border border-[#e2e8f0] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#16a34a] focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0f172a] mb-1">Confirmar nova senha</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="Repita a senha"
                  className="w-full border border-[#e2e8f0] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#16a34a] focus:border-transparent transition-all"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#16a34a] text-white font-bold py-3 rounded-xl hover:bg-[#15803d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Salvando...' : 'Salvar nova senha'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

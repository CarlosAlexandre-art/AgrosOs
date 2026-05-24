'use client'

import { useState, useEffect } from 'react'
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
  const [sessionReady, setSessionReady] = useState(false)
  const [sessionError, setSessionError] = useState('')
  const [supabase] = useState(() => createClient())

  useEffect(() => {
    // Fluxo principal: servidor trocou o code em /auth/callback e gravou sessão nos cookies

    // Fallback implicit: hash com #access_token (links antigos ou clientes legacy)
    const hash = window.location.hash
    if (hash && hash.includes('access_token')) {
      const p = new URLSearchParams(hash.substring(1))
      const accessToken = p.get('access_token')
      const refreshToken = p.get('refresh_token') ?? ''
      if (p.get('type') === 'recovery' && accessToken) {
        supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
          .then(({ error: err }) => {
            if (!err) {
              setSessionReady(true)
              window.history.replaceState({}, '', window.location.pathname)
            } else {
              setSessionError(err.message)
            }
          })
        return
      }
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setSessionReady(true)
      else setSessionError('Link inválido. Solicite um novo link de recuperação.')
    })
  }, [supabase])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('As senhas não coincidem.'); return }
    if (password.length < 6) { setError('A senha deve ter pelo menos 6 caracteres.'); return }
    setLoading(true)
    setError('')
    const { error: err } = await supabase.auth.updateUser({ password })
    if (err) {
      setError('Não foi possível atualizar a senha. Tente novamente.')
      setLoading(false)
      return
    }
    setDone(true)
    setTimeout(() => router.push('/dashboard'), 2500)
  }

  if (sessionError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 mb-6">
              <AgroOSLogo size={36} />
              <span className="font-bold text-2xl text-[#0f172a]">SmartAgroOS</span>
            </Link>
          </div>
          <div className="bg-white rounded-2xl border border-[#e2e8f0] p-8 shadow-sm text-center space-y-4">
            <div className="text-4xl">⏰</div>
            <h2 className="text-lg font-bold text-slate-900">Link expirado</h2>
            <p className="text-sm text-slate-500">{sessionError}</p>
            <Link href="/esqueci-senha" className="block w-full bg-[#16a34a] text-white font-bold py-3 rounded-xl hover:bg-[#15803d] transition-colors text-center text-sm">
              Solicitar novo link
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!sessionReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <div className="text-center">
          <div className="text-4xl mb-3 animate-pulse">🔐</div>
          <p className="text-[#64748b] text-sm">Validando link...</p>
        </div>
      </div>
    )
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
                <input type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full border border-[#e2e8f0] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#16a34a] focus:border-transparent transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0f172a] mb-1">Confirmar nova senha</label>
                <input type="password" required minLength={6} value={confirm} onChange={e => setConfirm(e.target.value)}
                  placeholder="Repita a senha"
                  className="w-full border border-[#e2e8f0] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#16a34a] focus:border-transparent transition-all" />
              </div>
              {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>}
              <button type="submit" disabled={loading}
                className="w-full bg-[#16a34a] text-white font-bold py-3 rounded-xl hover:bg-[#15803d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? 'Salvando...' : 'Salvar nova senha'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

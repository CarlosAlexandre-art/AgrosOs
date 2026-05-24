'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import AgroOSLogo from '@/components/AgroOSLogo'

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/atualizar-senha`,
    })

    if (err) {
      if (err.message?.includes('60 seconds') || err.status === 429) {
        setError('Aguarde 1 minuto antes de solicitar outro link.')
      } else {
        setError(err.message || 'Não foi possível enviar o e-mail. Verifique o endereço e tente novamente.')
      }
      setLoading(false)
      return
    }

    setSent(true)
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
          <h1 className="text-2xl font-bold text-[#0f172a]">Esqueceu sua senha?</h1>
          <p className="text-[#64748b] mt-1 text-sm">Sem problema — vamos te ajudar a recuperar o acesso</p>
        </div>

        <div className="bg-white rounded-2xl border border-[#e2e8f0] p-8 shadow-sm">
          {sent ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-3xl mx-auto">📧</div>
              <h2 className="text-lg font-bold text-slate-900">E-mail enviado!</h2>
              <p className="text-sm text-slate-500 leading-relaxed">
                Enviamos um link de recuperação para <strong className="text-slate-700">{email}</strong>. Verifique sua caixa de entrada (e o spam).
              </p>
              <p className="text-xs text-slate-400">O link expira em 1 hora.</p>
              <Link href="/login"
                className="block w-full bg-[#16a34a] text-white font-bold py-3 rounded-xl hover:bg-[#15803d] transition-colors text-center text-sm mt-2">
                Voltar ao login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#0f172a] mb-1">E-mail da sua conta</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="seu@email.com"
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
                {loading ? 'Enviando...' : 'Enviar link de recuperação'}
              </button>

              <div className="text-center">
                <Link href="/login" className="text-sm text-[#64748b] hover:text-[#16a34a] transition-colors">
                  ← Voltar ao login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

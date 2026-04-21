'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AgroOSLogo from '@/components/AgroOSLogo'

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    propertyName: '',
    location: '',
    sizeHectares: '',
  })

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.propertyName.trim()) return
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyName: form.propertyName.trim(),
          location: form.location.trim() || null,
          sizeHectares: form.sizeHectares ? parseFloat(form.sizeHectares) : 0,
        }),
      })
      if (!res.ok) {
        let errorMsg = 'Erro ao configurar. Tente novamente.'
        try {
          const data = await res.json()
          errorMsg = data.error || errorMsg
        } catch {}
        throw new Error(errorMsg)
      }
      router.push('/dashboard')
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao configurar')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-lg">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-2"><AgroOSLogo size={52} /></div>
          <h1 className="text-2xl font-bold text-slate-900 mt-2">Bem-vindo ao AgroOS</h1>
          <p className="text-slate-500 text-sm mt-1">Vamos configurar sua fazenda em 1 minuto</p>
        </div>

        {/* Steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${step >= s ? 'bg-[#16a34a] text-white' : 'bg-slate-200 text-slate-400'}`}>
                {s}
              </div>
              {s < 2 && <div className={`w-12 h-0.5 transition-all ${step > s ? 'bg-[#16a34a]' : 'bg-slate-200'}`} />}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">

          {step === 1 && (
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-1">Qual o nome da sua fazenda?</h2>
              <p className="text-sm text-slate-500 mb-6">Você poderá adicionar mais propriedades depois.</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Nome da fazenda *</label>
                  <input
                    autoFocus
                    value={form.propertyName}
                    onChange={set('propertyName')}
                    placeholder="Ex: Fazenda São João"
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#16a34a] focus:border-transparent"
                  />
                </div>
              </div>

              <button
                onClick={() => { if (form.propertyName.trim()) setStep(2) }}
                disabled={!form.propertyName.trim()}
                className="w-full mt-6 bg-[#16a34a] text-white font-semibold py-3 rounded-xl hover:bg-[#15803d] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Continuar →
              </button>
            </div>
          )}

          {step === 2 && (
            <form onSubmit={handleSubmit}>
              <h2 className="text-lg font-bold text-slate-900 mb-1">Mais detalhes (opcional)</h2>
              <p className="text-sm text-slate-500 mb-6">Essas informações ajudam no controle por hectare.</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Localização</label>
                  <input
                    value={form.location}
                    onChange={set('location')}
                    placeholder="Ex: Sorriso, MT"
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#16a34a] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Área total (hectares)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={form.sizeHectares}
                    onChange={set('sizeHectares')}
                    placeholder="Ex: 500"
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#16a34a] focus:border-transparent"
                  />
                </div>
              </div>

              {error && (
                <div className="mt-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                  {error}
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 border-2 border-slate-200 text-slate-700 font-semibold py-3 rounded-xl hover:border-slate-300 transition-colors"
                >
                  ← Voltar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-[#16a34a] text-white font-semibold py-3 rounded-xl hover:bg-[#15803d] transition-colors disabled:opacity-50"
                >
                  {loading ? 'Configurando...' : 'Entrar no sistema'}
                </button>
              </div>
            </form>
          )}

        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          Você pode pular e configurar depois pelo dashboard.{' '}
          <button onClick={() => router.push('/dashboard')} className="text-[#16a34a] hover:underline font-medium">
            Pular →
          </button>
        </p>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import PushNotificationButton from '@/components/PushNotificationButton'
import Link from 'next/link'

function ExclusaoDadosBtn() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'err'>('idle')
  async function handleClick() {
    if (!confirm('Confirmar solicitação de exclusão de dados? Você receberá uma resposta em até 30 dias.')) return
    setStatus('loading')
    const res = await fetch('/api/lgpd/solicitar-exclusao', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
    setStatus(res.ok ? 'ok' : 'err')
  }
  if (status === 'ok') return <p className="text-sm text-green-600 font-medium">✓ Solicitação enviada. Processamos em até 30 dias.</p>
  if (status === 'err') return <p className="text-sm text-red-600">Erro ao enviar. Tente novamente ou escreva para privacidade@oryonag.com.br</p>
  return (
    <button onClick={handleClick} disabled={status === 'loading'} className="text-sm text-red-600 font-semibold hover:text-red-700 transition-colors disabled:opacity-50 underline">
      {status === 'loading' ? 'Enviando solicitação...' : 'Solicitar exclusão de dados'}
    </button>
  )
}

export default function ConfiguracoesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '', avatarUrl: '' })
  const [passwordForm, setPasswordForm] = useState({ next: '', confirm: '' })
  const [passError, setPassError] = useState('')
  const [passSaved, setPassSaved] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState('')
  const [plan, setPlan] = useState('starter')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setForm({
          name: user.user_metadata?.name || '',
          email: user.email || '',
          phone: user.user_metadata?.phone || '',
          avatarUrl: user.user_metadata?.avatarUrl || '',
        })
        setAvatarPreview(user.user_metadata?.avatarUrl || '')
      }
    })
    fetch('/api/user/plan').then(r => r.json()).then(d => setPlan(d.plan || 'starter'))
  }, [])

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const ext = file.name.split('.').pop()
    const path = `${user.id}.${ext}`
    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
    if (error) { setLoading(false); return }
    const { data } = supabase.storage.from('avatars').getPublicUrl(path)
    const url = `${data.publicUrl}?t=${Date.now()}`
    setAvatarPreview(url)
    setForm(f => ({ ...f, avatarUrl: url }))
    await supabase.auth.updateUser({ data: { avatarUrl: url } })
    setLoading(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  async function handleProfile(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.updateUser({
      data: { name: form.name, phone: form.phone },
    })
    setLoading(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault()
    setPassError('')
    if (passwordForm.next !== passwordForm.confirm) { setPassError('As senhas não conferem.'); return }
    if (passwordForm.next.length < 6) { setPassError('Mínimo de 6 caracteres.'); return }
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: passwordForm.next })
    setLoading(false)
    if (error) { setPassError(error.message); return }
    setPasswordForm({ next: '', confirm: '' })
    setPassSaved(true)
    setTimeout(() => setPassSaved(false), 3000)
  }

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  const inputCls = 'w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#16a34a] focus:border-transparent transition-all'
  const labelCls = 'block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5'
  const initial = form.name?.[0]?.toUpperCase() || 'U'

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Configurações</h1>
        <p className="text-sm text-slate-500 mt-0.5">Gerencie sua conta e preferências</p>
      </div>

      {/* Perfil */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Perfil</h2>
        </div>
        <form onSubmit={handleProfile} className="p-6 space-y-5">

          {/* Avatar */}
          <div className="flex items-center gap-5">
            <div className="relative group cursor-pointer" onClick={() => fileRef.current?.click()}>
              {avatarPreview ? (
                <img src={avatarPreview} alt="Foto" className="w-20 h-20 rounded-2xl object-cover border-2 border-slate-200" />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#16a34a] to-[#059669] text-white text-3xl font-bold flex items-center justify-center">
                  {initial}
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            <div>
              <div className="font-semibold text-slate-900">{form.name || 'Usuário'}</div>
              <div className="text-sm text-slate-400">{form.email}</div>
              <button type="button" onClick={() => fileRef.current?.click()} className="text-xs text-[#16a34a] font-medium hover:underline mt-1">
                Trocar foto
              </button>
            </div>
          </div>

          <div>
            <label className={labelCls}>Nome</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputCls} />
          </div>

          <div>
            <label className={labelCls}>Telefone</label>
            <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="(00) 00000-0000" className={inputCls} />
          </div>

          <div>
            <label className={labelCls}>E-mail</label>
            <input value={form.email} disabled className={`${inputCls} opacity-50 cursor-not-allowed`} />
            <p className="text-xs text-slate-400 mt-1">O e-mail não pode ser alterado por aqui.</p>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button type="submit" disabled={loading} className="bg-[#16a34a] text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-[#15803d] transition-colors disabled:opacity-50 text-sm">
              {loading ? 'Salvando...' : 'Salvar perfil'}
            </button>
            {saved && <span className="text-sm text-green-600 font-medium">✓ Salvo!</span>}
          </div>
        </form>
      </div>

      {/* Senha */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Segurança</h2>
        </div>
        <form onSubmit={handlePassword} className="p-6 space-y-4">
          <div>
            <label className={labelCls}>Nova senha</label>
            <input type="password" value={passwordForm.next} onChange={e => setPasswordForm(f => ({ ...f, next: e.target.value }))} placeholder="Mínimo 6 caracteres" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Confirmar nova senha</label>
            <input type="password" value={passwordForm.confirm} onChange={e => setPasswordForm(f => ({ ...f, confirm: e.target.value }))} placeholder="Repita a senha" className={inputCls} />
          </div>
          {passError && <p className="text-sm text-red-600">{passError}</p>}
          <div className="flex items-center gap-3 pt-1">
            <button type="submit" disabled={loading} className="bg-slate-800 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-slate-900 transition-colors disabled:opacity-50 text-sm">
              Alterar senha
            </button>
            {passSaved && <span className="text-sm text-green-600 font-medium">✓ Senha alterada!</span>}
          </div>
        </form>
      </div>

      {/* Notificações */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Notificações</h2>
        </div>
        <div className="px-6 py-2">
          <PushNotificationButton />
        </div>
      </div>

      {/* Conta */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Conta</h2>
        </div>
        <div className="p-6 space-y-3">
          <div className="flex items-center justify-between py-3 border-b border-slate-100">
            <div>
              <div className="text-sm font-medium text-slate-900">Plano atual</div>
              <div className="text-xs text-slate-400">
                {plan === 'pro' ? 'Pro — recursos completos' : plan === 'enterprise' ? 'Enterprise — suporte prioritário' : 'Gratuito — recursos básicos'}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-xs font-bold px-3 py-1 rounded-full border ${plan === 'pro' ? 'text-blue-700 bg-blue-50 border-blue-200' : plan === 'enterprise' ? 'text-purple-700 bg-purple-50 border-purple-200' : 'text-[#16a34a] bg-green-50 border-green-200'}`}>
                {plan === 'pro' ? 'Pro' : plan === 'enterprise' ? 'Enterprise' : 'Grátis'}
              </span>
              {plan === 'starter' && (
                <button onClick={() => router.push('/dashboard/planos')} className="text-xs font-bold text-white bg-[#16a34a] px-3 py-1.5 rounded-lg hover:bg-[#15803d] transition-colors">
                  Fazer upgrade
                </button>
              )}
            </div>
          </div>
          <div className="py-3 border-b border-slate-100">
            <div className="text-sm font-medium text-slate-900 mb-1">Privacidade e dados pessoais</div>
            <p className="text-xs text-slate-400 mb-3">Conforme a LGPD (Art. 18), você pode solicitar a exclusão dos seus dados a qualquer momento. <Link href="/privacidade" className="text-[#16a34a] hover:underline">Ver política de privacidade</Link></p>
            <ExclusaoDadosBtn />
          </div>
          <button onClick={handleSignOut} className="flex items-center gap-2 text-sm text-red-600 font-medium hover:text-red-700 transition-colors pt-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            Sair da conta
          </button>
        </div>
      </div>
    </div>
  )
}

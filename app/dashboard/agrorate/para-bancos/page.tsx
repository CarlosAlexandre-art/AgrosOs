'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'

type ScoreData = {
  score: number; category: string
  productionScore: number; efficiencyScore: number
  behaviorScore: number; operationalScore: number
  totalRevenue: number; totalCosts: number
  marginRate: number; activityCount: number
  dataCompleteness: number; lastCalculated: string
}

const CAT: Record<string, { label: string; color: string; hex: string; glow: string }> = {
  ELITE:    { label: 'Elite',    hex: '#f59e0b', color: 'text-amber-400',   glow: 'rgba(245,158,11,.5)'  },
  HIGH:     { label: 'Alto',     hex: '#10b981', color: 'text-emerald-400', glow: 'rgba(16,185,129,.5)' },
  GOOD:     { label: 'Bom',      hex: '#22c55e', color: 'text-green-400',   glow: 'rgba(34,197,94,.5)'  },
  REGULAR:  { label: 'Regular',  hex: '#3b82f6', color: 'text-blue-400',    glow: 'rgba(59,130,246,.5)' },
  LOW:      { label: 'Baixo',    hex: '#f97316', color: 'text-orange-400',  glow: 'rgba(249,115,22,.5)' },
  CRITICAL: { label: 'Crítico',  hex: '#ef4444', color: 'text-red-400',     glow: 'rgba(239,68,68,.5)'  },
}

export default function ParaBancosPage() {
  const [data, setData] = useState<ScoreData | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [selectedBanks, setSelectedBanks] = useState<string[]>([])

  const banks = [
    { id: 'sicoob', name: 'Sicoob', type: 'Cooperativa', logo: '🏦', email: 'credito@sicoob.com.br' },
    { id: 'sicredi', name: 'Sicredi', type: 'Cooperativa', logo: '🏦', email: 'credito@sicredi.com.br' },
    { id: 'brasil', name: 'Banco do Brasil', type: 'Banco Público', logo: '🏛️', email: 'agro@bb.com.br' },
    { id: 'santander', name: 'Santander', type: 'Banco Privado', logo: '🏦', email: 'agro@santander.com.br' },
    { id: 'itau', name: 'Itaú', type: 'Banco Privado', logo: '🏦', email: 'agro@itau.com.br' },
    { id: 'bradesco', name: 'Bradesco', type: 'Banco Privado', logo: '🏦', email: 'agro@bradesco.com.br' },
    { id: 'agrocred', name: 'AgroCred', type: 'Fintech', logo: '💳', email: 'contato@agrocred.com.br' },
    { id: 'credagro', name: 'CredAgro', type: 'Fintech', logo: '💳', email: 'credito@credagro.com.br' },
  ]

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) { setLoading(false); return }
      const res = await fetch(`/api/agrorate/score?userId=${session.user.id}`)
      if (res.ok) setData(await res.json())
      setLoading(false)
    })
  }, [])

  const cat = data ? (CAT[data.category] ?? CAT.REGULAR) : CAT.REGULAR

  const generateShareLink = () => {
    if (!data) return ''
    const baseUrl = window.location.origin
    const params = new URLSearchParams({
      score: data.score.toString(),
      category: data.category,
      production: data.productionScore.toString(),
      efficiency: data.efficiencyScore.toString(),
      behavior: data.behaviorScore.toString(),
      operational: data.operationalScore.toString(),
      revenue: data.totalRevenue.toString(),
      margin: (data.marginRate * 100).toString(),
      activities: data.activityCount.toString(),
      completeness: data.dataCompleteness.toString(),
      timestamp: new Date().toISOString()
    })
    return `${baseUrl}/dashboard/agrorate/compartilhado?${params.toString()}`
  }

  const copyShareLink = () => {
    const link = generateShareLink()
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
  }

  const sendEmailToBanks = async () => {
    if (!data || selectedBanks.length === 0) return
    
    setEmailSent(true)
    // Simulação de envio - em produção, integraria com API de email
    setTimeout(() => setEmailSent(false), 3000)
  }

  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020c08] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-green-500/20 border-t-green-500 rounded-full animate-spin mb-4" />
          <p className="text-slate-500">Carregando dados...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#020c08] flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🌾</div>
          <h2 className="text-2xl font-bold text-white mb-2">Dados não encontrados</h2>
          <p className="text-slate-400 mb-6">Configure sua fazenda no SmartAgroOS para gerar o AgroRate</p>
          <a href="/dashboard/agrorate" className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition-colors">
            ← Voltar para AgroRate
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#020c08] relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 right-0 w-96 h-96 bg-green-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 p-6 max-w-6xl mx-auto">
        {/* Header */}
        <motion.div initial={{opacity:0, y:-20}} animate={{opacity:1, y:0}} className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black text-white mb-2">Compartilhar com Bancos</h1>
              <p className="text-slate-400">Compartilhe seu AgroRate com instituições financeiras para obter as melhores condições de crédito</p>
            </div>
            <a href="/dashboard/agrorate" className="text-slate-400 hover:text-white transition-colors">
              ← Voltar
            </a>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Score Card */}
          <motion.div initial={{opacity:0, x:-20}} animate={{opacity:1, x:0}} transition={{delay:0.1}} className="lg:col-span-1">
            <div className="bg-gradient-to-br from-green-900/20 to-emerald-900/10 border border-green-500/20 rounded-2xl p-6">
              <div className="text-center mb-6">
                <div className="text-6xl font-black text-white mb-2">{data.score}</div>
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${cat.color} bg-green-500/20 border border-green-500/30`}>
                  <span className="w-2 h-2 rounded-full bg-green-400" />
                  {cat.label}
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Receita Total</span>
                  <span className="text-white font-semibold">{fmt(data.totalRevenue)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Margem</span>
                  <span className="text-white font-semibold">{Math.round(data.marginRate * 100)}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Atividades</span>
                  <span className="text-white font-semibold">{data.activityCount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Completude</span>
                  <span className="text-white font-semibold">{data.dataCompleteness}%</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Produção</span>
                  <span className="text-green-400">{data.productionScore}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Eficiência</span>
                  <span className="text-cyan-400">{data.efficiencyScore}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Comportamento</span>
                  <span className="text-purple-400">{data.behaviorScore}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Operacional</span>
                  <span className="text-amber-400">{data.operationalScore}</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Banks Selection */}
          <motion.div initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} transition={{delay:0.2}} className="lg:col-span-2 space-y-6">
            {/* Share Link */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Link de Compartilhamento</h3>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={generateShareLink()}
                  readOnly
                  className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm font-mono"
                />
                <button
                  onClick={copyShareLink}
                  className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-semibold"
                >
                  {copied ? 'Copiado!' : 'Copiar Link'}
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-2">Este link contém seus dados do AgroRate e pode ser compartilhado com instituições financeiras</p>
            </div>

            {/* Banks Grid */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Selecionar Bancos</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                {banks.map(bank => (
                  <label key={bank.id} className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-xl cursor-pointer hover:bg-white/10 transition-colors">
                    <input
                      type="checkbox"
                      checked={selectedBanks.includes(bank.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedBanks([...selectedBanks, bank.id])
                        } else {
                          setSelectedBanks(selectedBanks.filter(id => id !== bank.id))
                        }
                      }}
                      className="w-4 h-4 text-green-600 bg-white/10 border-white/20 rounded focus:ring-green-500 focus:ring-2"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{bank.logo}</span>
                        <div>
                          <div className="font-medium text-white">{bank.name}</div>
                          <div className="text-xs text-slate-400">{bank.type}</div>
                        </div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              <button
                onClick={sendEmailToBanks}
                disabled={selectedBanks.length === 0 || emailSent}
                className="w-full py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {emailSent ? 'Enviando...' : `Enviar para ${selectedBanks.length} banco${selectedBanks.length !== 1 ? 's' : ''}`}
              </button>
            </div>

            {/* Instructions */}
            <div className="bg-blue-900/20 border border-blue-500/20 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-blue-400 mb-3">Como funciona</h3>
              <div className="space-y-2 text-sm text-blue-200">
                <div className="flex gap-2">
                  <span className="text-blue-400">1.</span>
                  <span>Selecione as instituições financeiras que deseja contatar</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-blue-400">2.</span>
                  <span>Copie o link ou envie diretamente pelo sistema</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-blue-400">3.</span>
                  <span>Os bancos analisarão seu perfil e entrarão em contato com propostas</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-blue-400">4.</span>
                  <span>Você pode acompanhar as propostas na aba "Crédito" do AgroRate</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const STORAGE_KEY = 'agrotoken_tutorial_v1'

const STEPS = [
  {
    icon: '🌾',
    badge: 'O que é',
    title: 'AgroToken — tokenize sua produção',
    desc: 'O AgroToken permite que produtores rurais captem capital de investidores tokenizando ativos reais: safra, materiais agrícolas e maquinário.',
    detail: 'Um token representa uma fração do valor de um ativo da sua fazenda. Em vez de depender de um único banco, você capta de vários investidores de uma vez — com menos burocracia e mais transparência.',
    visual: (
      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          { icon: '🌱', label: 'Safra' },
          { icon: '🧪', label: 'Material' },
          { icon: '🚜', label: 'Maquinário' },
        ].map(i => (
          <div key={i.label} className="bg-white/10 rounded-xl p-3">
            <div className="text-2xl">{i.icon}</div>
            <div className="text-xs text-white/70 mt-1 font-medium">{i.label}</div>
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: '👨‍🌾',
    badge: 'Para produtores',
    title: 'Capte capital em 4 passos',
    desc: 'Como produtor, você cria um token representando o valor da sua safra ou ativo. Investidores compram frações e você recebe o capital para financiar a produção.',
    detail: 'Cada token passa por análise (aprovação da equipe AgroToken), laudo de capacidade produtiva gerado automaticamente com seus dados do SmartAgroOS, e fica disponível no marketplace.',
    visual: (
      <div className="space-y-2">
        {[
          { step: '01', text: 'Crie o token com tipo, valor e detalhes' },
          { step: '02', text: 'Aguarde aprovação e laudo automático' },
          { step: '03', text: 'Investidores compram no marketplace' },
          { step: '04', text: 'Solicite resgate ao final do período' },
        ].map(s => (
          <div key={s.step} className="flex items-center gap-3 bg-white/10 rounded-lg px-3 py-2">
            <span className="text-[10px] font-black text-white/50 w-6 flex-shrink-0">{s.step}</span>
            <span className="text-xs text-white/80">{s.text}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: '📈',
    badge: 'Para investidores',
    title: 'Invista no campo com retorno real',
    desc: 'No marketplace você vê todos os tokens disponíveis de produtores verificados — com laudo de capacidade produtiva e score AgroRate do emissor.',
    detail: 'Cada token mostra: tipo de ativo, rendimento esperado, prazo, volume captado e quantidade disponível. Você compra tokens e acompanha seu portfólio em "Meus Investimentos".',
    visual: (
      <div className="bg-white/10 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-bold text-white">Soja Talhão 3 — 2026</div>
            <div className="text-xs text-white/60">AgroRate 720 · KYC verificado</div>
          </div>
          <div className="text-right">
            <div className="text-sm font-black text-green-400">14% a.a.</div>
            <div className="text-xs text-white/50">12 meses</div>
          </div>
        </div>
        <div className="h-1.5 bg-white/10 rounded-full">
          <div className="h-full w-2/3 bg-green-400 rounded-full" />
        </div>
        <div className="text-xs text-white/50 text-right">67% captado</div>
      </div>
    ),
  },
  {
    icon: '💰',
    badge: 'Modelo de receita',
    title: 'Comissões transparentes',
    desc: 'O AgroToken opera com um modelo de comissão por resultado — não há mensalidade. A plataforma só recebe quando você recebe.',
    detail: 'As taxas são cobradas automaticamente nos eventos: aprovação do token, compra de tokens por investidores e liquidação pelo produtor.',
    visual: (
      <div className="space-y-2">
        {[
          { evento: 'Token aprovado', taxa: '2%', tipo: 'do valor total', color: 'bg-blue-500/20 border-blue-500/30 text-blue-300' },
          { evento: 'Investidor compra', taxa: '2%', tipo: 'por compra', color: 'bg-amber-500/20 border-amber-500/30 text-amber-300' },
          { evento: 'Produtor resgata', taxa: '3%', tipo: 'do captado', color: 'bg-green-500/20 border-green-500/30 text-green-300' },
        ].map(r => (
          <div key={r.evento} className={`flex items-center justify-between border rounded-xl px-3 py-2.5 ${r.color}`}>
            <span className="text-xs font-medium">{r.evento}</span>
            <div className="text-right">
              <span className="text-sm font-black">{r.taxa}</span>
              <span className="text-xs opacity-70 ml-1">{r.tipo}</span>
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: '🚀',
    badge: 'Fase atual',
    title: 'Fase Piloto — o que já funciona',
    desc: 'O AgroToken está em fase piloto. Tudo que você criar aqui é real e será migrado automaticamente quando a infraestrutura blockchain estiver ativa.',
    detail: 'Cadastre tokens agora, atraia investidores, teste o fluxo completo. A integração com Polygon (ERC-1400), assinatura Clicksign e distribuição regulada CVM 88 serão ativadas em breve.',
    visual: (
      <div className="space-y-2">
        {[
          { label: 'Wizard de criação de token', done: true },
          { label: 'Laudo de capacidade produtiva automático', done: true },
          { label: 'Marketplace e fluxo de compra', done: true },
          { label: 'Painel admin e comissões', done: true },
          { label: 'Blockchain Polygon (ERC-1400)', done: false },
          { label: 'Assinatura digital Clicksign', done: false },
          { label: 'CVM 88 — distribuição regulada', done: false },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-2.5 text-xs">
            <span className={`flex-shrink-0 ${item.done ? 'text-green-400' : 'text-white/25'}`}>
              {item.done ? '✓' : '○'}
            </span>
            <span className={item.done ? 'text-white/80' : 'text-white/35'}>{item.label}</span>
          </div>
        ))}
      </div>
    ),
  },
]

export default function AgroTokenTutorial() {
  const [visible, setVisible] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY)) return
    const t = setTimeout(() => setVisible(true), 600)
    return () => clearTimeout(t)
  }, [])

  function finish() {
    localStorage.setItem(STORAGE_KEY, '1')
    setVisible(false)
  }

  if (!visible) return null

  const s = STEPS[step]
  const isLast = step === STEPS.length - 1

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={finish} />

      <div className="relative bg-gradient-to-br from-[#0f172a] to-[#1e3a2f] rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden border border-white/10">
        {/* Progress */}
        <div className="h-0.5 bg-white/10">
          <div className="h-full bg-green-400 transition-all duration-500" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
        </div>

        <div className="p-6">
          {/* Badge + icon */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-2xl flex-shrink-0">
              {s.icon}
            </div>
            <div>
              <div className="text-[10px] font-black text-green-400 uppercase tracking-widest">{s.badge}</div>
              <h2 className="text-base font-black text-white leading-snug">{s.title}</h2>
            </div>
          </div>

          {/* Desc */}
          <p className="text-sm text-white/70 leading-relaxed mb-3">{s.desc}</p>

          {/* Visual */}
          <div className="mb-3">{s.visual}</div>

          {/* Detail */}
          <p className="text-xs text-white/40 leading-relaxed mb-4 border-t border-white/10 pt-3">{s.detail}</p>

          {/* Dots */}
          <div className="flex justify-center gap-1.5 mb-4">
            {STEPS.map((_, i) => (
              <button key={i} onClick={() => setStep(i)}
                className={`rounded-full transition-all ${i === step ? 'w-5 h-1.5 bg-green-400' : 'w-1.5 h-1.5 bg-white/20 hover:bg-white/40'}`}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {step > 0 && (
              <button onClick={() => setStep(s => s - 1)}
                className="flex-1 bg-white/10 text-white/70 font-semibold py-2.5 rounded-xl text-sm hover:bg-white/15 transition-colors">
                ← Voltar
              </button>
            )}
            {isLast ? (
              <Link href="/dashboard/token/novo" onClick={finish}
                className="flex-1 bg-[#16a34a] text-white font-bold py-2.5 rounded-xl text-sm hover:bg-[#15803d] transition-colors text-center">
                Criar meu primeiro token →
              </Link>
            ) : (
              <button onClick={() => setStep(s => s + 1)}
                className="flex-1 bg-[#16a34a] text-white font-bold py-2.5 rounded-xl text-sm hover:bg-[#15803d] transition-colors">
                Próximo →
              </button>
            )}
          </div>

          <button onClick={finish} className="mt-2 w-full text-white/25 text-xs py-1.5 hover:text-white/50 transition-colors">
            Pular tutorial
          </button>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'aves_modo_iniciante'

/** Preferência local (por navegador) de exibir ou não explicações extras nas telas de Avicultura. */
export function useModoIniciante(): [boolean, (v: boolean) => void] {
  const [ativo, setAtivo] = useState(true)

  useEffect(() => {
    const salvo = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null
    if (salvo !== null) setAtivo(salvo === '1')
  }, [])

  const atualizar = useCallback((v: boolean) => {
    setAtivo(v)
    if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, v ? '1' : '0')
  }, [])

  return [ativo, atualizar]
}

export function ModoInicianteToggle({ ativo, onChange }: { ativo: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!ativo)}
      style={{
        display: 'flex', alignItems: 'center', gap: 8, background: ativo ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${ativo ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 10,
        padding: '7px 14px', fontSize: 12, fontWeight: 600, color: ativo ? '#fbbf24' : '#64748b', cursor: 'pointer',
      }}
      title="Explicações extra para quem está começando na avicultura"
    >
      <span>{ativo ? '🔎' : '⚙️'}</span>
      Modo iniciante {ativo ? 'ligado' : 'desligado'}
    </button>
  )
}

/** Caixa de explicação simples — só aparece quando o modo iniciante está ligado. */
export function Dica({ ativo, children }: { ativo: boolean; children: React.ReactNode }) {
  if (!ativo) return null
  return (
    <div style={{ fontSize: 12, color: '#94a3b8', padding: '9px 12px', background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: 8, lineHeight: 1.5 }}>
      💡 {children}
    </div>
  )
}

/** Card de biblioteca de conteúdo — visível sempre, é referência de mercado independente do nível do usuário. */
export function GuiaRapido({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 16, padding: 22, marginTop: 32 }}>
      <h2 style={{ fontSize: 14, fontWeight: 700, color: '#94a3b8', marginBottom: 8 }}>📖 {titulo}</h2>
      <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6 }}>{children}</div>
    </div>
  )
}

/** Faixa de benchmark — compara um valor medido contra uma referência de mercado. */
export function Benchmark({ label, valor, referencia, dentro }: { label: string; valor: string; referencia: string; dentro: boolean | null }) {
  const cor = dentro === null ? '#64748b' : dentro ? '#34d399' : '#f87171'
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, gap: 10 }}>
      <div style={{ fontSize: 12, color: '#94a3b8' }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 800, color: cor }}>{valor}</span>
        <span style={{ fontSize: 10, color: '#475569' }}>ref: {referencia}</span>
      </div>
    </div>
  )
}

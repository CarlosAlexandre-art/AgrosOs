'use client'

import { useState, useEffect } from 'react'

export interface HowToUseStep {
  icon: string
  title: string
  description: string
}

interface HowToUseProps {
  storageKey: string
  title: string
  subtitle: string
  steps: HowToUseStep[]
  theme?: 'dark' | 'light'
  accentColor?: string
  tip?: string
}

export default function HowToUse({
  storageKey,
  title,
  subtitle,
  steps,
  theme = 'light',
  accentColor = '#16a34a',
  tip,
}: HowToUseProps) {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const dismissed = localStorage.getItem(`howto_${storageKey}`)
    setOpen(dismissed !== 'true')
  }, [storageKey])

  function dismiss() {
    localStorage.setItem(`howto_${storageKey}`, 'true')
    setOpen(false)
  }

  if (!mounted) return null

  const isDark = theme === 'dark'

  const bg = isDark ? 'rgba(255,255,255,0.04)' : '#fff'
  const border = isDark ? `1px solid rgba(255,255,255,0.1)` : `1px solid ${accentColor}30`
  const headerBg = isDark ? 'transparent' : `${accentColor}08`
  const textPrimary = isDark ? '#f1f5f9' : '#0f172a'
  const textSecondary = isDark ? '#94a3b8' : '#64748b'
  const textMuted = isDark ? '#64748b' : '#94a3b8'
  const stepBg = isDark ? 'rgba(255,255,255,0.05)' : `${accentColor}08`
  const stepBorder = isDark ? 'rgba(255,255,255,0.08)' : `${accentColor}20`

  if (!open) {
    return (
      <div className="flex justify-end px-1 mb-2">
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all hover:opacity-80"
          style={{ color: accentColor, background: `${accentColor}12`, border: `1px solid ${accentColor}25` }}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
          </svg>
          Como usar
        </button>
      </div>
    )
  }

  return (
    <div
      className="rounded-2xl overflow-hidden mb-5"
      style={{ background: bg, border }}
    >
      {/* Header */}
      <div
        className="px-5 py-4 flex items-start justify-between gap-4"
        style={{ background: headerBg, borderBottom: isDark ? '1px solid rgba(255,255,255,0.07)' : `1px solid ${accentColor}15` }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: `${accentColor}20`, border: `1px solid ${accentColor}35` }}
          >
            <svg className="w-4.5 h-4.5" style={{ color: accentColor, width: '18px', height: '18px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.966 8.966 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-bold leading-tight" style={{ color: textPrimary }}>{title}</h3>
            <p className="text-xs mt-0.5 leading-tight" style={{ color: textSecondary }}>{subtitle}</p>
          </div>
        </div>
        <button
          onClick={dismiss}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg flex-shrink-0 transition-all hover:opacity-80"
          style={{ color: accentColor, background: `${accentColor}15`, border: `1px solid ${accentColor}25` }}
        >
          Entendi
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
        </button>
      </div>

      {/* Steps */}
      <div className="px-5 py-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {steps.map((step, i) => (
            <div
              key={i}
              className="flex items-start gap-3 px-3 py-3 rounded-xl"
              style={{ background: stepBg, border: `1px solid ${stepBorder}` }}
            >
              <div
                className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0 mt-0.5"
                style={{ background: accentColor, color: '#fff' }}
              >
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-base leading-none">{step.icon}</span>
                  <span className="text-xs font-semibold leading-tight" style={{ color: textPrimary }}>{step.title}</span>
                </div>
                <p className="text-[11px] leading-relaxed" style={{ color: textSecondary }}>{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        {tip && (
          <div
            className="mt-3 flex items-start gap-2 px-3 py-2.5 rounded-xl text-[11px]"
            style={{ background: `${accentColor}10`, border: `1px solid ${accentColor}20`, color: textSecondary }}
          >
            <svg className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: accentColor }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
            </svg>
            <span><strong style={{ color: accentColor }}>Dica:</strong> {tip}</span>
          </div>
        )}
      </div>
    </div>
  )
}

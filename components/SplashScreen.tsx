'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/* ─────────────────────────────────────────────
   3 variantes — sorteadas sem repetir (sessionStorage)

   A · BOOT OS      — navy escuro, feixe ciano, texto terminal
   B · AURORA VERDE — deep forest, aurora ondulante no topo
   C · NOITE QUÂNTICA — indigo-preto, shimmer violeta-verde
───────────────────────────────────────────── */
const VARIANTS = [
  {
    id: 'a',
    bg: '#000914',
    stars: [['0,210,160', '0,255,200'], 1.0],   // ciano elétrico
    beamA: 'rgba(0,210,160,.26)', beamB: 'rgba(0,255,200,.10)',
    glow: 'rgba(74,222,128,.90)', glowFar: 'rgba(22,163,74,.35)',
    ringColor: '#4ade80', branchColor: '#4ade80',
    stemColor: '#22c55e', leafFill: 'rgba(22,163,74,.18)',
    wordGrad: 'linear-gradient(140deg,#f8fafc 0%,#4ade80 50%,#00d4a0 100%)',
    tagColor: 'rgba(74,222,128,.58)',
    subColor: 'rgba(0,210,160,.45)',
    label: 'SYSTEM BOOT',
  },
  {
    id: 'b',
    bg: '#020c05',
    stars: [['34,197,94', '74,222,128'], 1.0],   // verde vivo
    beamA: 'rgba(74,222,128,.24)', beamB: 'rgba(134,239,172,.10)',
    glow: 'rgba(34,197,94,.90)', glowFar: 'rgba(34,197,94,.30)',
    ringColor: '#86efac', branchColor: '#4ade80',
    stemColor: '#22c55e', leafFill: 'rgba(74,222,128,.15)',
    wordGrad: 'linear-gradient(140deg,#f0fdf4 0%,#86efac 50%,#22c55e 100%)',
    tagColor: 'rgba(134,239,172,.58)',
    subColor: 'rgba(74,222,128,.45)',
    label: 'AURORA VERDE',
  },
  {
    id: 'c',
    bg: '#050510',
    stars: [['139,92,246', '34,197,94'], 1.0],   // violeta + verde
    beamA: 'rgba(139,92,246,.22)', beamB: 'rgba(167,139,250,.08)',
    glow: 'rgba(139,92,246,.80)', glowFar: 'rgba(34,197,94,.30)',
    ringColor: '#a78bfa', branchColor: '#c4b5fd',
    stemColor: '#4ade80', leafFill: 'rgba(139,92,246,.18)',
    wordGrad: 'linear-gradient(140deg,#faf5ff 0%,#a78bfa 45%,#4ade80 100%)',
    tagColor: 'rgba(167,139,250,.58)',
    subColor: 'rgba(139,92,246,.45)',
    label: 'NOITE QUÂNTICA',
  },
] as const

type Variant = typeof VARIANTS[number]

/* ── Star field canvas ── */
function StarField({ variant }: { variant: Variant }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    let raf: number
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    resize()
    window.addEventListener('resize', resize)

    const [hA, hB] = variant.stars[0] as [string, string]
    const stars = Array.from({ length: 120 }, () => ({
      x: Math.random(), y: Math.random(),
      r: Math.random() * 1.5 + 0.25,
      dl: Math.random() * 1.6,
      a: 0,
      hue: Math.random() > 0.5 ? hA : hB,
    }))

    let t0: number | null = null
    const draw = (ts: number) => {
      if (!t0) t0 = ts
      const e = (ts - t0) / 1000
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      stars.forEach(s => {
        if (e > s.dl) {
          s.a = Math.min(1, (e - s.dl) * 2)
          const p = (Math.sin((e - s.dl) * 2.6 + s.x * 12) + 1) / 2
          ctx.beginPath()
          ctx.arc(s.x * canvas.width, s.y * canvas.height, s.r, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(${s.hue},${s.a * (0.14 + p * 0.36)})`
          ctx.fill()
        }
      })
      if (e < 6) raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [variant])

  return <canvas ref={ref} className="absolute inset-0 pointer-events-none" />
}

/* ── Aurora overlay (variante B) ── */
function AuroraLayer() {
  return (
    <motion.div
      className="absolute inset-0 pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3, duration: 1.4 }}
      style={{
        background: 'radial-gradient(ellipse 80% 40% at 50% -10%, rgba(34,197,94,.18) 0%, transparent 70%)',
      }}
    />
  )
}

/* ── Logo SVG animado ── */
function Logo({ variant, show }: { variant: Variant; show: boolean }) {
  const logoVariants = {
    hidden: { opacity: 0, scale: 0.6, filter: 'blur(18px)' },
    visible: {
      opacity: 1, scale: 1, filter: 'blur(0px)',
      transition: { delay: 0.55, duration: 0.95, ease: [0.2, 0, 0.1, 1] as number[] },
    },
  }

  const ring = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: { pathLength: 1, opacity: 0.65, transition: { delay: 0.7, duration: 0.9, ease: 'easeOut' as const } },
  }
  const leaf = {
    hidden: { opacity: 0, scale: 0.4 },
    visible: { opacity: 1, scale: 1, transition: { delay: 0.85, duration: 0.55, ease: 'easeOut' as const } },
  }
  const stem = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: { pathLength: 1, opacity: 1, transition: { delay: 1.0, duration: 0.4, ease: 'easeOut' as const } },
  }
  const branchA = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: { pathLength: 1, opacity: 0.8, transition: { delay: 1.15, duration: 0.3, ease: 'easeOut' as const } },
  }
  const branchB = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: { pathLength: 1, opacity: 0.8, transition: { delay: 1.25, duration: 0.3, ease: 'easeOut' as const } },
  }

  const size = 'clamp(108px,20vmin,148px)'

  return (
    <motion.div
      variants={logoVariants}
      initial="hidden"
      animate={show ? 'visible' : 'hidden'}
      style={{
        width: size, height: size,
        filter: `drop-shadow(0 0 28px ${variant.glow}) drop-shadow(0 0 56px ${variant.glowFar})`,
      }}
    >
      <motion.svg
        viewBox="0 0 36 36" fill="none"
        style={{ width: '100%', height: '100%' }}
        initial="hidden"
        animate={show ? 'visible' : 'hidden'}
      >
        {/* Background rect */}
        <motion.rect
          width="36" height="36" rx="9" fill="#0f172a"
          variants={{ hidden: { opacity: 0, scale: 0.5 }, visible: { opacity: 1, scale: 1, transition: { delay: 0.58, duration: 0.4, type: 'spring', stiffness: 260 } } }}
          style={{ transformOrigin: '18px 18px' }}
        />
        {/* Ring */}
        <motion.circle
          cx="18" cy="18" r="12"
          stroke={variant.ringColor}
          strokeWidth="1.2" fill="none"
          variants={ring}
        />
        {/* Leaf body */}
        <motion.path
          d="M18 9 C18 9 11 13.5 11 18.5 C11 22 14 25 18 25 C22 25 25 22 25 18.5 C25 13.5 18 9 18 9Z"
          fill={variant.leafFill}
          stroke={variant.branchColor}
          strokeWidth="1.3" strokeLinejoin="round"
          variants={leaf}
          style={{ transformOrigin: '18px 17px' }}
        />
        {/* Stem */}
        <motion.line
          x1="18" y1="9" x2="18" y2="25"
          stroke={variant.stemColor} strokeWidth="1.3" strokeLinecap="round"
          variants={stem}
        />
        {/* Upper branches */}
        <motion.line x1="18" y1="13.5" x2="14.5" y2="11.8"
          stroke={variant.branchColor} strokeWidth="0.9" strokeLinecap="round"
          variants={branchA} />
        <motion.line x1="18" y1="13.5" x2="21.5" y2="11.8"
          stroke={variant.branchColor} strokeWidth="0.9" strokeLinecap="round"
          variants={branchA} />
        {/* Lower branches */}
        <motion.line x1="18" y1="17.5" x2="13.5" y2="15.8"
          stroke={variant.branchColor} strokeWidth="0.9" strokeLinecap="round"
          variants={branchB} />
        <motion.line x1="18" y1="17.5" x2="22.5" y2="15.8"
          stroke={variant.branchColor} strokeWidth="0.9" strokeLinecap="round"
          variants={branchB} />
      </motion.svg>
    </motion.div>
  )
}

/* ── Wordmark ── */
function Wordmark({ variant, show }: { variant: Variant; show: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={show ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
      transition={{ delay: 1.65, duration: 0.75, ease: 'easeOut' }}
      style={{ marginTop: 'clamp(14px,4vmin,24px)' }}
    >
      {/* Sub-label variante */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={show ? { opacity: 1 } : { opacity: 0 }}
        transition={{ delay: 1.60, duration: 0.5 }}
        style={{
          fontFamily: "'DM Mono','Montserrat',monospace",
          fontSize: 'clamp(.45rem,1.4vmin,.58rem)',
          letterSpacing: '.22em',
          textTransform: 'uppercase',
          color: variant.tagColor,
          textAlign: 'center',
          marginBottom: 'clamp(4px,1vmin,8px)',
        }}
      >
        — {variant.label} —
      </motion.div>

      <div style={{
        fontFamily: "'Montserrat',system-ui,sans-serif",
        fontSize: 'clamp(2.4rem,9vmin,4.4rem)',
        fontWeight: 900,
        lineHeight: 1,
        background: variant.wordGrad,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        letterSpacing: '-.02em',
        textAlign: 'center',
      }}>
        SmartAgroOS
      </div>
    </motion.div>
  )
}

/* ── Main ── */
export default function SplashScreen() {
  const [show, setShow] = useState(false)
  const [exit, setExit] = useState(false)
  const [gone, setGone] = useState(false)

  const [variant] = useState<Variant>(() => {
    try {
      const last = sessionStorage.getItem('agroos_splash_last') ?? ''
      const pool = [...VARIANTS].filter(v => v.id !== last)
      const pick = pool[Math.floor(Math.random() * pool.length)]
      sessionStorage.setItem('agroos_splash_last', pick.id)
      return pick
    } catch {
      return VARIANTS[0]
    }
  })

  useEffect(() => {
    const t1 = setTimeout(() => setShow(true), 200)
    const t2 = setTimeout(() => setExit(true), 4200)
    const t3 = setTimeout(() => setGone(true), 5100)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [])

  if (gone) return null

  return (
    <AnimatePresence>
      <motion.div
        key="agroos-splash"
        className="fixed inset-0 z-[99999] flex items-center justify-center overflow-hidden"
        style={{
          background: variant.bg,
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
        animate={exit ? { opacity: 0 } : { opacity: 1 }}
        transition={{ duration: 0.9, ease: 'easeInOut' }}
      >
        {/* Stars */}
        <StarField variant={variant} />

        {/* Aurora overlay — só variante B */}
        {variant.id === 'b' && <AuroraLayer />}

        {/* Scan line — variante A (boot) */}
        {variant.id === 'a' && (
          <motion.div
            className="absolute left-0 right-0 pointer-events-none"
            style={{ height: '1px', background: `linear-gradient(90deg,transparent,${variant.tagColor},transparent)` }}
            initial={{ top: '-1px', opacity: 0 }}
            animate={show ? { top: ['0%', '100%'], opacity: [0, 0.7, 0] } : {}}
            transition={{ delay: 0.8, duration: 1.8, ease: 'easeInOut' }}
          />
        )}

        {/* Quantum ring pulse — variante C */}
        {variant.id === 'c' && show && (
          <>
            {[1, 1.6, 2.2].map((delay, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full pointer-events-none"
                style={{
                  width: 'clamp(180px,35vmin,260px)', height: 'clamp(180px,35vmin,260px)',
                  border: `1px solid ${variant.tagColor}`,
                  top: '50%', left: '50%',
                  translateX: '-50%', translateY: '-50%',
                }}
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: [0.4, 1.8], opacity: [0, 0.4, 0] }}
                transition={{ delay, duration: 1.8, ease: 'easeOut', repeat: Infinity, repeatDelay: 1.5 }}
              />
            ))}
          </>
        )}

        {/* Light beam A */}
        <motion.div
          className="absolute inset-y-0 pointer-events-none"
          style={{
            width: '45%', left: '-45%',
            background: `linear-gradient(90deg,transparent 0%,${variant.beamA.replace('.26', '.05')} 20%,${variant.beamA} 50%,${variant.beamA.replace('.26', '.05')} 80%,transparent 100%)`,
          }}
          animate={show ? { left: '160%' } : { left: '-45%' }}
          transition={{ delay: 1.5, duration: 1.2, ease: [0.4, 0, 0.3, 1] }}
        />
        {/* Light beam B */}
        <motion.div
          className="absolute inset-y-0 pointer-events-none"
          style={{
            width: '22%', left: '-22%',
            background: `linear-gradient(90deg,transparent,${variant.beamB} 50%,transparent)`,
          }}
          animate={show ? { left: '160%' } : { left: '-22%' }}
          transition={{ delay: 1.85, duration: 1.0, ease: [0.4, 0, 0.3, 1] }}
        />

        {/* Center content */}
        <div className="relative z-10 flex flex-col items-center">
          <Logo variant={variant} show={show} />
          <Wordmark variant={variant} show={show} />

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={show ? { opacity: 1 } : { opacity: 0 }}
            transition={{ delay: 2.4, duration: 0.6 }}
            style={{
              fontFamily: "'Montserrat',sans-serif",
              fontSize: 'clamp(.55rem,2vmin,.72rem)',
              letterSpacing: '.18em',
              textTransform: 'uppercase',
              color: variant.tagColor,
              marginTop: 'clamp(10px,2.5vmin,16px)',
              textAlign: 'center',
              padding: '0 20px',
            }}
          >
            Sistema Operacional da Fazenda
          </motion.p>

          {/* Módulos */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={show ? { opacity: 1 } : { opacity: 0 }}
            transition={{ delay: 3.0, duration: 0.55 }}
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: 'clamp(8px,3vmin,18px)',
              marginTop: 'clamp(14px,4vmin,22px)',
              padding: '0 16px',
              fontFamily: "'Montserrat',sans-serif",
              fontSize: 'clamp(.48rem,1.6vmin,.62rem)',
              letterSpacing: '.1em',
              textTransform: 'uppercase',
              color: variant.subColor,
            }}
          >
            {['26 Módulos', 'IA QUBO', 'AgroNav 3D', 'AgroToken'].map(m => (
              <span key={m} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 3, height: 3, borderRadius: '50%', background: variant.subColor, display: 'inline-block' }} />
                {m}
              </span>
            ))}
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

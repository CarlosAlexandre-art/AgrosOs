// components/Hero/HeroSection.tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import HeroVideo from './HeroVideo'
import Hero3DMap from './Hero3DMap'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: 'easeOut' } },
}

export default function HeroSection() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <section className="relative w-full min-h-screen flex items-center justify-center overflow-hidden bg-[#020c05]">
      {/* Background Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#020c0588]" />

      {/* Left: Video (60%) */}
      <div className="absolute left-0 top-0 w-3/5 h-full hidden lg:block">
        <HeroVideo />
        <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-[#020c05aa]" />
      </div>

      {/* Right: 3D Map (40%) */}
      <div className="absolute right-0 top-0 w-2/5 h-full hidden lg:block">
        {mounted && <Hero3DMap isVisible={true} />}
      </div>

      {/* Mobile: Video Full + 3D Corner */}
      <div className="absolute inset-0 lg:hidden">
        <HeroVideo />
        {mounted && (
          <div className="absolute bottom-8 right-8 w-32 h-32">
            <Hero3DMap isVisible={true} />
          </div>
        )}
      </div>

      {/* Center Content */}
      <motion.div
        className="relative z-10 max-w-4xl mx-auto px-6 text-center"
        variants={containerVariants}
        initial="hidden"
        animate={mounted ? 'visible' : 'hidden'}
      >
        {/* Status */}
        <motion.div
          className="flex items-center justify-center gap-3 mb-6"
          variants={itemVariants}
        >
          <div className="w-2 h-2 rounded-full bg-[#4ade80] animate-pulse" />
          <span className="text-xs tracking-widest font-medium text-[#4ade80] uppercase font-mono">
            ORYON AG — Agtech Brasileiro
          </span>
        </motion.div>

        {/* Title */}
        <motion.h1
          className="text-5xl sm:text-6xl lg:text-7xl font-black font-fraunces leading-tight mb-6 text-[#f0fdf4]"
          variants={itemVariants}
        >
          Inteligência que
          <br />
          <span className="bg-gradient-to-r from-[#22c55e] via-[#4ade80] to-[#86efac] bg-clip-text text-transparent italic">
            conecta o agro
          </span>
          <br />
          ao futuro.
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          className="text-lg lg:text-xl font-light text-[#4a7c5c] max-w-2xl mx-auto mb-8 leading-relaxed"
          variants={itemVariants}
        >
          Marketplace agrícola, sistema operacional de fazenda e crédito rural
          inteligente — três plataformas integradas em um único ecossistema.
        </motion.p>

        {/* CTAs */}
        <motion.div
          className="flex flex-col sm:flex-row gap-3 justify-center"
          variants={itemVariants}
        >
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#22c55e] text-[#020c05] rounded-xl font-semibold hover:bg-[#16a34a] transition-all hover:shadow-lg hover:-translate-y-0.5"
          >
            Criar conta grátis
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
          <Link
            href="/demo"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-[#4ade8044] text-[#4a7c5c] rounded-xl font-medium hover:border-[#4ade80] hover:text-[#4ade80] transition-all"
          >
            Ver demonstração
          </Link>
        </motion.div>
      </motion.div>

      {/* Scroll Indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[#4ade80] opacity-30"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </motion.div>
    </section>
  )
}

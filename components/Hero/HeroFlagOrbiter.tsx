'use client'

import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

const COUNTRIES = [
  { name: 'Brasil', flag: '/flags/br.svg', angle: 0 },
  { name: 'Israel', flag: '/flags/il.svg', angle: 60 },
  { name: 'Índia', flag: '/flags/in.svg', angle: 120 },
  { name: 'China', flag: '/flags/cn.svg', angle: 180 },
  { name: 'EUA', flag: '/flags/us.svg', angle: 240 },
  { name: 'Europa', flag: '/flags/eu.svg', angle: 300 },
]

export default function HeroFlagOrbiter() {
  const containerRef = useRef<HTMLDivElement>(null)

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full flex items-center justify-center"
    >
      {/* Orbiting flags */}
      <motion.div
        className="absolute"
        animate={{ rotate: 360 }}
        transition={{
          duration: 60,
          repeat: Infinity,
          ease: 'linear',
        }}
        style={{ width: '280px', height: '280px' }}
      >
        {COUNTRIES.map((country, idx) => (
          <motion.div
            key={country.name}
            className="absolute"
            style={{
              width: '50px',
              height: '50px',
              left: '50%',
              top: '50%',
              marginLeft: '-25px',
              marginTop: '-25px',
            }}
            animate={{
              rotate: -360, // Counter-rotate to keep upright
            }}
            transition={{
              duration: 60,
              repeat: Infinity,
              ease: 'linear',
            }}
            initial={{
              opacity: 0,
              scale: 0,
            }}
            whileInView={{
              opacity: 1,
              scale: 1,
              transition: {
                delay: idx * 0.1,
                duration: 0.5,
              },
            }}
          >
            <motion.div
              className="absolute rounded-lg overflow-hidden border-2 border-[#4ade80] bg-white shadow-lg"
              style={{
                transform: `rotate(${country.angle}deg) translateY(-140px)`,
                width: '100%',
                height: '100%',
              }}
              whileHover={{
                scale: 1.3,
                boxShadow: '0 0 20px rgba(74,222,128,0.6)',
              }}
              transition={{ duration: 0.2 }}
            >
              <img
                src={country.flag}
                alt={country.name}
                className="w-full h-full object-cover"
              />
            </motion.div>
          </motion.div>
        ))}
      </motion.div>

      {/* Brasil destaque (topo) */}
      <motion.div
        className="absolute top-0 flex flex-col items-center"
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 2.5, repeat: Infinity }}
      >
        <motion.div
          className="w-16 h-16 rounded-lg overflow-hidden border-4 border-[#22c55e] bg-white shadow-2xl"
          whileHover={{ scale: 1.2 }}
        >
          <img src="/flags/br.svg" alt="Brasil" className="w-full h-full object-cover" />
        </motion.div>
        <span className="mt-2 text-xs font-bold text-[#22c55e] uppercase tracking-wide">
          Brasil
        </span>
      </motion.div>
    </div>
  )
}

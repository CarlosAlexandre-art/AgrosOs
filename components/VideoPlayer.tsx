'use client'

import { useState } from 'react'

// Troque pelo ID real do YouTube quando tiver o vídeo
const YOUTUBE_ID = 'dQw4w9WgXcQ'

export default function VideoPlayer() {
  const [playing, setPlaying] = useState(false)

  return (
    <div className="relative rounded-3xl overflow-hidden bg-[#0f172a] aspect-video shadow-2xl shadow-gray-300">
      {playing ? (
        <iframe
          className="absolute inset-0 w-full h-full"
          src={`https://www.youtube-nocookie.com/embed/${YOUTUBE_ID}?autoplay=1&rel=0&modestbranding=1`}
          title="AgroOS — Demonstração"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <>
          {/* Thumbnail decorativa */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-0 grid grid-cols-4 gap-4 p-8">
              {['📋 Operações', '💰 Financeiro', '👷 Equipe', '🌾 Talhões'].map(t => (
                <div key={t} className="bg-white/10 rounded-xl p-4 text-white text-xs font-medium flex items-center gap-2">
                  {t}
                </div>
              ))}
            </div>
          </div>

          {/* Gradiente escuro no centro para o botão se destacar */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

          {/* Botão play */}
          <button
            onClick={() => setPlaying(true)}
            className="absolute inset-0 w-full h-full flex flex-col items-center justify-center gap-4 group"
            aria-label="Reproduzir vídeo"
          >
            <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-2xl group-hover:scale-110 group-hover:bg-[#f0fdf4] transition-all duration-200">
              <svg className="w-8 h-8 text-[#16a34a] ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            <span className="text-white/70 text-sm font-medium group-hover:text-white transition-colors">
              Assistir demonstração — 2 min
            </span>
          </button>

          {/* Badge */}
          <div className="absolute top-4 left-4 bg-[#16a34a] text-white text-xs font-bold px-3 py-1.5 rounded-full pointer-events-none">
            AgroOS em ação
          </div>
        </>
      )}
    </div>
  )
}

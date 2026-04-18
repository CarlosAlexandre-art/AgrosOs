'use client'

const YOUTUBE_ID = '4Yu7iqfk3ys'
const YOUTUBE_URL = `https://youtu.be/${YOUTUBE_ID}`
const THUMBNAIL_URL = `https://img.youtube.com/vi/${YOUTUBE_ID}/maxresdefault.jpg`

export default function VideoPlayer() {
  return (
    <a
      href={YOUTUBE_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="relative block rounded-3xl overflow-hidden aspect-video shadow-2xl shadow-gray-300 group"
      aria-label="Assistir demonstração no YouTube"
    >
      {/* Thumbnail do YouTube como fundo */}
      <img
        src={THUMBNAIL_URL}
        alt="AgroOS — Demonstração"
        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
      />

      {/* Overlay escuro */}
      <div className="absolute inset-0 bg-black/35 group-hover:bg-black/25 transition-colors" />

      {/* Botão play */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
        <div className="w-20 h-20 rounded-full bg-white/90 flex items-center justify-center shadow-2xl group-hover:scale-110 group-hover:bg-white transition-all duration-200">
          <svg className="w-8 h-8 text-[#16a34a] ml-1" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
        <span className="text-white/90 text-sm font-semibold group-hover:text-white transition-colors drop-shadow">
          Assistir demonstração
        </span>
      </div>

      {/* Badge */}
      <div className="absolute top-4 left-4 bg-[#16a34a] text-white text-xs font-bold px-3 py-1.5 rounded-full">
        AgroOS em ação
      </div>
    </a>
  )
}

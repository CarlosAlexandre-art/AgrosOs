'use client'

export default function ScrollEffectsPage() {
  return (
    <div className="w-full bg-[#020c05] text-white overflow-hidden">
      {/* Title */}
      <div className="px-8 py-12 max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">Efeitos de Scroll — 3 Estilos</h1>
        <p className="text-gray-400">Qual se encaixa melhor na visão premium do OryonAG?</p>
      </div>

      {/* Option A: Subtle Fade In */}
      <section className="border-t border-gray-800 py-12">
        <div className="px-8 max-w-7xl mx-auto mb-8">
          <h2 className="text-2xl font-bold text-[#4ade80] mb-2">Opção A: Subtle Fade-In + Slide Up</h2>
          <p className="text-gray-400">Minimalista. Elementos aparecem conforme scroll (elegante, discreto)</p>
        </div>
        <div className="px-8 max-w-7xl mx-auto space-y-6">
          {/* Simulated sections */}
          <div className="h-32 bg-gradient-to-r from-[#1a3a1a] to-[#020c05] rounded border border-[#22c55e]/20 flex items-center justify-center opacity-90 hover:opacity-100 transition">
            <p className="text-gray-400">Seção 1: "O Ecossistema" — fade in no scroll</p>
          </div>
          <div className="h-32 bg-gradient-to-r from-[#1a3a1a] to-[#020c05] rounded border border-[#22c55e]/20 flex items-center justify-center opacity-70 hover:opacity-100 transition">
            <p className="text-gray-400">Seção 2: "AgroCore" — slides up + fade</p>
          </div>
          <div className="h-32 bg-gradient-to-r from-[#1a3a1a] to-[#020c05] rounded border border-[#22c55e]/20 flex items-center justify-center opacity-50 hover:opacity-100 transition">
            <p className="text-gray-400">Seção 3: "SmartAgroOS" — staggered cards</p>
          </div>
          <div className="p-6 bg-[#1a3a1a] rounded border border-[#22c55e]/20">
            <p className="text-sm text-gray-300 mb-2"><strong>Características:</strong> Transições suaves, nada muito chamativo. Elementos aparecem naturalmente conforme você desce.</p>
            <p className="text-sm text-gray-400"><strong>Referência:</strong> From Another Love, HubTown (corporativo sofisticado)</p>
            <p className="text-sm text-gray-500"><strong>Complexidade:</strong> ⭐⭐ Baixa — usa Intersection Observer + CSS transitions</p>
          </div>
        </div>
      </section>

      {/* Option B: Parallax + Reveal */}
      <section className="border-t border-gray-800 py-12">
        <div className="px-8 max-w-7xl mx-auto mb-8">
          <h2 className="text-2xl font-bold text-[#4ade80] mb-2">Opção B: Parallax + Reveal Animations</h2>
          <p className="text-gray-400">Sofisticado. Imagens se movem diferente do texto (profundidade), elementos revelam em cascade</p>
        </div>
        <div className="px-8 max-w-7xl mx-auto space-y-6">
          {/* Simulated parallax section */}
          <div className="relative h-64 rounded border border-[#22c55e]/20 overflow-hidden bg-[#0d1f0d]">
            {/* Background layer */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#22c55e]/20 to-transparent transform -translate-y-8"></div>
            {/* Content layer */}
            <div className="relative h-full flex flex-col items-center justify-center text-center">
              <p className="text-gray-400 mb-4">Seção "O Ecossistema"</p>
              <p className="text-sm text-gray-500">Imagem de fundo se move mais lentamente que o texto</p>
              <p className="text-sm text-gray-500">→ Cria ilusão de profundidade (3D depth effect)</p>
            </div>
          </div>

          {/* Cascade reveal example */}
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-24 bg-gradient-to-br from-[#1a3a1a] to-[#020c05] rounded border border-[#22c55e]/20 flex items-center justify-center"
                style={{ opacity: 0.3 + i * 0.2 }}
              >
                <p className="text-xs text-gray-500">Card {i}</p>
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-500 text-center">Cards aparecem em sequência (cascade) — Card 1, depois Card 2, depois Card 3</p>

          <div className="p-6 bg-[#1a3a1a] rounded border border-[#22c55e]/20">
            <p className="text-sm text-gray-300 mb-2"><strong>Características:</strong> Paralaxe de imagens, elementos aparecem em cascade/sequência, movimento perceptível.</p>
            <p className="text-sm text-gray-400"><strong>Referência:</strong> Floema, Horeca Social (agências criativas premium)</p>
            <p className="text-sm text-gray-500"><strong>Complexidade:</strong> ⭐⭐⭐ Média — usa GSAP + Intersection Observer</p>
          </div>
        </div>
      </section>

      {/* Option C: Full Motion — Gsap Timeline */}
      <section className="border-t border-gray-800 py-12 pb-20">
        <div className="px-8 max-w-7xl mx-auto mb-8">
          <h2 className="text-2xl font-bold text-[#4ade80] mb-2">Opção C: Full Motion — GSAP Timeline</h2>
          <p className="text-gray-400">Cinematográfico. Efeitos complexos orquestrados via GSAP: rotações, escalas, blur, movimento fluido</p>
        </div>
        <div className="px-8 max-w-7xl mx-auto space-y-6">
          {/* Simulated complex animation */}
          <div className="relative h-80 rounded border border-[#22c55e]/20 overflow-hidden bg-[#0d1f0d] flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="w-24 h-24 mx-auto bg-[#22c55e]/30 rounded-full animate-pulse"></div>
              <p className="text-gray-400">Seção "Intelligence Hub"</p>
              <p className="text-sm text-gray-500">Elemento rotaciona + scale em, blur backgrounds</p>
              <p className="text-sm text-gray-500">Múltiplos efeitos orquestrados simultaneamente</p>
            </div>
          </div>

          {/* Grid with individual animations */}
          <div className="grid grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-20 bg-gradient-to-br from-[#1a3a1a] to-[#020c05] rounded border border-[#22c55e]/20 flex items-center justify-center transform hover:scale-110 transition-transform"
              >
                <p className="text-xs text-gray-500">Item {i}</p>
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-500 text-center">Cada grid item tem seu próprio timeline de animação</p>

          <div className="p-6 bg-[#1a3a1a] rounded border border-[#22c55e]/20">
            <p className="text-sm text-gray-300 mb-2"><strong>Características:</strong> Efeitos complexos, orquestrados com GSAP, muito movimento e "wow factor".</p>
            <p className="text-sm text-gray-400"><strong>Referência:</strong> StationABT, agências criativas ultra-premium (Apple-like)</p>
            <p className="text-sm text-gray-500"><strong>Complexidade:</strong> ⭐⭐⭐⭐⭐ Alta — GSAP Timelines, múltiplos efeitos simultâneos, exige performance</p>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <div className="border-t border-gray-800 px-8 py-12 text-center max-w-7xl mx-auto">
        <p className="text-gray-300 mb-6">Qual estilo de scroll effects você quer?</p>
        <p className="text-gray-400 mb-2"><strong>A:</strong> Subtle (minimalista) | <strong>B:</strong> Parallax (sofisticado) | <strong>C:</strong> Full Motion (cinematográfico)</p>
        <p className="text-gray-500 text-sm">Responda no terminal com: A, B, ou C</p>
      </div>
    </div>
  )
}

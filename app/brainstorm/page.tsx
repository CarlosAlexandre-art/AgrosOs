'use client'

export default function BrainstormPage() {
  return (
    <div className="w-full bg-[#020c05] text-white overflow-hidden">
      {/* Title */}
      <div className="px-8 py-12 max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">3 Abordagens para o Hero Section</h1>
        <p className="text-gray-400">Qual se alinha melhor com sua visão premium?</p>
      </div>

      {/* Approach A: Full-Width Visual First */}
      <section className="border-t border-gray-800 py-12">
        <div className="px-8 max-w-7xl mx-auto mb-8">
          <h2 className="text-2xl font-bold text-[#4ade80] mb-2">Abordagem A: Visual-First (Full-Width)</h2>
          <p className="text-gray-400">Vídeo/animação full-width como protagonista, texto centered overlay</p>
        </div>
        <div className="px-8 max-w-7xl mx-auto">
          <div className="relative w-full h-96 bg-gradient-to-b from-[#1a3a1a] to-[#020c05] rounded-lg overflow-hidden border border-[#22c55e]/20 flex items-center justify-center">
            {/* Simulated video background */}
            <div className="absolute inset-0 opacity-30">
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#22c55e] to-transparent"></div>
            </div>

            {/* Overlay text */}
            <div className="relative z-10 text-center px-8 max-w-2xl">
              <div className="text-sm font-mono text-[#4ade80] mb-4 flex items-center justify-center gap-2">
                <span className="w-2 h-2 bg-[#4ade80] rounded-full animate-pulse"></span>
                ORYON AG — AGTECH BRASILEIRO
              </div>
              <h1 className="text-5xl font-black mb-4 leading-tight">
                Inteligência que<br/>
                <span className="bg-gradient-to-r from-[#22c55e] via-[#4ade80] to-[#86efac] bg-clip-text text-transparent">conecta o agro</span><br/>
                ao futuro.
              </h1>
              <p className="text-gray-300 mb-8 text-lg">
                Gerencie sua fazenda, contrate serviços e acesse crédito rural em um só lugar
              </p>
              <button className="bg-[#22c55e] text-[#020c05] px-8 py-3 rounded-lg font-bold hover:bg-[#16a34a] transition mb-6">
                Começar grátis
              </button>
              <div className="flex gap-4 justify-center flex-wrap text-sm">
                <button className="text-[#4ade80] hover:text-white transition flex items-center gap-1">
                  <span>🏪</span> Marketplace →
                </button>
                <button className="text-[#4ade80] hover:text-white transition flex items-center gap-1">
                  <span>⚙️</span> Sistema da Fazenda →
                </button>
                <button className="text-[#4ade80] hover:text-white transition flex items-center gap-1">
                  <span>💰</span> Score de Crédito →
                </button>
              </div>
            </div>
          </div>
          <div className="mt-6 p-4 bg-[#1a3a1a] rounded border border-[#22c55e]/20">
            <p className="text-sm text-gray-300 mb-2"><strong>Vantagens:</strong> Impacto visual máximo, como From Another Love / Floema. Puro cinema.</p>
            <p className="text-sm text-gray-400"><strong>Desvantagens:</strong> Menos espaço para conteúdo estruturado. Requer assets visuais de alta qualidade.</p>
          </div>
        </div>
      </section>

      {/* Approach B: Split Layout */}
      <section className="border-t border-gray-800 py-12">
        <div className="px-8 max-w-7xl mx-auto mb-8">
          <h2 className="text-2xl font-bold text-[#4ade80] mb-2">Abordagem B: Split Layout (60/40)</h2>
          <p className="text-gray-400">Esquerda: vídeo/visual. Direita: 3D interativo + texto. Híbrido estruturado.</p>
        </div>
        <div className="px-8 max-w-7xl mx-auto">
          <div className="flex gap-4 h-96 border border-[#22c55e]/20 rounded-lg overflow-hidden">
            {/* Left side - Video */}
            <div className="w-3/5 bg-gradient-to-br from-[#1a3a1a] to-[#020c05] flex items-center justify-center relative">
              <div className="text-center text-gray-500">
                <div className="text-4xl mb-2">🎥</div>
                <p>Vídeo ou animação agrícola</p>
              </div>
            </div>

            {/* Right side - Content + 3D */}
            <div className="w-2/5 bg-[#0d1f0d] flex flex-col items-center justify-center p-6 relative">
              <div className="text-center mb-6">
                <div className="text-sm font-mono text-[#4ade80] mb-3">ORYON AG</div>
                <h1 className="text-2xl font-bold mb-2">Inteligência que conecta o agro ao futuro</h1>
                <p className="text-xs text-gray-400 mb-4">Marketplace + ERP + Crédito</p>
                <button className="bg-[#22c55e] text-[#020c05] px-4 py-2 rounded text-sm font-bold">Começar grátis</button>
              </div>
              <div className="text-center w-full border-t border-[#22c55e]/20 pt-4">
                <div className="text-2xl mb-2">🌍</div>
                <p className="text-xs text-gray-400">Mapa 3D interativo</p>
                <p className="text-xs text-[#4ade80]">+ 6 bandeiras em órbita</p>
              </div>
            </div>
          </div>
          <div className="mt-6 p-4 bg-[#1a3a1a] rounded border border-[#22c55e]/20">
            <p className="text-sm text-gray-300 mb-2"><strong>Vantagens:</strong> Estrutura clara, conteúdo + visual equilibrado. Responsivo (empilha em mobile).</p>
            <p className="text-sm text-gray-400"><strong>Desvantagens:</strong> Menos impactante que full-width. Requer Two.js para 3D.</p>
          </div>
        </div>
      </section>

      {/* Approach C: Content-First Hero */}
      <section className="border-t border-gray-800 py-12 pb-20">
        <div className="px-8 max-w-7xl mx-auto mb-8">
          <h2 className="text-2xl font-bold text-[#4ade80] mb-2">Abordagem C: Content-First (like HubTown)</h2>
          <p className="text-gray-400">Texto protagonista, visual como suporte. Hierarquia clara, mais leitura.</p>
        </div>
        <div className="px-8 max-w-7xl mx-auto">
          <div className="grid grid-cols-2 gap-6 h-80">
            {/* Left - Content */}
            <div className="flex flex-col justify-center bg-gradient-to-br from-[#1a3a1a] to-[#020c05] p-8 rounded-lg border border-[#22c55e]/20">
              <div className="text-sm font-mono text-[#4ade80] mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-[#4ade80] rounded-full"></span>
                ORYON AG
              </div>
              <h1 className="text-4xl font-black mb-6 leading-tight">
                Inteligência que conecta o agro ao futuro
              </h1>
              <p className="text-gray-300 mb-8">
                O ecossistema mais completo do agronegócio brasileiro. Marketplace, ERP e crédito integrados em uma única plataforma alimentada por IA.
              </p>
              <div className="flex flex-wrap gap-2">
                <button className="bg-[#22c55e] text-[#020c05] px-6 py-2 rounded font-bold text-sm hover:bg-[#16a34a]">
                  Começar grátis
                </button>
                <button className="border border-[#4ade80] text-[#4ade80] px-6 py-2 rounded font-bold text-sm hover:bg-[#4ade80]/10">
                  Ver demonstração
                </button>
              </div>
            </div>

            {/* Right - Visual */}
            <div className="bg-gradient-to-br from-[#22c55e]/10 to-[#020c05] rounded-lg border border-[#22c55e]/20 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-20">
                <div className="w-full h-full bg-gradient-to-r from-[#22c55e] to-transparent"></div>
              </div>
              <div className="relative z-10 text-center">
                <div className="text-5xl mb-3">🚜</div>
                <p className="text-gray-400">Imagem ou vídeo curto</p>
                <p className="text-gray-500 text-sm">campo + interface</p>
              </div>
            </div>
          </div>
          <div className="mt-6 p-4 bg-[#1a3a1a] rounded border border-[#22c55e]/20">
            <p className="text-sm text-gray-300 mb-2"><strong>Vantagens:</strong> Mensagem clara, hierarquia forte. Fácil de ler. Direciona melhor a ação.</p>
            <p className="text-sm text-gray-400"><strong>Desvantagens:</strong> Menos visual que A. Precisa de copywriting bem afiado.</p>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <div className="border-t border-gray-800 px-8 py-12 text-center max-w-7xl mx-auto">
        <p className="text-gray-300 mb-6">Qual dessas 3 abordagens se alinha melhor com sua visão premium para o OryonAG?</p>
        <p className="text-gray-500 text-sm">Responda no terminal com: A, B, ou C (+ qualquer comentário)</p>
      </div>
    </div>
  )
}

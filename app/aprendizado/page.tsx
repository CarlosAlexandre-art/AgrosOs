import Link from 'next/link'
import Nav from '@/components/Nav'

const CANAL_YT = 'https://www.youtube.com/@agroos'

const CATEGORIAS = [
  {
    id: 'operacional',
    icon: '📋',
    cor: 'bg-blue-50 border-blue-200 text-blue-700',
    iconBg: 'bg-blue-100',
    titulo: 'Gestão Operacional',
    desc: 'Como organizar tarefas, executar atividades no campo e eliminar gargalos.',
    aulas: [
      { titulo: 'Como criar e organizar atividades no AgroOS', duracao: '8 min', nivel: 'Iniciante', url: 'https://youtu.be/mFPE2grkp9I?si=L6oDrnAySR1hfKXt' },
      { titulo: 'Planejamento de safra do zero ao fim', duracao: '14 min', nivel: 'Intermediário', url: 'https://youtu.be/-ZsBPCZUByU?si=l5_KkU5RQKw7B1ks' },
      { titulo: 'Como eliminar o "apagão de informações" no campo', duracao: '11 min', nivel: 'Iniciante', url: 'https://youtu.be/d0TEuOIrB98?si=eGCQto1IKh5xkDao' },
      { titulo: 'Checklist operacional semanal para fazendas', duracao: '6 min', nivel: 'Iniciante', url: 'https://youtu.be/akC7On2pPJM?si=6ewOR2np5c9ZQrpq' },
    ],
  },
  {
    id: 'propriedades',
    icon: '🌾',
    cor: 'bg-green-50 border-green-200 text-green-700',
    iconBg: 'bg-green-100',
    titulo: 'Gestão de Propriedades',
    desc: 'Configure fazendas, talhões e culturas para ter controle geográfico total.',
    aulas: [
      { titulo: 'Como estruturar talhões para análises precisas', duracao: '10 min', nivel: 'Iniciante', url: 'https://youtu.be/r8h7GrBpgxs?si=GOUrMzhs0o0eLSF-' },
      { titulo: 'Dividindo a fazenda por cultura e ciclo produtivo', duracao: '12 min', nivel: 'Intermediário', url: null },
      { titulo: 'Gestão de múltiplas propriedades em um só sistema', duracao: '9 min', nivel: 'Avançado', url: null },
      { titulo: 'Mapeando insumos e recursos por talhão', duracao: '7 min', nivel: 'Intermediário', url: null },
    ],
  },
  {
    id: 'financeiro',
    icon: '💰',
    cor: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    iconBg: 'bg-yellow-100',
    titulo: 'Gestão Financeira',
    desc: 'Custo por hectare, análise de margem e controle orçamentário na prática.',
    aulas: [
      { titulo: 'Calculando o custo por hectare corretamente', duracao: '13 min', nivel: 'Iniciante', url: null },
      { titulo: 'Como identificar onde a fazenda perde dinheiro', duracao: '15 min', nivel: 'Intermediário', url: null },
      { titulo: 'Orçamento de safra: do planejamento ao resultado', duracao: '18 min', nivel: 'Avançado', url: null },
      { titulo: 'Relatórios financeiros que o banco quer ver', duracao: '10 min', nivel: 'Intermediário', url: null },
    ],
  },
  {
    id: 'equipe',
    icon: '👷',
    cor: 'bg-orange-50 border-orange-200 text-orange-700',
    iconBg: 'bg-orange-100',
    titulo: 'Gestão de Equipe',
    desc: 'Produtividade individual, comunicação no campo e gestão de times rurais.',
    aulas: [
      { titulo: 'Como delegar tarefas para equipe de campo', duracao: '9 min', nivel: 'Iniciante', url: null },
      { titulo: 'Medindo produtividade sem microgerenciar', duracao: '11 min', nivel: 'Intermediário', url: null },
      { titulo: 'Onboarding rápido para novos funcionários', duracao: '7 min', nivel: 'Iniciante', url: null },
      { titulo: 'Turnover no agro: como reter talentos no campo', duracao: '12 min', nivel: 'Avançado', url: null },
    ],
  },
  {
    id: 'ia',
    icon: '🤖',
    cor: 'bg-purple-50 border-purple-200 text-purple-700',
    iconBg: 'bg-purple-100',
    titulo: 'Inteligência Artificial no Agro',
    desc: 'Como usar IA para decisões mais rápidas e operação mais eficiente.',
    aulas: [
      { titulo: 'O que a IA faz (e o que não faz) na sua fazenda', duracao: '8 min', nivel: 'Iniciante', url: null },
      { titulo: 'Alertas automáticos: como configurar e interpretar', duracao: '10 min', nivel: 'Iniciante', url: null },
      { titulo: 'Previsão de custos com machine learning', duracao: '16 min', nivel: 'Avançado', url: null },
      { titulo: 'Ferramentas de IA gratuitas para o produtor rural', duracao: '13 min', nivel: 'Intermediário', url: null },
    ],
  },
  {
    id: 'agrocore',
    icon: '🔗',
    cor: 'bg-slate-50 border-slate-200 text-slate-700',
    iconBg: 'bg-slate-100',
    titulo: 'Tutorial AgroCore',
    desc: 'Como contratar, acompanhar e integrar serviços externos pelo AgroCore.',
    aulas: [
      { titulo: 'O que é o AgroCore e como ele funciona', duracao: '6 min', nivel: 'Iniciante', url: null },
      { titulo: 'Primeira contratação pelo AgroCore — passo a passo', duracao: '9 min', nivel: 'Iniciante', url: null },
      { titulo: 'Rastreando execução de serviços em tempo real', duracao: '8 min', nivel: 'Intermediário', url: null },
      { titulo: 'Integrando custos do AgroCore ao financeiro', duracao: '7 min', nivel: 'Intermediário', url: null },
    ],
  },
]

const NIVEL_COR: Record<string, string> = {
  'Iniciante': 'bg-green-100 text-green-700',
  'Intermediário': 'bg-yellow-100 text-yellow-700',
  'Avançado': 'bg-red-100 text-red-700',
}

export default function AprendizadoPage() {
  return (
    <div className="min-h-screen bg-white">
      <Nav />
      <main className="pt-20 pb-20">

        {/* Hero */}
        <section className="px-4 sm:px-6 py-10 sm:py-16 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" style={{background: 'radial-gradient(ellipse 70% 40% at 50% 0%, rgba(22,163,74,0.08), transparent)'}} />
          <div className="max-w-4xl mx-auto text-center relative">
            {/* Botão voltar */}
            <div className="flex justify-start mb-6">
              <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-[#64748b] hover:text-[#16a34a] transition-colors font-medium">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Voltar ao início
              </Link>
            </div>

            <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 text-xs font-semibold px-4 py-2 rounded-full mb-6 border border-green-200 uppercase tracking-wider">
              🎓 Central de Aprendizado
            </div>
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold text-[#0f172a] leading-tight mb-5">
              Aprenda a operar<br />no nível mais alto
            </h1>
            <p className="text-base sm:text-xl text-[#64748b] max-w-2xl mx-auto leading-relaxed mb-8">
              Vídeos no YouTube ensinando como dominar cada módulo do AgroOS — operacional, financeiro, equipe, IA e AgroCore. Do básico ao avançado.
            </p>
            <a
              href={CANAL_YT}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#ff0000] text-white font-bold px-6 py-3 rounded-xl hover:bg-[#cc0000] transition-colors shadow-lg shadow-red-200"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
              Seguir no YouTube
            </a>
          </div>
        </section>

        {/* Estatísticas rápidas */}
        <section className="px-4 sm:px-6 py-6 sm:py-8 border-y border-gray-100 bg-[#f8fafc]">
          <div className="max-w-4xl mx-auto grid grid-cols-3 gap-4 sm:gap-6 text-center">
            <div>
              <div className="text-2xl sm:text-3xl font-black text-[#16a34a]">24</div>
              <div className="text-xs sm:text-sm text-[#64748b] mt-1">Aulas disponíveis</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-[#16a34a]">6</div>
              <div className="text-xs sm:text-sm text-[#64748b] mt-1">Módulos completos</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-[#16a34a]">100%</div>
              <div className="text-xs sm:text-sm text-[#64748b] mt-1">Gratuito</div>
            </div>
          </div>
        </section>

        {/* Categorias */}
        <section className="px-4 sm:px-6 py-10 sm:py-16">
          <div className="max-w-5xl mx-auto space-y-8 sm:space-y-12">
            {CATEGORIAS.map(cat => (
              <div key={cat.id} className={`rounded-2xl border p-4 sm:p-8 ${cat.cor}`}>
                <div className="flex items-start gap-3 sm:gap-4 mb-5">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-xl sm:text-2xl flex-shrink-0 ${cat.iconBg}`}>
                    {cat.icon}
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-lg sm:text-xl font-bold text-[#0f172a]">{cat.titulo}</h2>
                    <p className="text-xs sm:text-sm text-[#64748b] mt-0.5 leading-snug">{cat.desc}</p>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-2 sm:gap-3">
                  {cat.aulas.map(aula => {
                    const Wrapper = aula.url ? 'a' : 'div'
                    const wrapperProps = aula.url
                      ? { href: aula.url, target: '_blank', rel: 'noopener noreferrer' }
                      : {}
                    return (
                      <Wrapper
                        key={aula.titulo}
                        {...(wrapperProps as any)}
                        className={`flex items-center gap-3 bg-white rounded-xl px-3 sm:px-4 py-3 border border-gray-100 transition-all group ${aula.url ? 'hover:border-[#16a34a] hover:shadow-sm cursor-pointer' : 'opacity-60 cursor-default'}`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex-shrink-0 border flex items-center justify-center transition-colors ${aula.url ? 'bg-[#f8fafc] border-gray-200 group-hover:bg-[#16a34a] group-hover:border-[#16a34a]' : 'bg-gray-100 border-gray-200'}`}>
                          {aula.url ? (
                            <svg className="w-3.5 h-3.5 text-[#94a3b8] group-hover:text-white transition-colors ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          ) : (
                            <span className="text-[10px] font-bold text-gray-400">EM</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`text-sm font-semibold transition-colors truncate ${aula.url ? 'text-[#0f172a] group-hover:text-[#16a34a]' : 'text-[#64748b]'}`}>
                            {aula.titulo}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className="text-xs text-[#94a3b8]">{aula.duracao}</span>
                            {aula.url ? (
                              <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${NIVEL_COR[aula.nivel]}`}>{aula.nivel}</span>
                            ) : (
                              <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-400">Em breve</span>
                            )}
                          </div>
                        </div>
                      </Wrapper>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="px-4 sm:px-6 py-10 sm:py-12 text-center">
          <div className="max-w-2xl mx-auto">
            <div className="text-4xl mb-4">🎓</div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0f172a] mb-3">Aprendeu? Agora aplique.</h2>
            <p className="text-[#64748b] mb-8 text-sm sm:text-base">Crie sua conta grátis no AgroOS e coloque em prática o que você aprendeu.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/login" className="inline-flex items-center justify-center bg-[#16a34a] text-white font-bold px-8 py-4 rounded-2xl hover:bg-[#15803d] transition-colors shadow-lg shadow-green-200 text-base sm:text-lg">
                Começar grátis
              </Link>
              <Link href="/docs" className="inline-flex items-center justify-center border-2 border-[#e2e8f0] text-[#0f172a] font-semibold px-8 py-4 rounded-2xl hover:border-[#16a34a] hover:text-[#16a34a] transition-all text-base sm:text-lg">
                Ver documentação
              </Link>
            </div>
          </div>
        </section>

      </main>
    </div>
  )
}

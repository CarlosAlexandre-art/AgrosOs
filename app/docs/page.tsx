import Link from 'next/link'
import Nav from '@/components/Nav'

const DOCS = [
  {
    categoria: 'Primeiros passos',
    icon: '🚀',
    videoUrl: 'https://youtu.be/Y096LbVwaqw?si=_3JlUIm5CE5sWoU9',
    items: [
      { title: 'Criar sua conta', desc: 'Como se cadastrar e configurar seu perfil inicial.' },
      { title: 'Adicionar sua primeira propriedade', desc: 'Configure fazenda, talhões e culturas.' },
      { title: 'Cadastrar a equipe', desc: 'Adicionar membros e definir funções.' },
      { title: 'Criar sua primeira atividade', desc: 'Do zero ao campo organizado.' },
    ],
  },
  {
    categoria: 'Operações',
    icon: '📋',
    videoUrl: 'https://youtu.be/kkVLXjLvX2s?si=4iIa2RPhgm2sJC3e',
    items: [
      { title: 'Gerenciando atividades', desc: 'Criar, editar, priorizar e acompanhar.' },
      { title: 'Calendário agrícola', desc: 'Visualização e planejamento por data.' },
      { title: 'Status e acompanhamento', desc: 'Entenda o fluxo de status das atividades.' },
      { title: 'Alertas automáticos', desc: 'Como configurar e interpretar alertas.' },
    ],
  },
  {
    categoria: 'Financeiro',
    icon: '💰',
    videoUrl: 'https://youtu.be/T0ewOkAK8RI?si=wo-CnMcguALGpPLZ',
    items: [
      { title: 'Como os custos são registrados', desc: 'Automático vs manual — quando usar cada um.' },
      { title: 'Custo por hectare', desc: 'Como o cálculo funciona e como interpretar.' },
      { title: 'Relatório financeiro', desc: 'Lendo e exportando seus dados.' },
      { title: 'Comparação de safras', desc: 'Analisando evolução ao longo do tempo.' },
    ],
  },
  {
    categoria: 'AgroCore',
    icon: '🔗',
    videoUrl: 'https://youtu.be/DZ8JE_9baUA?si=xr4-4isPajW3sBd5',
    items: [
      { title: 'O que é o AgroCore', desc: 'Entenda a integração e como ela funciona.' },
      { title: 'Solicitando um serviço', desc: 'Passo a passo para contratar via AgroCore.' },
      { title: 'Acompanhando a execução', desc: 'Como o status aparece no AgroOS.' },
      { title: 'Custos AgroCore no financeiro', desc: 'Como o gasto entra nos relatórios.' },
    ],
  },
]

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-white">
      <Nav />
      <main className="pt-24 pb-20">
        <section className="px-4 sm:px-6 py-16 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" style={{background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(22,163,74,0.08), transparent)'}} />
          <div className="max-w-5xl mx-auto relative">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 text-xs font-semibold px-4 py-2 rounded-full mb-6 border border-green-200 uppercase tracking-wider">
                📚 Documentação
              </div>
              <h1 className="text-3xl sm:text-5xl font-bold text-[#0f172a] mb-4">Guias e tutoriais</h1>
              <p className="text-[#64748b] text-base sm:text-lg max-w-xl mx-auto">Tudo que você precisa para dominar o AgroOS e tirar o máximo da sua operação.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {DOCS.map(section => (
                <div key={section.categoria} className="bg-[#f8fafc] rounded-2xl border border-gray-100 overflow-hidden">
                  <div className="p-5 border-b border-gray-100 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-xl shadow-sm flex-shrink-0">
                        {section.icon}
                      </div>
                      <h2 className="font-bold text-[#0f172a] truncate">{section.categoria}</h2>
                    </div>
                    <a
                      href={section.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0 flex items-center gap-1.5 bg-[#16a34a] text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-[#15803d] transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                      Assistir vídeo
                    </a>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {section.items.map(item => (
                      <div key={item.title} className="px-5 py-3.5 flex items-start gap-3 hover:bg-white transition-colors">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#16a34a] mt-1.5 flex-shrink-0" />
                        <div>
                          <div className="font-medium text-sm text-[#0f172a]">{item.title}</div>
                          <div className="text-xs text-[#94a3b8] mt-0.5">{item.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12 bg-[#0f172a] rounded-2xl p-8 text-center">
              <div className="text-3xl mb-3">🎯</div>
              <h3 className="font-bold text-white mb-2">Melhor que ler: use de verdade</h3>
              <p className="text-gray-400 text-sm mb-6">Crie sua conta gratuita e aprenda na prática em menos de 10 minutos.</p>
              <Link href="/login" className="inline-flex items-center gap-2 bg-[#16a34a] text-white font-bold px-6 py-3 rounded-xl hover:bg-[#15803d] transition-colors">
                Começar grátis agora
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

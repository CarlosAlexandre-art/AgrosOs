import Link from 'next/link'
import Nav from '@/components/Nav'

const DOCS = [
  {
    categoria: 'Primeiros passos',
    icon: '🚀',
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
        <section className="px-6 py-16 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" style={{background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(22,163,74,0.08), transparent)'}} />
          <div className="max-w-5xl mx-auto relative">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 text-xs font-semibold px-4 py-2 rounded-full mb-6 border border-green-200 uppercase tracking-wider">
                📚 Documentação
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold text-[#0f172a] mb-4">Guias e tutoriais</h1>
              <p className="text-[#64748b] text-base sm:text-lg max-w-xl mx-auto">Tudo que você precisa para dominar o AgroOS e tirar o máximo da sua operação.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {DOCS.map(section => (
                <div key={section.categoria} className="bg-[#f8fafc] rounded-2xl border border-gray-100 overflow-hidden">
                  <div className="p-6 border-b border-gray-100 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-xl shadow-sm">
                      {section.icon}
                    </div>
                    <h2 className="font-bold text-[#0f172a]">{section.categoria}</h2>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {section.items.map(item => (
                      <div key={item.title} className="px-6 py-4 flex items-start justify-between gap-4 hover:bg-white transition-colors group">
                        <div className="min-w-0">
                          <div className="font-medium text-sm text-[#0f172a]">{item.title}</div>
                          <div className="text-xs text-[#94a3b8] mt-0.5">{item.desc}</div>
                        </div>
                        <button
                          disabled
                          title="Vídeo em breve"
                          className="flex-shrink-0 flex items-center gap-1.5 bg-slate-100 text-slate-400 text-xs font-semibold px-3 py-1.5 rounded-lg cursor-not-allowed select-none"
                        >
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                          Em breve
                        </button>
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

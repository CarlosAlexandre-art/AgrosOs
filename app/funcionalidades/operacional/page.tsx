import Link from 'next/link'
import Nav from '@/components/Nav'

export default function OperacionalPage() {
  return (
    <div className="min-h-screen bg-white">
      <Nav />
      <main className="pt-24 pb-20">
        <section className="px-6 py-16 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" style={{background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(59,130,246,0.08), transparent)'}} />
          <div className="max-w-5xl mx-auto relative">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div>
                <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-semibold px-4 py-2 rounded-full mb-6 border border-blue-200 uppercase tracking-wider">
                  📋 Gestão Operacional
                </div>
                <h1 className="text-5xl font-bold text-[#0f172a] leading-tight mb-6">
                  O campo organizado começa aqui
                </h1>
                <p className="text-xl text-[#64748b] leading-relaxed mb-8">
                  Crie, acompanhe e priorize cada atividade da sua fazenda em tempo real. Do plantio à colheita, nada fica sem controle.
                </p>
                <Link href="/login" className="inline-flex items-center bg-[#16a34a] text-white font-bold px-8 py-4 rounded-2xl hover:bg-[#15803d] transition-all shadow-lg shadow-green-200">
                  Começar grátis
                </Link>
              </div>
              <div className="bg-blue-50 rounded-3xl p-8 border border-blue-100">
                <div className="space-y-3">
                  {[
                    { name: 'Pulverização — Talhão 3', status: 'Em andamento', dot: 'bg-blue-500', date: 'Hoje' },
                    { name: 'Plantio de soja — T1', status: 'Pendente', dot: 'bg-yellow-500', date: 'Amanhã' },
                    { name: 'Análise de solo', status: 'Agendado', dot: 'bg-purple-500', date: '15 Abr' },
                    { name: 'Colheita — Talhão 2', status: 'Concluído', dot: 'bg-green-500', date: '10 Abr' },
                  ].map(a => (
                    <div key={a.name} className="bg-white rounded-xl px-4 py-3 flex items-center justify-between shadow-sm border border-blue-50">
                      <div className="flex items-center gap-3">
                        <div className={`w-2.5 h-2.5 rounded-full ${a.dot}`} />
                        <div>
                          <div className="text-sm font-medium text-[#0f172a]">{a.name}</div>
                          <div className="text-xs text-[#94a3b8]">{a.date}</div>
                        </div>
                      </div>
                      <span className="text-xs text-[#64748b] font-medium">{a.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 py-16 bg-[#f8fafc]">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-[#0f172a] text-center mb-12">O que você controla</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {[
                { icon: '📅', title: 'Calendário agrícola', desc: 'Visualize todas as atividades por data e talhão.' },
                { icon: '👤', title: 'Responsável definido', desc: 'Cada tarefa tem um dono — sem "ninguém fez".' },
                { icon: '⚡', title: 'Priorização', desc: 'Sinalize o que é urgente e o que pode esperar.' },
                { icon: '📍', title: 'Status em tempo real', desc: 'Pendente, em andamento, concluído ou atrasado.' },
                { icon: '🔔', title: 'Alertas de atraso', desc: 'O sistema avisa antes de virar problema.' },
                { icon: '📊', title: 'Histórico completo', desc: 'Cada safra registrada para comparação futura.' },
              ].map(f => (
                <div key={f.title} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                  <div className="text-3xl mb-3">{f.icon}</div>
                  <div className="font-bold text-[#0f172a] text-sm mb-1">{f.title}</div>
                  <div className="text-xs text-[#64748b] leading-relaxed">{f.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-16 text-center">
          <Link href="/login" className="inline-flex items-center gap-2 bg-[#16a34a] text-white font-bold px-8 py-4 rounded-2xl hover:bg-[#15803d] transition-all shadow-xl shadow-green-200">
            Começar a organizar minha operação
          </Link>
        </section>
      </main>
    </div>
  )
}

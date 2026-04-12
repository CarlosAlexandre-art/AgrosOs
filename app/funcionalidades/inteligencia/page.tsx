import Link from 'next/link'
import Nav from '@/components/Nav'

export default function InteligenciaPage() {
  return (
    <div className="min-h-screen bg-white">
      <Nav />
      <main className="pt-24 pb-20">
        <section className="px-6 py-16 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" style={{background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(244,63,94,0.07), transparent)'}} />
          <div className="max-w-5xl mx-auto relative">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div>
                <div className="inline-flex items-center gap-2 bg-rose-50 text-rose-700 text-xs font-semibold px-4 py-2 rounded-full mb-6 border border-rose-200 uppercase tracking-wider">
                  🤖 Inteligência IA
                </div>
                <h1 className="text-5xl font-bold text-[#0f172a] leading-tight mb-6">
                  O sistema que pensa junto com você
                </h1>
                <p className="text-xl text-[#64748b] leading-relaxed mb-8">
                  Alertas automáticos, análises inteligentes e insights que transformam dados da sua fazenda em decisões estratégicas — sem você precisar pedir.
                </p>
                <Link href="/login" className="inline-flex items-center bg-[#16a34a] text-white font-bold px-8 py-4 rounded-2xl hover:bg-[#15803d] transition-all shadow-lg shadow-green-200">
                  Começar grátis
                </Link>
              </div>
              <div className="bg-[#0f172a] rounded-3xl p-8 space-y-4">
                <div className="text-xs font-bold text-green-400 uppercase tracking-wider mb-2">Alertas inteligentes</div>
                {[
                  { tipo: '⚠️', msg: 'Pulverização no Talhão 3 está 2 dias atrasada. Risco climático amanhã.', nivel: 'Crítico', cor: 'border-red-500/30 bg-red-500/10 text-red-300' },
                  { tipo: '💰', msg: 'Custo por hectare 18% acima da média histórica este mês.', nivel: 'Atenção', cor: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-300' },
                  { tipo: '✅', msg: 'Equipe com produtividade 12% acima do mês anterior. Bom ritmo!', nivel: 'Positivo', cor: 'border-green-500/30 bg-green-500/10 text-green-300' },
                ].map(a => (
                  <div key={a.msg} className={`rounded-xl p-4 border ${a.cor}`}>
                    <div className="flex items-start gap-3">
                      <span className="text-lg flex-shrink-0">{a.tipo}</span>
                      <div>
                        <div className="text-xs font-bold mb-1 opacity-80">{a.nivel}</div>
                        <div className="text-sm leading-relaxed">{a.msg}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 py-16 bg-[#f8fafc]">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-[#0f172a] text-center mb-12">IA que gera resultado real</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {[
                { icon: '🔔', title: 'Alertas proativos', desc: 'O sistema avisa antes do problema acontecer.' },
                { icon: '📊', title: 'Análise automática', desc: 'Relatório inteligente sem você precisar montar.' },
                { icon: '💬', title: 'Assistente IA', desc: 'Pergunte sobre sua operação em linguagem natural.' },
                { icon: '📈', title: 'Previsão de custo', desc: 'Projeção baseada no histórico e no ritmo atual.' },
                { icon: '🎯', title: 'Recomendações', desc: 'O que otimizar para aumentar o faturamento.' },
                { icon: '🧠', title: 'Aprende com você', desc: 'Quanto mais usa, mais preciso fica o sistema.' },
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
            Ativar inteligência na minha fazenda
          </Link>
        </section>
      </main>
    </div>
  )
}

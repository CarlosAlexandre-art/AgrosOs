import Link from 'next/link'
import Nav from '@/components/Nav'

export default function FinanceiroPage() {
  return (
    <div className="min-h-screen bg-white">
      <Nav />
      <main className="pt-24 pb-20">
        <section className="px-6 py-16 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" style={{background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(147,51,234,0.07), transparent)'}} />
          <div className="max-w-5xl mx-auto relative">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div>
                <div className="inline-flex items-center gap-2 bg-purple-50 text-purple-700 text-xs font-semibold px-4 py-2 rounded-full mb-6 border border-purple-200 uppercase tracking-wider">
                  💰 Controle Financeiro
                </div>
                <h1 className="text-5xl font-bold text-[#0f172a] leading-tight mb-6">
                  Decisão baseada em dados, não em feeling
                </h1>
                <p className="text-xl text-[#64748b] leading-relaxed mb-8">
                  Acompanhe o custo por atividade, por hectare e por talhão. Saiba exatamente onde está perdendo dinheiro e onde pode aumentar o faturamento.
                </p>
                <Link href="/login" className="inline-flex items-center bg-[#16a34a] text-white font-bold px-8 py-4 rounded-2xl hover:bg-[#15803d] transition-all shadow-lg shadow-green-200">
                  Começar grátis
                </Link>
              </div>
              <div className="bg-purple-50 rounded-3xl p-8 border border-purple-100 space-y-4">
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-purple-50">
                  <div className="text-sm text-[#64748b] mb-1">Custo total do mês</div>
                  <div className="text-4xl font-bold text-[#0f172a]">R$ 84.200</div>
                  <div className="text-xs text-green-600 mt-1 font-medium">▼ 8% em relação ao mês anterior</div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Custo/ha', value: 'R$ 187' },
                    { label: 'Insumos', value: 'R$ 42k' },
                    { label: 'Mão de obra', value: 'R$ 28k' },
                    { label: 'Maquinário', value: 'R$ 14k' },
                  ].map(m => (
                    <div key={m.label} className="bg-white rounded-xl px-4 py-3 shadow-sm border border-purple-50">
                      <div className="text-xs text-[#94a3b8]">{m.label}</div>
                      <div className="font-bold text-[#0f172a] mt-0.5">{m.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 py-16 bg-[#f8fafc]">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-[#0f172a] text-center mb-12">Visão financeira completa</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {[
                { icon: '📊', title: 'Custo por atividade', desc: 'Veja quanto cada operação custou de verdade.' },
                { icon: '🌾', title: 'Custo por hectare', desc: 'Compare entre talhões e identifique ineficiências.' },
                { icon: '📈', title: 'Comparação de safras', desc: 'Evoluiu ou piorou? Os dados mostram a verdade.' },
                { icon: '⚠️', title: 'Alertas de desvio', desc: 'Aviso automático quando custo sai do esperado.' },
                { icon: '🏷️', title: 'Categorias de gasto', desc: 'Insumos, mão de obra, maquinário e AgroCore.' },
                { icon: '📉', title: 'Redução de desperdício', desc: 'Identifique onde cortar sem afetar produção.' },
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
            Controlar meu financeiro agora
          </Link>
        </section>
      </main>
    </div>
  )
}

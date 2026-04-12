import Link from 'next/link'
import Nav from '@/components/Nav'

export default function PropriedadesPage() {
  return (
    <div className="min-h-screen bg-white">
      <Nav />
      <main className="pt-24 pb-20">
        <section className="px-6 py-16 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" style={{background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(22,163,74,0.08), transparent)'}} />
          <div className="max-w-5xl mx-auto relative">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div>
                <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 text-xs font-semibold px-4 py-2 rounded-full mb-6 border border-green-200 uppercase tracking-wider">
                  🌾 Propriedades e Talhões
                </div>
                <h1 className="text-5xl font-bold text-[#0f172a] leading-tight mb-6">
                  A base estrutural da sua operação
                </h1>
                <p className="text-xl text-[#64748b] leading-relaxed mb-8">
                  Organize suas fazendas, divida em talhões, associe culturas e safras. Cada dado de operação e custo é associado à estrutura que você criou aqui.
                </p>
                <Link href="/login" className="inline-flex items-center bg-[#16a34a] text-white font-bold px-8 py-4 rounded-2xl hover:bg-[#15803d] transition-all shadow-lg shadow-green-200">
                  Começar grátis
                </Link>
              </div>
              <div className="bg-green-50 rounded-3xl p-8 border border-green-100">
                <div className="mb-4 pb-4 border-b border-green-100">
                  <div className="font-bold text-[#0f172a]">🏡 Fazenda Boa Vista</div>
                  <div className="text-sm text-[#64748b]">450 ha · Minas Gerais</div>
                </div>
                <div className="space-y-3">
                  {[
                    { nome: 'Talhão 1', cultura: 'Soja', area: '120 ha', safra: '24/25' },
                    { nome: 'Talhão 2', cultura: 'Milho', area: '85 ha', safra: '24/25' },
                    { nome: 'Talhão 3', cultura: 'Café', area: '60 ha', safra: '24/25' },
                    { nome: 'Talhão 4', cultura: 'Pastagem', area: '185 ha', safra: '—' },
                  ].map(t => (
                    <div key={t.nome} className="bg-white rounded-xl px-4 py-3 flex items-center justify-between shadow-sm border border-green-50">
                      <div>
                        <div className="text-sm font-semibold text-[#0f172a]">{t.nome}</div>
                        <div className="text-xs text-[#64748b]">{t.cultura} · Safra {t.safra}</div>
                      </div>
                      <div className="text-sm font-bold text-[#16a34a]">{t.area}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 py-16 bg-[#f8fafc]">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-[#0f172a] text-center mb-12">Estrutura que sustenta tudo</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {[
                { icon: '🏡', title: 'Múltiplas fazendas', desc: 'Gerencie várias propriedades no mesmo painel.' },
                { icon: '🗺️', title: 'Divisão por talhões', desc: 'Granularidade para controle preciso por área.' },
                { icon: '🌱', title: 'Culturas e safras', desc: 'Associe o que planta em cada área e período.' },
                { icon: '📐', title: 'Área em hectares', desc: 'Base para cálculo automático de custo/ha.' },
                { icon: '🔗', title: 'Tudo conectado', desc: 'Atividades e custos sempre ligados à área certa.' },
                { icon: '📊', title: 'Visão consolidada', desc: 'Totais por fazenda, por talhão ou por safra.' },
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
            Mapear minha propriedade agora
          </Link>
        </section>
      </main>
    </div>
  )
}

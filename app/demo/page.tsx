import Link from 'next/link'
import Nav from '@/components/Nav'

const STEPS = [
  {
    id: 1,
    icon: '🌾',
    title: 'Cadastre sua propriedade',
    desc: 'Adicione sua fazenda, divida em talhões e associe as culturas. O mapa da sua operação começa aqui.',
    details: ['Múltiplas fazendas', 'Divisão por talhões', 'Culturas e safras', 'Área em hectares'],
    mockup: [
      { label: 'Fazenda Boa Vista', value: '450 ha' },
      { label: 'Talhão 1 — Soja', value: '120 ha' },
      { label: 'Talhão 2 — Milho', value: '85 ha' },
      { label: 'Talhão 3 — Café', value: '60 ha' },
    ],
  },
  {
    id: 2,
    icon: '📋',
    title: 'Crie e organize atividades',
    desc: 'Cada operação do campo vira uma atividade com responsável, prazo e status em tempo real.',
    details: ['Tipos de atividade', 'Atribuição de equipe', 'Datas e prazos', 'Priorização'],
    mockup: [
      { label: 'Pulverização — T3', value: 'Em andamento' },
      { label: 'Plantio — T1', value: 'Pendente' },
      { label: 'Colheita — T2', value: 'Concluído' },
      { label: 'Análise de Solo', value: 'Agendado' },
    ],
  },
  {
    id: 3,
    icon: '💰',
    title: 'Controle o financeiro',
    desc: 'Cada atividade gera custo automaticamente. Veja onde está gastando mais e o custo por hectare.',
    details: ['Custo por atividade', 'Custo por hectare', 'Comparação de safras', 'Alertas de desvio'],
    mockup: [
      { label: 'Custo total mês', value: 'R$ 84.200' },
      { label: 'Custo/hectare', value: 'R$ 187' },
      { label: 'Insumos', value: 'R$ 42.000' },
      { label: 'Mão de obra', value: 'R$ 28.000' },
    ],
  },
  {
    id: 4,
    icon: '🔗',
    title: 'Integre com o AgroCore',
    desc: 'Precisa de serviço externo? Solicite via AgroCore sem sair do SmartAgroOS. Custo já entra no relatório.',
    details: ['Solicitação integrada', 'Acompanhamento em tempo real', 'Custo automático', 'Histórico completo'],
    mockup: [
      { label: 'Drone — Pulverização T3', value: 'AgroCore' },
      { label: 'Valor', value: 'R$ 3.200' },
      { label: 'Status', value: 'Em execução' },
      { label: 'Prestador', value: '⭐ 4.9' },
    ],
  },
]

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-white">
      <Nav />

      <main className="pt-24 pb-20">
        {/* Header */}
        <section className="px-6 py-16 text-center relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" style={{background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(22,163,74,0.08), transparent)'}} />
          <div className="relative max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 text-xs font-semibold px-4 py-2 rounded-full mb-6 border border-green-200 uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Demonstração interativa
            </div>
            <h1 className="text-5xl font-bold text-[#0f172a] mb-4">Veja o SmartAgroOS<br />
              <span style={{background: 'linear-gradient(135deg, #16a34a, #059669)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'}}>em ação</span>
            </h1>
            <p className="text-[#64748b] text-lg mb-8">Explore como o sistema funciona na prática, sem precisar de conta.</p>
            <Link href="/login" className="inline-flex items-center gap-2 bg-[#16a34a] text-white font-bold px-8 py-4 rounded-2xl hover:bg-[#15803d] transition-all shadow-xl shadow-green-200">
              Criar conta grátis e começar
            </Link>
          </div>
        </section>

        {/* Steps interativos */}
        <section className="px-6 max-w-5xl mx-auto space-y-8">
          {STEPS.map((step, i) => (
            <div key={step.id} className={`grid md:grid-cols-2 gap-8 items-center ${i % 2 === 1 ? 'md:grid-flow-dense' : ''}`}>
              {/* Texto */}
              <div className={i % 2 === 1 ? 'md:col-start-2' : ''}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#f0fdf4] flex items-center justify-center text-2xl">
                    {step.icon}
                  </div>
                  <span className="text-xs font-bold text-[#16a34a] uppercase tracking-wider">Passo {step.id}</span>
                </div>
                <h2 className="text-2xl font-bold text-[#0f172a] mb-3">{step.title}</h2>
                <p className="text-[#64748b] leading-relaxed mb-6">{step.desc}</p>
                <ul className="space-y-2">
                  {step.details.map(d => (
                    <li key={d} className="flex items-center gap-2 text-sm text-[#374151]">
                      <span className="text-[#16a34a] font-bold">✓</span>
                      {d}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Mockup */}
              <div className={`bg-[#f8fafc] rounded-2xl border border-gray-200 p-6 ${i % 2 === 1 ? 'md:col-start-1' : ''}`}>
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
                  <div className="flex gap-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                  </div>
                  <span className="text-xs text-[#94a3b8] ml-2">SmartAgroOS — {step.title}</span>
                </div>
                <div className="space-y-3">
                  {step.mockup.map(m => (
                    <div key={m.label} className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-gray-100">
                      <span className="text-sm text-[#64748b]">{m.label}</span>
                      <span className="text-sm font-bold text-[#0f172a]">{m.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* CTA final */}
        <section className="px-6 mt-20 max-w-3xl mx-auto text-center">
          <div className="bg-[#f0fdf4] rounded-3xl border border-green-200 p-12">
            <div className="text-4xl mb-4">🌾</div>
            <h2 className="text-3xl font-bold text-[#0f172a] mb-3">Pronto para começar?</h2>
            <p className="text-[#64748b] mb-8">Crie sua conta gratuitamente e leve o controle para sua fazenda hoje.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/login" className="bg-[#16a34a] text-white font-bold px-8 py-4 rounded-2xl hover:bg-[#15803d] transition-colors shadow-lg shadow-green-200">
                Criar conta grátis
              </Link>
              <Link href="/como-funciona" className="border-2 border-[#e2e8f0] text-[#0f172a] font-semibold px-8 py-4 rounded-2xl hover:border-[#16a34a] transition-colors">
                Ver guia completo
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

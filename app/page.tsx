import Link from 'next/link'
import Nav from '@/components/Nav'
import VideoPlayer from '@/components/VideoPlayer'

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Nav />

      {/* Hero */}
      <section className="pt-32 pb-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div style={{background: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(22,163,74,0.12), transparent)'}} className="absolute inset-0" />
          <div className="absolute top-20 left-10 w-72 h-72 bg-green-100 rounded-full blur-3xl opacity-40" />
          <div className="absolute bottom-0 right-10 w-96 h-96 bg-emerald-50 rounded-full blur-3xl opacity-60" />
        </div>

        <div className="max-w-5xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 text-xs font-semibold px-4 py-2 rounded-full mb-8 border border-green-200 uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
            Sistema Operacional da Fazenda Moderna
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold text-[#0f172a] leading-[1.05] tracking-tight mb-6">
            Controle total da<br />
            <span style={{background: 'linear-gradient(135deg, #16a34a 0%, #059669 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'}}>
              sua operação
            </span>
          </h1>

          <p className="text-base sm:text-xl text-[#64748b] max-w-2xl mx-auto mb-10 leading-relaxed">
            O AgroOS centraliza planejamento, execução e controle da sua fazenda em um único lugar — e integra com o AgroCore para contratar serviços sem sair do sistema.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link href="/login" className="inline-flex items-center justify-center bg-[#16a34a] text-white font-bold text-base px-8 py-4 rounded-2xl hover:bg-[#15803d] transition-all shadow-xl shadow-green-200 hover:shadow-green-300 hover:-translate-y-0.5">
              Começar agora grátis
            </Link>
            <Link href="/demo" className="inline-flex items-center justify-center gap-2 border-2 border-[#e2e8f0] text-[#0f172a] font-semibold text-base px-8 py-4 rounded-2xl hover:border-[#16a34a] hover:text-[#16a34a] transition-all bg-white">
              <span className="w-2.5 h-2.5 rounded-full bg-[#16a34a]" />
              Ver demonstração
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 sm:gap-6 max-w-2xl mx-auto">
            {[
              { value: '100%', label: 'Operação visível' },
              { value: 'R$ 1B+', label: 'Aumento de faturamento' },
              { value: '+40%', label: 'Aumento de produtividade' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-[#0f172a]">{s.value}</div>
                <div className="text-xs sm:text-sm text-[#94a3b8] mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dashboard preview */}
      <section className="px-6 pb-24">
        <div className="max-w-5xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden border border-gray-200 shadow-2xl shadow-gray-200">
            <div className="bg-[#f1f5f9] px-4 py-3 flex items-center gap-2 border-b border-gray-200">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <div className="flex-1 mx-4 bg-white rounded-lg px-3 py-1 text-xs text-[#94a3b8] text-center border border-gray-200">
                app.agroos.com.br/dashboard
              </div>
            </div>
            <div className="bg-[#f8fafc] p-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
                {[
                  { icon: '📋', value: '12', label: 'Em andamento', color: 'bg-blue-50 border-blue-100' },
                  { icon: '⚠️', value: '2', label: 'Atrasadas', color: 'bg-red-50 border-red-100' },
                  { icon: '💰', value: 'R$ 84k', label: 'Custo do mês', color: 'bg-purple-50 border-purple-100' },
                  { icon: '✅', value: '34', label: 'Concluídas', color: 'bg-green-50 border-green-100' },
                ].map(card => (
                  <div key={card.label} className={`${card.color} border rounded-2xl p-4`}>
                    <div className="text-2xl mb-2">{card.icon}</div>
                    <div className="text-2xl font-bold text-[#0f172a]">{card.value}</div>
                    <div className="text-xs text-[#64748b] mt-0.5">{card.label}</div>
                  </div>
                ))}
              </div>
              <div className="hidden sm:grid grid-cols-3 gap-4">
                <div className="col-span-2 bg-white rounded-2xl border border-gray-200 p-4">
                  <div className="font-semibold text-sm text-[#0f172a] mb-3">Atividades recentes</div>
                  {[
                    { name: 'Pulverização — Talhão 3', status: 'Em andamento', dot: 'bg-blue-500' },
                    { name: 'Plantio de soja — Talhão 1', status: 'Concluído', dot: 'bg-green-500' },
                    { name: 'Colheita — Talhão 2', status: 'Pendente', dot: 'bg-yellow-500' },
                  ].map(a => (
                    <div key={a.name} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${a.dot}`} />
                        <span className="text-sm text-[#374151]">{a.name}</span>
                      </div>
                      <span className="text-xs text-[#94a3b8]">{a.status}</span>
                    </div>
                  ))}
                </div>
                <div className="bg-white rounded-2xl border border-gray-200 p-4">
                  <div className="font-semibold text-sm text-[#0f172a] mb-3">Financeiro</div>
                  <div className="space-y-3">
                    {[
                      { label: 'Insumos', pct: 72, color: 'bg-green-500' },
                      { label: 'Mão de obra', pct: 48, color: 'bg-blue-500' },
                      { label: 'Maquinário', pct: 30, color: 'bg-purple-500' },
                    ].map(b => (
                      <div key={b.label}>
                        <div className="flex justify-between text-xs text-[#64748b] mb-1">
                          <span>{b.label}</span><span>{b.pct}%</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full">
                          <div className={`h-1.5 ${b.color} rounded-full`} style={{width: `${b.pct}%`}} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="funcionalidades" className="px-6 py-24 bg-[#f8fafc]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-sm font-semibold text-[#16a34a] uppercase tracking-wider mb-3">Funcionalidades</div>
            <h2 className="text-4xl font-bold text-[#0f172a]">Tudo que sua fazenda precisa</h2>
            <p className="text-[#64748b] mt-3 max-w-xl mx-auto">Módulos integrados que cobrem do planejamento à análise, sem burocracia.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: '📋', title: 'Operacional', desc: 'Crie e acompanhe atividades do campo em tempo real com calendário agrícola.', href: '/funcionalidades/operacional', color: 'bg-blue-50', iconBg: 'bg-blue-100' },
              { icon: '💰', title: 'Financeiro', desc: 'Custo por atividade, por hectare e por talhão. Decisão baseada em dados.', href: '/funcionalidades/financeiro', color: 'bg-purple-50', iconBg: 'bg-purple-100' },
              { icon: '👷', title: 'Equipe', desc: 'Atribua tarefas, acompanhe produtividade e meça desempenho de cada membro.', href: '/funcionalidades/equipe', color: 'bg-orange-50', iconBg: 'bg-orange-100' },
              { icon: '🌾', title: 'Propriedades', desc: 'Organize fazendas, divida em talhões e associe culturas. A base de tudo.', href: '/funcionalidades/propriedades', color: 'bg-green-50', iconBg: 'bg-green-100' },
              { icon: '🤖', title: 'Inteligência IA', desc: 'Alertas automáticos e insights que transformam dados em decisão estratégica.', href: '/funcionalidades/inteligencia', color: 'bg-rose-50', iconBg: 'bg-rose-100' },
              { icon: '🔗', title: 'AgroCore', desc: 'Solicite serviços terceirizados integrados diretamente do AgroOS.', href: '/agrocore', color: 'bg-teal-50', iconBg: 'bg-teal-100' },
            ].map(f => (
              <Link key={f.title} href={f.href} className={`${f.color} rounded-2xl p-6 border border-white hover:shadow-lg hover:-translate-y-0.5 transition-all group`}>
                <div className={`${f.iconBg} w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4`}>
                  {f.icon}
                </div>
                <h3 className="font-bold text-[#0f172a] mb-2 group-hover:text-[#16a34a] transition-colors">{f.title}</h3>
                <p className="text-sm text-[#64748b] leading-relaxed">{f.desc}</p>
                <div className="mt-4 text-xs font-bold text-[#16a34a] opacity-0 group-hover:opacity-100 transition-opacity">
                  Saiba mais →
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Vídeo institucional — no lugar dos planos */}
      <section className="px-6 py-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="text-sm font-semibold text-[#16a34a] uppercase tracking-wider mb-3">Veja na prática</div>
            <h2 className="text-4xl font-bold text-[#0f172a]">Do campo ao controle,<br />em um único sistema</h2>
            <p className="text-[#64748b] mt-3 max-w-xl mx-auto">Veja como o AgroOS transforma a operação de uma fazenda real.</p>
          </div>

          <VideoPlayer />
          <p className="text-center text-xs text-[#94a3b8] mt-4">Clique para assistir a demonstração do sistema.</p>
        </div>
      </section>

      {/* Como funciona */}
      <section id="como-funciona" className="px-6 py-24 bg-[#f8fafc]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-sm font-semibold text-[#16a34a] uppercase tracking-wider mb-3">Como funciona</div>
            <h2 className="text-4xl font-bold text-[#0f172a]">Do caos ao controle em 4 passos</h2>
            <Link href="/como-funciona" className="inline-block mt-4 text-sm text-[#16a34a] font-semibold hover:underline">
              Ver guia completo →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { step: '01', icon: '🌾', title: 'Cadastro e configuração', desc: 'Configure sua propriedade, talhões, culturas e equipe em menos de 10 minutos.' },
              { step: '02', icon: '📋', title: 'Organize as operações', desc: 'Crie atividades, atribua responsáveis e defina prazos. O campo organizado começa aqui.' },
              { step: '03', icon: '🔗', title: 'Execute com o AgroCore', desc: 'Precisa de serviço externo? Solicite via AgroCore diretamente do AgroOS. Sem fricção.' },
              { step: '04', icon: '📊', title: 'Analise e cresça', desc: 'Relatórios automáticos e alertas inteligentes mostram onde aumentar o faturamento.' },
            ].map(s => (
              <div key={s.step} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow flex gap-5">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-2xl bg-[#f0fdf4] flex items-center justify-center text-2xl">
                    {s.icon}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-bold text-[#16a34a] mb-1">PASSO {s.step}</div>
                  <h3 className="font-bold text-[#0f172a] mb-2">{s.title}</h3>
                  <p className="text-sm text-[#64748b] leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AgroCore integration */}
      <section className="px-6 py-24">
        <div className="max-w-5xl mx-auto">
          <div className="bg-[#0f172a] rounded-3xl p-12 md:p-16 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-80 h-80 bg-[#16a34a]/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
            <div className="relative grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 bg-green-900/50 text-green-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-6 border border-green-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  Serviços terceirizados integrados
                </div>
                <h2 className="text-4xl font-bold text-white mb-4">Conectado ao AgroCore</h2>
                <p className="text-gray-400 leading-relaxed mb-8">
                  O AgroCore é o marketplace de serviços agrícolas integrado ao AgroOS. Solicite pulverização, colheita, transporte e mais — sem sair do sistema, com controle total de custo e execução.
                </p>
                <Link href="/agrocore" className="inline-flex items-center gap-2 bg-[#16a34a] text-white font-bold px-6 py-3 rounded-xl hover:bg-[#15803d] transition-colors">
                  Acessar AgroCore
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: '🚜', label: 'Tratoreação' },
                  { icon: '🌿', label: 'Pulverização' },
                  { icon: '🌾', label: 'Colheita' },
                  { icon: '🚛', label: 'Transporte' },
                  { icon: '🧪', label: 'Análise de Solo' },
                  { icon: '🚁', label: 'Drone Agrícola' },
                ].map(s => (
                  <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-3">
                    <span className="text-xl">{s.icon}</span>
                    <span className="text-sm text-gray-300 font-medium">{s.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="px-6 py-24 bg-[#f8fafc]">
        <div className="max-w-3xl mx-auto text-center">
          <div style={{background: 'linear-gradient(135deg, #15803d 0%, #059669 100%)'}} className="rounded-3xl p-16 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
            <div className="relative">
              <h2 className="text-4xl font-bold mb-4">Pronto para controlar<br />sua operação?</h2>
              <p className="text-green-200 mb-8 text-lg">Cadastre-se gratuitamente e comece a usar em minutos.</p>
              <Link href="/login" className="inline-flex items-center gap-2 bg-white text-[#16a34a] font-bold px-8 py-4 rounded-2xl hover:bg-green-50 transition-all shadow-lg">
                Criar conta grátis
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="px-6 py-8 border-t border-gray-100 text-center text-sm text-[#94a3b8]">
        © 2026 AgroOS · O sistema operacional da fazenda moderna
      </footer>
    </div>
  )
}

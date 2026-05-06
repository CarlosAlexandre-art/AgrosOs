import Link from 'next/link'
import Nav from '@/components/Nav'

const SERVICOS = [
  { icon: '✈️', nome: 'Pulverização aérea', desc: 'Drones e aviões agrícolas para aplicação precisa.' },
  { icon: '🚜', nome: 'Mecanização', desc: 'Plantio, colheita e operações de solo.' },
  { icon: '🚛', nome: 'Transporte', desc: 'Logística de grãos e insumos.' },
  { icon: '🔬', nome: 'Análise de solo', desc: 'Laudos técnicos e recomendações de correção.' },
  { icon: '💧', nome: 'Irrigação', desc: 'Instalação e manutenção de sistemas.' },
  { icon: '🌱', nome: 'Consultoria agronômica', desc: 'Diagnóstico e acompanhamento técnico.' },
]

const PASSOS = [
  { num: '01', title: 'Crie a atividade no SmartAgroOS', desc: 'Defina o tipo de serviço, talhão e data desejada.' },
  { num: '02', title: 'Selecione "Via AgroCore"', desc: 'O sistema abre a solicitação direto na plataforma.' },
  { num: '03', title: 'Prestador é acionado', desc: 'A AgroCore conecta ao prestador mais adequado.' },
  { num: '04', title: 'Execução rastreada', desc: 'Status atualizado em tempo real dentro do SmartAgroOS.' },
  { num: '05', title: 'Custo entra no relatório', desc: 'O valor é registrado automaticamente no financeiro.' },
]

export default function AgroCoreExternalPage() {
  return (
    <div className="min-h-screen bg-white">
      <Nav />
      <main className="pt-24 pb-20">

        {/* Hero */}
        <section className="px-6 py-20 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" style={{background: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(22,163,74,0.10), transparent)'}} />
          <div className="max-w-5xl mx-auto relative text-center">
            <div className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-full mb-6 border uppercase tracking-wider" style={{background:'#f2f9ea', color:'#104e27', borderColor:'#679d3f'}}>
              <span className="w-2 h-2 rounded-full animate-pulse" style={{background:'#679d3f'}} /> AgroCore — Soluções Sustentáveis do Campo
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-[#0f172a] leading-tight mb-6">
              O braço que executa<br />o que o SmartAgroOS planeja
            </h1>
            <p className="text-xl text-[#64748b] max-w-2xl mx-auto mb-10 leading-relaxed">
              O AgroCore é o marketplace de serviços agrícolas integrado ao SmartAgroOS. Contrate pulverização, colheita, transporte e muito mais — sem sair do sistema, sem ligação, sem imprevisto.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="https://agrocore.com.br"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 text-white font-bold px-8 py-4 rounded-2xl transition-all shadow-lg text-lg bg-[#104e27] hover:bg-[#679d3f]"
              >
                Acessar AgroCore
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
              <Link href="/demo" className="inline-flex items-center justify-center gap-2 border-2 border-[#e2e8f0] text-[#0f172a] font-semibold px-8 py-4 rounded-2xl hover:border-[#104e27] hover:text-[#16a34a] transition-all text-lg">
                Ver demonstração
              </Link>
            </div>
          </div>
        </section>

        {/* Diferença SmartAgroOS vs AgroCore */}
        <section className="px-6 py-16 bg-[#f8fafc]">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-[#0f172a] text-center mb-4">Dois sistemas, uma operação</h2>
            <p className="text-center text-[#64748b] mb-12">Cada plataforma tem seu papel. Juntas, formam a operação agrícola completa.</p>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl p-8 border-2 border-[#e2e8f0] shadow-sm">
                <div className="text-4xl mb-4">🧠</div>
                <div className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider mb-2">SmartAgroOS</div>
                <h3 className="text-xl font-bold text-[#0f172a] mb-4">O cérebro da fazenda</h3>
                <ul className="space-y-2.5">
                  {['Planejamento e gestão de atividades', 'Controle financeiro e custo/ha', 'Gestão de equipe interna', 'Análise de dados e alertas IA', 'Visão consolidada da operação'].map(item => (
                    <li key={item} className="flex items-center gap-2 text-sm text-[#64748b]">
                      <svg className="w-4 h-4 text-[#16a34a] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-[#0f172a] rounded-2xl p-8 border-2 border-[#104e27] shadow-lg relative overflow-hidden">
                <div className="absolute top-4 right-4">
                  <span className="flex items-center gap-1.5 bg-green-500/20 text-green-400 text-xs font-bold px-3 py-1 rounded-full border border-green-500/30">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" /> Integrado
                  </span>
                </div>
                <div className="text-4xl mb-4">💪</div>
                <div className="text-xs font-bold text-green-400 uppercase tracking-wider mb-2">AgroCore</div>
                <h3 className="text-xl font-bold text-white mb-4">O braço de execução</h3>
                <ul className="space-y-2.5">
                  {['Marketplace de serviços agrícolas', 'Rede de prestadores qualificados', 'Contratação sem burocracia', 'Acompanhamento em tempo real', 'Custo integrado ao SmartAgroOS'].map(item => (
                    <li key={item} className="flex items-center gap-2 text-sm text-gray-300">
                      <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Serviços disponíveis */}
        <section className="px-6 py-16">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-[#0f172a] text-center mb-4">Serviços disponíveis no AgroCore</h2>
            <p className="text-center text-[#64748b] mb-12">Todos contratáveis direto pelo SmartAgroOS — com rastreabilidade total.</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
              {SERVICOS.map(s => (
                <div key={s.nome} className="bg-[#f8fafc] rounded-2xl p-6 border border-gray-100 hover:border-green-200 hover:shadow-md transition-all group cursor-default">
                  <div className="text-3xl mb-3">{s.icon}</div>
                  <div className="font-bold text-[#0f172a] text-sm mb-1 group-hover:text-[#16a34a] transition-colors">{s.nome}</div>
                  <div className="text-xs text-[#94a3b8] leading-relaxed">{s.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Como funciona a integração */}
        <section className="px-6 py-16 bg-[#f8fafc]">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-[#0f172a] text-center mb-4">Como funciona na prática</h2>
            <p className="text-center text-[#64748b] mb-14">Do pedido ao custo no relatório — tudo sem sair do SmartAgroOS.</p>
            <div className="relative">
              <div className="absolute left-8 top-0 bottom-0 w-px bg-gray-200 hidden md:block" />
              <div className="space-y-8">
                {PASSOS.map((p) => (
                  <div key={p.num} className="flex gap-6 items-start relative">
                    <div className="w-16 h-16 rounded-2xl bg-white border-2 border-[#104e27] flex items-center justify-center flex-shrink-0 z-10 shadow-sm">
                      <span className="font-black text-[#16a34a] text-lg">{p.num}</span>
                    </div>
                    <div className="pt-3 pb-2">
                      <div className="font-bold text-[#0f172a] mb-1">{p.title}</div>
                      <div className="text-sm text-[#64748b]">{p.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Benefícios da integração */}
        <section className="px-6 py-16">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-[#0f172a] text-center mb-12">Por que integrar faz diferença</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { icon: '⚡', title: 'Agilidade', desc: 'Contrate um serviço em minutos. Sem ligações, sem planilhas, sem espera.' },
                { icon: '📊', title: 'Visibilidade total', desc: 'Custo de cada serviço externo entra direto no seu relatório financeiro.' },
                { icon: '🔗', title: 'Operação unificada', desc: 'Interno ou externo — tudo aparece na mesma tela, com o mesmo controle.' },
              ].map(b => (
                <div key={b.title} className="text-center">
                  <div className="text-5xl mb-4">{b.icon}</div>
                  <h3 className="font-bold text-[#0f172a] text-lg mb-2">{b.title}</h3>
                  <p className="text-[#64748b] text-sm leading-relaxed">{b.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA final */}
        <section className="px-6 py-16">
          <div className="max-w-3xl mx-auto bg-[#0f172a] rounded-3xl p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none" style={{background: 'radial-gradient(ellipse 60% 60% at 50% 0%, rgba(22,163,74,0.15), transparent)'}} />
            <div className="relative">
              <div className="text-5xl mb-4">🔗</div>
              <h3 className="text-3xl font-bold text-white mb-4">Pronto para operar de verdade?</h3>
              <p className="text-gray-400 mb-8 leading-relaxed">Crie sua conta no SmartAgroOS e tenha acesso ao AgroCore integrado desde o primeiro dia.</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/login" className="inline-flex items-center justify-center gap-2 bg-[#16a34a] text-white font-bold px-8 py-4 rounded-xl hover:bg-[#15803d] transition-colors text-lg">
                  Começar grátis no SmartAgroOS
                </Link>
                <a href="https://agrocore.com.br" target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 border border-white/20 text-white font-semibold px-8 py-4 rounded-xl hover:border-white/40 transition-colors text-lg">
                  Conhecer o AgroCore
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </section>

      </main>
    </div>
  )
}

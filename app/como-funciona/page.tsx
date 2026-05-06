import Link from 'next/link'
import Nav from '@/components/Nav'

const PASSOS = [
  {
    num: '01',
    fase: 'Cadastro',
    titulo: 'Crie sua conta em 2 minutos',
    desc: 'Informe nome, e-mail e senha. Sem cartão de crédito, sem formulários longos. Você está dentro em menos de 2 minutos — e já pode começar a configurar.',
    detalhes: ['Acesso imediato após cadastro', 'Sem período de espera ou aprovação', 'Plano gratuito disponível para começar'],
    cor: 'bg-green-50 border-green-200',
    numCor: 'text-[#16a34a]',
    mock: (
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <div className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider mb-4">Criar conta</div>
        <div className="space-y-3">
          <div>
            <div className="text-xs text-[#94a3b8] mb-1">Nome completo</div>
            <div className="bg-[#f8fafc] rounded-lg px-3 py-2 text-sm text-[#0f172a] border border-gray-200">João Ferreira</div>
          </div>
          <div>
            <div className="text-xs text-[#94a3b8] mb-1">E-mail</div>
            <div className="bg-[#f8fafc] rounded-lg px-3 py-2 text-sm text-[#0f172a] border border-gray-200">joao@fazenda.com</div>
          </div>
          <div className="pt-1">
            <div className="w-full bg-[#16a34a] text-white text-sm font-bold text-center py-2.5 rounded-xl">Criar conta grátis →</div>
          </div>
        </div>
      </div>
    ),
  },
  {
    num: '02',
    fase: 'Configuração',
    titulo: 'Configure sua propriedade',
    desc: 'Adicione suas fazendas, divida em talhões, associe culturas e safras. É a base que conecta tudo — atividades, custos e relatórios sempre amarrados à área certa.',
    detalhes: ['Suporte a múltiplas fazendas', 'Talhões com área em hectares', 'Culturas, safras e ciclos produtivos'],
    cor: 'bg-blue-50 border-blue-200',
    numCor: 'text-blue-600',
    mock: (
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <div className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider mb-4">🏡 Fazenda Boa Vista · 450 ha</div>
        <div className="space-y-2">
          {[
            { nome: 'Talhão 1', cultura: 'Soja', area: '120 ha' },
            { nome: 'Talhão 2', cultura: 'Milho', area: '85 ha' },
            { nome: 'Talhão 3', cultura: 'Café', area: '60 ha' },
          ].map(t => (
            <div key={t.nome} className="flex items-center justify-between bg-[#f8fafc] rounded-xl px-4 py-2.5 border border-gray-100">
              <div>
                <div className="text-sm font-semibold text-[#0f172a]">{t.nome}</div>
                <div className="text-xs text-[#94a3b8]">{t.cultura}</div>
              </div>
              <div className="text-sm font-bold text-[#16a34a]">{t.area}</div>
            </div>
          ))}
          <div className="mt-2 border-2 border-dashed border-gray-200 rounded-xl py-2.5 text-center text-xs text-[#94a3b8] cursor-pointer hover:border-green-300 transition-colors">+ Adicionar talhão</div>
        </div>
      </div>
    ),
  },
  {
    num: '03',
    fase: 'Gestão',
    titulo: 'Gerencie operação, equipe e financeiro',
    desc: 'Crie atividades, atribua à equipe, acompanhe o andamento e veja os custos entrando automaticamente. O SmartAgroOS organiza tudo para que você passe menos tempo gerenciando e mais tempo decidindo.',
    detalhes: ['Atividades com prazo, responsável e status', 'Custo por hectare calculado automaticamente', 'Alertas inteligentes quando algo sai do padrão'],
    cor: 'bg-orange-50 border-orange-200',
    numCor: 'text-orange-600',
    mock: (
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-3">
        <div className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider mb-2">Atividades de hoje</div>
        {[
          { titulo: 'Pulverização · Talhão 1', resp: 'João Silva', status: 'Em andamento', cor: 'bg-blue-100 text-blue-700' },
          { titulo: 'Coleta de amostra · Talhão 3', resp: 'Maria Santos', status: 'Pendente', cor: 'bg-yellow-100 text-yellow-700' },
          { titulo: 'Irrigação · Talhão 2', resp: 'Pedro Lima', status: 'Concluído', cor: 'bg-green-100 text-green-700' },
        ].map(a => (
          <div key={a.titulo} className="flex items-center justify-between bg-[#f8fafc] rounded-xl px-4 py-2.5 border border-gray-100">
            <div>
              <div className="text-sm font-semibold text-[#0f172a]">{a.titulo}</div>
              <div className="text-xs text-[#94a3b8]">{a.resp}</div>
            </div>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${a.cor}`}>{a.status}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    num: '04',
    fase: 'Expansão',
    titulo: 'Expanda com o AgroCore',
    desc: 'Quando precisar de serviços externos — pulverização aérea, análise de solo, transporte — acesse o AgroCore direto do SmartAgroOS. Contrate, acompanhe e veja o custo entrar no relatório automaticamente.',
    detalhes: ['Marketplace com prestadores qualificados', 'Rastreabilidade da execução em tempo real', 'Custo externo integrado ao financeiro'],
    cor: 'bg-purple-50 border-purple-200',
    numCor: 'text-purple-600',
    mock: (
      <div className="bg-[#0f172a] rounded-2xl p-6 space-y-3">
        <div className="text-xs font-bold text-green-400 uppercase tracking-wider mb-2">AgroCore — Serviços externos</div>
        {[
          { icon: '✈️', servico: 'Pulverização aérea', status: 'Em execução', km: 'Talhão 1 · 120 ha' },
          { icon: '🔬', servico: 'Análise de solo', status: 'Agendado', km: 'Talhão 3 · amanhã' },
        ].map(s => (
          <div key={s.servico} className="bg-white/10 rounded-xl px-4 py-3 border border-white/10">
            <div className="flex items-center gap-3">
              <span className="text-xl">{s.icon}</span>
              <div className="flex-1">
                <div className="text-sm font-semibold text-white">{s.servico}</div>
                <div className="text-xs text-gray-400">{s.km}</div>
              </div>
              <span className="text-xs font-bold text-green-400">{s.status}</span>
            </div>
          </div>
        ))}
        <div className="mt-2 bg-[#16a34a]/20 border border-[#16a34a]/30 rounded-xl px-4 py-2.5 text-center text-xs font-bold text-green-400">
          + Solicitar novo serviço
        </div>
      </div>
    ),
  },
]

const NUMEROS = [
  { valor: '2 min', label: 'para criar a conta' },
  { valor: '10 min', label: 'para primeira atividade' },
  { valor: '1 dia', label: 'para visão completa da fazenda' },
  { valor: '0', label: 'treinamento necessário' },
]

export default function ComoFuncionaPage() {
  return (
    <div className="min-h-screen bg-white">
      <Nav />
      <main className="pt-24 pb-20">

        {/* Hero */}
        <section className="px-6 py-20 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" style={{background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(22,163,74,0.08), transparent)'}} />
          <div className="max-w-4xl mx-auto text-center relative">
            <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 text-xs font-semibold px-4 py-2 rounded-full mb-6 border border-green-200 uppercase tracking-wider">
              📖 Como funciona
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-[#0f172a] leading-tight mb-6">
              Da fazenda desorganizada<br />ao controle total
            </h1>
            <p className="text-xl text-[#64748b] max-w-2xl mx-auto mb-10 leading-relaxed">
              Quatro passos simples. Do cadastro à operação integrada com AgroCore — sem curva de aprendizado, sem consultor, sem complicação.
            </p>
            <Link href="/login" className="inline-flex items-center gap-2 bg-[#16a34a] text-white font-bold px-8 py-4 rounded-2xl hover:bg-[#15803d] transition-all shadow-lg shadow-green-200 text-lg">
              Começar agora grátis
            </Link>
          </div>
        </section>

        {/* Números de velocidade */}
        <section className="px-6 py-10 border-y border-gray-100 bg-[#f8fafc]">
          <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
            {NUMEROS.map(n => (
              <div key={n.label} className="text-center">
                <div className="text-3xl font-black text-[#16a34a] mb-1">{n.valor}</div>
                <div className="text-sm text-[#64748b]">{n.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Passos detalhados */}
        <section className="px-6 py-20">
          <div className="max-w-5xl mx-auto space-y-28">
            {PASSOS.map((passo, idx) => (
              <div key={passo.num} className={`grid md:grid-cols-2 gap-12 items-center ${idx % 2 === 1 ? 'md:[&>*:first-child]:order-2' : ''}`}>
                <div>
                  <div className={`inline-flex items-center gap-2 text-xs font-bold px-4 py-1.5 rounded-full mb-5 border ${passo.cor} ${passo.numCor}`}>
                    Passo {passo.num} — {passo.fase}
                  </div>
                  <h2 className="text-3xl font-bold text-[#0f172a] mb-4 leading-snug">{passo.titulo}</h2>
                  <p className="text-[#64748b] text-lg leading-relaxed mb-6">{passo.desc}</p>
                  <ul className="space-y-2.5">
                    {passo.detalhes.map(d => (
                      <li key={d} className="flex items-center gap-2.5 text-sm text-[#64748b]">
                        <svg className="w-4 h-4 text-[#16a34a] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7" />
                        </svg>
                        {d}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  {passo.mock}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ rápido */}
        <section className="px-6 py-16 bg-[#f8fafc]">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-[#0f172a] text-center mb-12">Perguntas rápidas</h2>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-100">
              {[
                { p: 'Preciso instalar alguma coisa?', r: 'Não. O SmartAgroOS roda direto no navegador. Em celulares, pode ser adicionado à tela inicial como app — mas não é obrigatório.' },
                { p: 'Minha equipe no campo precisa de treinamento?', r: 'Não. A interface foi desenhada para ser intuitiva. A maioria dos usuários opera sem qualquer treinamento formal.' },
                { p: 'Posso usar o SmartAgroOS sem o AgroCore?', r: 'Sim. O AgroCore é opcional. Você tem controle completo da operação interna independente da integração.' },
                { p: 'Os dados financeiros ficam seguros?', r: 'Sim. Todos os dados são criptografados e hospedados em servidores seguros. Nenhuma informação é compartilhada com terceiros.' },
              ].map(faq => (
                <div key={faq.p} className="px-8 py-5">
                  <div className="font-semibold text-[#0f172a] mb-1">{faq.p}</div>
                  <div className="text-sm text-[#64748b] leading-relaxed">{faq.r}</div>
                </div>
              ))}
            </div>
            <div className="text-center mt-6">
              <Link href="/faq" className="text-sm text-[#16a34a] font-semibold hover:underline">
                Ver todas as perguntas frequentes →
              </Link>
            </div>
          </div>
        </section>

        {/* CTA final */}
        <section className="px-6 py-20 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-4xl font-bold text-[#0f172a] mb-4">Entendeu como funciona?</h2>
            <p className="text-[#64748b] text-lg mb-8">Agora é só começar. Crie sua conta grátis e veja na prática — em menos de 10 minutos você já tem a sua fazenda organizada no sistema.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/login" className="inline-flex items-center justify-center gap-2 bg-[#16a34a] text-white font-bold px-8 py-4 rounded-2xl hover:bg-[#15803d] transition-all shadow-xl shadow-green-200 text-lg">
                Começar grátis agora
              </Link>
              <Link href="/demo" className="inline-flex items-center justify-center gap-2 border-2 border-[#e2e8f0] text-[#0f172a] font-semibold px-8 py-4 rounded-2xl hover:border-[#16a34a] hover:text-[#16a34a] transition-all text-lg">
                Ver demonstração interativa
              </Link>
            </div>
          </div>
        </section>

      </main>
    </div>
  )
}

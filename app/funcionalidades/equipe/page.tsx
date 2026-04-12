import Link from 'next/link'
import Nav from '@/components/Nav'

export default function EquipePage() {
  return (
    <div className="min-h-screen bg-white">
      <Nav />
      <main className="pt-24 pb-20">
        <section className="px-6 py-16 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" style={{background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(249,115,22,0.07), transparent)'}} />
          <div className="max-w-5xl mx-auto relative">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div>
                <div className="inline-flex items-center gap-2 bg-orange-50 text-orange-700 text-xs font-semibold px-4 py-2 rounded-full mb-6 border border-orange-200 uppercase tracking-wider">
                  👷 Gestão de Equipe
                </div>
                <h1 className="text-5xl font-bold text-[#0f172a] leading-tight mb-6">
                  Quem faz o quê — sem dúvida
                </h1>
                <p className="text-xl text-[#64748b] leading-relaxed mb-8">
                  Atribua tarefas, acompanhe a execução e meça o desempenho de cada membro da equipe. Fim do "combinado verbal" que ninguém lembrou.
                </p>
                <Link href="/login" className="inline-flex items-center bg-[#16a34a] text-white font-bold px-8 py-4 rounded-2xl hover:bg-[#15803d] transition-all shadow-lg shadow-green-200">
                  Começar grátis
                </Link>
              </div>
              <div className="bg-orange-50 rounded-3xl p-8 border border-orange-100 space-y-3">
                {[
                  { nome: 'João Silva', funcao: 'Operador de Máquinas', tarefas: 3, status: 'Ativo' },
                  { nome: 'Maria Santos', funcao: 'Técnica Agrícola', tarefas: 2, status: 'Em campo' },
                  { nome: 'Pedro Lima', funcao: 'Motorista', tarefas: 1, status: 'Disponível' },
                  { nome: 'Ana Costa', funcao: 'Agrônoma', tarefas: 4, status: 'Ativo' },
                ].map(m => (
                  <div key={m.nome} className="bg-white rounded-xl px-4 py-3 flex items-center justify-between shadow-sm border border-orange-50">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center font-bold text-orange-700 text-sm">
                        {m.nome[0]}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-[#0f172a]">{m.nome}</div>
                        <div className="text-xs text-[#94a3b8]">{m.funcao}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-[#0f172a]">{m.tarefas} tarefas</div>
                      <div className="text-xs text-green-600">{m.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 py-16 bg-[#f8fafc]">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-[#0f172a] text-center mb-12">Gestão humana de verdade</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {[
                { icon: '👥', title: 'Cadastro de membros', desc: 'Registre funções, contatos e responsabilidades.' },
                { icon: '📌', title: 'Atribuição de tarefas', desc: 'Cada atividade tem um responsável claro.' },
                { icon: '📊', title: 'Produtividade', desc: 'Veja quem entrega e quem precisa de suporte.' },
                { icon: '🏆', title: 'Meritocracia real', desc: 'Dados para reconhecer quem performa bem.' },
                { icon: '🔔', title: 'Notificações', desc: 'Equipe avisada quando recebe nova tarefa.' },
                { icon: '📱', title: 'Acesso mobile', desc: 'A equipe acompanha tudo pelo celular.' },
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
            Organizar minha equipe agora
          </Link>
        </section>
      </main>
    </div>
  )
}

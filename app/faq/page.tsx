'use client'

import { useState } from 'react'
import Link from 'next/link'
import Nav from '@/components/Nav'

const FAQ = [
  { categoria: 'Geral', pergunta: 'O que é o SmartAgroOS?', resposta: 'O SmartAgroOS é o sistema operacional da fazenda moderna. Ele centraliza a gestão de operações, equipe, financeiro e propriedades em um único lugar, integrado ao AgroCore para contratação de serviços externos.' },
  { categoria: 'Geral', pergunta: 'Preciso instalar algum aplicativo?', resposta: 'Não. O SmartAgroOS funciona direto no navegador, em qualquer dispositivo. Pode ser instalado como PWA no celular para acesso rápido, mas não é obrigatório.' },
  { categoria: 'Geral', pergunta: 'Funciona sem internet?', resposta: 'Algumas funcionalidades básicas ficam disponíveis offline. Os dados são sincronizados automaticamente quando a conexão é restabelecida — essencial para o campo.' },
  { categoria: 'Conta', pergunta: 'Como criar minha conta?', resposta: 'Basta clicar em "Começar grátis", informar nome, e-mail e senha. Em menos de 2 minutos você já está dentro do sistema.' },
  { categoria: 'Conta', pergunta: 'Posso ter mais de um usuário na minha fazenda?', resposta: 'Sim. Você pode convidar membros da equipe com diferentes níveis de acesso: administrador, gerente ou operador.' },
  { categoria: 'AgroCore', pergunta: 'O que é o AgroCore?', resposta: 'O AgroCore é o marketplace de serviços agrícolas integrado ao SmartAgroOS. Por ele, você contrata prestadores de pulverização, colheita, transporte e outros serviços diretamente pelo sistema, sem sair do SmartAgroOS.' },
  { categoria: 'AgroCore', pergunta: 'Como funciona a integração com o AgroCore?', resposta: 'Dentro do SmartAgroOS, ao criar uma atividade você pode optar por executar via AgroCore. O sistema abre a solicitação, você acompanha a execução e o custo entra automaticamente no relatório financeiro.' },
  { categoria: 'Financeiro', pergunta: 'Como o custo por hectare é calculado?', resposta: 'O sistema soma todos os custos associados a atividades de um talhão e divide pela área em hectares definida no cadastro da propriedade. O cálculo é automático e em tempo real.' },
  { categoria: 'Financeiro', pergunta: 'Os dados financeiros são seguros?', resposta: 'Sim. Todos os dados são criptografados e armazenados em servidores seguros. Nenhuma informação financeira é compartilhada com terceiros.' },
  { categoria: 'Técnico', pergunta: 'O SmartAgroOS funciona em celular?', resposta: 'Sim, o sistema é totalmente responsivo e funciona muito bem em smartphones e tablets. Pode ser instalado na tela inicial como um aplicativo nativo.' },
]

const CATEGORIAS = ['Todos', ...Array.from(new Set(FAQ.map(f => f.categoria)))]

function FaqItem({ pergunta, resposta }: { pergunta: string; resposta: string }) {
  const [aberto, setAberto] = useState(false)
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button onClick={() => setAberto(!aberto)}
        className="w-full py-5 px-0 text-left flex items-start justify-between gap-4 hover:text-[#16a34a] transition-colors group">
        <span className="font-semibold text-[#0f172a] group-hover:text-[#16a34a] transition-colors">{pergunta}</span>
        <span className={`text-[#94a3b8] flex-shrink-0 mt-0.5 transition-transform ${aberto ? 'rotate-180' : ''}`}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
          </svg>
        </span>
      </button>
      {aberto && (
        <div className="pb-5 text-[#64748b] leading-relaxed text-sm">
          {resposta}
        </div>
      )}
    </div>
  )
}

export default function FaqPage() {
  const [categoria, setCategoria] = useState('Todos')
  const filtrados = categoria === 'Todos' ? FAQ : FAQ.filter(f => f.categoria === categoria)

  return (
    <div className="min-h-screen bg-white">
      <Nav />
      <main className="pt-24 pb-20">
        <section className="px-6 py-16 text-center relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" style={{background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(22,163,74,0.08), transparent)'}} />
          <div className="relative max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 text-xs font-semibold px-4 py-2 rounded-full mb-6 border border-green-200 uppercase tracking-wider">
              ❓ Perguntas frequentes
            </div>
            <h1 className="text-5xl font-bold text-[#0f172a] mb-4">Tem alguma dúvida?</h1>
            <p className="text-[#64748b] text-lg">Encontre respostas para as perguntas mais comuns sobre o SmartAgroOS.</p>
          </div>
        </section>

        <section className="px-6 max-w-3xl mx-auto">
          {/* Filtro por categoria */}
          <div className="flex flex-wrap gap-2 mb-10 justify-center">
            {CATEGORIAS.map(c => (
              <button key={c} onClick={() => setCategoria(c)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  categoria === c
                    ? 'bg-[#16a34a] text-white shadow-md shadow-green-200'
                    : 'bg-[#f8fafc] text-[#64748b] hover:bg-gray-100 border border-gray-200'
                }`}>
                {c}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-8">
            {filtrados.map(f => (
              <FaqItem key={f.pergunta} pergunta={f.pergunta} resposta={f.resposta} />
            ))}
          </div>

          <div className="mt-12 bg-[#f0fdf4] rounded-2xl border border-green-200 p-8 text-center">
            <div className="text-3xl mb-3">💬</div>
            <h3 className="font-bold text-[#0f172a] mb-2">Não encontrou sua resposta?</h3>
            <p className="text-[#64748b] text-sm mb-6">Fale com a gente pelo WhatsApp ou e-mail. Respondemos rápido.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a href="https://wa.me/5585986027333" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-[#16a34a] text-white font-bold px-6 py-3 rounded-xl hover:bg-[#15803d] transition-colors">
                📱 WhatsApp
              </a>
              <Link href="/login" className="inline-flex items-center justify-center gap-2 border-2 border-[#e2e8f0] text-[#0f172a] font-semibold px-6 py-3 rounded-xl hover:border-[#16a34a] transition-colors">
                Criar conta grátis
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

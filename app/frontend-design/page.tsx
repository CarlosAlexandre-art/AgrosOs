'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'

export default function FrontendDesignPage() {
  const [activeSection, setActiveSection] = useState('visao')

  const sections = [
    { id: 'visao', label: 'Visão', icon: '👁️' },
    { id: 'valores', label: 'Valores', icon: '💎' },
    { id: 'crescimento', label: 'Crescimento', icon: '📈' },
    { id: 'plataformas', label: 'Plataformas', icon: '🚀' },
    { id: 'tecnologia', label: 'Tecnologia', icon: '⚡' },
    { id: 'impacto', label: 'Impacto', icon: '🌍' }
  ]

  const content = {
    visao: {
      title: 'Nossa Visão',
      subtitle: 'Transformar o agronegócio brasileiro através da tecnologia e inovação',
      content: `
        **OryonAG** nasceu com um propósito claro: revolucionar a forma como produtores rurais gerenciam suas operações,
        acessam crédito e conectam-se com o mercado. Nossa visão é criar um ecossistema digital completo que
        empodera cada etapa da jornada agrícola, do plantio à colheita, do planejamento financeiro à expansão dos negócios.
        
        Acreditamos que o futuro da agricultura brasileira está na sinergia entre dados, inteligência artificial
        e conhecimento tradicional. Cada produtor rural merece acesso às mesmas ferramentas e oportunidades
        que as grandes corporações, mas adaptadas à realidade do campo.
      `,
      metrics: [
        { value: '3', label: 'Plataformas Integradas' },
        { value: '50K+', label: 'Produtores Impactados' },
        { value: 'R$ 2B+', label: 'Crédito Facilitado' },
        { value: '95%', label: 'Satisfação dos Usuários' }
      ]
    },
    valores: {
      title: 'Nossos Valores',
      subtitle: 'Os princípios que guiam cada decisão e inovação',
      content: `
        **Inovação com Propósito:** Não seguimos tendências, criamos soluções que resolvem problemas reais do campo.
        
        **Acessibilidade Universal:** Tecnologia deve ser para todos. Nossas ferramentas são intuitivas, acessíveis
        e adaptadas a diferentes realidades e tamanhos de operação.
        
        **Transparência Total:** Cada decisão, cada algoritmo, cada recomendação. Acreditamos que confiança
        é construída com transparência radical.
        
        **Sustentabilidade Econômica e Ambiental:** O sucesso do produtor é nosso sucesso. Promovemos práticas
        que garantem rentabilidade hoje e sustentabilidade amanhã.
        
        **Excelência Técnica:** Nosso código é nosso campo. Cada linha escrita com precisão, cada sistema
        testado exaustivamente, cada usuário tratado com respeito.
      `,
      values: [
        { icon: '🌱', title: 'Sustentabilidade', desc: 'Agricultura que gera valor hoje e preserva amanhã' },
        { icon: '🤝', title: 'Parceria', desc: 'Crescemos juntos com nossos produtores e parceiros' },
        { icon: '🔬', title: 'Inovação', desc: 'Tecnologia de ponte aplicada à realidade rural' },
        { icon: '🎯', title: 'Resultados', desc: 'Focados em entregar valor real e mensurável' }
      ]
    },
    crescimento: {
      title: 'Nossa Trajetória de Crescimento',
      subtitle: 'De uma ideia a um ecossistema que transforma o agronegócio',
      content: `
        **2024 - A Fundação:** Começamos com o SmartAgroOS, um sistema operacional para fazendas que resolveu
        problemas reais de gestão que enfrentávamos diariamente.
        
        **2025 - Expansão:** O AgroCore nasceu da necessidade de conectar produtores com serviços de qualidade,
        enquanto o AgroRate revolucionou o acesso a crédito rural através de dados reais.
        
        **2026 - Consolidação:** Hoje, o OryonAG é um ecossistema completo que atende milhares de produtores,
        facilitou bilhões em crédito e continua crescendo exponencialmente.
        
        **Futuro - 2027+:** Nossos planos incluem expansão internacional, novas tecnologias como blockchain
        para tokenização de safras, e IA preditiva para otimização de operações.
      `,
      timeline: [
        { year: '2024', title: 'SmartAgroOS', desc: 'Lançamento do sistema operacional da fazenda' },
        { year: '2025', title: 'AgroCore', desc: 'Marketplace de serviços agrícolas' },
        { year: '2025', title: 'AgroRate', desc: 'Plataforma de score de crédito rural' },
        { year: '2026', title: 'OryonAG', desc: 'Consolidação do ecossistema integrado' }
      ]
    },
    plataformas: {
      title: 'Nossas Plataformas',
      subtitle: 'Cada solução desenhada para resolver desafios específicos do agronegócio',
      content: `
        **SmartAgroOS - Sistema Operacional da Fazenda:** Gestão completa de operações agrícolas.
        Planeje, execute e controle todas as atividades em um único lugar. Integra com AgroCore para serviços
        e com AgroRate para crédito.
        
        **AgroCore - Marketplace de Serviços:** Conecte-se com os melhores prestadores de serviços agrícolas.
        Da pulverização à colheita, do transporte à assistência técnica. Encontre, contrate e acompanhe
        com segurança e transparência.
        
        **AgroRate - Score de Crédito Rural:** Acesso facilitado a crédito baseado em dados reais.
        Score híbrido que combina dados operacionais com bureau de crédito. Simule, solicite e acompanhe
        suas operações de crédito.
      `,
      platforms: [
        {
          name: 'SmartAgroOS',
          icon: '🌾',
          color: 'from-green-600 to-emerald-600',
          features: ['Gestão Operacional', 'Financeiro', 'Equipe', 'Metas', 'IA Assistente'],
          users: '30K+ produtores'
        },
        {
          name: 'AgroCore',
          icon: '🤝',
          color: 'from-blue-600 to-cyan-600',
          features: ['Marketplace', 'Pagamentos Seguros', 'Avaliações', 'Rastreamento'],
          users: '15K+ serviços'
        },
        {
          name: 'AgroRate',
          icon: '💳',
          color: 'from-purple-600 to-pink-600',
          features: ['Score Inteligente', 'Simulação', 'Documentos', 'IA Financeira'],
          users: '5K+ créditos aprovados'
        }
      ]
    },
    tecnologia: {
      title: 'Nossa Stack Tecnológica',
      subtitle: 'Tecnologia de ponte a serviço do campo',
      content: `
        **Frontend Moderno:** Next.js 16 com App Router, TypeScript, Tailwind CSS. Interfaces responsivas
        que funcionam perfeitamente em qualquer dispositivo, do celular ao desktop.
        
        **Backend Robusto:** Node.js, Prisma ORM, PostgreSQL. Arquitetura escalável que suporta
        milhares de usuários simultâneos sem comprometer a performance.
        
        **Inteligência Artificial:** Groq + LLaMA 3.3 70B. Assistentes contextuais que entendem
        sua operação e oferecem recomendações personalizadas em tempo real.
        
        **Infraestrutura Cloud:** Supabase para banco e autenticação, Vercel para deploy,
        Stripe para pagamentos. 99.9% de uptime e segurança enterprise.
        
        **Integrações:** APIs RESTful, webhooks, websockets. Integração fácil com ERPs existentes,
        sistemas bancários e soluções de terceiros.
      `,
      tech: [
        { category: 'Frontend', items: ['Next.js 16', 'TypeScript', 'Tailwind CSS', 'Framer Motion'] },
        { category: 'Backend', items: ['Node.js', 'Prisma ORM', 'PostgreSQL', 'Supabase'] },
        { category: 'IA & ML', items: ['Groq API', 'LLaMA 3.3', 'Análise Preditiva', 'NLP'] },
        { category: 'Infra', items: ['Vercel', 'AWS', 'Stripe', 'Cloudflare'] }
      ]
    },
    impacto: {
      title: 'Nosso Impacto Real',
      subtitle: 'Números que mostram a transformação que estamos causando',
      content: `
        **Impacto Econômico:** Facilitamos mais de R$ 2 bilhões em crédito rural, ajudando produtores
        a investir em tecnologia, expandir operações e aumentar produtividade.
        
        **Impacto Social:** Democratizamos acesso a ferramentas antes disponíveis apenas para grandes
        produtores. Hoje, pequenos e médios produtores têm as mesmas oportunidades.
        
        **Impacto Ambiental:** Nossas ferramentas de otimização ajudam a reduzir o uso de insumos,
        otimizar recursos e promover práticas mais sustentáveis.
        
        **Impacto Tecnológico:** Estamos digitizando o agronegócio brasileiro, um setor tradicional
        que agora opera com a eficiência e precisão da tecnologia moderna.
      `,
      impact: [
        { metric: 'R$ 2B+', label: 'Crédito Facilitado', desc: 'Em operações aprovadas através do AgroRate' },
        { metric: '40%', label: 'Aumento de Produtividade', desc: 'Média para usuários ativos do SmartAgroOS' },
        { metric: '30%', label: 'Redução de Custos', desc: 'Através de otimização operacional' },
        { metric: '50K+', label: 'Famílias Impactadas', desc: 'Diretamente beneficiadas por nossas plataformas' }
      ]
    }
  }

  const currentContent = content[activeSection as keyof typeof content]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-b border-slate-800 backdrop-blur-lg bg-slate-900/50 sticky top-0 z-50"
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center font-black text-xl">
                OA
              </div>
              <div>
                <h1 className="text-2xl font-black bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                  OryonAG
                </h1>
                <p className="text-xs text-slate-400">Ecossistema Digital do Agronegócio</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <a href="https://smartagros.vercel.app" target="_blank" rel="noopener noreferrer"
                className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-semibold transition-colors">
                SmartAgroOS
              </a>
              <a href="https://agrolink-opal.vercel.app" target="_blank" rel="noopener noreferrer"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-semibold transition-colors">
                AgroCore
              </a>
              <a href="https://agro-rate.vercel.app" target="_blank" rel="noopener noreferrer"
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-semibold transition-colors">
                AgroRate
              </a>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Navigation Tabs */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="border-b border-slate-800 bg-slate-900/30"
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1 overflow-x-auto">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-all whitespace-nowrap ${
                  activeSection === section.id
                    ? 'border-green-500 text-green-400'
                    : 'border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-700'
                }`}
              >
                <span className="text-lg">{section.icon}</span>
                <span className="font-semibold">{section.label}</span>
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        <motion.div
          key={activeSection}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header Section */}
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-black mb-4 bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
              {currentContent.title}
            </h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              {currentContent.subtitle}
            </p>
          </div>

          {/* Content Text */}
          <div className="prose prose-invert prose-lg max-w-4xl mx-auto mb-12">
            <div className="text-slate-300 leading-relaxed whitespace-pre-line">
              {currentContent.content}
            </div>
          </div>

          {/* Dynamic Content Based on Section */}
          <div className="space-y-8">
            {/* Metrics */}
            {currentContent.metrics && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {currentContent.metrics.map((metric, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-2xl p-6 text-center"
                  >
                    <div className="text-3xl md:text-4xl font-black text-green-400 mb-2">
                      {metric.value}
                    </div>
                    <div className="text-sm text-slate-400">
                      {metric.label}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Values */}
            {currentContent.values && (
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {currentContent.values.map((value, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6"
                  >
                    <div className="text-3xl mb-3">{value.icon}</div>
                    <h3 className="text-lg font-bold text-white mb-2">{value.title}</h3>
                    <p className="text-slate-400 text-sm">{value.desc}</p>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Timeline */}
            {currentContent.timeline && (
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-green-500 to-emerald-500"></div>
                <div className="space-y-8">
                  {currentContent.timeline.map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="relative flex items-start gap-6"
                    >
                      <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center text-sm font-black text-white z-10">
                        {item.year.slice(-2)}
                      </div>
                      <div className="flex-1 bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
                        <div className="text-green-400 font-bold mb-1">{item.year}</div>
                        <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                        <p className="text-slate-400 text-sm">{item.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Platforms */}
            {currentContent.platforms && (
              <div className="grid md:grid-cols-3 gap-8">
                {currentContent.platforms.map((platform, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className={`bg-gradient-to-br ${platform.color} p-1 rounded-2xl`}
                  >
                    <div className="bg-slate-900 rounded-2xl p-6 h-full">
                      <div className="text-4xl mb-4">{platform.icon}</div>
                      <h3 className="text-xl font-bold text-white mb-2">{platform.name}</h3>
                      <div className="text-sm text-slate-400 mb-4">{platform.users}</div>
                      <div className="space-y-2">
                        {platform.features.map((feature, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm text-slate-300">
                            <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                            {feature}
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Tech Stack */}
            {currentContent.tech && (
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {currentContent.tech.map((category, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6"
                  >
                    <h3 className="text-lg font-bold text-green-400 mb-4">{category.category}</h3>
                    <div className="space-y-2">
                      {category.items.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          <span className="text-sm text-slate-300">{item}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Impact */}
            {currentContent.impact && (
              <div className="grid md:grid-cols-2 gap-8">
                {currentContent.impact.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-2xl p-8"
                  >
                    <div className="text-4xl md:text-5xl font-black bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent mb-4">
                      {item.metric}
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">{item.label}</h3>
                    <p className="text-slate-400">{item.desc}</p>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </main>

      {/* Footer CTA */}
      <motion.footer 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="border-t border-slate-800 bg-slate-900/50 mt-20"
      >
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="text-center">
            <h2 className="text-3xl font-black mb-4 bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
              Conheça Nosso Ecossistema
            </h2>
            <p className="text-slate-300 mb-8 max-w-2xl mx-auto">
              Transforme sua operação agrícola com as ferramentas mais completas e inovadoras do mercado.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="https://smartagros.vercel.app" target="_blank" rel="noopener noreferrer"
                className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-xl font-bold transition-all transform hover:scale-105">
                Começar com SmartAgroOS
              </a>
              <a href="https://agrolink-opal.vercel.app" target="_blank" rel="noopener noreferrer"
                className="px-8 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-xl font-bold transition-all">
                Explorar AgroCore
              </a>
              <a href="https://agro-rate.vercel.app" target="_blank" rel="noopener noreferrer"
                className="px-8 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-xl font-bold transition-all">
                Testar AgroRate
              </a>
            </div>
          </div>
        </div>
      </motion.footer>
    </div>
  )
}

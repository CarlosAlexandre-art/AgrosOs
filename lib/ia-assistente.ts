import { createClient } from '@/lib/supabase/client'

// ─── Contexto da IA ───────────────────────────────────────────────────────────

export interface IAContext {
  userId: string
  propertyId?: string
  plataforma: 'smartagros' | 'agrorate' | 'agrocore'
  secao: string
  dadosUsuario?: any
  dadosPropriedade?: any
  contextoAdicional?: any
}

// ─── Prompts contextuais por seção ───────────────────────────────────────────────

const PROMPTS_CONTEXTUAIS: Record<string, (context: IAContext) => string> = {
  // SmartAgroOS - Operações
  'activities': (ctx) => `Você é o assistente do SmartAgroOS. Ajude o usuário com atividades agrícolas. 
    Dados: ${JSON.stringify(ctx.dadosPropriedade)}. 
    Foque em planejamento, execução e acompanhamento de atividades como plantio, colheita, pulverização.`,

  'costs': (ctx) => `Você é o assistente financeiro do SmartAgroOS. Ajude com controle de custos agrícolas.
    Dados da propriedade: ${JSON.stringify(ctx.dadosPropriedade)}.
    Foque em otimização de custos, categorização (insumos, mão de obra, maquinário) e análise de margens.`,

  'revenues': (ctx) => `Você é o assistente de receitas do SmartAgroOS. Ajude com gestão de receitas agrícolas.
    Dados: ${JSON.stringify(ctx.dadosPropriedade)}.
    Foque em previsão de safras, precificação, mercados e maximização de receita.`,

  'goals': (ctx) => `Você é o assistente de metas do SmartAgroOS. Ajude a definir e acompanhar metas agrícolas.
    Dados: ${JSON.stringify(ctx.dadosPropriedade)}.
    Foque em metas realistas de produção, financeiras e operacionais com base no histórico.`,

  'team': (ctx) => `Você é o assistente de equipe do SmartAgroOS. Ajude com gestão de equipe rural.
    Dados: ${JSON.stringify(ctx.dadosPropriedade)}.
    Foque em alocação de pessoas, produtividade, treinamento e gestão de desempenho.`,

  // AgroRate - Crédito
  'score': (ctx) => `Você é o especialista em crédito rural do AgroRate. Analise o score e dê recomendações.
    Dados do score: ${JSON.stringify(ctx.dadosUsuario)}.
    Foque em melhorar o score, entender os fatores e guiar para melhores condições de crédito.`,

  'credit': (ctx) => `Você é o consultor de crédito rural do AgroRate. Ajude a encontrar as melhores opções.
    Dados: ${JSON.stringify(ctx.dadosUsuario)}.
    Foque em simular crédito, comparar linhas, preparar documentação e otimizar aprovação.`,

  'documents': (ctx) => `Você é o assistente documental do AgroRate. Ajude com preparação de documentos.
    Dados: ${JSON.stringify(ctx.dadosUsuario)}.
    Foque em organizar documentos, verificar conformidade e preparar para análise bancária.`,

  // AgroCore - Marketplace
  'services': (ctx) => `Você é o assistente do AgroCore Marketplace. Ajude a contratar serviços agrícolas.
    Dados: ${JSON.stringify(ctx.dadosPropriedade)}.
    Foque em encontrar prestadores, negociar serviços, acompanhar execução e garantir qualidade.`,

  'proposals': (ctx) => `Você é o consultor do AgroCore. Ajude com propostas de serviços.
    Dados: ${JSON.stringify(ctx.dadosPropriedade)}.
    Foque em analisar propostas, negociar preços, definir escopos e proteger interesses do produtor.`,

  // Geral
  'dashboard': (ctx) => `Você é o assistente principal do ${ctx.plataforma === 'smartagros' ? 'SmartAgroOS' : ctx.plataforma === 'agrorate' ? 'AgroRate' : 'AgroCore'}.
    Dados completos: ${JSON.stringify({ ...ctx.dadosUsuario, ...ctx.dadosPropriedade })}.
    Ajude com visão geral, próximos passos e otimização geral da operação.`,

  'help': (ctx) => `Você é o assistente de ajuda do ecossistema OryonAG. Ajude o usuário a navegar pelas plataformas.
    Plataforma atual: ${ctx.plataforma}. Seção: ${ctx.seção}.
    Foque em explicar funcionalidades, resolver dúvidas e guiar para os recursos certos.`,
}

// ─── Gerar prompt contextualizado ─────────────────────────────────────────────

export function gerarPromptContextual(context: IAContext, mensagemUsuario: string): string {
  const promptBase = PROMPTS_CONTEXTUAIS[context.secao] || PROMPTS_CONTEXTUAIS['help']
  
  const promptContextual = promptBase(context) + `

Contexto adicional:
${JSON.stringify(context.contextoAdicional || {}, null, 2)}

Mensagem do usuário: "${mensagemUsuario}"

Responda de forma útil, prática e direta. Use linguagem agrícola quando apropriado. 
Seja proativo em sugerir próximos passos e melhores práticas.
Mantenha o tom de especialista mas acessível.`

  return promptContextual
}

// ─── Chamada à API Groq ───────────────────────────────────────────────────────

export async function chamarIA(mensagem: string, context: IAContext): Promise<string> {
  try {
    const promptCompleto = gerarPromptContextual(context, mensagem)
    
    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: promptCompleto
          },
          {
            role: 'user', 
            content: mensagem
          }
        ],
        model: 'llama-3.3-70b-versatile',
        max_tokens: 1000,
        temperature: 0.7
      })
    })

    if (!response.ok) {
      throw new Error('Erro na chamada à API')
    }

    const data = await response.json()
    return data.choices?.[0]?.message?.content || 'Desculpe, não consegui processar sua solicitação.'
    
  } catch (error) {
    console.error('Erro ao chamar IA:', error)
    return 'Desculpe, estou com dificuldades técnicas. Tente novamente em alguns instantes.'
  }
}

// ─── Componente de IA flutuante ───────────────────────────────────────────────

export function inicializarIA(context: IAContext) {
  // Listener para eventos CustomEvent do frontend
  if (typeof window !== 'undefined') {
    window.addEventListener('ai-prefill', (event: any) => {
      const prompt = event.detail?.prompt
      if (prompt) {
        // Disparar evento para o componente de IA
        window.dispatchEvent(new CustomEvent('ai-message', {
          detail: { prompt, context }
        }))
      }
    })
  }
}

// ─── Funções de ajuda específicas ───────────────────────────────────────────────

export const FUNCOES_AJUDA = {
  smartagros: {
    atividades: 'Como criar, acompanhar e otimizar atividades agrícolas',
    custos: 'Como controlar e reduzir custos de produção',
    receitas: 'Como maximizar e prever receitas das safras',
    metas: 'Como definir metas realistas e acompanhar o alcance',
    equipe: 'Como gerenciar equipe e aumentar produtividade',
    propriedades: 'Como configurar e gerenciar propriedades e talhões',
  },
  agrorate: {
    score: 'Como entender e melhorar seu score de crédito',
    credito: 'Como solicitar e aprovar crédito rural',
    documentos: 'Como preparar e organizar documentos bancários',
    simulacao: 'Como simular diferentes cenários de crédito',
    compartilhamento: 'Como compartilhar dados com bancos',
  },
  agrocore: {
    servicos: 'Como contratar serviços agrícolas qualificados',
    propostas: 'Como analisar e negociar propostas de serviços',
    prestadores: 'Como encontrar e avaliar prestadores',
    acompanhamento: 'Como acompanhar a execução de serviços',
  }
}

// ─── Sugestões automáticas baseadas no contexto ───────────────────────────────────

export function gerarSugestoes(context: IAContext): string[] {
  const sugestoes: string[] = []

  if (context.plataforma === 'smartagros') {
    if (context.dadosPropriedade?.activities?.length > 0) {
      sugestoes.push('Quer ajuda para planejar as próximas atividades?')
    }
    if (context.dadosPropriedade?.costs?.length > 0) {
      sugestoes.push('Posso ajudar a analisar seus custos e encontrar oportunidades de economia.')
    }
    if (context.dadosPropriedade?.goals?.length === 0) {
      sugestoes.push('Vamos definir algumas metas para sua propriedade?')
    }
  }

  if (context.plataforma === 'agrorate') {
    if (context.dadosUsuario?.score < 600) {
      sugestoes.push('Seu score precisa melhorar. Quer dicas personalizadas para aumentar?')
    }
    if (context.dadosUsuario?.dataCompleteness < 80) {
      sugestoes.push('Complete seus dados para melhorar seu score. Posso ajudar!')
    }
  }

  if (context.plataforma === 'agrocore') {
    sugestoes.push('Precisa de algum serviço agrícola? Posso ajudar a encontrar os melhores.')
  }

  return sugestoes
}

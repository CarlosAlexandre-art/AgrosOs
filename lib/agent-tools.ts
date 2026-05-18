import { prisma } from '@/lib/prisma'

export type ToolName =
  | 'buscar_saude_rebanho'
  | 'buscar_dados_financeiros'
  | 'buscar_alertas_ativos'
  | 'buscar_lotes_confinamento'
  | 'buscar_pastagens'
  | 'buscar_atividades_pendentes'
  | 'criar_alerta'

export const TOOL_DEFINITIONS = [
  {
    type: 'function' as const,
    function: {
      name: 'buscar_saude_rebanho',
      description: 'Busca registros de saúde recentes dos animais da propriedade, incluindo vacinas, medicações e diagnósticos dos últimos 14 dias.',
      parameters: {
        type: 'object',
        properties: {
          dias: { type: 'number', description: 'Número de dias atrás para buscar (padrão: 14)' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'buscar_dados_financeiros',
      description: 'Busca custos e receitas da propriedade nos últimos N dias para análise financeira.',
      parameters: {
        type: 'object',
        properties: {
          dias: { type: 'number', description: 'Período em dias (padrão: 30)' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'buscar_alertas_ativos',
      description: 'Busca alertas não lidos da propriedade, retornando tipo, mensagem e data.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'buscar_lotes_confinamento',
      description: 'Busca lotes ativos de confinamento com GMD, consumo de ração e mortalidade dos últimos 7 dias.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'buscar_pastagens',
      description: 'Busca status de todas as pastagens da propriedade: área, capacidade, status de ocupação e rotação.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'buscar_atividades_pendentes',
      description: 'Busca atividades com status PENDING ou LATE na propriedade.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'criar_alerta',
      description: 'Cria um alerta no sistema para notificar o produtor sobre uma situação importante.',
      parameters: {
        type: 'object',
        properties: {
          tipo: { type: 'string', description: 'Categoria: AGROVET, NUTRIBOV, AGROGRADE, AGROTRADE, AGENTE' },
          mensagem: { type: 'string', description: 'Texto claro e acionável descrevendo o problema e a ação sugerida' },
        },
        required: ['tipo', 'mensagem'],
      },
    },
  },
] as const

export async function executarTool(
  nome: ToolName,
  args: Record<string, unknown>,
  propertyId: string,
): Promise<string> {
  try {
    switch (nome) {
      case 'buscar_saude_rebanho': {
        const dias = (args.dias as number) ?? 14
        const desde = new Date(Date.now() - dias * 86400000)
        const registros = await prisma.animalSaude.findMany({
          where: { animal: { propertyId }, dataRegistro: { gte: desde } },
          include: { animal: { select: { identificacao: true, raca: true } } },
          orderBy: { dataRegistro: 'desc' },
          take: 30,
        })
        if (!registros.length) return `Nenhum registro de saúde nos últimos ${dias} dias.`
        const resumo = registros.map(r =>
          `Animal ${r.animal.identificacao} (${r.animal.raca ?? 'sem raça'}): ${r.tipo} — ${r.descricao}${r.produto ? ` / ${r.produto}` : ''} em ${r.dataRegistro.toLocaleDateString('pt-BR')}`
        ).join('\n')
        return `${registros.length} registros de saúde:\n${resumo}`
      }

      case 'buscar_dados_financeiros': {
        const dias = (args.dias as number) ?? 30
        const desde = new Date(Date.now() - dias * 86400000)
        const [custos, receitas] = await Promise.all([
          prisma.cost.findMany({
            where: { propertyId, date: { gte: desde } },
            select: { amount: true, category: true, description: true, date: true },
            orderBy: { date: 'desc' },
          }),
          prisma.revenue.findMany({
            where: { propertyId, date: { gte: desde } },
            select: { amount: true, category: true, description: true, date: true },
            orderBy: { date: 'desc' },
          }),
        ])
        const totalCustos = custos.reduce((s, c) => s + Number(c.amount), 0)
        const totalReceitas = receitas.reduce((s, r) => s + Number(r.amount), 0)
        const margem = totalReceitas - totalCustos
        return `Financeiro últimos ${dias} dias:\nReceitas: R$${totalReceitas.toFixed(2)} (${receitas.length} lançamentos)\nCustos: R$${totalCustos.toFixed(2)} (${custos.length} lançamentos)\nMargem: R$${margem.toFixed(2)} (${margem >= 0 ? 'positiva' : 'NEGATIVA'})`
      }

      case 'buscar_alertas_ativos': {
        const alertas = await prisma.alert.findMany({
          where: { propertyId, isRead: false },
          orderBy: { createdAt: 'desc' },
          take: 20,
        })
        if (!alertas.length) return 'Nenhum alerta ativo no momento.'
        return `${alertas.length} alertas ativos:\n${alertas.map(a => `[${a.type}] ${a.message}`).join('\n')}`
      }

      case 'buscar_lotes_confinamento': {
        const lotes = await prisma.lote.findMany({
          where: { propertyId, status: 'ATIVO' },
          include: {
            registrosDiarios: { orderBy: { data: 'desc' }, take: 7 },
            planosNutricionais: { where: { ativo: true }, take: 1 },
          },
        })
        if (!lotes.length) return 'Nenhum lote ativo em confinamento.'
        const hoje = new Date()
        return lotes.map(lote => {
          const dias = Math.floor((hoje.getTime() - lote.dataEntrada.getTime()) / 86400000)
          const ult = lote.registrosDiarios[0]
          const gmd = dias > 0 && ult?.pesoMedio
            ? ((ult.pesoMedio - lote.pesoMedioEntrada) / dias).toFixed(2)
            : 'N/D'
          const mort = lote.registrosDiarios.reduce((s, r) => s + r.mortalidade, 0)
          return `Lote "${lote.nome}": ${lote.cabecas} cab, ${dias} dias, GMD=${gmd}kg/dia, Mortalidade 7d=${mort}, Peso atual=${ult?.pesoMedio ?? lote.pesoMedioEntrada}kg`
        }).join('\n')
      }

      case 'buscar_pastagens': {
        const pastagens = await prisma.pastagem.findMany({
          where: { propertyId },
          include: {
            rotacoes: { where: { saida: null }, orderBy: { entrada: 'asc' }, take: 1 },
          },
        })
        if (!pastagens.length) return 'Nenhuma pastagem cadastrada.'
        return pastagens.map(p => {
          const rot = p.rotacoes[0]
          const diasOcupada = rot
            ? Math.ceil((Date.now() - rot.entrada.getTime()) / 86400000)
            : null
          return `Pastagem "${p.nome}": ${p.areaHectares}ha, Cap=${p.capacidadeUA ?? 'N/D'} UA, Status=${p.status}${diasOcupada ? `, Ocupada há ${diasOcupada} dias (ciclo=${p.cicloDescanso ?? 21}d)` : ''}`
        }).join('\n')
      }

      case 'buscar_atividades_pendentes': {
        const atividades = await prisma.activity.findMany({
          where: { propertyId, status: { in: ['PENDING', 'LATE'] } },
          orderBy: { startDate: 'asc' },
          take: 15,
          select: { type: true, description: true, status: true, startDate: true },
        })
        if (!atividades.length) return 'Nenhuma atividade pendente.'
        return `${atividades.length} atividades pendentes:\n${atividades.map(a =>
          `[${a.status}] ${a.type}: ${a.description ?? 'sem descrição'} — ${a.startDate.toLocaleDateString('pt-BR')}`
        ).join('\n')}`
      }

      case 'criar_alerta': {
        const tipo = (args.tipo as string) ?? 'AGENTE'
        const mensagem = args.mensagem as string
        await prisma.alert.create({ data: { propertyId, type: tipo, message: mensagem } })
        return `Alerta criado com sucesso: [${tipo}] ${mensagem}`
      }

      default:
        return 'Ferramenta não reconhecida.'
    }
  } catch (err: any) {
    return `Erro ao executar ${nome}: ${err?.message ?? 'desconhecido'}`
  }
}

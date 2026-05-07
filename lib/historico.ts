import { prisma } from '@/lib/prisma'

// ─── Tipos de histórico ───────────────────────────────────────────────────────

export interface HistoricoEntry {
  id: string
  userId: string
  propertyId?: string
  tipo: 'ACTIVITY' | 'COST' | 'REVENUE' | 'GOAL' | 'ALERT' | 'PROPERTY' | 'TEAM_MEMBER' | 'AGRO_RATE' | 'ENERGY' | 'DOCUMENT'
  acao: 'CREATE' | 'UPDATE' | 'DELETE' | 'STATUS_CHANGE'
  entidadeId: string
  entidadeTipo: string
  dadosAntigos?: any
  dadosNovos?: any
  descricao: string
  ip?: string
  userAgent?: string
  createdAt: Date
}

// ─── Criar entrada no histórico ─────────────────────────────────────────────────

export async function criarHistorico(params: {
  userId: string
  propertyId?: string
  tipo: HistoricoEntry['tipo']
  acao: HistoricoEntry['acao']
  entidadeId: string
  entidadeTipo: string
  dadosAntigos?: any
  dadosNovos?: any
  descricao: string
  request?: Request
}) {
  try {
    const entry = {
      userId: params.userId,
      propertyId: params.propertyId,
      tipo: params.tipo,
      acao: params.acao,
      entidadeId: params.entidadeId,
      entidadeTipo: params.entidadeTipo,
      dadosAntigos: params.dadosAntigos ? JSON.stringify(params.dadosAntigos) : null,
      dadosNovos: params.dadosNovos ? JSON.stringify(params.dadosNovos) : null,
      descricao: params.descricao,
      ip: params.request ? getClientIP(params.request) : null,
      userAgent: params.request ? params.request.headers.get('user-agent') || undefined : undefined,
      createdAt: new Date()
    }

    // Salvar no banco (se tiver tabela de histórico)
    // await prisma.historico.create({ data: entry })

    console.log('📝 Histórico criado:', entry)
    return entry
  } catch (error) {
    console.error('Erro ao criar histórico:', error)
    return null
  }
}

// ─── Consultar histórico ─────────────────────────────────────────────────────

export async function consultarHistorico(params: {
  userId?: string
  propertyId?: string
  tipo?: HistoricoEntry['tipo']
  dataInicio?: Date
  dataFim?: Date
  limite?: number
}) {
  try {
    // Consultar no banco (se tiver tabela)
    // const historico = await prisma.historico.findMany({
    //   where: {
    //     ...(params.userId && { userId: params.userId }),
    //     ...(params.propertyId && { propertyId: params.propertyId }),
    //     ...(params.tipo && { tipo: params.tipo }),
    //     createdAt: {
    //       ...(params.dataInicio && { gte: params.dataInicio }),
    //       ...(params.dataFim && { lte: params.dataFim })
    //     }
    //   },
    //   orderBy: { createdAt: 'desc' },
    //   take: params.limite || 100
    // })

    // return historico

    // Mock para teste
    return []
  } catch (error) {
    console.error('Erro ao consultar histórico:', error)
    return []
  }
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function getClientIP(request: Request): string {
  return request.headers.get('x-forwarded-for') ||
         request.headers.get('x-real-ip') ||
         'unknown'
}

// ─── Middleware automático ───────────────────────────────────────────────────

export function comHistorico(
  tipo: HistoricoEntry['tipo'],
  entidadeTipo: string
) {
  return function(target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value

    descriptor.value = async function(...args: any[]) {
      const resultado = await method.apply(this, args)
      
      // Extrair informações do contexto
      const userId = this.userId || args[0]?.userId
      const propertyId = this.propertyId || args[0]?.propertyId
      
      if (userId) {
        await criarHistorico({
          userId,
          propertyId,
          tipo,
          acao: 'UPDATE',
          entidadeId: args[0]?.id || 'unknown',
          entidadeTipo,
          descricao: `${entidadeTipo} atualizado via ${propertyName}`,
          dadosNovos: resultado
        })
      }
      
      return resultado
    }
  }
}

// ─── Exportar histórico para PDF ───────────────────────────────────────────────

export async function exportarHistoricoPDF(params: {
  userId: string
  propertyId?: string
  dataInicio?: Date
  dataFim?: Date
}) {
  const historico = await consultarHistorico(params)
  
  // Lógica de exportação PDF aqui
  // Usar jsPDF ou similar
  
  return {
    filename: `historico_${new Date().toISOString().split('T')[0]}.pdf`,
    data: historico
  }
}

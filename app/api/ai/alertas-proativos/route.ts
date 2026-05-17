import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { groq } from '@/lib/groq'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      select: {
        name: true,
        properties: {
          take: 1,
          select: {
            id: true,
            name: true,
            location: true,
            sizeHectares: true,
            activities: {
              orderBy: { startDate: 'asc' },
              take: 30,
              select: { type: true, description: true, status: true, startDate: true, endDate: true },
            },
            costs: {
              orderBy: { date: 'desc' },
              take: 10,
              select: { amount: true, category: true, date: true, description: true },
            },
            revenues: {
              orderBy: { date: 'desc' },
              take: 10,
              select: { amount: true, category: true, date: true },
            },
            goals: {
              where: { isCompleted: false },
              select: { title: true, type: true, targetValue: true, currentValue: true },
            },
            alerts: {
              where: { read: false },
              orderBy: { createdAt: 'desc' },
              take: 10,
              select: { message: true, type: true, createdAt: true },
            },
          },
        },
      },
    })

    const p = dbUser?.properties[0]
    if (!p) return NextResponse.json({ error: 'Propriedade não encontrada' }, { status: 404 })

    const hoje = new Date()
    const hojeStr = hoje.toISOString().split('T')[0]

    // Identificar atividades atrasadas
    const atrasadas = p.activities.filter(a =>
      a.status === 'PENDING' && new Date(a.startDate) < hoje
    )
    const proximas7dias = p.activities.filter(a => {
      const inicio = new Date(a.startDate)
      const diff = (inicio.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)
      return a.status === 'PENDING' && diff >= 0 && diff <= 7
    })

    const totalCustos = p.costs.reduce((s, c) => s + Number(c.amount), 0)
    const totalReceitas = p.revenues.reduce((s, r) => s + Number(r.amount), 0)
    const resultado = totalReceitas - totalCustos

    const prompt = `Você é um consultor agrícola especializado em gestão de fazendas brasileiras. Analise os dados abaixo e gere alertas proativos prioritários para o produtor agir hoje.

Fazenda: ${p.name}${p.location ? ` — ${p.location}` : ''} | ${p.sizeHectares} ha
Hoje: ${hojeStr}
Produtor: ${dbUser?.name || 'Produtor'}

OPERACIONAL:
- Atividades atrasadas (${atrasadas.length}): ${atrasadas.map(a => `${a.type} (${a.description || ''})`).join(', ') || 'nenhuma'}
- Próximas 7 dias (${proximas7dias.length}): ${proximas7dias.map(a => `${a.type} em ${new Date(a.startDate).toLocaleDateString('pt-BR')}`).join(', ') || 'nenhuma'}
- Total atividades em andamento: ${p.activities.filter(a => a.status === 'IN_PROGRESS').length}

FINANCEIRO:
- Receita: R$${totalReceitas.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
- Custo: R$${totalCustos.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
- Resultado: R$${resultado.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}

METAS EM ABERTO:
${p.goals.map(g => `${g.title}: ${Math.round((Number(g.currentValue) / Number(g.targetValue)) * 100)}% concluído`).join('\n') || 'Nenhuma meta'}

ALERTAS JÁ EXISTENTES NÃO LIDOS:
${p.alerts.map(a => a.message).join('\n') || 'Nenhum'}

Gere de 3 a 6 alertas proativos novos e relevantes (não repetir os já existentes acima). Priorize os mais urgentes.

Responda APENAS com JSON válido, sem markdown:
{
  "alertas": [
    {
      "tipo": "OPERACIONAL|FINANCEIRO|META|CLIMA|SAUDE|MANUTENCAO|OPORTUNIDADE",
      "prioridade": "critica|alta|media|baixa",
      "titulo": "título curto do alerta (max 60 chars)",
      "mensagem": "descrição detalhada com contexto da fazenda (max 150 chars)",
      "acao": "ação imediata recomendada"
    }
  ],
  "resumoSituacao": "avaliação geral da fazenda em 1-2 frases"
}`

    const resultado2 = await groq([{ role: 'user', content: prompt }], 1200)

    let parsed: { alertas: Record<string, string>[]; resumoSituacao: string }
    try {
      const clean = resultado2.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      parsed = JSON.parse(clean)
    } catch {
      return NextResponse.json({ error: 'Não foi possível gerar alertas' })
    }

    // Persistir alertas no banco
    if (parsed.alertas?.length > 0) {
      await prisma.alert.createMany({
        data: parsed.alertas.map(a => ({
          propertyId: p.id,
          type: a.tipo || 'OPERACIONAL',
          message: a.mensagem || a.titulo || 'Alerta gerado por IA',
          read: false,
        })),
        skipDuplicates: true,
      })
    }

    return NextResponse.json({
      ok: true,
      quantidade: parsed.alertas?.length ?? 0,
      alertas: parsed.alertas,
      resumo: parsed.resumoSituacao,
    })
  } catch (e: any) {
    console.error('[AlertasProativos Error]', e?.message)
    return NextResponse.json({ error: e?.message ?? 'Erro interno' }, { status: 500 })
  }
}

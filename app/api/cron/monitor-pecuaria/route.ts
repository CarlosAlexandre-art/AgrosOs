import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendPushToUser } from '@/lib/push'

export const maxDuration = 60

// Evita criar alertas duplicados — verifica se já existe um alerta não lido do mesmo tipo/propriedade
async function alertaJaExiste(propertyId: string, type: string, keyword: string): Promise<boolean> {
  const existing = await prisma.alert.findFirst({
    where: { propertyId, type, isRead: false, message: { contains: keyword } },
  })
  return !!existing
}

async function criarAlerta(propertyId: string, userId: string, type: string, message: string, isPush: boolean, plan: string) {
  await prisma.alert.create({ data: { propertyId, type, message } })
  // Push apenas para enterprise
  if (isPush && plan === 'enterprise') {
    await sendPushToUser(userId, {
      title: getTituloPorTipo(type),
      body: message,
      url: getUrlPorTipo(type),
    }).catch(() => {})
  }
}

function getTituloPorTipo(type: string): string {
  const map: Record<string, string> = {
    AGROVET: '🐄 AgroVet — Ação Necessária',
    NUTRIBOV: '🌿 NutriBov — Pastagem/Nutrição',
    AGROGRADE: '🥛 AgroGrade — Produção/Qualidade',
    AGROTRADE: '💹 AgroTrade — Financeiro Pecuário',
  }
  return map[type] ?? '📋 SmartAgroOS — Alerta'
}

function getUrlPorTipo(type: string): string {
  const map: Record<string, string> = {
    AGROVET: '/dashboard/saude-reproducao',
    NUTRIBOV: '/dashboard/nutricao-pastagem',
    AGROGRADE: '/dashboard/producao-qualidade',
    AGROTRADE: '/dashboard/financeiro-pecuario',
  }
  return map[type] ?? '/dashboard'
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const users = await prisma.user.findMany({
    where: { properties: { some: {} } },
    select: { id: true, plan: true, properties: { select: { id: true } } },
  })

  let totalAlertas = 0

  for (const user of users) {
    for (const property of user.properties) {
      const pid = property.id
      const uid = user.id
      const plan = user.plan || 'starter'

      try {
        // ── AGROVET: Vacinas vencendo em 7 dias ──
        const vacinasUrgentes = await (prisma as any).protocoloVacinal.findMany({
          where: {
            propertyId: pid,
            proximaAplicacao: {
              gte: new Date(),
              lte: new Date(Date.now() + 7 * 86400000),
            },
          },
          take: 5,
        })
        for (const v of vacinasUrgentes) {
          const dias = Math.ceil((new Date(v.proximaAplicacao).getTime() - Date.now()) / 86400000)
          const keyword = v.nome || v.doenca
          if (!(await alertaJaExiste(pid, 'AGROVET', keyword))) {
            await criarAlerta(pid, uid, 'AGROVET', `Protocolo "${keyword}" vence em ${dias} dia(s) — agende a vacinação`, true, plan)
            totalAlertas++
          }
        }

        // ── AGROVET: Partos previstos nos próximos 14 dias ──
        const partosProximos = await (prisma as any).statusReprodutivo.findMany({
          where: {
            animal: { propertyId: pid },
            statusPrenhez: 'POSITIVA',
            dataPrevistoParto: {
              gte: new Date(),
              lte: new Date(Date.now() + 14 * 86400000),
            },
          },
          include: { animal: { select: { identificacao: true } } },
          take: 5,
        })
        for (const s of partosProximos) {
          const dias = Math.ceil((new Date(s.dataPrevistoParto).getTime() - Date.now()) / 86400000)
          const keyword = s.animal.identificacao
          if (!(await alertaJaExiste(pid, 'AGROVET', keyword))) {
            await criarAlerta(pid, uid, 'AGROVET', `Parto previsto de ${keyword} em ${dias} dia(s) — prepare o manejo`, true, plan)
            totalAlertas++
          }
        }

        // ── NUTRIBOV: Pastagem ocupada além do ciclo ──
        const pastagensVencidas = await (prisma as any).pastagem.findMany({
          where: {
            propertyId: pid,
            status: 'OCUPADA',
          },
          include: {
            rotacoes: { where: { saida: null }, orderBy: { entrada: 'asc' }, take: 1 },
          },
        })
        for (const p of pastagensVencidas) {
          const rotacao = p.rotacoes?.[0]
          if (!rotacao) continue
          const ciclo = Number(p.cicloDescanso ?? 21)
          const diasOcupada = Math.ceil((Date.now() - new Date(rotacao.entrada).getTime()) / 86400000)
          if (diasOcupada >= ciclo) {
            if (!(await alertaJaExiste(pid, 'NUTRIBOV', p.nome))) {
              await criarAlerta(pid, uid, 'NUTRIBOV', `Pastagem "${p.nome}" está ocupada há ${diasOcupada} dias — faça a rotação`, true, plan)
              totalAlertas++
            }
          }
        }

        // ── AGROGRADE: CCS alto nos últimos 3 dias ──
        const ccsAltos = await (prisma as any).producaoLeite.findMany({
          where: {
            animal: { propertyId: pid },
            ccs: { gt: 400000 },
            data: { gte: new Date(Date.now() - 3 * 86400000) },
          },
          include: { animal: { select: { identificacao: true } } },
          take: 3,
        })
        if (ccsAltos.length > 0) {
          if (!(await alertaJaExiste(pid, 'AGROGRADE', 'CCS'))) {
            const nomes = [...new Set(ccsAltos.map((r: any) => r.animal.identificacao))].join(', ')
            await criarAlerta(pid, uid, 'AGROGRADE', `CCS elevado (>${(400000 / 1000).toFixed(0)}k) detectado em: ${nomes} — risco de mastite`, true, plan)
            totalAlertas++
          }
        }

        // ── AGROGRADE: Animais prontos para abate ──
        const aptosAbate = await (prisma as any).animal.findMany({
          where: {
            propertyId: pid,
            ativo: true,
            pesoAtual: { gte: 480 },
            dataNascimento: { lte: new Date(Date.now() - 30 * 30 * 86400000) },
          },
          select: { id: true },
          take: 1,
        })
        if (aptosAbate.length > 0) {
          if (!(await alertaJaExiste(pid, 'AGROGRADE', 'prontos para abate'))) {
            await criarAlerta(pid, uid, 'AGROGRADE', `${aptosAbate.length} animal(is) ≥480kg e ≥30 meses — prontos para abate`, false, plan)
            totalAlertas++
          }
        }

        // ── AGROTRADE: Sem valuation há 30 dias (só se houver animais) ──
        const temAnimais = await (prisma as any).animal.count({ where: { propertyId: pid, ativo: true } })
        if (temAnimais > 0) {
          const ultimoValuation = await (prisma as any).valuationRebanho.findFirst({
            where: { propertyId: pid },
            orderBy: { data: 'desc' },
          })
          if (!ultimoValuation || Date.now() - new Date(ultimoValuation.data).getTime() > 30 * 86400000) {
            if (!(await alertaJaExiste(pid, 'AGROTRADE', 'valoração'))) {
              await criarAlerta(pid, uid, 'AGROTRADE', 'Valoração do rebanho desatualizada — faça o valuation para ter o patrimônio real', false, plan)
              totalAlertas++
            }
          }
        }

        // ── AGROTRADE: Margem negativa ──
        const transacoes30d = await (prisma as any).transacaoGado.findMany({
          where: {
            propertyId: pid,
            data: { gte: new Date(Date.now() - 30 * 86400000) },
          },
        })
        const receitas = transacoes30d.filter((t: any) => t.tipo === 'VENDA' || t.tipo === 'LEILAO_VENDA').reduce((acc: number, t: any) => acc + Number(t.valorTotal ?? 0), 0)
        const custos = transacoes30d.filter((t: any) => !['VENDA', 'LEILAO_VENDA'].includes(t.tipo)).reduce((acc: number, t: any) => acc + Number(t.valorTotal ?? 0), 0)
        if (receitas > 0 && custos > receitas) {
          if (!(await alertaJaExiste(pid, 'AGROTRADE', 'margem negativa'))) {
            await criarAlerta(pid, uid, 'AGROTRADE', `Fluxo pecuário negativo nos últimos 30 dias — custos R$${custos.toFixed(0)} superam receitas R$${receitas.toFixed(0)}`, true, plan)
            totalAlertas++
          }
        }

      } catch (err) {
        // Propriedade sem tabelas de pecuária ainda — ignora
      }
    }
  }

  return NextResponse.json({ ok: true, alertasCriados: totalAlertas, propriedadesMonitoradas: users.reduce((a, u) => a + u.properties.length, 0) })
}

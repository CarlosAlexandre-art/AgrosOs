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
        properties: {
          take: 1,
          select: {
            id: true,
            name: true,
            lotes: {
              where: { status: 'ATIVO' },
              select: {
                id: true,
                nome: true,
                cabecas: true,
                racaPredominante: true,
                idadeMediaMeses: true,
                pesoMedioEntrada: true,
                objetivo: true,
                pesoMetaAbate: true,
                dataEntrada: true,
                dataSaidaPrevista: true,
                custoTotal: true,
                registrosDiarios: {
                  orderBy: { data: 'desc' },
                  take: 7,
                  select: {
                    data: true,
                    pesoMedio: true,
                    consumoRacaoKg: true,
                    consumoAguaL: true,
                    mortalidade: true,
                    medicacao: true,
                    custoRacaoDia: true,
                    custoDia: true,
                    observacoes: true,
                  },
                },
                planosNutricionais: {
                  where: { ativo: true },
                  take: 1,
                  select: { racaoKgDia: true, proteinaBruta: true, custoKgRacao: true },
                },
                animais: {
                  where: { ativo: true },
                  select: {
                    pesoAtual: true,
                    saude: { orderBy: { dataRegistro: 'desc' }, take: 1, select: { tipo: true, descricao: true, dataRegistro: true } },
                  },
                },
              },
            },
          },
        },
      },
    })

    const property = dbUser?.properties[0]
    if (!property) return NextResponse.json({ error: 'Propriedade não encontrada' }, { status: 404 })

    const lotes = property.lotes
    if (!lotes.length) return NextResponse.json({ error: 'Nenhum lote ativo encontrado' }, { status: 404 })

    const hoje = new Date()

    const dadosLotes = lotes.map(lote => {
      const dias = Math.floor((hoje.getTime() - new Date(lote.dataEntrada).getTime()) / (1000 * 60 * 60 * 24))
      const registros = lote.registrosDiarios
      const ultimoReg = registros[0]
      const pesoInicial = lote.pesoMedioEntrada
      const pesoAtual = ultimoReg?.pesoMedio ?? pesoInicial
      const gmd = dias > 0 ? ((pesoAtual - pesoInicial) / dias).toFixed(3) : '0'
      const consumoTotal = registros.reduce((s, r) => s + (r.consumoRacaoKg ?? 0), 0)
      const mediaDiaria = registros.length > 0 ? (consumoTotal / registros.length).toFixed(1) : '0'
      const mortalidades = registros.reduce((s, r) => s + r.mortalidade, 0)
      const custoDia = ultimoReg?.custoDia ?? (lote.planosNutricionais[0]?.custoKgRacao ?? 0) * (lote.planosNutricionais[0]?.racaoKgDia ?? 0)
      const custoAcumulado = lote.custoTotal
      const ocorrenciasSaude = lote.animais.filter(a => a.saude.length > 0).length

      return {
        nome: lote.nome,
        cabecas: lote.cabecas,
        raca: lote.racaPredominante || 'Não informada',
        idadeMedia: lote.idadeMediaMeses ? `${lote.idadeMediaMeses} meses` : 'não informada',
        diasConfinamento: dias,
        pesoEntrada: `${pesoInicial} kg`,
        pesoAtual: `${pesoAtual} kg`,
        gmd: `${gmd} kg/dia`,
        metaAbate: lote.pesoMetaAbate ? `${lote.pesoMetaAbate} kg` : 'não definida',
        consumoMedioDiario: `${mediaDiaria} kg/animal/dia`,
        mortalidades7dias: mortalidades,
        custoDiarioEstimado: `R$${custoDia.toFixed(2)}/cab/dia`,
        custoAcumulado: `R$${custoAcumulado.toFixed(2)}`,
        animaisComOcorrenciaSaude: ocorrenciasSaude,
        medicacoes7dias: registros.filter(r => r.medicacao).map(r => r.medicacao).join(', ') || 'nenhuma',
        observacoes: registros.filter(r => r.observacoes).map(r => r.observacoes).join(' | ') || '',
      }
    })

    const prompt = `Você é um zootecnista especializado em confinamento bovino brasileiro com 15 anos de experiência em fazendas de engorda.

Analise os dados dos lotes ativos abaixo e gere um Monitor Sanitário completo com semáforo de status para cada lote.

Fazenda: ${property.name}
Hoje: ${hoje.toLocaleDateString('pt-BR')}

DADOS DOS LOTES ATIVOS:
${JSON.stringify(dadosLotes, null, 2)}

Para cada lote, avalie: saúde geral, GMD em relação ao esperado, consumo de ração, mortalidade, custo-benefício e riscos sanitários.

Responda APENAS com JSON válido, sem markdown:
{
  "resumoGeral": "avaliação geral do rebanho em 2-3 frases",
  "lotes": [
    {
      "nome": "nome do lote",
      "semaforo": "verde/amarelo/vermelho",
      "scoreSaude": 0-100,
      "pontosCriticos": ["lista de problemas identificados"],
      "gmdAvaliacao": "abaixo/dentro/acima do esperado para a raça e objetivo",
      "riscoSanitario": "baixo/medio/alto",
      "acoesPrioritarias": ["ações imediatas recomendadas"],
      "previsaoAbate": "estimativa de dias restantes para atingir meta ou 'meta não definida'"
    }
  ],
  "alertasGerais": ["alertas críticos que requerem atenção imediata"],
  "recomendacoesNutricionais": ["ajustes de dieta ou suplementação sugeridos"],
  "custoBeneficio": "avaliação econômica geral e projeção de resultado"
}`

    const resultado = await groq([{ role: 'user', content: prompt }], 2000)

    let analise: Record<string, unknown>
    try {
      const clean = resultado.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      analise = JSON.parse(clean)
    } catch {
      return NextResponse.json({ error: 'Não foi possível estruturar a análise' })
    }

    return NextResponse.json({ ok: true, lotes: dadosLotes.length, analise })
  } catch (e: any) {
    console.error('[MonitorSanitario Error]', e?.message)
    return NextResponse.json({ error: e?.message ?? 'Erro interno' }, { status: 500 })
  }
}

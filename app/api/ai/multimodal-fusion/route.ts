import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { groq } from '@/lib/groq'

export const maxDuration = 60

/**
 * Motor de Fusão Multi-Modal — inspirado na arquitetura TriBE v2 (Meta FAIR)
 *
 * TriBE v2 (github.com/facebookresearch/tribev2) é um modelo foundation multi-modal
 * não disponível para inferência pública. Esta rota implementa o conceito de fusão
 * multi-modal usando os modelos disponíveis no ecossistema Groq/LLaMA:
 *
 * - Modalidade TEXTO:     LLaMA 3.3 70B (dados estruturados da fazenda)
 * - Modalidade VISÃO:     LLaMA 4 Scout Vision (imagens agronômicas)
 * - Modalidade ESTRUTURAL: Dados Prisma (financeiro, operacional, sanitário)
 * - FUSÃO:                LLaMA 3.3 70B sintetiza todas as modalidades
 */

const VISION_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct'
const GROQ_API     = 'https://api.groq.com/openai/v1/chat/completions'

async function analisarImagemModal(
  imageBase64: string,
  mime: string,
  tipoImagem: string,
  apiKey: string,
): Promise<string> {
  const prompts: Record<string, string> = {
    campo:     'Analise esta imagem de campo agrícola. Descreva condições da lavoura, solo, vegetação e qualquer anomalia visível. 3 frases.',
    animal:    'Analise este animal. Descreva condição corporal, comportamento, sinais de saúde ou doença visíveis. 3 frases.',
    pastagem:  'Analise esta pastagem. Descreva cobertura vegetal, qualidade do pasto, sinais de degradação e estágio de crescimento. 3 frases.',
    documento: 'Analise este documento. Extraia as informações mais relevantes visíveis (valores, datas, dados cadastrais). 3 frases.',
    equipamento: 'Analise este equipamento agrícola. Descreva tipo, condição, possíveis defeitos ou manutenção necessária. 3 frases.',
  }
  const prompt = prompts[tipoImagem] ?? prompts.campo

  const resp = await fetch(GROQ_API, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: VISION_MODEL,
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: `data:${mime};base64,${imageBase64}` } },
        ],
      }],
      max_tokens: 250,
      temperature: 0.2,
    }),
    signal: AbortSignal.timeout(20000),
  })

  if (!resp.ok) return `[análise visual indisponível — ${resp.status}]`
  const data = await resp.json()
  return data.choices?.[0]?.message?.content ?? '[sem descrição]'
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const form = await req.formData()
    const pergunta   = (form.get('pergunta') as string) ?? ''
    const imagens    = form.getAll('imagens') as File[]
    const tiposImg   = ((form.get('tipos') as string) ?? '').split(',').map(s => s.trim())
    const incluirDados = form.get('dados') !== 'false'

    if (!pergunta) return NextResponse.json({ error: 'Campo "pergunta" obrigatório' }, { status: 400 })

    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'GROQ_API_KEY não configurada' }, { status: 500 })

    // ── Modalidade 1: Dados estruturais do banco ──────────────────────────────
    let modalidadeEstruturada = ''
    if (incluirDados) {
      const dbUser = await prisma.user.findUnique({
        where: { supabaseId: user.id },
        select: {
          name: true,
          properties: {
            take: 1,
            select: {
              name: true,
              location: true,
              sizeHectares: true,
              activities: {
                orderBy: { startDate: 'desc' },
                take: 5,
                select: { type: true, status: true },
              },
              costs: {
                orderBy: { date: 'desc' },
                take: 3,
                select: { amount: true, category: true },
              },
              revenues: {
                orderBy: { date: 'desc' },
                take: 3,
                select: { amount: true, category: true },
              },
            },
          },
        },
      })

      const p = dbUser?.properties[0]
      if (p) {
        const receita = p.revenues.reduce((s, r) => s + Number(r.amount), 0)
        const custo   = p.costs.reduce((s, c) => s + Number(c.amount), 0)
        modalidadeEstruturada = `DADOS DA FAZENDA (modalidade estrutural):
Produtor: ${dbUser?.name} | Fazenda: ${p.name}${p.location ? ` — ${p.location}` : ''} | ${p.sizeHectares ?? '?'} ha
Receita recente: R$${receita.toFixed(0)} | Custo: R$${custo.toFixed(0)} | Resultado: R$${(receita - custo).toFixed(0)}
Atividades recentes: ${p.activities.slice(0, 3).map(a => `${a.type}(${a.status})`).join(', ')}`
      }
    }

    // ── Modalidade 2: Visão computacional (paralela) ──────────────────────────
    let modalidadeVisual = ''
    if (imagens.length > 0) {
      const imageFiles = imagens.slice(0, 3).filter(f => f.type.startsWith('image/'))
      const analises = await Promise.all(
        imageFiles.map(async (img, i) => {
          const bytes = await img.arrayBuffer()
          const b64   = Buffer.from(bytes).toString('base64')
          const tipo  = tiposImg[i] ?? 'campo'
          const desc  = await analisarImagemModal(b64, img.type, tipo, apiKey)
          return `Imagem ${i + 1} (${tipo}): ${desc}`
        })
      )
      modalidadeVisual = `ANÁLISE VISUAL (modalidade visão):\n${analises.join('\n')}`
    }

    // ── Fusão de modalidades: síntese final ──────────────────────────────────
    const promptFusao = `Você é um assistente agrícola de alta precisão que integra múltiplas fontes de informação para dar respostas completas a produtores rurais brasileiros.

PERGUNTA DO PRODUTOR: ${pergunta}

${modalidadeEstruturada}
${modalidadeVisual}

Com base em TODAS as informações disponíveis (dados estruturais, análise visual e conhecimento agronômico), responda de forma integrada e precisa à pergunta do produtor. Responda em português brasileiro. Máximo 4 parágrafos.`

    const resposta = await groq([{ role: 'user', content: promptFusao }], 600)

    return NextResponse.json({
      ok: true,
      pergunta,
      modalidadesUtilizadas: [
        'texto (LLaMA 3.3 70B)',
        ...(modalidadeEstruturada ? ['estrutural (Prisma DB)'] : []),
        ...(modalidadeVisual ? [`visão (LLaMA 4 Scout — ${imagens.length} imagem(ns))`] : []),
      ],
      resposta,
      arquitetura: 'Multi-Modal Fusion — inspirado em TriBE v2 (Meta FAIR) — github.com/facebookresearch/tribev2',
    })
  } catch (e: any) {
    console.error('[MultimodalFusion Error]', e?.message)
    return NextResponse.json({ error: e?.message ?? 'Erro interno' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { groq } from '@/lib/groq'

export const maxDuration = 60

const GROQ_VISION_URL = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_VISION_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct'

async function analisarImagem(base64: string, mimeType: string, prompt: string): Promise<string> {
  const res = await fetch(GROQ_VISION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_VISION_MODEL,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } },
            { type: 'text', text: prompt },
          ],
        },
      ],
      max_tokens: 2048,
      temperature: 0.3,
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Vision API error: ${err}`)
  }
  const data = await res.json()
  return data.choices[0].message.content as string
}

async function extrairTextoPDF(buffer: Buffer): Promise<string> {
  // pdfjs-dist (usado por pdf-parse) chama DOMMatrix que não existe no Node.js
  if (typeof globalThis.DOMMatrix === 'undefined') {
    ;(globalThis as any).DOMMatrix = class DOMMatrix {
      a=1;b=0;c=0;d=1;e=0;f=0
      m11=1;m12=0;m13=0;m14=0;m21=0;m22=1;m23=0;m24=0
      m31=0;m32=0;m33=1;m34=0;m41=0;m42=0;m43=0;m44=1
      is2D=true;isIdentity=true
      multiply() { return this }
      translate() { return this }
      scale() { return this }
      rotate() { return this }
      rotateAxisAngle() { return this }
      skewX() { return this }
      skewY() { return this }
      flipX() { return this }
      flipY() { return this }
      inverse() { return this }
      transformPoint() { return { x: 0, y: 0, z: 0, w: 1 } }
      toFloat32Array() { return new Float32Array(16) }
      toFloat64Array() { return new Float64Array(16) }
      toString() { return 'matrix(1, 0, 0, 1, 0, 0)' }
    }
  }
  const pdfParse = (await import('pdf-parse')).default
  const result = await pdfParse(buffer)
  return result.text
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const formData = await req.formData()
    const file = formData.get('documento') as File | null
    if (!file) return NextResponse.json({ error: 'Arquivo obrigatório' }, { status: 400 })

    const tipoDocumento = (formData.get('tipo') as string) || 'auto'
    const mimeType = file.type
    const buffer = Buffer.from(await file.arrayBuffer())

    const promptExtracao = `Você é um especialista em documentos do agronegócio brasileiro. Analise este documento e extraia todas as informações relevantes em JSON estruturado.

Identifique o tipo do documento (GTA, Nota Fiscal, Laudo Veterinário, Contrato, Receituário Agronômico, Boletim Meteorológico, Análise de Solo, Outro) e retorne:

{
  "tipoDocumento": "tipo identificado",
  "resumo": "resumo do documento em 2-3 frases",
  "dadosPrincipais": {
    // campos relevantes conforme o tipo:
    // GTA: numero, emitente, destinatario, animais, especie, quantidade, origem, destino, dataEmissao, dataValidade
    // Nota Fiscal: numero, emitente, destinatario, itens (array com descricao, quantidade, valor), total, dataEmissao
    // Laudo Veterinário: animal, proprietario, diagnostico, tratamento, medicamentos, dataConsulta, veterinario, crmv
    // Análise de Solo: propriedade, talhao, ph, fosforo, potassio, materia_organica, recomendacoes, data
    // Receituário: produto, cultura, praga, dose, carencia, tecnico, crea, data
    // Outros: campos pertinentes ao documento
  },
  "alertas": ["lista de itens que requerem atenção (vencimentos, irregularidades, etc)"],
  "acoesSugeridas": ["lista de ações recomendadas com base no documento"],
  "confianca": "alta/media/baixa"
}

Responda APENAS com JSON válido, sem markdown, sem explicação.`

    let textoExtraido: string | null = null
    let resultadoIA: string

    if (mimeType === 'application/pdf') {
      textoExtraido = await extrairTextoPDF(buffer)
      if (!textoExtraido?.trim()) {
        return NextResponse.json({ error: 'Não foi possível extrair texto do PDF' }, { status: 422 })
      }
      resultadoIA = await groq([
        { role: 'user', content: `${promptExtracao}\n\nTexto do documento:\n${textoExtraido.slice(0, 8000)}` },
      ], 2048)
    } else if (mimeType.startsWith('image/')) {
      const base64 = buffer.toString('base64')
      resultadoIA = await analisarImagem(base64, mimeType, promptExtracao)
    } else {
      return NextResponse.json({ error: 'Formato não suportado. Envie PDF ou imagem (JPG, PNG, WEBP)' }, { status: 400 })
    }

    let dados: Record<string, unknown>
    try {
      const clean = resultadoIA.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      dados = JSON.parse(clean)
    } catch {
      return NextResponse.json({ error: 'Não foi possível estruturar os dados do documento', textoExtraido })
    }

    return NextResponse.json({
      ok: true,
      nomeArquivo: file.name,
      tamanho: file.size,
      mimeType,
      dados,
    })
  } catch (e: any) {
    console.error('[AnalisarDocumento Error]', e?.message)
    return NextResponse.json({ error: e?.message ?? 'Erro interno' }, { status: 500 })
  }
}

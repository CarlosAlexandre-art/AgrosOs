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

function decodePDFString(s: string): string {
  return s
    .replace(/\\(\d{3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 8)))
    .replace(/\\n/g, '\n').replace(/\\r/g, '\r').replace(/\\t/g, '\t')
    .replace(/\\\(/g, '(').replace(/\\\)/g, ')').replace(/\\\\/g, '\\')
}

// Extração pura em Node.js via zlib — sem pdfjs-dist, sem workers, sem browser APIs.
// Funciona para PDFs com texto embutido (gerados por computador), não PDFs escaneados.
async function extrairTextoPDF(buffer: Buffer): Promise<string> {
  const { inflate, inflateRaw } = await import('zlib')
  const { promisify } = await import('util')
  const tryInflate = promisify(inflate)
  const tryInflateRaw = promisify(inflateRaw)

  const pdfStr = buffer.toString('binary')
  const texts: string[] = []

  const streamRe = /stream\r?\n([\s\S]*?)\r?\nendstream/g
  let m: RegExpExecArray | null

  while ((m = streamRe.exec(pdfStr)) !== null) {
    const raw = Buffer.from(m[1], 'binary')
    let content = m[1]

    // Tenta FlateDecode (compressão padrão em PDFs modernos)
    for (const fn of [
      () => tryInflate(raw),
      () => tryInflateRaw(raw),
      () => tryInflate(raw.slice(2)),
      () => tryInflateRaw(raw.slice(2)),
    ]) {
      try { content = (await fn()).toString('binary'); break } catch { /* tenta próximo */ }
    }

    // Extrai texto dos blocos BT...ET (Text Object)
    const btEtRe = /BT\b([\s\S]*?)\bET\b/g
    let bt: RegExpExecArray | null
    while ((bt = btEtRe.exec(content)) !== null) {
      const block = bt[1]
      const parts: string[] = []

      // (string) Tj  ou  (string) '
      const tjRe = /\(([^)\\]*(?:\\.[^)\\]*)*)\)\s*(?:Tj|'|")/g
      let tj: RegExpExecArray | null
      while ((tj = tjRe.exec(block)) !== null) parts.push(decodePDFString(tj[1]))

      // [(chunk) -kern (chunk)] TJ
      const TJRe = /\[([\s\S]*?)\]\s*TJ/g
      let TJ: RegExpExecArray | null
      while ((TJ = TJRe.exec(block)) !== null) {
        const chunkRe = /\(([^)\\]*(?:\\.[^)\\]*)*)\)/g
        let ch: RegExpExecArray | null
        while ((ch = chunkRe.exec(TJ[1])) !== null) parts.push(decodePDFString(ch[1]))
      }

      const line = parts.join('').trim()
      if (line) texts.push(line)
    }
  }

  return texts.join('\n').trim()
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

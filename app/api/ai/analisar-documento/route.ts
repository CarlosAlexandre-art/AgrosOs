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

// Decodifica strings hexadecimais do PDF: <hex>
// Suporta Latin-1 (1 byte) e UTF-16BE (2 bytes — usado em CIDFont/extratos bancários)
function decodePDFHexString(hex: string): string {
  const clean = hex.replace(/\s+/g, '')
  if (!clean) return ''
  // UTF-16BE: comprimento múltiplo de 4 e primeiro byte 00 indica plano básico Unicode
  const isUTF16 = clean.length % 4 === 0 && clean.length >= 4 && clean.slice(0, 2) === '00'
  let result = ''
  if (isUTF16) {
    for (let i = 0; i < clean.length; i += 4) {
      const code = parseInt(clean.slice(i, i + 4), 16)
      if (!isNaN(code) && code >= 0x20) result += String.fromCodePoint(code)
    }
  } else {
    for (let i = 0; i < clean.length; i += 2) {
      const code = parseInt(clean.slice(i, i + 2), 16)
      if (!isNaN(code) && code >= 0x20) result += String.fromCharCode(code)
    }
  }
  return result
}

// Extração pura via zlib (Node.js built-in) — sem pdfjs-dist, sem workers, sem browser APIs.
// Suporta strings literais (texto) e hex <hex> — cobre PDFs com texto embutido gerados por computador.
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
      const tjLitRe = /\(([^)\\]*(?:\\.[^)\\]*)*)\)\s*(?:Tj|'|")/g
      let tj: RegExpExecArray | null
      while ((tj = tjLitRe.exec(block)) !== null) parts.push(decodePDFString(tj[1]))

      // <hex> Tj  ou  <hex> '  — comum em CIDFont (extratos bancários, docs gov)
      const tjHexRe = /<([0-9a-fA-F\s]+)>\s*(?:Tj|'|")/g
      let hj: RegExpExecArray | null
      while ((hj = tjHexRe.exec(block)) !== null) {
        const dec = decodePDFHexString(hj[1])
        if (dec.trim()) parts.push(dec)
      }

      // [(chunk) -kern <hex> (chunk)] TJ — array misto de literais e hex
      const TJRe = /\[([\s\S]*?)\]\s*TJ/g
      let TJ: RegExpExecArray | null
      while ((TJ = TJRe.exec(block)) !== null) {
        const inner = TJ[1]
        const litRe = /\(([^)\\]*(?:\\.[^)\\]*)*)\)/g
        let lit: RegExpExecArray | null
        while ((lit = litRe.exec(inner)) !== null) parts.push(decodePDFString(lit[1]))

        const hexRe = /<([0-9a-fA-F\s]+)>/g
        let hx: RegExpExecArray | null
        while ((hx = hexRe.exec(inner)) !== null) {
          const dec = decodePDFHexString(hx[1])
          if (dec.trim()) parts.push(dec)
        }
      }

      const line = parts.join('').trim()
      if (line) texts.push(line)
    }
  }

  return texts.join('\n').trim()
}

const PROMPT_EXTRACAO = `Você é um especialista em documentos do agronegócio brasileiro. Analise este documento e extraia todas as informações relevantes em JSON estruturado.

Identifique o tipo do documento (GTA, Nota Fiscal, Laudo Veterinário, Contrato, Receituário Agronômico, Boletim Meteorológico, Análise de Solo, Extrato, Outro) e retorne:

{"tipoDocumento":"tipo identificado","resumo":"resumo em 2-3 frases","dadosPrincipais":{},"alertas":[],"acoesSugeridas":[],"confianca":"alta"}

Responda APENAS com JSON válido, sem markdown, sem explicação.`

async function processarDocumento(req: NextRequest): Promise<NextResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('documento') as File | null
  if (!file) return NextResponse.json({ error: 'Arquivo obrigatório' }, { status: 400 })

  const mimeType = file.type
  const buffer = Buffer.from(await file.arrayBuffer())

  let textoExtraido: string | null = null
  let resultadoIA: string

  if (mimeType === 'application/pdf') {
    textoExtraido = await extrairTextoPDF(buffer)
    if (!textoExtraido?.trim()) {
      return NextResponse.json({ error: 'Não foi possível extrair texto do PDF. Tente enviar como imagem.' }, { status: 422 })
    }
    // Força Groq (não NVIDIA NIM) e modelo rápido para manter dentro do timeout
    resultadoIA = await groq([
      { role: 'user', content: `${PROMPT_EXTRACAO}\n\nTexto do documento:\n${textoExtraido.slice(0, 4000)}` },
    ], 1024, 'llama-3.3-70b-versatile')
  } else if (mimeType.startsWith('image/')) {
    const base64 = buffer.toString('base64')
    resultadoIA = await analisarImagem(base64, mimeType, PROMPT_EXTRACAO)
  } else {
    return NextResponse.json({ error: 'Formato não suportado. Envie PDF ou imagem (JPG, PNG, WEBP)' }, { status: 400 })
  }

  let dados: Record<string, unknown>
  try {
    const clean = resultadoIA.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const jsonMatch = clean.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('sem JSON')
    dados = JSON.parse(jsonMatch[0])
  } catch {
    return NextResponse.json({ error: 'Não foi possível estruturar os dados do documento', textoExtraido })
  }

  return NextResponse.json({ ok: true, nomeArquivo: file.name, tamanho: file.size, mimeType, dados })
}

export async function POST(req: NextRequest) {
  const timeout = new Promise<NextResponse>(resolve =>
    setTimeout(() => resolve(NextResponse.json({ error: 'Análise demorou demais. Tente novamente.' })), 50000)
  )
  try {
    return await Promise.race([processarDocumento(req), timeout])
  } catch (e: any) {
    console.error('[AnalisarDocumento Error]', e?.message)
    return NextResponse.json({ error: e?.message ?? 'Erro interno' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { groqStream, Msg } from '@/lib/groq'

export const maxDuration = 60

// Usa Ollama local se OLLAMA_URL estiver configurado, senão fallback para Groq
async function ollamaStream(messages: Msg[], systemPrompt: string): Promise<ReadableStream<Uint8Array>> {
  const ollamaUrl = process.env.OLLAMA_URL // ex: http://localhost:11434
  const ollamaModel = process.env.OLLAMA_MODEL ?? 'llama3.2:3b' // modelo leve padrão

  const body = JSON.stringify({
    model: ollamaModel,
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages,
    ],
    stream: true,
    options: { num_predict: 800, temperature: 0.7 },
  })

  const res = await fetch(`${ollamaUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  })

  if (!res.ok || !res.body) throw new Error(`Ollama retornou ${res.status}`)

  // Converte o formato NDJSON do Ollama para SSE compatível com o frontend
  const reader = res.body.getReader()
  const encoder = new TextEncoder()

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      while (true) {
        const { done, value } = await reader.read()
        if (done) {
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
          break
        }
        const text = new TextDecoder().decode(value)
        const lines = text.split('\n').filter(l => l.trim())
        for (const line of lines) {
          try {
            const parsed = JSON.parse(line)
            const chunk = parsed?.message?.content ?? ''
            if (chunk) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ choices: [{ delta: { content: chunk } }] })}\n\n`))
            }
            if (parsed?.done) {
              controller.enqueue(encoder.encode('data: [DONE]\n\n'))
              controller.close()
              return
            }
          } catch { /* linha parcial, ignorar */ }
        }
      }
    },
  })
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return new Response('Não autenticado', { status: 401 })

    const { messages }: { messages: Msg[] } = await req.json()

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
              take: 10,
              select: { type: true, status: true, startDate: true },
            },
            costs: {
              orderBy: { date: 'desc' },
              take: 5,
              select: { amount: true, category: true, date: true },
            },
            revenues: {
              orderBy: { date: 'desc' },
              take: 5,
              select: { amount: true, category: true, date: true },
            },
          },
        },
      },
    })

    const p = dbUser?.properties[0]
    if (!p) return new Response('Propriedade não encontrada', { status: 404 })

    const hoje = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

    const receitaTotal = p.revenues.reduce((s, r) => s + Number(r.amount), 0)
    const custoTotal   = p.costs.reduce((s, c) => s + Number(c.amount), 0)
    const atrasadas    = p.activities.filter(a => a.status === 'LATE')
    const andamento    = p.activities.filter(a => a.status === 'IN_PROGRESS')

    const systemPrompt = `Você é o AgroGPT Offline, copiloto agrícola do SmartAgroOS. Responda SEMPRE em português brasileiro. Seja direto e prático. Máximo 4 parágrafos.

PRODUTOR: ${dbUser?.name} | Hoje: ${hoje}
FAZENDA: ${p.name}${p.location ? ` | ${p.location}` : ''} | ${p.sizeHectares ? p.sizeHectares + ' ha' : 'área não informada'}
FINANCEIRO: Receita R$${receitaTotal.toFixed(0)} | Custo R$${custoTotal.toFixed(0)} | Resultado ${(receitaTotal - custoTotal) >= 0 ? '+' : ''}R$${(receitaTotal - custoTotal).toFixed(0)}
OPERACIONAL: ${andamento.length} em andamento${atrasadas.length > 0 ? ` | ⚠️ ${atrasadas.length} atrasadas: ${atrasadas.slice(0, 3).map(a => a.type).join(', ')}` : ''}`

    const ollamaUrl = process.env.OLLAMA_URL
    const modoUsado = ollamaUrl ? 'ollama' : 'groq'

    let stream: ReadableStream<Uint8Array>
    if (ollamaUrl) {
      stream = await ollamaStream(messages, systemPrompt)
    } else {
      stream = await groqStream([
        { role: 'system', content: systemPrompt },
        ...messages,
      ])
    }

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-AI-Mode': modoUsado,
        'X-AI-Model': ollamaUrl ? (process.env.OLLAMA_MODEL ?? 'llama3.2:3b') : 'llama-3.3-70b-versatile',
      },
    })
  } catch (e: any) {
    console.error('[AgroGPTOffline Error]', e?.message)
    return new Response(JSON.stringify({ error: e?.message ?? 'Erro interno' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    })
  }
}

export async function GET() {
  const ollamaUrl = process.env.OLLAMA_URL
  const ollamaModel = process.env.OLLAMA_MODEL ?? 'llama3.2:3b'

  let ollamaStatus = 'não configurado'
  if (ollamaUrl) {
    try {
      const res = await fetch(`${ollamaUrl}/api/tags`, { signal: AbortSignal.timeout(2000) })
      if (res.ok) {
        const data = await res.json()
        const models = data.models?.map((m: any) => m.name) ?? []
        ollamaStatus = `online (${models.length} modelos: ${models.slice(0, 3).join(', ')})`
      } else {
        ollamaStatus = `erro ${res.status}`
      }
    } catch {
      ollamaStatus = 'inacessível (Ollama iniciado?)'
    }
  }

  return NextResponse.json({
    modo: ollamaUrl ? 'ollama_local' : 'groq_cloud',
    ollama: { url: ollamaUrl ?? null, model: ollamaModel, status: ollamaStatus },
    groq: { modelo: 'llama-3.3-70b-versatile', status: 'fallback ativo' },
    instrucoes: ollamaUrl
      ? `Usando Ollama local em ${ollamaUrl} com modelo ${ollamaModel}`
      : 'Para modo offline: defina OLLAMA_URL=http://localhost:11434 e OLLAMA_MODEL=llama3.2:3b no .env',
  })
}

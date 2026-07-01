const NIM_URL    = 'https://integrate.api.nvidia.com/v1/chat/completions'
const NIM_MODEL  = 'meta/llama-3.3-70b-instruct'
const GROQ_URL   = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL = 'llama-3.3-70b-versatile'
const GROQ_FALLBACK = 'llama-3.1-8b-instant'
const TIMEOUT_MS = 25_000 // 25 s — dentro do limite de 30 s do Vercel free

export type Msg = { role: 'system' | 'user' | 'assistant'; content: string }

async function callGroq(model: string, messages: Msg[], maxTokens: number): Promise<string> {
  const key = process.env.GROQ_API_KEY
  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model, messages, temperature: 0.7, max_tokens: maxTokens }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })
  if (!res.ok) {
    const txt = await res.text()
    if (res.status === 429) {
      // Rate limit no modelo grande → tenta modelo menor
      const r2 = await fetch(GROQ_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
        body: JSON.stringify({ model: GROQ_FALLBACK, messages, temperature: 0.7, max_tokens: maxTokens }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      })
      if (!r2.ok) throw new Error(`LLM ${r2.status}: ${await r2.text()}`)
      const b2 = await r2.text()
      let d2: any
      try { d2 = JSON.parse(b2) } catch { throw new Error('IA indisponível temporariamente') }
      return (d2.choices?.[0]?.message?.content ?? '') as string
    }
    throw new Error(`LLM ${res.status}: ${txt}`)
  }
  const body = await res.text()
  let data: any
  try { data = JSON.parse(body) } catch { throw new Error('IA indisponível temporariamente') }
  return (data.choices?.[0]?.message?.content ?? '') as string
}

async function callNim(messages: Msg[], maxTokens: number): Promise<string> {
  const key = process.env.NVIDIA_API_KEY!
  const res = await fetch(NIM_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: NIM_MODEL, messages, temperature: 0.7, max_tokens: maxTokens }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })
  if (!res.ok) throw new Error(`NIM ${res.status}`)
  const body = await res.text()
  let data: any
  try { data = JSON.parse(body) } catch { throw new Error('NIM resposta inválida') }
  return (data.choices?.[0]?.message?.content ?? '') as string
}

export async function groq(messages: Msg[], maxTokens = 1024, modelOverride?: string): Promise<string> {
  // modelOverride força Groq (nomes de modelo são Groq-específicos)
  if (modelOverride) return callGroq(modelOverride, messages, maxTokens)

  // Tenta NVIDIA NIM se disponível; cai no Groq em qualquer falha
  if (process.env.NVIDIA_API_KEY) {
    try {
      return await callNim(messages, maxTokens)
    } catch (e) {
      console.warn('[groq] NIM falhou, usando Groq como fallback:', (e as Error).message)
    }
  }

  return callGroq(GROQ_MODEL, messages, maxTokens)
}

export async function groqStream(messages: Msg[]): Promise<ReadableStream<Uint8Array>> {
  // Tenta NVIDIA NIM se disponível; cai no Groq em qualquer falha
  if (process.env.NVIDIA_API_KEY) {
    try {
      const res = await fetch(NIM_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.NVIDIA_API_KEY}` },
        body: JSON.stringify({ model: NIM_MODEL, messages, temperature: 0.7, max_tokens: 2048, stream: true }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      })
      if (!res.ok) throw new Error(`NIM stream ${res.status}`)
      return res.body!
    } catch (e) {
      console.warn('[groqStream] NIM falhou, usando Groq como fallback:', (e as Error).message)
    }
  }

  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
    body: JSON.stringify({ model: GROQ_MODEL, messages, temperature: 0.7, max_tokens: 2048, stream: true }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })
  if (!res.ok) throw new Error(`LLM stream ${res.status}`)
  return res.body!
}

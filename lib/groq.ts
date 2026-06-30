const NIM_URL  = 'https://integrate.api.nvidia.com/v1/chat/completions'
const NIM_MODEL  = 'meta/llama-3.3-70b-instruct'
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL = 'llama-3.3-70b-versatile'
const GROQ_FALLBACK = 'llama-3.1-8b-instant'

function provider() {
  if (process.env.NVIDIA_API_KEY) {
    return { url: NIM_URL, model: NIM_MODEL, key: process.env.NVIDIA_API_KEY }
  }
  return { url: GROQ_URL, model: GROQ_MODEL, key: process.env.GROQ_API_KEY }
}

export type Msg = { role: 'system' | 'user' | 'assistant'; content: string }

export async function groq(messages: Msg[], maxTokens = 1024, modelOverride?: string): Promise<string> {
  const p = provider()
  // modelOverride usa sempre Groq (nomes de modelo são Groq-específicos, não NVIDIA NIM)
  const url = modelOverride ? GROQ_URL : p.url
  const key = modelOverride ? process.env.GROQ_API_KEY : p.key
  const model = modelOverride ?? p.model
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model, messages, temperature: 0.7, max_tokens: maxTokens }),
  })
  if (!res.ok) {
    const txt = await res.text()
    // 429 rate limit — fallback para modelo menor com limite 3x maior
    if (res.status === 429 && p.url === GROQ_URL) {
      const r2 = await fetch(GROQ_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${p.key}` },
        body: JSON.stringify({ model: GROQ_FALLBACK, messages, temperature: 0.7, max_tokens: maxTokens }),
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

export async function groqStream(messages: Msg[]): Promise<ReadableStream<Uint8Array>> {
  const p = provider()
  const res = await fetch(p.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${p.key}`,
    },
    body: JSON.stringify({ model: p.model, messages, temperature: 0.7, max_tokens: 2048, stream: true }),
  })
  if (!res.ok) throw new Error(`LLM stream ${res.status}`)
  return res.body!
}

import { NextRequest, NextResponse } from 'next/server'

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL = 'llama-3.3-70b-versatile'
const ADVOGADA_EMAIL = process.env.ORYON_LEGAL_EMAIL ?? 'contato@oryon.ag'
const RESEND_KEY = process.env.RESEND_API_KEY

type Resposta = { pergunta: string; resposta: string }

export async function POST(req: NextRequest) {
  try {
    const { respostas, dadosUsuario } = await req.json() as {
      respostas: Resposta[]
      dadosUsuario?: { nome?: string; email?: string; telefone?: string; cidade?: string; estado?: string }
    }

    const resumoRespostas = respostas.map((r, i) => `P${i + 1}: ${r.pergunta}\nR: ${r.resposta}`).join('\n\n')

    const system = `Você é um especialista em direito rural e patrimonial brasileiro.
Analise as respostas do questionário jurídico de um produtor rural e gere um diagnóstico estruturado em JSON.

IMPORTANTE: Responda SOMENTE com JSON válido, sem texto antes ou depois.

Formato obrigatório:
{
  "score": número de 0 a 100 (quanto menor, mais crítico o risco),
  "nivel": "CRITICO" | "ALTO" | "MODERADO" | "BAIXO",
  "vulnerabilidades": [
    { "tipo": "🔴" | "🟡" | "🟢", "descricao": "string curta" }
  ],
  "recomendacao": "string com a principal recomendação",
  "prioridade": "URGENTE" | "ALTA" | "MEDIA" | "BAIXA",
  "resumo_advogada": "parágrafo curto explicando o caso para a advogada"
}`

    const prompt = `Produtor rural brasileiro respondeu o seguinte questionário jurídico:\n\n${resumoRespostas}\n\nGere o diagnóstico jurídico conforme o formato solicitado.`

    const groqRes = await fetch(GROQ_URL, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [{ role: 'system', content: system }, { role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 800,
      }),
    })

    const groqData = await groqRes.json()
    const raw = groqData.choices?.[0]?.message?.content ?? ''

    let diagnostico
    try {
      const match = raw.match(/\{[\s\S]*\}/)
      diagnostico = JSON.parse(match?.[0] ?? raw)
    } catch {
      diagnostico = {
        score: 45,
        nivel: 'ALTO',
        vulnerabilidades: [
          { tipo: '🔴', descricao: 'Pendências identificadas — análise detalhada necessária' },
        ],
        recomendacao: 'Consultoria jurídica especializada recomendada',
        prioridade: 'ALTA',
        resumo_advogada: 'Cliente com possíveis pendências jurídicas identificadas no diagnóstico inicial.',
      }
    }

    // Envia email para a advogada
    if (RESEND_KEY && dadosUsuario) {
      const vulnHtml = diagnostico.vulnerabilidades
        ?.map((v: { tipo: string; descricao: string }) => `<li>${v.tipo} ${v.descricao}</li>`)
        .join('') ?? ''

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'ORYON Legal <noreply@oryon.ag>',
          to: ADVOGADA_EMAIL,
          subject: `⚖️ Diagnóstico Jurídico — ${dadosUsuario.nome ?? 'Cliente'} · Score ${diagnostico.score}/100`,
          html: `
            <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
              <div style="background:#1e3a5f;color:white;padding:24px;border-radius:12px 12px 0 0">
                <h2 style="margin:0">⚖️ Diagnóstico Jurídico ORYON</h2>
                <p style="margin:4px 0 0;opacity:0.7;font-size:14px">Arquitetura 02 — Lead Qualificado</p>
              </div>
              <div style="background:#f9fafb;padding:24px;border:1px solid #e5e7eb;border-radius:0 0 12px 12px">
                <div style="background:white;border-radius:12px;padding:20px;margin-bottom:16px;border:1px solid #e5e7eb">
                  <h3 style="margin:0 0 12px;font-size:16px">Dados do cliente</h3>
                  <p style="margin:4px 0;font-size:14px"><strong>Nome:</strong> ${dadosUsuario.nome ?? '—'}</p>
                  <p style="margin:4px 0;font-size:14px"><strong>WhatsApp:</strong> <a href="https://wa.me/55${(dadosUsuario.telefone ?? '').replace(/\D/g, '')}">${dadosUsuario.telefone ?? '—'}</a></p>
                  <p style="margin:4px 0;font-size:14px"><strong>Email:</strong> ${dadosUsuario.email ?? '—'}</p>
                  <p style="margin:4px 0;font-size:14px"><strong>Cidade:</strong> ${dadosUsuario.cidade ?? '—'}${dadosUsuario.estado ? ` / ${dadosUsuario.estado}` : ''}</p>
                </div>
                <div style="background:white;border-radius:12px;padding:20px;margin-bottom:16px;border:1px solid #e5e7eb">
                  <h3 style="margin:0 0 4px;font-size:16px">Score Jurídico: <span style="color:${diagnostico.score < 40 ? '#ef4444' : diagnostico.score < 65 ? '#f59e0b' : '#22c55e'}">${diagnostico.score}/100 — ${diagnostico.nivel}</span></h3>
                  <p style="margin:0 0 12px;font-size:13px;color:#6b7280">Prioridade: ${diagnostico.prioridade}</p>
                  <ul style="margin:0;padding:0 0 0 4px;list-style:none;font-size:14px">${vulnHtml}</ul>
                </div>
                <div style="background:white;border-radius:12px;padding:20px;margin-bottom:16px;border:1px solid #e5e7eb">
                  <h3 style="margin:0 0 8px;font-size:14px;color:#6b7280">Resumo para a advogada</h3>
                  <p style="margin:0;font-size:14px;line-height:1.6">${diagnostico.resumo_advogada}</p>
                </div>
                <a href="https://wa.me/55${(dadosUsuario.telefone ?? '').replace(/\D/g, '')}?text=Olá%20${encodeURIComponent(dadosUsuario.nome ?? '')}%2C%20sou%20da%20ORYON%20Legal.%20Analisei%20seu%20diagnóstico%20e%20gostaria%20de%20conversar%20sobre%20como%20podemos%20ajudar."
                   style="display:block;text-align:center;background:#25d366;color:white;padding:14px;border-radius:8px;text-decoration:none;font-weight:700">
                  💬 Responder via WhatsApp
                </a>
              </div>
            </div>
          `,
        }),
      })
    }

    return NextResponse.json({ ok: true, diagnostico })
  } catch (err) {
    console.error('diagnostico error:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

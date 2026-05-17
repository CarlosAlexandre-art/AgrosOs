import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const maxDuration = 60

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const VISION_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const formData = await req.formData()
    const foto = formData.get('foto') as File | null
    const especie = (formData.get('especie') as string) || 'bovino'
    const contexto = (formData.get('contexto') as string) || ''

    if (!foto) return NextResponse.json({ error: 'Foto obrigatória' }, { status: 400 })
    if (!foto.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Apenas imagens são aceitas (JPG, PNG, WEBP)' }, { status: 400 })
    }
    if (foto.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Imagem muito grande. Máximo 10 MB.' }, { status: 400 })
    }

    const buffer = Buffer.from(await foto.arrayBuffer())
    const base64 = buffer.toString('base64')

    const prompt = `Você é um médico veterinário especializado em saúde de animais de produção (bovinos, suínos, ovinos, caprinos, aves) com 20 anos de experiência no campo.

Analise esta fotografia de um ${especie}${contexto ? `. Contexto adicional: ${contexto}` : ''}.

Avalie cuidadosamente os seguintes aspectos visíveis na imagem:
- Condição corporal geral (escore de 1 a 5)
- Mucosas, pelos/penas, postura e mobilidade
- Sinais visíveis de enfermidade (lesões, inchaços, secreções, etc.)
- Estado nutricional e hidratação
- Possíveis parasitoses externas visíveis

Responda APENAS com JSON válido, sem markdown:
{
  "condicaoCorporal": "número de 1 a 5 com descrição",
  "aparenciaGeral": "avaliação objetiva do que é visível na imagem",
  "sinaisClinicosVisiveis": ["lista de sinais observados ou 'Nenhum sinal preocupante identificado'"],
  "hipotesesDiagnosticas": ["possíveis condições com base na imagem (ou 'Aparência dentro da normalidade')"],
  "urgencia": "baixa/media/alta/emergencia",
  "recomendacoes": ["lista de ações recomendadas"],
  "medicamentosComuns": ["se indicado: medicamentos típicos para as hipóteses, com dosagem padrão"],
  "observacoes": "observações adicionais ou limitações da análise visual",
  "confianca": "alta/media/baixa",
  "aviso": "Esta análise é baseada apenas em imagem e não substitui exame clínico presencial de médico veterinário habilitado (CFMV)."
}`

    const res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: VISION_MODEL,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image_url', image_url: { url: `data:${foto.type};base64,${base64}` } },
              { type: 'text', text: prompt },
            ],
          },
        ],
        max_tokens: 1500,
        temperature: 0.3,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('[DiagnosticoAnimal Vision Error]', err)
      return NextResponse.json({ error: 'Erro ao analisar imagem' }, { status: 500 })
    }

    const data = await res.json()
    const raw = data.choices[0].message.content as string

    let diagnostico: Record<string, unknown>
    try {
      const clean = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      diagnostico = JSON.parse(clean)
    } catch {
      return NextResponse.json({ error: 'Não foi possível estruturar o diagnóstico', raw })
    }

    return NextResponse.json({ ok: true, especie, diagnostico })
  } catch (e: any) {
    console.error('[DiagnosticoAnimal Error]', e?.message)
    return NextResponse.json({ error: e?.message ?? 'Erro interno' }, { status: 500 })
  }
}

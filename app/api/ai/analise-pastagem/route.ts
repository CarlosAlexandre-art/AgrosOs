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
    const nomeTalhao = (formData.get('talhao') as string) || ''
    const tipoPastagem = (formData.get('tipo') as string) || ''

    if (!foto) return NextResponse.json({ error: 'Foto obrigatória' }, { status: 400 })
    if (!foto.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Apenas imagens aceitas (JPG, PNG, WEBP)' }, { status: 400 })
    }
    if (foto.size > 12 * 1024 * 1024) {
      return NextResponse.json({ error: 'Imagem muito grande. Máximo 12 MB.' }, { status: 400 })
    }

    const buffer = Buffer.from(await foto.arrayBuffer())
    const base64 = buffer.toString('base64')

    const prompt = `Você é um zootecnista e agrônomo especializado em pastagens tropicais brasileiras (Brachiaria, Panicum, Cynodon, Pennisetum, Andropogon) com foco em sistemas de produção pecuária.

Analise esta imagem de pastagem${nomeTalhao ? ` do talhão "${nomeTalhao}"` : ''}${tipoPastagem ? ` (espécie: ${tipoPastagem})` : ''}.

Avalie detalhadamente:
1. Cobertura vegetal estimada (%)
2. Altura do pasto e estágio fenológico
3. Presença de plantas daninhas (espécies identificáveis)
4. Sinais de degradação (erosão, compactação, superpastejo, subpastejo)
5. Uniformidade da pastagem
6. Sinais de deficiência nutricional (cor, textura)
7. Condições de umidade visíveis
8. Potencial de lotação estimado

Responda APENAS com JSON válido, sem markdown:
{
  "coberturaVegetal": "percentual estimado",
  "alturaPasto": "estimativa em cm",
  "estadio": "vegetativo/crescimento/pastejo/dormencia",
  "qualidade": "excelente/boa/regular/degradada/critica",
  "especiesIdentificadas": ["lista de gramíneas e leguminosas visíveis"],
  "plantasDaninhas": ["espécies invasoras identificadas ou 'Não identificadas'"],
  "sinaisDegradacao": ["lista de problemas observados ou 'Nenhum sinal de degradação'"],
  "deficienciasNutricionais": ["sintomas visíveis de carência nutricional ou 'Sem sinais aparentes'"],
  "lotacaoEstimada": "UA/ha estimado para a condição atual",
  "diasDescanso": "estimativa de dias necessários para recuperação",
  "recomendacoes": [
    { "tipo": "imediata/curto_prazo/longo_prazo", "acao": "ação recomendada", "justificativa": "por que" }
  ],
  "insumosSugeridos": ["fertilizantes, corretivos ou herbicidas indicados com dosagem padrão"],
  "confianca": "alta/media/baixa",
  "observacoes": "limitações da análise ou observações importantes"
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
        temperature: 0.25,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('[AnalisePastagem Vision Error]', err)
      return NextResponse.json({ error: 'Erro ao analisar imagem' }, { status: 500 })
    }

    const data = await res.json()
    const raw = data.choices[0].message.content as string

    let analise: Record<string, unknown>
    try {
      const clean = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      analise = JSON.parse(clean)
    } catch {
      return NextResponse.json({ error: 'Não foi possível estruturar a análise', raw })
    }

    return NextResponse.json({ ok: true, talhao: nomeTalhao, analise })
  } catch (e: any) {
    console.error('[AnalisePastagem Error]', e?.message)
    return NextResponse.json({ error: e?.message ?? 'Erro interno' }, { status: 500 })
  }
}

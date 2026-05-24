import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { groq } from '@/lib/groq'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { cultura, area, dataInicio, estado } = await req.json()
    if (!cultura || !area) return NextResponse.json({ error: 'Cultura e área obrigatórias' }, { status: 400 })

    const text = await groq([{
      role: 'user',
      content: `Crie um cronograma completo de safra para:
- Cultura: ${cultura}
- Área: ${area} hectares
- Data de início: ${dataInicio || new Date().toLocaleDateString('pt-BR')}
- Estado/Região: ${estado || 'Brasil (Centro-Oeste/Sudeste)'}

Responda EXATAMENTE neste JSON (sem markdown):
{
  "cultura": "${cultura}",
  "area": ${area},
  "duracao_dias": <número total de dias da safra>,
  "fases": [
    {
      "nome": "<nome da fase>",
      "tipo": "<tipo de atividade ex: Preparo do solo, Plantio, Adubação, Irrigação, Colheita etc>",
      "inicio_dia": <dia relativo ao início, ex: 1>,
      "duracao_dias": <duração em dias>,
      "descricao": "<descrição prática de 1 frase>",
      "insumos": "<principais insumos ou null>",
      "prioridade": "alta" | "media" | "baixa"
    }
  ],
  "observacoes": "<2 observações importantes sobre essa cultura nessa época>"
}`
    }], 1500)

    const clean = text.replace(/```json\n?|\n?```/g, '').trim()
    return NextResponse.json(JSON.parse(clean))
  } catch (e: any) {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

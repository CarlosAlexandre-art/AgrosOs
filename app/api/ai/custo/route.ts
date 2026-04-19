import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { groq } from '@/lib/groq'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { descricao } = await req.json()
    if (!descricao || descricao.length < 3) return NextResponse.json({ error: 'Descrição muito curta' }, { status: 400 })

    const text = await groq([{
      role: 'user',
      content: `Para uma fazenda brasileira, classifique este custo agrícola: "${descricao}"

Categorias disponíveis: INSUMO (fertilizantes, herbicidas, sementes, defensivos), MAO_DE_OBRA (diária, serviços manuais), MAQUINARIO (combustível, manutenção, aluguel de máquinas), AGROLINK (serviços contratados pelo marketplace), OUTROS (demais despesas).

Responda EXATAMENTE neste JSON (sem markdown):
{
  "categoria": "INSUMO" | "MAO_DE_OBRA" | "MAQUINARIO" | "AGROLINK" | "OUTROS",
  "valor_sugerido": <número médio de mercado em reais, ou null se impossível estimar>,
  "justificativa": "<1 frase curta explicando a classificação>"
}`
    }], 150)

    const clean = text.replace(/```json\n?|\n?```/g, '').trim()
    return NextResponse.json(JSON.parse(clean))
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { groq } from '@/lib/groq'

export const maxDuration = 30

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { descricao } = await req.json()
    if (!descricao?.trim()) return NextResponse.json({ error: 'Descrição obrigatória' }, { status: 400 })

    const anoAtual = new Date().getFullYear()
    const prompt = `Você é um assistente de gestão pecuária brasileiro. O produtor descreve um ou mais lotes de animais. Cada lote pode ter várias cabeças. Gere UM registro por lote (não por animal individual), usando a identificação do lote como "identificacao".

Campos por lote:
- identificacao (string, obrigatório — use o nome/número do lote, ex: "Lote 01", "Lote A")
- sexo ("MACHO" | "FEMEA" — use "MACHO" se não informado)
- raca (string, ex: "Nelore" — null se não informado)
- dataNascimento (formato "YYYY-MM-DD" — calcule a partir da idade em meses se informada, usando ${anoAtual} como referência; null se não der para calcular)
- pesoAtual (número em kg — use o peso de entrada se informado; null se não informado)
- origemFazenda (string — null se não informado)

Descrição do produtor:
${descricao}

Responda SOMENTE com o JSON array, sem markdown, sem explicação. Exemplo:
[{"identificacao":"Lote 01","sexo":"MACHO","raca":"Nelore","dataNascimento":"2024-02-01","pesoAtual":314,"origemFazenda":null}]`

    const text = await groq([{ role: 'user', content: prompt }], 1200)
    const clean = text.replace(/```json\n?|\n?```/g, '').trim()
    const animais = JSON.parse(clean)

    if (!Array.isArray(animais)) throw new Error('Resposta inválida da IA')

    return NextResponse.json({ animais })
  } catch (e: any) {
    console.error('[ai-parse]', e.message)
    return NextResponse.json({ error: 'Erro ao interpretar descrição. Tente ser mais específico.' }, { status: 500 })
  }
}

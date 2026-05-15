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

    const prompt = `Você é um assistente de gestão pecuária brasileiro. O produtor vai descrever um lote de animais em linguagem natural. Extraia e retorne APENAS um JSON array com os animais para cadastro.

Campos disponíveis por animal:
- identificacao (string, obrigatório — gere sequencial como "#0001", "#0002" se não informado)
- sexo ("MACHO" | "FEMEA", obrigatório)
- raca (string, ex: "Nelore", "Angus", "Girolando" — null se não informado)
- dataNascimento (formato "YYYY-MM-DD" — null se não informado)
- pesoAtual (número em kg — null se não informado)
- origemFazenda (string — null se não informado)

Descrição do produtor: "${descricao}"

Responda SOMENTE com o JSON array, sem markdown, sem explicação. Exemplo:
[{"identificacao":"#0001","sexo":"FEMEA","raca":"Nelore","dataNascimento":"2024-03-01","pesoAtual":280,"origemFazenda":null}]`

    const text = await groq([{ role: 'user', content: prompt }], 800)
    const clean = text.replace(/```json\n?|\n?```/g, '').trim()
    const animais = JSON.parse(clean)

    if (!Array.isArray(animais)) throw new Error('Resposta inválida da IA')

    return NextResponse.json({ animais })
  } catch (e: any) {
    console.error('[ai-parse]', e.message)
    return NextResponse.json({ error: 'Erro ao interpretar descrição. Tente ser mais específico.' }, { status: 500 })
  }
}

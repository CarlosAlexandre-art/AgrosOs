import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { groq } from '@/lib/groq'

export const maxDuration = 30

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const d = await req.json()

    const prompt = `Você é um especialista em compra de bovinos no Brasil. Analise esta operação:

Origem: ${d.origem} | Finalidade: ${d.finalidade}
Raça/Categoria: ${d.raca || 'não informada'} / ${d.categoria || 'não informada'}
Cabeças: ${d.cabecas} | Peso médio: ${d.pesoMedio} kg
Preço de compra: R$${d.precoPorArroba}/arroba
Custo total: R$${Number(d.custoTotal).toFixed(2)} | Custo/cabeça: R$${Number(d.custoPorCab).toFixed(2)}
Custo/arroba real (com encargos): R$${Number(d.custoArrobaReal).toFixed(2)}
Arrobas compradas: ${Number(d.arrobasCompradas).toFixed(1)}@
${d.precoVendaArroba > 0 ? `
Projeção de saída:
- Preço de venda: R$${d.precoVendaArroba}/arroba
- Receita estimada: R$${Number(d.receitaEstimada).toFixed(2)}
- Lucro estimado: R$${Number(d.lucroEstimado).toFixed(2)}
- Margem bruta: ${Number(d.margemBruta).toFixed(1)}%
- Dias de ciclo: ${d.diasCiclo} | GMD implícito: ${Number(d.gmd).toFixed(3)} kg/dia
` : 'Sem projeção de venda informada.'}
Score calculado: ${d.score}

Responda EXATAMENTE neste JSON (sem markdown, sem texto fora do JSON):
{
  "viabilidade": "RECOMENDADO" ou "ATENCAO" ou "RISCO",
  "diagnostico": "diagnóstico direto em até 20 palavras",
  "ponto_forte": "principal vantagem desta compra em até 15 palavras",
  "ponto_risco": "principal risco ou fragilidade em até 15 palavras",
  "recomendacao": "ação ou ajuste recomendado em até 25 palavras",
  "preco_justo_ref": "faixa de preço justa ex: R$300-330/arroba ou null"
}`

    const text = await groq([{ role: 'user', content: prompt }], 320)
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('JSON inválido')
    return NextResponse.json(JSON.parse(match[0]))
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

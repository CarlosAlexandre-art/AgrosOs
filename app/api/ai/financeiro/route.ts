import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { groq } from '@/lib/groq'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      include: { properties: { include: { costs: true, revenues: true } } },
    })
    const p = dbUser?.properties[0]
    if (!p) return NextResponse.json({ error: 'Sem propriedade' }, { status: 404 })

    const totalCosts = p.costs.reduce((s, c) => s + Number(c.amount), 0)
    const totalRevenues = (p as any).revenues?.reduce((s: number, r: any) => s + Number(r.amount), 0) ?? 0
    const sizeHa = Number(p.sizeHectares ?? 0)

    const byCat: Record<string, number> = {}
    p.costs.forEach((c: any) => { byCat[c.category] = (byCat[c.category] || 0) + Number(c.amount) })
    const topCat = Object.entries(byCat).sort((a, b) => b[1] - a[1]).slice(0, 3)

    const prompt = `Análise financeira rápida para fazenda "${p.name}":
- Receita total: R$ ${totalRevenues.toFixed(2)}
- Custo total: R$ ${totalCosts.toFixed(2)}
- Resultado: R$ ${(totalRevenues - totalCosts).toFixed(2)}
${sizeHa > 0 ? `- Custo/ha: R$ ${(totalCosts / sizeHa).toFixed(0)}\n- Resultado/ha: R$ ${((totalRevenues - totalCosts) / sizeHa).toFixed(0)}` : ''}
- Top categorias de custo: ${topCat.map(([k, v]) => `${k}: R$${v.toFixed(0)}`).join(', ')}
- Lançamentos de custo: ${p.costs.length} | Receitas: ${(p as any).revenues?.length ?? 0}

Responda EXATAMENTE neste formato JSON (sem markdown, só o JSON):
{
  "situacao": "positiva" | "atencao" | "critica",
  "insight": "Uma frase de diagnóstico direto (max 20 palavras)",
  "recomendacao": "Uma ação concreta que o produtor deve fazer agora (max 25 palavras)",
  "alerta": "Risco ou ponto de atenção importante, ou null se não houver"
}`

    const text = await groq([{ role: 'user', content: prompt }], 300)
    const clean = text.replace(/```json\n?|\n?```/g, '').trim()
    const json = JSON.parse(clean)
    return NextResponse.json(json)
  } catch (e: any) {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

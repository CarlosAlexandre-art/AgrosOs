import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { groq } from '@/lib/groq'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { type, propertyId } = await req.json()
    if (!type) return NextResponse.json({ error: 'Tipo obrigatório' }, { status: 400 })

    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      include: { properties: { include: { activities: { orderBy: { startDate: 'desc' }, take: 20 }, teamMembers: true, fields: true } } },
    })
    const p = dbUser?.properties.find(pr => pr.id === propertyId) ?? dbUser?.properties[0]
    if (!p) return NextResponse.json({ error: 'Sem propriedade' }, { status: 404 })

    const similares = (p.activities as any[]).filter(a => a.type === type && a.status === 'DONE')
    const avgDias = similares.length > 0
      ? Math.round(similares.filter(a => a.endDate).reduce((s, a) => s + (new Date(a.endDate).getTime() - new Date(a.startDate).getTime()) / 86400000, 0) / similares.filter(a => a.endDate).length)
      : null

    const text = await groq([{
      role: 'user',
      content: `Para uma atividade do tipo "${type}" em uma fazenda com ${Number(p.sizeHectares ?? 0)} ha, ${p.fields.length} talhões e ${p.teamMembers.length} membros de equipe:

${similares.length > 0 ? `Histórico: ${similares.length} atividades similares já realizadas, duração média ${avgDias ?? '?'} dias.` : 'Primeira vez realizando essa atividade.'}

Responda EXATAMENTE neste JSON (sem markdown):
{
  "prazo_dias": <número inteiro de dias recomendados para concluir>,
  "dica": "<dica prática de 1 frase para executar bem essa atividade>",
  "insumos": "<lista curta de insumos/materiais típicos separados por vírgula, ou null se não aplicável>"
}`
    }], 200)

    const clean = text.replace(/```json\n?|\n?```/g, '').trim()
    return NextResponse.json(JSON.parse(clean))
  } catch (e: any) {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: session.user.id },
      include: { properties: { take: 1 } },
    })
    const property = dbUser?.properties[0]
    if (!property) return NextResponse.json({ error: 'Propriedade não encontrada. Complete o cadastro da fazenda.' }, { status: 404 })

    const { animais } = await req.json()
    if (!Array.isArray(animais) || animais.length === 0)
      return NextResponse.json({ error: 'Nenhum animal informado' }, { status: 400 })
    if (animais.length > 200)
      return NextResponse.json({ error: 'Máximo de 200 animais por importação' }, { status: 400 })

    const criados: string[] = []
    const erros: string[] = []

    for (const a of animais) {
      try {
        const animal = await (prisma as any).animal.create({
          data: {
            propertyId: property.id,
            identificacao: a.identificacao,
            sexo: a.sexo,
            raca: a.raca || null,
            dataNascimento: a.dataNascimento ? new Date(a.dataNascimento) : null,
            pesoAtual: a.pesoAtual ? Number(a.pesoAtual) : null,
            origemFazenda: a.origemFazenda || null,
            brincoEletronico: a.brincoEletronico || null,
            sisbovId: a.sisbovId || null,
            rfid: a.rfid || null,
          },
        })
        await (prisma as any).animalMovimento.create({
          data: {
            animalId: animal.id,
            tipo: 'ENTRADA',
            origem: a.origemFazenda || null,
            destino: property.name,
            peso: a.pesoAtual ? Number(a.pesoAtual) : null,
          },
        })
        criados.push(a.identificacao)
      } catch {
        erros.push(a.identificacao)
      }
    }

    return NextResponse.json({ criados: criados.length, erros, total: animais.length })
  } catch (e: any) {
    console.error('[bulk]', e.message)
    return NextResponse.json({ error: 'Erro ao importar animais' }, { status: 500 })
  }
}

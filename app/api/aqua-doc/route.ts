import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

async function getProperty(supabaseId: string) {
  const dbUser = await prisma.user.findUnique({
    where: { supabaseId },
    include: { properties: { take: 1 } },
  })
  return dbUser?.properties[0] ?? null
}

const DOCS_PADRAO = [
  { tipo: 'RGP', label: 'Registro Geral da Pesca', orgao: 'MPA/SEAP' },
  { tipo: 'LICENCA_AMBIENTAL', label: 'Licença Ambiental Aquicultura', orgao: 'IBAMA/SEMA' },
  { tipo: 'OUTORGA_AGUA', label: 'Outorga de Uso da Água', orgao: 'ANA/DAEE' },
  { tipo: 'DIPOA', label: 'Registro DIPOA', orgao: 'MAPA' },
  { tipo: 'CFMV', label: 'Responsável Técnico (CFMV)', orgao: 'CFMV' },
  { tipo: 'GTA', label: 'Guia de Trânsito Animal', orgao: 'MAPA/ADAGRI' },
]

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const property = await getProperty(session.user.id)
    if (!property) return NextResponse.json({ error: 'Propriedade não encontrada' }, { status: 404 })

    const documentos = await (prisma as any).documentoAqua.findMany({
      where: { propertyId: property.id },
      orderBy: { vencimento: 'asc' },
    })

    const hoje = new Date()
    const em30dias = new Date(hoje.getTime() + 30 * 86400000)
    const vencendo = documentos.filter((d: any) => d.vencimento && new Date(d.vencimento) <= em30dias && new Date(d.vencimento) > hoje)
    const vencidos = documentos.filter((d: any) => d.vencimento && new Date(d.vencimento) < hoje)

    return NextResponse.json({ documentos, docsPadrao: DOCS_PADRAO, kpis: { total: documentos.length, vencendo: vencendo.length, vencidos: vencidos.length, vigentes: documentos.length - vencendo.length - vencidos.length } })
  } catch (e: any) {
    console.error('[aqua-doc GET]', e.message)
    return NextResponse.json({ error: 'Erro ao carregar dados' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const property = await getProperty(session.user.id)
    if (!property) return NextResponse.json({ error: 'Propriedade não encontrada' }, { status: 404 })

    const { tipo, numero, orgao, emissao, vencimento, observacao } = await req.json()
    if (!tipo) return NextResponse.json({ error: 'Tipo de documento é obrigatório' }, { status: 400 })

    const doc = await (prisma as any).documentoAqua.create({
      data: {
        propertyId: property.id,
        tipo,
        numero: numero || null,
        orgao: orgao || null,
        emissao: emissao ? new Date(emissao) : null,
        vencimento: vencimento ? new Date(vencimento) : null,
        observacao: observacao || null,
      },
    })

    return NextResponse.json(doc, { status: 201 })
  } catch (e: any) {
    console.error('[aqua-doc POST]', e.message)
    return NextResponse.json({ error: 'Erro ao salvar' }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id }, select: { id: true } })
    if (!dbUser) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

    const op = await prisma.fieldOperation.findFirst({
      where: { id: params.id, userId: dbUser.id },
      include: { field: { select: { name: true, property: { select: { name: true } } } } },
    })
    if (!op) return NextResponse.json({ error: 'Operação não encontrada' }, { status: 404 })

    const { searchParams } = new URL(req.url)
    const format = searchParams.get('format') ?? 'csv'

    if (format === 'csv') {
      const header = 'ID,Propriedade,Talhão,Tipo,Largura(m),Ângulo(°),Velocidade(km/h),Área(ha),Passadas,Distância(km),Tempo Est.(h),Tempo Real(min),Combustível(L),Modo GPS,Data'
      const row = [
        op.id,
        op.field?.property?.name ?? '',
        op.field?.name ?? '',
        op.tipo,
        op.larguraM,
        op.anguloGraus,
        op.velocidadeKmh,
        op.areaHa.toFixed(2),
        op.passadas,
        op.comprimentoKm.toFixed(1),
        op.tempoEstHoras.toFixed(2),
        op.tempoRealMin?.toFixed(0) ?? '',
        op.combustivelL?.toFixed(1) ?? '',
        op.modoGps ? 'Sim' : 'Não',
        op.completedAt?.toISOString() ?? op.createdAt.toISOString(),
      ].join(',')

      const csv = `${header}\n${row}`
      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="operacao-${op.id.slice(0, 8)}.csv"`,
        },
      })
    }

    // JSON para uso no cliente (PDF gerado client-side com jsPDF)
    return NextResponse.json({ operacao: op })
  } catch (err) {
    console.error('[agronav/operacoes/exportar]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit'
import { analisarFrames, ModoAnalise } from '@/lib/groq-vision'

export const maxDuration = 120

const MODOS_VALIDOS: ModoAnalise[] = ['drone', 'visita', 'animal', 'servico']

// Limite: 10 análises por hora por usuário (plano pro+)
const LIMITE_HORA = 10

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { allowed } = rateLimit(`analisar-video:${user.id}`, LIMITE_HORA, 3600_000)
    if (!allowed) {
      return NextResponse.json(
        { error: `Limite de ${LIMITE_HORA} análises por hora atingido. Tente novamente em breve.` },
        { status: 429 }
      )
    }

    const body = await req.json()
    const { frames, modo } = body as { frames: string[]; modo: ModoAnalise }

    if (!frames || !Array.isArray(frames) || frames.length === 0) {
      return NextResponse.json({ error: 'Nenhum frame enviado' }, { status: 400 })
    }
    if (frames.length > 20) {
      return NextResponse.json({ error: 'Máximo de 20 frames por análise' }, { status: 400 })
    }
    if (!MODOS_VALIDOS.includes(modo)) {
      return NextResponse.json({ error: 'Modo de análise inválido' }, { status: 400 })
    }

    const resultado = await analisarFrames(frames, modo)
    return NextResponse.json(resultado)
  } catch (e: any) {
    console.error('[analisar-video]', e?.message)
    return NextResponse.json({ error: e?.message ?? 'Erro interno' }, { status: 500 })
  }
}

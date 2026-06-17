import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { rateLimit } from '@/lib/rate-limit'
import { analisarFrames, ModoAnalise } from '@/lib/groq-vision'

export const maxDuration = 120

const MODOS_VALIDOS: ModoAnalise[] = ['drone', 'visita', 'animal', 'servico']
const BUCKET = 'agrovision-temp'

// Converte Uint8Array para base64 sem estourar a pilha em arquivos grandes
function uint8ToBase64(bytes: Uint8Array): string {
  let binary = ''
  const chunk = 8192
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}

async function extrairFramesServidor(videoUrl: string, maxFrames = 5): Promise<string[]> {
  const { FFmpeg } = await import('@ffmpeg/ffmpeg')
  const { fetchFile } = await import('@ffmpeg/util')

  const ffmpeg = new FFmpeg()
  await ffmpeg.load({
    coreURL: '/ffmpeg/ffmpeg-core.js',
    wasmURL: '/ffmpeg/ffmpeg-core.wasm',
  })

  // Baixa o vídeo do Supabase Storage
  const res = await fetch(videoUrl)
  if (!res.ok) throw new Error('Falha ao baixar vídeo do storage')
  const videoBuffer = await res.arrayBuffer()

  await ffmpeg.writeFile('video', new Uint8Array(videoBuffer))

  const frames: string[] = []
  const posicoes = [1, 2, 4, 6, 8]

  for (let i = 0; i < posicoes.length && frames.length < maxFrames; i++) {
    const t = posicoes[i]
    const nome = `f${i}.jpg`
    try {
      await ffmpeg.exec(['-ss', String(t), '-i', 'video', '-frames:v', '1', '-vf', 'scale=640:-1', '-q:v', '4', nome])
      const data = await ffmpeg.readFile(nome) as Uint8Array
      const b64 = uint8ToBase64(data)
      if (b64.length > 500) frames.push(b64)
      await ffmpeg.deleteFile(nome).catch(() => {})
    } catch { break }
  }

  await ffmpeg.deleteFile('video').catch(() => {})
  return frames
}

export async function POST(req: NextRequest) {
  const admin = createAdminClient()
  let storagePath: string | null = null

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { allowed } = rateLimit(`analisar-video:${user.id}`, 5, 3600_000)
    if (!allowed) return NextResponse.json({ error: 'Limite de 5 análises de vídeo por hora atingido.' }, { status: 429 })

    const formData = await req.formData()
    const file = formData.get('video') as File | null
    const modo = formData.get('modo') as ModoAnalise

    if (!file) return NextResponse.json({ error: 'Nenhum vídeo enviado' }, { status: 400 })
    if (!MODOS_VALIDOS.includes(modo)) return NextResponse.json({ error: 'Modo inválido' }, { status: 400 })
    if (file.size > 60 * 1024 * 1024) return NextResponse.json({ error: 'Vídeo muito grande. Máximo 60MB.' }, { status: 400 })

    // Garante bucket temporário
    await admin.storage.createBucket(BUCKET, { public: true, fileSizeLimit: 60 * 1024 * 1024 }).catch(() => {})

    // Upload para Supabase Storage
    storagePath = `${user.id}/${Date.now()}.mp4`
    const bytes = await file.arrayBuffer()
    const { error: uploadError } = await admin.storage.from(BUCKET).upload(storagePath, bytes, { contentType: file.type, upsert: true })
    if (uploadError) throw new Error(`Erro no upload: ${uploadError.message}`)

    const { data: { publicUrl } } = admin.storage.from(BUCKET).getPublicUrl(storagePath)

    // Extrai frames no servidor
    const frames = await extrairFramesServidor(publicUrl, 5)
    if (frames.length === 0) throw new Error('Nenhum frame extraído do vídeo.')

    // Analisa com Groq Vision
    const resultado = await analisarFrames(frames, modo)
    return NextResponse.json(resultado)

  } catch (e: any) {
    console.error('[analisar-video-upload]', e)
    return NextResponse.json({ error: e?.message ?? 'Erro interno' }, { status: 500 })
  } finally {
    // Deleta o vídeo do storage após processar
    if (storagePath) {
      await admin.storage.from(BUCKET).remove([storagePath]).catch(() => {})
    }
  }
}

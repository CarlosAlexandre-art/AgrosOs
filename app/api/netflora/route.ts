import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { MODEL_REGISTRY, detectLocal } from '@/lib/netflora-inference'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const qgisUrl = process.env.QGIS_SERVICE_URL
  if (qgisUrl) {
    try {
      const res = await fetch(`${qgisUrl}/netflora/models`, {
        signal: AbortSignal.timeout(5000),
        next: { revalidate: 60 },
      })
      if (res.ok) return NextResponse.json(await res.json())
    } catch (_) {
      // fall through to local registry
    }
  }

  const models = Object.entries(MODEL_REGISTRY).map(([id, info]) => ({
    id,
    biome: info.biome,
    category: info.category,
    description: info.description,
    n_classes: Object.keys(info.classes).length,
    downloaded: false,
  }))

  return NextResponse.json(models)
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json() as { model_id: string; image_b64: string; confidence_threshold?: number }

  if (!body.model_id || !MODEL_REGISTRY[body.model_id]) {
    return NextResponse.json({ error: 'model_id inválido' }, { status: 422 })
  }
  if (!body.image_b64) {
    return NextResponse.json({ error: 'image_b64 obrigatório' }, { status: 422 })
  }

  const threshold = body.confidence_threshold ?? 0.5

  // 1) Tenta microserviço externo (QGIS_SERVICE_URL)
  const qgisUrl = process.env.QGIS_SERVICE_URL
  if (qgisUrl) {
    try {
      const proxyRes = await fetch(`${qgisUrl}/netflora/detect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model_id: body.model_id, image_b64: body.image_b64, confidence_threshold: threshold }),
        signal: AbortSignal.timeout(30_000),
      })
      if (proxyRes.ok) {
        return NextResponse.json({ ...(await proxyRes.json()), source: 'qgis-microservice' })
      }
    } catch (_) {
      // fall through to local inference
    }
  }

  // 2) Inferência local com onnxruntime-node + modelos do GitHub Releases
  try {
    const imageBuffer = Buffer.from(body.image_b64, 'base64')
    const result = await detectLocal(body.model_id, imageBuffer, threshold)
    return NextResponse.json(result)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido'
    console.error('[netflora] Erro na inferência local:', msg)
    return NextResponse.json({ error: `Inferência falhou: ${msg}` }, { status: 500 })
  }
}

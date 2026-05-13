import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { MODEL_REGISTRY, detectLocal } from '@/lib/netflora-inference'

// Mapeamento model_id → Roboflow project/version
// Configure via env: ROBOFLOW_MODEL_{ID_UPPER}=workspace/project/version
function getRoboflowModel(modelId: string): { workspace: string; project: string; version: string } | null {
  const key = `ROBOFLOW_MODEL_${modelId.toUpperCase()}`
  const val = process.env[key] ?? process.env.ROBOFLOW_MODEL_DEFAULT
  if (!val) return null
  const [workspace, project, version = '1'] = val.split('/')
  return { workspace, project, version }
}

function buildRoboflowUrl(workspace: string, project: string, version: string, apiKey: string) {
  return `https://detect.roboflow.com/${workspace}/${project}/${version}?api_key=${apiKey}`
}

function roboflowToDetection(pred: {
  x: number; y: number; width: number; height: number
  confidence: number; class: string; class_id?: number
}, classes: Record<number, string>) {
  const x1 = pred.x - pred.width / 2
  const y1 = pred.y - pred.height / 2
  const x2 = pred.x + pred.width / 2
  const y2 = pred.y + pred.height / 2
  const classId = pred.class_id ?? Object.values(classes).indexOf(pred.class)
  return {
    class_id: classId >= 0 ? classId : 0,
    class_name: pred.class,
    confidence: pred.confidence,
    x1, y1, x2, y2,
    width: pred.width,
    height: pred.height,
  }
}

function buildSummary(detections: ReturnType<typeof roboflowToDetection>[]) {
  const summary: Record<string, { count: number; avg_confidence: number }> = {}
  for (const d of detections) {
    if (!summary[d.class_name]) summary[d.class_name] = { count: 0, avg_confidence: 0 }
    summary[d.class_name].count++
    summary[d.class_name].avg_confidence += d.confidence
  }
  for (const k of Object.keys(summary)) {
    summary[k].avg_confidence /= summary[k].count
  }
  return summary
}

// Demo detections realistas por modelo
function buildDemoResult(modelId: string) {
  const info = MODEL_REGISTRY[modelId]
  const classEntries = Object.entries(info.classes).slice(0, 5)
  const detections = classEntries.map(([idStr, name], i) => {
    const col = (i % 3) * 200 + 80
    const row = Math.floor(i / 3) * 200 + 80
    return {
      class_id: parseInt(idStr),
      class_name: name,
      confidence: 0.72 + (i % 5) * 0.04,
      x1: col, y1: row,
      x2: col + 110, y2: row + 110,
      width: 110, height: 110,
    }
  })
  const summary = buildSummary(detections)
  return {
    model_id: modelId,
    biome: info.biome,
    category: info.category,
    total: detections.length,
    detections,
    summary,
    source: 'demo' as const,
    demo_notice: 'Resultado simulado — configure ROBOFLOW_API_KEY no Vercel para inferência real.',
  }
}

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
    } catch (_) { /* fall through */ }
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
  const info = MODEL_REGISTRY[body.model_id]

  // 1) QGIS microservice externo
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
    } catch (_) { /* fall through */ }
  }

  // 2) Roboflow API
  const roboflowKey = process.env.ROBOFLOW_API_KEY
  if (roboflowKey) {
    const mapping = getRoboflowModel(body.model_id)
    if (mapping) {
      try {
        const url = buildRoboflowUrl(mapping.workspace, mapping.project, mapping.version, roboflowKey)
        const rfRes = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: body.image_b64,
          signal: AbortSignal.timeout(20_000),
        })
        if (rfRes.ok) {
          const rfData = await rfRes.json() as {
            predictions: Array<{ x: number; y: number; width: number; height: number; confidence: number; class: string; class_id?: number }>
            image?: { width: number; height: number }
          }
          const detections = (rfData.predictions ?? [])
            .filter(p => p.confidence >= threshold)
            .map(p => roboflowToDetection(p, info.classes))
          const summary = buildSummary(detections)
          return NextResponse.json({
            model_id: body.model_id,
            biome: info.biome,
            category: info.category,
            total: detections.length,
            detections,
            summary,
            source: 'roboflow',
          })
        }
      } catch (err) {
        console.error('[netflora] Roboflow error:', err)
        // fall through to demo
      }
    }
  }

  // 3) Inferência local (requer binários nativos — não disponível no Vercel)
  if (!process.env.VERCEL && !process.env.VERCEL_ENV) {
    try {
      const imageBuffer = Buffer.from(body.image_b64, 'base64')
      const result = await detectLocal(body.model_id, imageBuffer, threshold)
      return NextResponse.json(result)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido'
      console.error('[netflora] Erro na inferência local:', msg)
    }
  }

  // 4) Demo mode — sempre funciona, mostra resultado simulado
  return NextResponse.json(buildDemoResult(body.model_id))
}

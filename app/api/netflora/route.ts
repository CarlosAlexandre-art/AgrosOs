import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const MODEL_REGISTRY: Record<string, { biome: string; category: string; description: string; classes: Record<number, string> }> = {
  amazonia_geral: {
    biome: 'Amazônia', category: 'Geral',
    description: '59 espécies — palmeiras, madeireiras, não-madeireiras, açaí, castanheira',
    classes: {
      0:'Tucumã',1:'Jací',2:'Jauari',3:'Inajá',4:'Uricuri',5:'Babaçu',
      6:'Cocão',7:'Murumuru',8:'Açaí solteiro',9:'Açaí solteiro produtivo',
      10:'Buritirana',11:'Buriti',12:'Patauá',13:'Bacaba',14:'Paxiuba',
      15:'Cedro',16:'Castanheira',17:'Cumaru',18:'Sucupira',19:'Cacau',
      20:'Café',21:'Guaraná',22:'Açaí touceira',23:'Árvore morta',
      24:'Clareira',25:'Invasora',
    },
  },
  amazonia_palmeiras: {
    biome: 'Amazônia', category: 'Palmeiras',
    description: '15 espécies de palmeiras amazônicas',
    classes: {
      0:'Tucumã',1:'Jací',2:'Jauari',3:'Inajá',4:'Uricuri',
      5:'Babaçu',6:'Cocão',7:'Murumuru',8:'Açaí solteiro',
      9:'Buritirana',10:'Buriti',11:'Patauá',12:'Bacaba',13:'Paxiuba',14:'Açaí touceira',
    },
  },
  amazonia_acai_solteiro: {
    biome: 'Amazônia', category: 'Açaí-solteiro',
    description: 'Euterpe precatoria — 2 categorias (solteiro / produtivo)',
    classes: { 0:'Açaí solteiro', 1:'Açaí solteiro produtivo' },
  },
  amazonia_castanheira: {
    biome: 'Amazônia', category: 'Castanheira',
    description: 'Detecção de Castanha-do-brasil (Bertholletia excelsa)',
    classes: { 0:'Castanheira' },
  },
  amazonia_invasora: {
    biome: 'Amazônia', category: 'Invasora',
    description: 'Detecção de espécies invasoras em florestas amazônicas',
    classes: { 0:'Invasora' },
  },
  cerrado_palmeiras: {
    biome: 'Cerrado', category: 'Palmeiras',
    description: 'Palmeiras do bioma Cerrado',
    classes: { 0:'Buriti', 1:'Babaçu', 2:'Macaúba' },
  },
  cerrado_carvao: {
    biome: 'Cerrado', category: 'Carvão/Biomassa',
    description: 'Espécies lenhosas para estimativa de biomassa/carvão',
    classes: { 0:'Espécie lenhosa' },
  },
  mata_atlantica_araucaria: {
    biome: 'Mata Atlântica', category: 'Araucária',
    description: 'Araucaria angustifolia — Pinheiro-do-paraná',
    classes: { 0:'Araucária' },
  },
  mata_atlantica_palmeiras: {
    biome: 'Mata Atlântica', category: 'Palmeiras',
    description: 'Palmeiras da Mata Atlântica (Euterpe edulis, Syagrus, etc.)',
    classes: { 0:'Juçara', 1:'Jerivá', 2:'Macaúba' },
  },
  caatinga_palmeiras: {
    biome: 'Caatinga', category: 'Palmeiras',
    description: 'Palmeiras da Caatinga (Carnaubeira, Licuri, etc.)',
    classes: { 0:'Carnaubeira', 1:'Licuri', 2:'Macaúba' },
  },
  pantanal_palmeiras: {
    biome: 'Pantanal', category: 'Palmeiras',
    description: 'Palmeiras do Pantanal',
    classes: { 0:'Bocaiuva', 1:'Buriti' },
  },
  pampa_palmeiras: {
    biome: 'Pampa', category: 'Palmeiras',
    description: 'Palmeiras do Pampa gaúcho',
    classes: { 0:'Butiá' },
  },
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
    } catch (_) {
      // fall through to static registry
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

  const qgisUrl = process.env.QGIS_SERVICE_URL
  if (qgisUrl) {
    try {
      const proxyRes = await fetch(`${qgisUrl}/netflora/detect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model_id: body.model_id,
          image_b64: body.image_b64,
          confidence_threshold: body.confidence_threshold ?? 0.5,
        }),
        signal: AbortSignal.timeout(30000),
      })
      if (proxyRes.ok) {
        return NextResponse.json({ ...(await proxyRes.json()), source: 'qgis-microservice' })
      }
    } catch (_) {
      // fall through to demo mode
    }
  }

  // Demo mode — microservice not available; return simulated result
  const modelInfo = MODEL_REGISTRY[body.model_id]
  const classNames = Object.values(modelInfo.classes)
  const demoDetections = classNames.slice(0, Math.min(3, classNames.length)).map((name, i) => ({
    class_id: i,
    class_name: name,
    confidence: parseFloat((0.72 + i * 0.05).toFixed(3)),
    x1: 50 + i * 80, y1: 60 + i * 40,
    x2: 130 + i * 80, y2: 140 + i * 40,
    width: 80, height: 80,
  }))

  const summary: Record<string, { count: number; avg_confidence: number }> = {}
  for (const d of demoDetections) {
    summary[d.class_name] = { count: 1, avg_confidence: d.confidence }
  }

  return NextResponse.json({
    model_id: body.model_id,
    biome: modelInfo.biome,
    category: modelInfo.category,
    total: demoDetections.length,
    detections: demoDetections,
    summary,
    source: 'demo',
    demo_notice: 'Microserviço QGIS não configurado. Resultados simulados para demonstração.',
  })
}

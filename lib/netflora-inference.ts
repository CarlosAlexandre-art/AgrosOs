/**
 * netflora-inference.ts — Port TypeScript do pipeline YOLO/ONNX do Netflora (Embrapa Acre)
 * Baixa modelos de github.com/karasinski-mauro/Netflora/releases e cacheia em /tmp
 */

import path from 'path'
import fs from 'fs'

const INPUT_SIZE = 640
const WEIGHTS_DIR = path.join('/tmp', 'netflora')

export const MODEL_REGISTRY: Record<string, {
  biome: string
  category: string
  description: string
  url: string
  classes: Record<number, string>
}> = {
  amazonia_geral: {
    biome: 'Amazônia', category: 'Geral',
    description: '59 espécies — palmeiras, madeireiras, não-madeireiras, açaí, castanheira',
    url: 'https://github.com/karasinski-mauro/Netflora/releases/download/v1.0/amazonia_geral.onnx',
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
    url: 'https://github.com/karasinski-mauro/Netflora/releases/download/v1.0/amazonia_palmeiras.onnx',
    classes: {
      0:'Tucumã',1:'Jací',2:'Jauari',3:'Inajá',4:'Uricuri',
      5:'Babaçu',6:'Cocão',7:'Murumuru',8:'Açaí solteiro',
      9:'Buritirana',10:'Buriti',11:'Patauá',12:'Bacaba',13:'Paxiuba',14:'Açaí touceira',
    },
  },
  amazonia_acai_solteiro: {
    biome: 'Amazônia', category: 'Açaí-solteiro',
    description: 'Euterpe precatoria — 2 categorias (solteiro / produtivo)',
    url: 'https://github.com/karasinski-mauro/Netflora/releases/download/v1.0/amazonia_acai_solteiro.onnx',
    classes: { 0:'Açaí solteiro', 1:'Açaí solteiro produtivo' },
  },
  amazonia_castanheira: {
    biome: 'Amazônia', category: 'Castanheira',
    description: 'Detecção de Castanha-do-brasil (Bertholletia excelsa)',
    url: 'https://github.com/karasinski-mauro/Netflora/releases/download/v1.0/amazonia_castanheira.onnx',
    classes: { 0:'Castanheira' },
  },
  amazonia_invasora: {
    biome: 'Amazônia', category: 'Invasora',
    description: 'Detecção de espécies invasoras em florestas amazônicas',
    url: 'https://github.com/karasinski-mauro/Netflora/releases/download/v1.0/amazonia_invasora.onnx',
    classes: { 0:'Invasora' },
  },
  cerrado_palmeiras: {
    biome: 'Cerrado', category: 'Palmeiras',
    description: 'Palmeiras do bioma Cerrado',
    url: 'https://github.com/karasinski-mauro/Netflora/releases/download/v1.0/cerrado_palmeiras.onnx',
    classes: { 0:'Buriti', 1:'Babaçu', 2:'Macaúba' },
  },
  cerrado_carvao: {
    biome: 'Cerrado', category: 'Carvão/Biomassa',
    description: 'Espécies lenhosas para estimativa de biomassa/carvão',
    url: 'https://github.com/karasinski-mauro/Netflora/releases/download/v1.0/cerrado_carvao.onnx',
    classes: { 0:'Espécie lenhosa' },
  },
  mata_atlantica_araucaria: {
    biome: 'Mata Atlântica', category: 'Araucária',
    description: 'Araucaria angustifolia — Pinheiro-do-paraná',
    url: 'https://github.com/karasinski-mauro/Netflora/releases/download/v1.0/mata_atlantica_araucaria.onnx',
    classes: { 0:'Araucária' },
  },
  mata_atlantica_palmeiras: {
    biome: 'Mata Atlântica', category: 'Palmeiras',
    description: 'Palmeiras da Mata Atlântica (Euterpe edulis, Syagrus, etc.)',
    url: 'https://github.com/karasinski-mauro/Netflora/releases/download/v1.0/mata_atlantica_palmeiras.onnx',
    classes: { 0:'Juçara', 1:'Jerivá', 2:'Macaúba' },
  },
  caatinga_palmeiras: {
    biome: 'Caatinga', category: 'Palmeiras',
    description: 'Palmeiras da Caatinga (Carnaubeira, Licuri, etc.)',
    url: 'https://github.com/karasinski-mauro/Netflora/releases/download/v1.0/caatinga_palmeiras.onnx',
    classes: { 0:'Carnaubeira', 1:'Licuri', 2:'Macaúba' },
  },
  pantanal_palmeiras: {
    biome: 'Pantanal', category: 'Palmeiras',
    description: 'Palmeiras do Pantanal',
    url: 'https://github.com/karasinski-mauro/Netflora/releases/download/v1.0/pantanal_palmeiras.onnx',
    classes: { 0:'Bocaiuva', 1:'Buriti' },
  },
  pampa_palmeiras: {
    biome: 'Pampa', category: 'Palmeiras',
    description: 'Palmeiras do Pampa gaúcho',
    url: 'https://github.com/karasinski-mauro/Netflora/releases/download/v1.0/pampa_palmeiras.onnx',
    classes: { 0:'Butiá' },
  },
}

interface Detection {
  class_id: number
  class_name: string
  confidence: number
  x1: number; y1: number
  x2: number; y2: number
  width: number; height: number
}

function nms(boxes: Detection[], iouThreshold = 0.85): Detection[] {
  if (boxes.length === 0) return []
  boxes.sort((a, b) => b.confidence - a.confidence)
  const kept: Detection[] = []
  for (const b of boxes) {
    let overlap = false
    for (const k of kept) {
      const ix1 = Math.max(b.x1, k.x1); const iy1 = Math.max(b.y1, k.y1)
      const ix2 = Math.min(b.x2, k.x2); const iy2 = Math.min(b.y2, k.y2)
      const iw = Math.max(0, ix2 - ix1); const ih = Math.max(0, iy2 - iy1)
      const inter = iw * ih
      const union = (b.x2 - b.x1) * (b.y2 - b.y1) + (k.x2 - k.x1) * (k.y2 - k.y1) - inter
      if (union > 0 && inter / union >= iouThreshold) { overlap = true; break }
    }
    if (!overlap) kept.push(b)
  }
  return kept
}

async function ensureModel(modelId: string): Promise<string> {
  if (!fs.existsSync(WEIGHTS_DIR)) fs.mkdirSync(WEIGHTS_DIR, { recursive: true })
  const modelPath = path.join(WEIGHTS_DIR, `${modelId}.onnx`)
  if (fs.existsSync(modelPath)) return modelPath

  const info = MODEL_REGISTRY[modelId]
  if (!info) throw new Error(`Modelo desconhecido: ${modelId}`)

  console.log(`[netflora] Baixando ${modelId}.onnx de GitHub Releases...`)
  const res = await fetch(info.url, { signal: AbortSignal.timeout(60_000) })
  if (!res.ok) throw new Error(`Falha ao baixar modelo: ${res.status}`)

  const buffer = Buffer.from(await res.arrayBuffer())
  fs.writeFileSync(modelPath, buffer)
  console.log(`[netflora] Modelo ${modelId}.onnx baixado (${(buffer.byteLength / 1024 / 1024).toFixed(1)} MB)`)
  return modelPath
}

async function preprocessImage(imageBuffer: Buffer): Promise<Float32Array> {
  const sharp = (await import('sharp')).default
  const { data } = await sharp(imageBuffer)
    .resize(INPUT_SIZE, INPUT_SIZE, { fit: 'fill' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const pixelCount = INPUT_SIZE * INPUT_SIZE
  const float32 = new Float32Array(3 * pixelCount)
  for (let i = 0; i < pixelCount; i++) {
    float32[i]                = data[i * 3]     / 255.0  // R
    float32[pixelCount + i]   = data[i * 3 + 1] / 255.0  // G
    float32[pixelCount*2 + i] = data[i * 3 + 2] / 255.0  // B
  }
  return float32
}

export async function detectLocal(
  modelId: string,
  imageBuffer: Buffer,
  confidenceThreshold = 0.5,
): Promise<{
  model_id: string; biome: string; category: string
  total: number; detections: Detection[]
  summary: Record<string, { count: number; avg_confidence: number }>
  source: 'local-onnx'
}> {
  const ort = await import('onnxruntime-node')
  const modelInfo = MODEL_REGISTRY[modelId]
  if (!modelInfo) throw new Error(`Modelo desconhecido: ${modelId}`)

  const modelPath = await ensureModel(modelId)
  const session = await ort.InferenceSession.create(modelPath, {
    executionProviders: ['cpu'],
  })

  const inputTensor = await preprocessImage(imageBuffer)
  const tensor = new ort.Tensor('float32', inputTensor, [1, 3, INPUT_SIZE, INPUT_SIZE])
  const inputName = session.inputNames[0]
  const outputs = await session.run({ [inputName]: tensor })

  const rawOutput = outputs[session.outputNames[0]]
  let rawData = rawOutput.data as Float32Array
  let dims = rawOutput.dims as number[]

  // Handle both YOLO output formats:
  // Format A: [1, 5+nc, 8400] → transpose to [1, 8400, 5+nc]
  // Format B: [1, 8400, 5+nc] → use as-is
  const nc = Object.keys(modelInfo.classes).length
  let numAnchors: number
  let rowSize: number

  if (dims[1] === 5 + nc && dims[2] > dims[1]) {
    // Format A: need to transpose [1, 5+nc, anchors] → [anchors, 5+nc]
    numAnchors = dims[2]
    rowSize = 5 + nc
    const transposed = new Float32Array(numAnchors * rowSize)
    for (let a = 0; a < numAnchors; a++) {
      for (let r = 0; r < rowSize; r++) {
        transposed[a * rowSize + r] = rawData[r * numAnchors + a]
      }
    }
    rawData = transposed
  } else {
    // Format B: [1, anchors, 5+nc] or already flat
    numAnchors = dims[1] ?? (rawData.length / (5 + nc))
    rowSize = 5 + nc
  }

  const detections: Detection[] = []
  for (let i = 0; i < numAnchors; i++) {
    const offset = i * rowSize
    const xc = rawData[offset]
    const yc = rawData[offset + 1]
    const w  = rawData[offset + 2]
    const h  = rawData[offset + 3]

    const classScores = Array.from(rawData.slice(offset + 4, offset + 4 + nc))
    const conf = Math.max(...classScores)
    if (conf < confidenceThreshold) continue

    const cls = classScores.indexOf(conf)
    const x1 = xc - w / 2; const y1 = yc - h / 2
    const x2 = xc + w / 2; const y2 = yc + h / 2

    // Physical constraints from Netflora source
    if (!(w >= 1 && w <= 200 && h >= 1 && h <= 200)) continue
    const ratio = w / (h + 1e-9)
    if (!(ratio >= 0.3 && ratio <= 3.0)) continue

    detections.push({
      class_id: cls,
      class_name: modelInfo.classes[cls] ?? `classe_${cls}`,
      confidence: Math.round(conf * 1000) / 1000,
      x1: Math.round(x1), y1: Math.round(y1),
      x2: Math.round(x2), y2: Math.round(y2),
      width: Math.round(w), height: Math.round(h),
    })
  }

  const filtered = nms(detections)

  const summary: Record<string, { count: number; avg_confidence: number; _confs?: number[] }> = {}
  for (const d of filtered) {
    if (!summary[d.class_name]) summary[d.class_name] = { count: 0, avg_confidence: 0, _confs: [] }
    summary[d.class_name].count++
    summary[d.class_name]._confs!.push(d.confidence)
  }
  for (const s of Object.values(summary)) {
    s.avg_confidence = Math.round(s._confs!.reduce((a, b) => a + b, 0) / s._confs!.length * 1000) / 1000
    delete s._confs
  }

  return {
    model_id: modelId,
    biome: modelInfo.biome,
    category: modelInfo.category,
    total: filtered.length,
    detections: filtered,
    summary,
    source: 'local-onnx',
  }
}

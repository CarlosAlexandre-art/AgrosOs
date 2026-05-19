import { NextRequest, NextResponse } from 'next/server'

function seededRand(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0xffffffff
  }
}

function generateDemoFields(minLng: number, minLat: number, maxLng: number, maxLat: number) {
  const rand = seededRand(Math.round((minLng + minLat) * 10000))
  const lngSpan = maxLng - minLng
  const latSpan = maxLat - minLat
  const count = 8 + Math.floor(rand() * 10)
  const CROPS = ['Soja', 'Milho', 'Café', 'Cana', 'Pastagem', 'Algodão', 'Arroz', 'Feijão']
  const features = []

  for (let i = 0; i < count; i++) {
    const baseLng = minLng + rand() * lngSpan * 0.82 + lngSpan * 0.05
    const baseLat = minLat + rand() * latSpan * 0.82 + latSpan * 0.05
    const w = 0.0015 + rand() * 0.007
    const h = 0.0012 + rand() * 0.006
    const shear = (rand() - 0.5) * 0.0008
    const irregular = rand() * 0.0003

    const coords = [
      [baseLng, baseLat],
      [baseLng + w + shear, baseLat + irregular],
      [baseLng + w + shear * 2 + irregular, baseLat + h],
      [baseLng + irregular, baseLat + h - irregular],
      [baseLng, baseLat],
    ]

    const cosLat = Math.cos(baseLat * Math.PI / 180)
    const areaHa = (w * h * 111320 * 111320 * cosLat) / 10000

    features.push({
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [coords] },
      properties: {
        id: `ftw-${i}`,
        area_ha: parseFloat(areaHa.toFixed(2)),
        confidence: parseFloat((0.82 + rand() * 0.17).toFixed(3)),
        ndvi: parseFloat((0.25 + rand() * 0.55).toFixed(3)),
        cultura: CROPS[Math.floor(rand() * CROPS.length)],
        source: 'FTW Sentinel-2',
      },
    })
  }

  const totalArea = features.reduce((s, f) => s + f.properties.area_ha, 0)

  return {
    type: 'FeatureCollection',
    features,
    meta: {
      source: 'Fields of The World (FTW) — Demo',
      bbox: [minLng, minLat, maxLng, maxLat],
      count: features.length,
      total_area_ha: parseFloat(totalArea.toFixed(1)),
      note: 'Configure FTW_API_URL para dados reais via API FTW',
    },
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const bbox = searchParams.get('bbox')

  if (!bbox) return NextResponse.json({ error: 'bbox obrigatório. Formato: minLng,minLat,maxLng,maxLat' }, { status: 400 })

  const parts = bbox.split(',').map(Number)
  if (parts.length !== 4 || parts.some(isNaN)) {
    return NextResponse.json({ error: 'bbox inválido' }, { status: 400 })
  }

  const [minLng, minLat, maxLng, maxLat] = parts

  const ftwApiUrl = process.env.FTW_API_URL
  if (ftwApiUrl) {
    try {
      const res = await fetch(
        `${ftwApiUrl}/v1/fields?bbox=${bbox}&limit=200`,
        {
          headers: { Accept: 'application/geo+json', 'User-Agent': 'OryonAG-GEO/1.0' },
          signal: AbortSignal.timeout(12000),
        }
      )
      if (res.ok) {
        const data = await res.json()
        return NextResponse.json(data)
      }
    } catch {
      // fallthrough to demo
    }
  }

  return NextResponse.json(generateDemoFields(minLng, minLat, maxLng, maxLat))
}

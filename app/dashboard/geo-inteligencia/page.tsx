'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import ProPaywall from '../../../components/ProPaywall'
import { usePlan } from '../../../lib/hooks/usePlan'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type L = any

interface DetectedField {
  id: string
  area_ha: number
  confidence: number
  ndvi: number
  cultura: string
  source: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  geojson: any
}

interface FTWResult {
  type: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  features: any[]
  meta: {
    source: string
    count: number
    total_area_ha: number
    note?: string
  }
}

const BR_CENTER: [number, number] = [-14.235, -51.925]

function ndviColor(ndvi: number): string {
  if (ndvi >= 0.7) return '#16a34a'
  if (ndvi >= 0.5) return '#65a30d'
  if (ndvi >= 0.35) return '#ca8a04'
  if (ndvi >= 0.2) return '#ea580c'
  return '#dc2626'
}

function ndviLabel(ndvi: number): string {
  if (ndvi >= 0.7) return 'Excelente'
  if (ndvi >= 0.5) return 'Bom'
  if (ndvi >= 0.35) return 'Moderado'
  if (ndvi >= 0.2) return 'Estressado'
  return 'Crítico'
}

function GeoIntelContent() {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<L>(null)
  const ftwLayerRef = useRef<L>(null)
  const baseLayerRef = useRef<L>(null)

  const [detecting, setDetecting] = useState(false)
  const [result, setResult] = useState<FTWResult | null>(null)
  const [fields, setFields] = useState<DetectedField[]>([])
  const [selectedField, setSelectedField] = useState<DetectedField | null>(null)
  const [showFields, setShowFields] = useState(true)
  const [propertyLoaded, setPropertyLoaded] = useState(false)
  const [panelOpen, setPanelOpen] = useState(false)
  const [pulse, setPulse] = useState(false)

  // Load Leaflet + init map
  useEffect(() => {
    if (typeof window === 'undefined' || mapInstance.current) return

    const cssId = 'leaflet-css'
    if (!document.getElementById(cssId)) {
      const link = document.createElement('link')
      link.id = cssId
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
    }

    const initMap = () => {
      if (!mapRef.current || mapInstance.current) return
      const Lx: L = (window as L).L

      delete Lx.Icon.Default.prototype._getIconUrl
      Lx.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const map = Lx.map(mapRef.current, {
        center: BR_CENTER,
        zoom: 5,
        zoomControl: false,
      })
      mapInstance.current = map

      baseLayerRef.current = Lx.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { attribution: '&copy; Esri, Maxar', maxZoom: 19 }
      ).addTo(map)

      Lx.control.zoom({ position: 'bottomright' }).addTo(map)

      // Load property coords
      fetch('/api/mapa')
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data?.lat && data?.lng) {
            map.flyTo([data.lat, data.lng], 14, { duration: 1.5 })
            // Farm marker
            const icon = Lx.divIcon({
              className: '',
              html: `<div style="width:38px;height:38px;background:#34d399;border:3px solid #fff;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 2px 12px rgba(52,211,153,0.5)"><div style="transform:rotate(45deg);height:100%;display:flex;align-items:center;justify-content:center;font-size:16px">🌾</div></div>`,
              iconSize: [38, 38], iconAnchor: [19, 38], popupAnchor: [0, -40],
            })
            Lx.marker([data.lat, data.lng], { icon })
              .addTo(map)
              .bindPopup(`<b>${data.name ?? 'Minha Fazenda'}</b><br>${Number(data.sizeHectares ?? 0).toFixed(1)} ha`)
          }
          setPropertyLoaded(true)
        })
        .catch(() => setPropertyLoaded(true))
    }

    if ((window as L).L) { initMap() } else {
      const script = document.createElement('script')
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
      script.onload = initMap
      document.body.appendChild(script)
    }

    return () => {
      mapInstance.current?.remove()
      mapInstance.current = null
      baseLayerRef.current = null
      ftwLayerRef.current = null
    }
  }, [])

  // Toggle FTW layer visibility
  useEffect(() => {
    if (!ftwLayerRef.current || !mapInstance.current) return
    if (showFields) {
      ftwLayerRef.current.addTo(mapInstance.current)
    } else {
      ftwLayerRef.current.remove()
    }
  }, [showFields])

  const handleDetect = useCallback(async () => {
    const map = mapInstance.current
    if (!map) return
    setDetecting(true)
    setPulse(true)
    setTimeout(() => setPulse(false), 2000)

    try {
      const bounds = map.getBounds()
      const bbox = `${bounds.getWest().toFixed(6)},${bounds.getSouth().toFixed(6)},${bounds.getEast().toFixed(6)},${bounds.getNorth().toFixed(6)}`

      const res = await fetch(`/api/geo/ftw?bbox=${bbox}`)
      if (!res.ok) throw new Error('Falha na API')
      const data: FTWResult = await res.json()

      setResult(data)

      // Render polygons on map
      const Lx: L = (window as L).L
      if (ftwLayerRef.current) { ftwLayerRef.current.remove() }

      const parsed: DetectedField[] = []
      ftwLayerRef.current = Lx.geoJSON(data, {
        style: (feature: L) => {
          const ndvi = feature?.properties?.ndvi ?? 0.5
          const color = ndviColor(ndvi)
          return {
            color,
            fillColor: color,
            fillOpacity: 0.35,
            weight: 2,
          }
        },
        onEachFeature: (feature: L, layer: L) => {
          const p = feature.properties
          const f: DetectedField = {
            id: p.id ?? `ftw-${parsed.length}`,
            area_ha: p.area_ha ?? 0,
            confidence: p.confidence ?? 0,
            ndvi: p.ndvi ?? 0,
            cultura: p.cultura ?? '—',
            source: p.source ?? 'FTW',
            geojson: feature,
          }
          parsed.push(f)
          layer.bindPopup(`
            <div style="font-family:sans-serif;min-width:160px">
              <div style="font-weight:700;font-size:13px;margin-bottom:4px">${f.cultura}</div>
              <div style="color:#666;font-size:11px">${f.area_ha} ha · NDVI ${f.ndvi.toFixed(2)}</div>
              <div style="margin-top:4px;padding:2px 6px;border-radius:4px;font-size:10px;font-weight:600;display:inline-block;background:${ndviColor(f.ndvi)}22;color:${ndviColor(f.ndvi)}">${ndviLabel(f.ndvi)}</div>
              <div style="color:#999;font-size:10px;margin-top:4px">Confiança: ${(f.confidence * 100).toFixed(0)}%</div>
            </div>
          `)
          layer.on('click', () => setSelectedField(f))
        },
      })

      if (showFields) ftwLayerRef.current.addTo(map)
      setFields(parsed)
      setPanelOpen(true)
    } catch (e) {
      console.error(e)
    } finally {
      setDetecting(false)
    }
  }, [showFields])

  const [activeTab, setActiveTab] = useState<'mapa' | 'campos'>('mapa')

  const flyToField = useCallback((f: DetectedField) => {
    setSelectedField(f)
    setActiveTab('mapa')
    // pequeno delay para garantir que o mapa ficou visível antes do flyTo
    setTimeout(() => {
      const map = mapInstance.current
      if (!map) return
      const Lx: L = (window as L).L
      try {
        const geo = Lx.geoJSON(f.geojson)
        map.flyToBounds(geo.getBounds(), { padding: [40, 40], duration: 1 })
      } catch {}
    }, 60)
  }, [])

  const avgConf = fields.length ? fields.reduce((s, f) => s + f.confidence, 0) / fields.length : 0
  const avgNdvi = fields.length ? fields.reduce((s, f) => s + f.ndvi, 0) / fields.length : 0

  const tabStyle = (active: boolean) => ({
    background: active ? 'rgba(52,211,153,0.18)' : 'transparent',
    color: active ? '#34d399' : 'rgba(148,163,184,0.5)',
    border: `1px solid ${active ? 'rgba(52,211,153,0.4)' : 'transparent'}`,
  })

  return (
    <div className="flex flex-col h-full" style={{ background: '#020c14', fontFamily: "'Syne', 'Inter', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&display=swap');
        @keyframes ping {
          0% { transform: translate(-50%, -50%) scale(0.2); opacity: 0.8; }
          100% { transform: translate(-50%, -50%) scale(1); opacity: 0; }
        }
      `}</style>

      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3"
        style={{ background: 'rgba(2,12,20,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(52,211,153,0.15)' }}>
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="relative w-9 h-9 flex items-center justify-center flex-shrink-0">
            <div className="absolute inset-0 rounded-xl" style={{ background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.3)' }} />
            <svg className="w-5 h-5 relative z-10" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth={1.8}>
              <circle cx="12" cy="12" r="3" />
              <path strokeLinecap="round" d="M12 2v2M12 20v2M2 12h2M20 12h2" />
              <path strokeLinecap="round" d="M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M17.66 6.34l-1.41 1.41M6.34 17.66l-1.41 1.41" />
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-bold leading-tight" style={{ background: 'linear-gradient(90deg, #34d399, #6ee7b7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontFamily: "'Syne', sans-serif", letterSpacing: '-0.02em' }}>
              ORYON GEO INTELLIGENCE
            </h1>
            <p className="text-[10px]" style={{ color: 'rgba(148,163,184,0.7)' }}>Fields of The World · Sentinel-2 · Detecção IA</p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <button onClick={() => setActiveTab('mapa')} className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all" style={tabStyle(activeTab === 'mapa')}>
            🗺️ Mapa
          </button>
          <button onClick={() => setActiveTab('campos')} className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all" style={tabStyle(activeTab === 'campos')}>
            📋 Campos{result ? ` (${result.meta.count})` : ''}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 relative min-h-0">

        {/* ── ABA MAPA ── sempre montado, apenas visibility toggled (evita bug Leaflet) */}
        <div className="absolute inset-0" style={{ visibility: activeTab === 'mapa' ? 'visible' : 'hidden' }}>
          <div ref={mapRef} className="absolute inset-0" />

          {/* Detect button */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[1000]">
            <button onClick={handleDetect} disabled={detecting}
              className="flex items-center gap-2.5 px-5 py-3 rounded-2xl text-sm font-bold transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                background: detecting ? 'rgba(52,211,153,0.15)' : 'linear-gradient(135deg, rgba(52,211,153,0.95), rgba(16,185,129,0.95))',
                color: detecting ? '#34d399' : '#020c14',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(52,211,153,0.4)',
                boxShadow: detecting ? 'none' : '0 4px 24px rgba(52,211,153,0.35)',
                fontFamily: "'Syne', sans-serif",
              }}>
              {detecting ? (
                <><div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />Detectando...</>
              ) : (
                <><svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}><circle cx="11" cy="11" r="4" /><path strokeLinecap="round" d="M11 7V4M11 18v-3M7 11H4M18 11h-3" /><path strokeLinecap="round" d="M8.4 8.4 6.3 6.3M15.6 15.6l-2.1-2.1M15.6 8.4l2.1-2.1M8.4 15.6 6.3 17.7" /></svg>
                {result ? 'Re-detectar IA' : 'Detectar Campos IA'}</>
              )}
            </button>
          </div>

          {/* Toggle polígonos */}
          {result && (
            <div className="absolute top-3 right-3 z-[1000]">
              <button onClick={() => setShowFields(o => !o)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                style={{ background: 'rgba(2,12,20,0.85)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)', color: showFields ? '#34d399' : 'rgba(148,163,184,0.5)' }}>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={showFields ? 'M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' : 'M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21'} />
                </svg>
                {showFields ? 'Polígonos visíveis' : 'Polígonos ocultos'}
              </button>
            </div>
          )}

          {/* Pulse radar */}
          {pulse && (
            <div className="absolute inset-0 z-[999] pointer-events-none flex items-center justify-center">
              <div className="relative">
                {[0, 1, 2].map(i => (
                  <div key={i} className="absolute rounded-full border"
                    style={{ width: `${(i + 1) * 120}px`, height: `${(i + 1) * 120}px`, top: '50%', left: '50%', transform: 'translate(-50%, -50%)', borderColor: 'rgba(52,211,153,0.4)', animation: `ping 1.5s ease-out ${i * 0.3}s infinite` }} />
                ))}
              </div>
            </div>
          )}

          {/* Attribution */}
          <div className="absolute bottom-3 right-3 z-[1000] px-2 py-1 rounded-lg"
            style={{ background: 'rgba(2,12,20,0.7)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <span className="text-[9px]" style={{ color: 'rgba(148,163,184,0.4)' }}>FTW · Sentinel-2 · OryonAG GEO</span>
          </div>
        </div>

        {/* ── ABA CAMPOS ── painel administrativo */}
        {activeTab === 'campos' && (
          <div className="absolute inset-0 overflow-y-auto" style={{ background: '#020c14' }}>
            {!result ? (
              /* Estado vazio */
              <div className="flex flex-col items-center justify-center h-full px-6 text-center">
                <div className="w-16 h-16 rounded-2xl mb-4 flex items-center justify-center" style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)' }}>
                  <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth={1.5}><circle cx="11" cy="11" r="4" /><path strokeLinecap="round" d="M11 7V4M11 18v-3M7 11H4M18 11h-3" /></svg>
                </div>
                <p className="text-sm font-semibold mb-1" style={{ color: '#e2e8f0' }}>Nenhuma detecção ainda</p>
                <p className="text-xs mb-5" style={{ color: 'rgba(148,163,184,0.5)' }}>Vá para a aba Mapa e toque em "Detectar Campos IA"</p>
                <button onClick={() => setActiveTab('mapa')}
                  className="px-4 py-2 rounded-xl text-sm font-bold"
                  style={{ background: 'linear-gradient(135deg, rgba(52,211,153,0.9), rgba(16,185,129,0.9))', color: '#020c14' }}>
                  Ir para o Mapa →
                </button>
              </div>
            ) : (
              <>
                {/* Stats summary */}
                <div className="grid grid-cols-2 gap-3 px-4 pt-4 pb-2">
                  {[
                    { label: 'CAMPOS', value: String(result.meta.count), color: '#34d399' },
                    { label: 'HECTARES', value: String(result.meta.total_area_ha), color: '#6ee7b7' },
                    { label: 'NDVI MÉDIO', value: avgNdvi.toFixed(2), color: ndviColor(avgNdvi) },
                    { label: 'CONFIANÇA IA', value: `${(avgConf * 100).toFixed(0)}%`, color: '#a7f3d0' },
                  ].map(s => (
                    <div key={s.label} className="rounded-2xl p-3 text-center"
                      style={{ background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.12)' }}>
                      <div className="text-xl font-bold" style={{ color: s.color, fontFamily: "'Syne', sans-serif" }}>{s.value}</div>
                      <div className="text-[9px] mt-1 font-semibold" style={{ color: 'rgba(148,163,184,0.5)', letterSpacing: '0.08em' }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* NDVI Legend */}
                <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="text-[9px] font-bold mb-2" style={{ color: 'rgba(148,163,184,0.4)', letterSpacing: '0.1em' }}>ESCALA NDVI</div>
                  <div className="flex flex-wrap gap-x-3 gap-y-1">
                    {[
                      { color: '#16a34a', label: 'Excelente ≥0.7' },
                      { color: '#65a30d', label: 'Bom ≥0.5' },
                      { color: '#ca8a04', label: 'Moderado ≥0.35' },
                      { color: '#ea580c', label: 'Estressado ≥0.2' },
                      { color: '#dc2626', label: 'Crítico <0.2' },
                    ].map(({ color, label }) => (
                      <div key={color} className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: color }} />
                        <span className="text-[10px]" style={{ color: '#94a3b8' }}>{label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Fields list */}
                <div>
                  {fields.map((f, idx) => (
                    <button key={f.id} onClick={() => flyToField(f)} className="w-full text-left px-4 py-3 transition-all"
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: selectedField?.id === f.id ? 'rgba(52,211,153,0.08)' : 'transparent' }}>
                      <div className="flex items-start gap-2.5">
                        <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0 mt-1" style={{ background: ndviColor(f.ndvi) }} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-semibold" style={{ color: '#e2e8f0' }}>{f.cultura}</span>
                            <span className="text-[10px] font-bold flex-shrink-0" style={{ color: ndviColor(f.ndvi) }}>{ndviLabel(f.ndvi)}</span>
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-[10px]" style={{ color: 'rgba(148,163,184,0.6)' }}>{f.area_ha} ha</span>
                            <span className="text-[10px]" style={{ color: 'rgba(148,163,184,0.6)' }}>NDVI {f.ndvi.toFixed(2)}</span>
                            <span className="text-[10px]" style={{ color: 'rgba(148,163,184,0.4)' }}>#{idx + 1}</span>
                          </div>
                          <div className="mt-1.5 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                            <div className="h-full rounded-full" style={{ width: `${f.confidence * 100}%`, background: 'linear-gradient(90deg, #34d399, #6ee7b7)' }} />
                          </div>
                          <div className="mt-0.5 text-[9px]" style={{ color: 'rgba(148,163,184,0.4)' }}>{(f.confidence * 100).toFixed(0)}% confiança · toque para ver no mapa</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {result?.meta.note && (
                  <div className="px-4 py-4">
                    <p className="text-[9px] leading-relaxed" style={{ color: 'rgba(148,163,184,0.4)' }}>{result.meta.note}</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Loading overlay */}
        {!propertyLoaded && (
          <div className="absolute inset-0 z-[2000] flex items-center justify-center" style={{ background: 'rgba(2,12,20,0.9)' }}>
            <div className="text-center">
              <div className="w-10 h-10 mx-auto mb-3 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'rgba(52,211,153,0.3)', borderTopColor: '#34d399' }} />
              <p className="text-xs" style={{ color: 'rgba(148,163,184,0.6)' }}>Carregando mapa...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function GeoIntelPage() {
  const { loading, isPro } = usePlan()
  if (loading) return (
    <div className="flex items-center justify-center h-64" style={{ background: '#020c14' }}>
      <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'rgba(52,211,153,0.3)', borderTopColor: '#34d399' }} />
    </div>
  )
  if (!isPro) return (
    <ProPaywall
      icon="🛰️"
      feature="ORYON GEO INTELLIGENCE"
      desc="Detecte automaticamente campos agrícolas via IA (FTW + Sentinel-2), visualize NDVI por talhão e analise expansão territorial."
    />
  )
  return <GeoIntelContent />
}

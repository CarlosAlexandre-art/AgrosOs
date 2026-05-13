'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import HowToUse from '../../../components/HowToUse'
import ProPaywall from '../../../components/ProPaywall'
import { usePlan } from '../../../lib/hooks/usePlan'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type L = any

interface PropertyData {
  id: string
  name: string
  lat: number | null
  lng: number | null
  sizeHectares: number
}

const GRID_PRESETS = [
  { m: 50,   label: '50 m',  cellHa: '0.25 ha', color: '#22d3ee' },
  { m: 100,  label: '100 m', cellHa: '1 ha',    color: '#34d399' },
  { m: 200,  label: '200 m', cellHa: '4 ha',    color: '#fbbf24' },
  { m: 500,  label: '500 m', cellHa: '25 ha',   color: '#f87171' },
  { m: 1000, label: '1 km',  cellHa: '100 ha',  color: '#a78bfa' },
]

function getUtmZone(lng: number): { zone: number; hemi: string } {
  return { zone: Math.floor((lng + 180) / 6) + 1, hemi: 'S' }
}

interface GridCell {
  id: string
  s: number; n: number; w: number; e: number
  centerLat: number; centerLng: number
  col: number; row: number
}

function buildGrid(
  centerLat: number, centerLng: number,
  gridM: number, extentCells: number,
): GridCell[] {
  const latStep = gridM / 111_000
  const lngStep = gridM / (111_000 * Math.cos(centerLat * Math.PI / 180))
  const cells: GridCell[] = []
  const half = extentCells

  for (let row = 0; row < half * 2; row++) {
    for (let col = 0; col < half * 2; col++) {
      const s = centerLat + (row - half) * latStep
      const n = s + latStep
      const w = centerLng + (col - half) * lngStep
      const e = w + lngStep

      const colLabel = col < 26
        ? String.fromCharCode(65 + col)
        : String.fromCharCode(65 + Math.floor(col / 26) - 1) + String.fromCharCode(65 + (col % 26))

      cells.push({
        id: `${colLabel}${half * 2 - row}`,
        s, n, w, e,
        centerLat: (s + n) / 2,
        centerLng: (w + e) / 2,
        col, row,
      })
    }
  }
  return cells
}

function GradeUTMContent() {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<L>(null)
  const gridLayerRef = useRef<L>(null)
  const labelsLayerRef = useRef<L>(null)

  const [property, setProperty] = useState<PropertyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [gridM, setGridM] = useState(100)
  const [extentCells, setExtentCells] = useState(10)
  const [showLabels, setShowLabels] = useState(true)
  const [hoveredCell, setHoveredCell] = useState<GridCell | null>(null)
  const [cellCount, setCellCount] = useState(0)
  const [panelOpen, setPanelOpen] = useState(false)

  const activePreset = GRID_PRESETS.find(p => p.m === gridM) ?? GRID_PRESETS[1]

  useEffect(() => {
    fetch('/api/properties')
      .then(r => r.json())
      .then((props: PropertyData[]) => {
        setProperty(Array.isArray(props) ? props[0] ?? null : null)
      })
      .finally(() => setLoading(false))
  }, [])

  // Init map
  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current || mapInstance.current) return

    const cssId = 'leaflet-css2'
    if (!document.getElementById(cssId)) {
      const link = document.createElement('link')
      link.id = cssId; link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
    }

    const init = () => {
      if (!mapRef.current || mapInstance.current) return
      const Lx: L = (window as L).L
      delete Lx.Icon.Default.prototype._getIconUrl

      const map = Lx.map(mapRef.current, {
        center: [-14.235, -51.925], zoom: 5, zoomControl: true,
      })
      mapInstance.current = map

      Lx.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { attribution: '&copy; Esri', maxZoom: 20 },
      ).addTo(map)
    }

    if ((window as L).L) { init() }
    else {
      const s = document.createElement('script')
      s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
      s.onload = init
      document.body.appendChild(s)
    }
    return () => { mapInstance.current?.remove(); mapInstance.current = null }
  }, [])

  // Fly to property when loaded
  useEffect(() => {
    if (!property?.lat || !property?.lng || !mapInstance.current) return
    mapInstance.current.flyTo([property.lat, property.lng], 14, { duration: 1.2 })
  }, [property])

  // Render grid
  const renderGrid = useCallback(() => {
    const map = mapInstance.current
    if (!map || !(window as L).L) return
    if (!property?.lat || !property?.lng) return

    const Lx: L = (window as L).L

    // Remove old layers
    if (gridLayerRef.current) { map.removeLayer(gridLayerRef.current); gridLayerRef.current = null }
    if (labelsLayerRef.current) { map.removeLayer(labelsLayerRef.current); labelsLayerRef.current = null }

    const cells = buildGrid(property.lat, property.lng, gridM, extentCells)
    setCellCount(cells.length)

    const color = activePreset.color
    const gridGroup = Lx.layerGroup()
    const labelsGroup = Lx.layerGroup()

    cells.forEach(cell => {
      const rect = Lx.rectangle(
        [[cell.s, cell.w], [cell.n, cell.e]],
        {
          color,
          weight: 0.8,
          fillColor: color,
          fillOpacity: 0.04,
          interactive: true,
        }
      )

      rect.on('mouseover', () => { setHoveredCell(cell); rect.setStyle({ fillOpacity: 0.22 }) })
      rect.on('mouseout', () => { setHoveredCell(null); rect.setStyle({ fillOpacity: 0.04 }) })
      rect.addTo(gridGroup)

      if (showLabels) {
        const label = Lx.marker([cell.centerLat, cell.centerLng], {
          icon: Lx.divIcon({
            className: '',
            html: `<div style="font-size:9px;font-weight:700;color:${color};text-shadow:0 0 3px rgba(0,0,0,.9),0 0 6px rgba(0,0,0,.7);white-space:nowrap;pointer-events:none;user-select:none">${cell.id}</div>`,
            iconSize: [32, 14],
            iconAnchor: [16, 7],
          }),
          interactive: false,
          keyboard: false,
        })
        label.addTo(labelsGroup)
      }
    })

    gridGroup.addTo(map)
    labelsGroup.addTo(map)
    gridLayerRef.current = gridGroup
    labelsLayerRef.current = labelsGroup
  }, [property, gridM, extentCells, showLabels, activePreset.color])

  useEffect(() => {
    const t = setTimeout(renderGrid, 200)
    return () => clearTimeout(t)
  }, [renderGrid])

  const exportGeoJSON = useCallback(() => {
    if (!property?.lat || !property?.lng) return
    const cells = buildGrid(property.lat, property.lng, gridM, extentCells)
    const geojson = {
      type: 'FeatureCollection',
      features: cells.map(cell => ({
        type: 'Feature',
        properties: { id: cell.id, gridSize: gridM, row: cell.row, col: cell.col },
        geometry: {
          type: 'Polygon',
          coordinates: [[[cell.w, cell.s],[cell.e, cell.s],[cell.e, cell.n],[cell.w, cell.n],[cell.w, cell.s]]],
        },
      })),
    }
    const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `grade-utm-${gridM}m.geojson`
    a.click()
  }, [property, gridM, extentCells])

  const utmZone = property?.lng ? getUtmZone(property.lng) : null

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#0b1120]">
      {/* Top header strip */}
      <div
        className="flex-shrink-0 px-5 py-3 flex items-center justify-between gap-4 border-b"
        style={{ background: 'rgba(11,17,32,0.95)', borderColor: 'rgba(255,255,255,0.07)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: `${activePreset.color}22`, border: `1px solid ${activePreset.color}44` }}
          >
            <svg className="w-4 h-4" style={{ color: activePreset.color }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-1.5-3.75c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125" />
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-bold text-white leading-tight">Grade UTM</h1>
            <p className="text-[10px] text-slate-500 leading-tight">GridZoneGenerator · Divisão de talhões</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {hoveredCell ? (
            <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-lg" style={{ background: `${activePreset.color}18`, border: `1px solid ${activePreset.color}33` }}>
              <span className="text-xs font-bold font-mono" style={{ color: activePreset.color }}>{hoveredCell.id}</span>
              <span className="text-[10px] text-slate-400 font-mono">{hoveredCell.centerLat.toFixed(5)}°, {hoveredCell.centerLng.toFixed(5)}°</span>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-3 text-[10px] text-slate-500">
              <span className="font-mono">{cellCount} células</span>
              {utmZone && <span className="font-mono">UTM {utmZone.zone}{utmZone.hemi}</span>}
            </div>
          )}

          <button
            onClick={exportGeoJSON}
            disabled={!property?.lat}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-30"
            style={{ background: `${activePreset.color}20`, color: activePreset.color, border: `1px solid ${activePreset.color}40` }}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            GeoJSON
          </button>
        </div>
      </div>

      {/* Educational guide */}
      <div className="flex-shrink-0 border-b px-4 py-2" style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(11,17,32,0.97)' }}>
        <HowToUse
          storageKey="grade-utm"
          title="Grade UTM de Talhões"
          subtitle="Divisão georeferenciada em células métricas · GridZoneGenerator"
          theme="dark"
          accentColor="#22d3ee"
          steps={[
            { icon: '📍', title: 'Centragem automática', description: 'A grade já está centrada nas coordenadas da sua propriedade cadastrada. Certifique-se de ter definido a localização na página Mapa.' },
            { icon: '📐', title: 'Tamanho da célula', description: 'Escolha entre 50m, 100m, 200m, 500m ou 1km. Células de 100m (1 ha) são ideais para manejo de talhões em lavoura.' },
            { icon: '🔲', title: 'Extensão e rótulos', description: 'Ajuste o slider de extensão (5×5 a 20×20 células) e ative/desative os rótulos A1, B2... para cada célula no mapa.' },
            { icon: '💾', title: 'Exporte o GeoJSON', description: 'Baixe o arquivo GeoJSON para importar no QGIS, ArcGIS ou qualquer outro sistema de informação geográfica.' },
          ]}
          tip="Passe o mouse sobre qualquer célula para ver seu ID (ex: B5) e coordenadas exatas. O ID é gerado por coluna (letra) e linha (número)."
        />
      </div>

      <div className="flex flex-1 min-h-0 relative">
        {/* Config panel — sidebar on desktop, bottom sheet on mobile */}
        <div
          className={[
            'flex-col border-r overflow-y-auto flex-shrink-0',
            panelOpen
              ? 'flex absolute inset-x-0 bottom-0 max-h-[65%] z-[1001] rounded-t-2xl shadow-2xl'
              : 'hidden',
            'md:flex md:relative md:inset-auto md:bottom-auto md:z-auto md:max-h-none md:rounded-none md:w-56 md:shadow-none',
          ].join(' ')}
          style={{ background: 'rgba(11,17,32,0.97)', borderColor: 'rgba(255,255,255,0.07)' }}
        >
          {/* Mobile close button */}
          <div className="md:hidden flex items-center justify-between px-4 py-2.5 border-b flex-shrink-0" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
            <span className="text-xs font-bold text-white">Configurações</span>
            <button onClick={() => setPanelOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {/* Property info */}
          <div className="px-4 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Propriedade</div>
            {loading ? (
              <div className="h-4 bg-white/5 rounded animate-pulse" />
            ) : property ? (
              <div>
                <div className="text-sm font-semibold text-white truncate">{property.name}</div>
                <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
                  {property.lat?.toFixed(4)}°, {property.lng?.toFixed(4)}°
                </div>
                {utmZone && (
                  <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold font-mono"
                    style={{ background: `${activePreset.color}18`, color: activePreset.color }}>
                    UTM {utmZone.zone}{utmZone.hemi}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-500">Sem coordenadas</p>
            )}
          </div>

          {/* Grid size */}
          <div className="px-4 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Tamanho da célula</div>
            <div className="space-y-1.5">
              {GRID_PRESETS.map(p => (
                <button
                  key={p.m}
                  onClick={() => setGridM(p.m)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-all"
                  style={gridM === p.m
                    ? { background: `${p.color}20`, border: `1px solid ${p.color}50`, color: p.color }
                    : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: '#64748b' }
                  }
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-sm" style={{ background: p.color, opacity: gridM === p.m ? 1 : 0.4 }} />
                    <span className="text-xs font-semibold">{p.label}</span>
                  </div>
                  <span className="text-[10px] font-mono opacity-70">{p.cellHa}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Extent */}
          <div className="px-4 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
            <div className="flex items-center justify-between mb-2">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Extensão</div>
              <span className="text-xs font-mono" style={{ color: activePreset.color }}>{extentCells}×{extentCells}</span>
            </div>
            <input
              type="range" min="5" max="20" step="1" value={extentCells}
              onChange={e => setExtentCells(Number(e.target.value))}
              className="w-full"
              style={{ accentColor: activePreset.color }}
            />
            <div className="flex justify-between text-[10px] text-slate-600 mt-1">
              <span>5×5</span><span>20×20</span>
            </div>
          </div>

          {/* Options */}
          <div className="px-4 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Opções</div>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <div
                onClick={() => setShowLabels(v => !v)}
                className="w-8 h-4.5 rounded-full transition-all flex items-center px-0.5 flex-shrink-0"
                style={{
                  background: showLabels ? activePreset.color : 'rgba(255,255,255,0.1)',
                  height: '18px', width: '32px',
                }}
              >
                <div
                  className="w-3.5 h-3.5 rounded-full bg-white shadow transition-transform"
                  style={{ transform: showLabels ? 'translateX(14px)' : 'translateX(0)' }}
                />
              </div>
              <span className="text-xs text-slate-400">Rótulos de células</span>
            </label>
          </div>

          {/* Stats */}
          <div className="px-4 py-4">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Estatísticas</div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-[10px] text-slate-500">Células totais</span>
                <span className="text-xs font-mono font-semibold text-white">{cellCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[10px] text-slate-500">Área por célula</span>
                <span className="text-xs font-mono font-semibold text-white">{activePreset.cellHa}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[10px] text-slate-500">Área total</span>
                <span className="text-xs font-mono font-semibold text-white">
                  {(cellCount * gridM * gridM / 10_000).toFixed(0)} ha
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[10px] text-slate-500">Passo lat</span>
                <span className="text-[10px] font-mono text-slate-400">
                  {property?.lat
                    ? (gridM / 111_000).toFixed(5) + '°'
                    : '—'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="flex-1 relative min-w-0">
          {/* Mobile panel toggle */}
          <button
            onClick={() => setPanelOpen(o => !o)}
            className="md:hidden absolute bottom-20 right-3 z-[1000] flex items-center gap-1.5 px-3 py-2 rounded-xl shadow-lg text-xs font-semibold text-white transition-all hover:scale-105 active:scale-95"
            style={{
              background: panelOpen ? `${activePreset.color}dd` : 'rgba(15,23,42,0.85)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.15)',
            }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
            </svg>
            Grade
          </button>
          {!property?.lat && !loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center" style={{ background: 'rgba(11,17,32,0.85)' }}>
              <div className="text-center px-6">
                <div className="text-4xl mb-3" style={{ filter: 'grayscale(0.3)' }}>📍</div>
                <p className="text-sm font-semibold text-white">Propriedade sem coordenadas</p>
                <p className="text-xs text-slate-400 mt-1">Defina a localização na página Mapa primeiro</p>
              </div>
            </div>
          )}
          <div ref={mapRef} className="absolute inset-0" />

          {/* Hover info overlay */}
          {hoveredCell && (
            <div
              className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] px-4 py-2 rounded-xl flex items-center gap-3 pointer-events-none"
              style={{
                background: 'rgba(11,17,32,0.9)',
                backdropFilter: 'blur(12px)',
                border: `1px solid ${activePreset.color}40`,
              }}
            >
              <span className="text-sm font-bold font-mono" style={{ color: activePreset.color }}>{hoveredCell.id}</span>
              <span className="text-[11px] text-slate-400 font-mono">
                {hoveredCell.centerLat.toFixed(5)}, {hoveredCell.centerLng.toFixed(5)}
              </span>
              <span className="text-[10px] text-slate-500">·</span>
              <span className="text-[11px] text-slate-400">{activePreset.cellHa}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function GradeUTMPage() {
  const { loading, isPro } = usePlan()
  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-slate-200 border-t-[#16a34a] rounded-full animate-spin" /></div>
  if (!isPro) return <ProPaywall icon="🗺️" feature="Grade UTM Georreferenciada" desc="Divida sua propriedade em células UTM para amostragem de solo, aplicação variável e rastreamento de operações por talhão." />
  return <GradeUTMContent />
}

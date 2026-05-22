'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface Field {
  id: string
  name: string
  sizeHectares: number
  lat: number | null
  lng: number | null
  geoJson: string | null
}

interface MapData {
  id: string
  name: string
  lat: number | null
  lng: number | null
  sizeHectares: number
  fields: Field[]
}

type Mode = 'view' | 'move' | 'field'

type LayerId = 'satellite' | 'hybrid' | 'topo' | 'street' | 'osm'

interface TileConfig {
  label: string
  sublabel: string
  url: string
  labelsUrl?: string
  attribution: string
  swatch: string
  swatchAlt: string
}

const TILE_LAYERS: Record<LayerId, TileConfig> = {
  satellite: {
    label: 'Satélite',
    sublabel: 'Esri World Imagery',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri, Maxar, Earthstar Geographics',
    swatch: 'linear-gradient(135deg,#1a3a1a 0%,#2d5016 40%,#3a6b1e 70%,#1c2b0e 100%)',
    swatchAlt: '#2d5016',
  },
  hybrid: {
    label: 'Híbrido',
    sublabel: 'Satélite + Rótulos',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    labelsUrl: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri',
    swatch: 'linear-gradient(135deg,#1a3a1a 0%,#2d5016 40%,#f59e0b44 70%,#1c2b0e 100%)',
    swatchAlt: '#3d6b20',
  },
  topo: {
    label: 'Topográfico',
    sublabel: 'Esri World Topo',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri, HERE, DeLorme',
    swatch: 'linear-gradient(135deg,#7cb9a8 0%,#5a9e8e 30%,#8aab6f 60%,#c8b89a 100%)',
    swatchAlt: '#7cb9a8',
  },
  street: {
    label: 'Ruas',
    sublabel: 'Esri World Street',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri, HERE, TomTom',
    swatch: 'linear-gradient(135deg,#e8dcc8 0%,#d4c9b0 30%,#c8b99a 60%,#b8a88a 100%)',
    swatchAlt: '#d4c9b0',
  },
  osm: {
    label: 'OpenStreetMap',
    sublabel: 'Comunidade OSM',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>',
    swatch: 'linear-gradient(135deg,#b5cf6b 0%,#8fb94a 30%,#d4e8a0 60%,#c8d870 100%)',
    swatchAlt: '#8fb94a',
  },
}

const FIELD_COLORS = ['#16a34a', '#2563eb', '#d97706', '#dc2626', '#7c3aed', '#0891b2', '#db2777']
const BR_CENTER: [number, number] = [-14.235, -51.925]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type L = any

export default function FarmMap({ data }: { data: MapData }) {
  const router = useRouter()
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<L>(null)
  const propMarker = useRef<L>(null)
  const fieldMarkers = useRef<Record<string, L>>({})
  const baseLayerRef = useRef<L>(null)
  const labelsLayerRef = useRef<L>(null)
  const modeRef = useRef<Mode>('view')
  const activeFieldRef = useRef<string | null>(null)
  const setPendingRef = useRef<((lat: number, lng: number) => void) | null>(null)
  const setFieldRef = useRef<((id: string, lat: number, lng: number) => void) | null>(null)
  const dataRef = useRef(data)

  const [mode, setMode] = useState<Mode>('view')
  const [activeField, setActiveField] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchNotFound, setSearchNotFound] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState(false)
  const [activeLayer, setActiveLayer] = useState<LayerId>('satellite')
  const [layerPanelOpen, setLayerPanelOpen] = useState(false)
  const [mobileFieldsOpen, setMobileFieldsOpen] = useState(false)
  const [pendingLat, setPendingLat] = useState<number | null>(data.lat)
  const [pendingLng, setPendingLng] = useState<number | null>(data.lng)
  const [fieldCoords, setFieldCoords] = useState<Record<string, { lat: number; lng: number }>>(() => {
    const acc: Record<string, { lat: number; lng: number }> = {}
    data.fields.forEach(f => { if (f.lat && f.lng) acc[f.id] = { lat: f.lat, lng: f.lng } })
    return acc
  })

  useEffect(() => { modeRef.current = mode }, [mode])
  useEffect(() => { activeFieldRef.current = activeField }, [activeField])
  useEffect(() => {
    setPendingRef.current = (lat, lng) => { setPendingLat(lat); setPendingLng(lng) }
    setFieldRef.current = (id, lat, lng) => setFieldCoords(prev => ({ ...prev, [id]: { lat, lng } }))
  }, [])

  // Switch tile layer
  const switchLayer = useCallback((layerId: LayerId) => {
    const map = mapInstance.current
    if (!map || !(window as L).L) return
    const Lx: L = (window as L).L

    // Remove existing layers
    if (baseLayerRef.current) { baseLayerRef.current.remove(); baseLayerRef.current = null }
    if (labelsLayerRef.current) { labelsLayerRef.current.remove(); labelsLayerRef.current = null }

    const cfg = TILE_LAYERS[layerId]
    baseLayerRef.current = Lx.tileLayer(cfg.url, { attribution: cfg.attribution, maxZoom: 19 }).addTo(map)

    if (cfg.labelsUrl) {
      labelsLayerRef.current = Lx.tileLayer(cfg.labelsUrl, { attribution: '', maxZoom: 19, pane: 'tilePane' }).addTo(map)
    }

    setActiveLayer(layerId)
    setLayerPanelOpen(false)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined' || mapInstance.current) return

    const cssId = 'leaflet-css'
    if (!document.getElementById(cssId)) {
      const link = document.createElement('link')
      link.id = cssId; link.rel = 'stylesheet'
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

      const d = dataRef.current
      const center: [number, number] = d.lat && d.lng ? [d.lat, d.lng] : BR_CENTER
      const map = Lx.map(mapRef.current, { center, zoom: d.lat ? 14 : 5, zoomControl: false })
      mapInstance.current = map

      // Initial tile layer (satellite)
      const cfg = TILE_LAYERS['satellite']
      baseLayerRef.current = Lx.tileLayer(cfg.url, { attribution: cfg.attribution, maxZoom: 19 }).addTo(map)

      Lx.control.zoom({ position: 'bottomright' }).addTo(map)

      const makeFarmIcon = () => Lx.divIcon({
        className: '',
        html: `<div style="width:36px;height:36px;background:#16a34a;border:3px solid #fff;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 2px 10px rgba(0,0,0,.4)"><div style="transform:rotate(45deg);height:100%;display:flex;align-items:center;justify-content:center;font-size:15px">🌾</div></div>`,
        iconSize: [36, 36], iconAnchor: [18, 36], popupAnchor: [0, -38],
      })

      if (d.lat && d.lng) {
        propMarker.current = Lx.marker([d.lat, d.lng], { icon: makeFarmIcon() })
          .addTo(map)
          .bindPopup(`<b>${d.name}</b><br><span style="color:#666">${Number(d.sizeHectares).toFixed(1)} ha</span>`)
      }

      d.fields.forEach((field: Field, idx: number) => {
        const color = FIELD_COLORS[idx % FIELD_COLORS.length]
        if (field.geoJson) {
          try {
            fieldMarkers.current[field.id] = Lx.geoJSON(JSON.parse(field.geoJson), {
              style: { color, fillColor: color, fillOpacity: 0.25, weight: 2 },
            }).addTo(map).bindPopup(`<b>${field.name}</b><br>${Number(field.sizeHectares).toFixed(1)} ha`)
          } catch {}
        } else if (field.lat && field.lng) {
          const icon = Lx.divIcon({
            className: '',
            html: `<div style="background:${color};width:14px;height:14px;border-radius:50%;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>`,
            iconSize: [14, 14], iconAnchor: [7, 7],
          })
          fieldMarkers.current[field.id] = Lx.marker([field.lat, field.lng], { icon })
            .addTo(map).bindPopup(`<b>${field.name}</b><br>${Number(field.sizeHectares).toFixed(1)} ha`)
        }
      })

      map.on('click', (e: L) => {
        const { lat, lng } = e.latlng
        const m = modeRef.current
        const fid = activeFieldRef.current

        if (m === 'move') {
          setPendingRef.current?.(lat, lng)
          if (propMarker.current) propMarker.current.setLatLng([lat, lng])
          else propMarker.current = Lx.marker([lat, lng], { icon: makeFarmIcon() }).addTo(map)
        } else if (m === 'field' && fid) {
          setFieldRef.current?.(fid, lat, lng)
          const d2 = dataRef.current
          const idx = d2.fields.findIndex((f: Field) => f.id === fid)
          const color = FIELD_COLORS[idx % FIELD_COLORS.length]
          fieldMarkers.current[fid]?.remove()
          const icon = Lx.divIcon({
            className: '',
            html: `<div style="background:${color};width:14px;height:14px;border-radius:50%;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>`,
            iconSize: [14, 14], iconAnchor: [7, 7],
          })
          fieldMarkers.current[fid] = Lx.marker([lat, lng], { icon })
            .addTo(map).bindPopup(d2.fields[idx]?.name ?? '')
        }
      })
    }

    if ((window as L).L) { initMap() }
    else {
      const script = document.createElement('script')
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
      script.onload = initMap
      document.body.appendChild(script)
    }

    return () => {
      mapInstance.current?.remove()
      mapInstance.current = null
      baseLayerRef.current = null
      labelsLayerRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSearch = useCallback(async () => {
    if (!search.trim() || !mapInstance.current) return
    setSearching(true)
    setSearchNotFound(false)
    try {
      const query = search.includes('Brasil') ? search : search + ', Brasil'
      const r = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&countrycodes=br`,
        { headers: { 'Accept-Language': 'pt' } }
      )
      const results = await r.json()
      if (results[0]) {
        mapInstance.current.flyTo([parseFloat(results[0].lat), parseFloat(results[0].lon)], 14)
      } else {
        setSearchNotFound(true)
        setTimeout(() => setSearchNotFound(false), 3000)
      }
    } catch {
      setSearchNotFound(true)
      setTimeout(() => setSearchNotFound(false), 3000)
    } finally { setSearching(false) }
  }, [search])

  const handleGeolocate = useCallback(() => {
    if (!navigator.geolocation || !mapInstance.current) return
    navigator.geolocation.getCurrentPosition(pos =>
      mapInstance.current.flyTo([pos.coords.latitude, pos.coords.longitude], 15)
    )
  }, [])

  const handleOpenGoogleMaps = useCallback(() => {
    const map = mapInstance.current
    if (!map) return
    const c = map.getCenter()
    const z = map.getZoom()
    window.open(`https://maps.google.com/?q=${c.lat},${c.lng}&z=${z}&t=k`, '_blank')
  }, [])

  const handleSave = useCallback(async () => {
    setSaving(true)
    setSaveError(false)
    try {
      const calls: Promise<Response>[] = []
      if (pendingLat != null && pendingLng != null && (pendingLat !== data.lat || pendingLng !== data.lng)) {
        calls.push(fetch('/api/mapa', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lat: pendingLat, lng: pendingLng }),
        }))
      }
      Object.entries(fieldCoords).forEach(([fieldId, c]) => {
        const orig = data.fields.find(f => f.id === fieldId)
        if (orig?.lat === c.lat && orig?.lng === c.lng) return
        calls.push(fetch('/api/mapa', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fieldId, lat: c.lat, lng: c.lng }),
        }))
      })
      const responses = await Promise.all(calls)
      const allOk = responses.every(r => r.ok)
      if (allOk) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2500)
        router.refresh()
      } else {
        setSaveError(true)
        setTimeout(() => setSaveError(false), 4000)
      }
    } catch {
      setSaveError(true)
      setTimeout(() => setSaveError(false), 4000)
    } finally {
      setSaving(false)
      setMode('view')
      setActiveField(null)
    }
  }, [pendingLat, pendingLng, fieldCoords, data, router])

  const hasChanges =
    (pendingLat != null && (pendingLat !== data.lat || pendingLng !== data.lng)) ||
    Object.entries(fieldCoords).some(([id, c]) => {
      const o = data.fields.find(f => f.id === id)
      return !o || o.lat !== c.lat || o.lng !== c.lng
    })

  const currentLayerCfg = TILE_LAYERS[activeLayer]

  const FieldsList = ({ onMarkField }: { onMarkField?: () => void }) => (
    <>
      {data.fields.length === 0 ? (
        <div className="p-6 text-center">
          <div className="text-3xl mb-2">🌱</div>
          <p className="text-sm text-slate-400">Nenhum talhão cadastrado</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-50">
          {data.fields.map((field, idx) => {
            const color = FIELD_COLORS[idx % FIELD_COLORS.length]
            const isLocated = fieldCoords[field.id] || (field.lat && field.lng)
            const isActive = activeField === field.id && mode === 'field'
            return (
              <div key={field.id} className={`px-4 py-3 transition-colors ${isActive ? 'bg-amber-50' : 'hover:bg-slate-50/80'}`}>
                <div className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full flex-shrink-0 ring-2 ring-white" style={{ background: color }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-800 truncate">{field.name}</div>
                    <div className="text-xs text-slate-400">{Number(field.sizeHectares).toFixed(1)} ha</div>
                  </div>
                  <button
                    onClick={() => {
                      if (isActive) { setMode('view'); setActiveField(null) }
                      else { setMode('field'); setActiveField(field.id); onMarkField?.() }
                    }}
                    title={isLocated ? 'Reposicionar' : 'Marcar no mapa'}
                    className={`flex-shrink-0 p-1.5 rounded-lg transition-colors ${
                      isActive ? 'bg-amber-200 text-amber-700' : 'text-slate-300 hover:text-[#16a34a] hover:bg-green-50'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                </div>
                {isLocated && (
                  <div className="mt-1 text-[10px] text-[#16a34a] font-semibold flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Localizado
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </>
  )

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar — two rows on mobile, single row on desktop */}
      <div className="bg-white border-b border-slate-200 px-3 py-2.5 flex-shrink-0">
        {/* Row 1: Search */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Buscar cidade, endereço..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#16a34a] focus:border-transparent"
            />
          </div>
          <button onClick={handleSearch} disabled={searching}
            className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 whitespace-nowrap flex-shrink-0 ${
              searchNotFound ? 'bg-red-100 text-red-600' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}>
            {searching ? '...' : searchNotFound ? 'Não encontrado' : 'Buscar'}
          </button>
        </div>

        {/* Row 2: Action buttons */}
        <div className="flex items-center gap-2 mt-2">
          <button onClick={handleGeolocate} title="Usar minha localização"
            className="flex items-center gap-1.5 px-3 py-2 text-sm border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition-colors flex-shrink-0">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="3" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 2v3m0 14v3M2 12h3m14 0h3" />
            </svg>
            <span className="hidden sm:inline">GPS</span>
          </button>

          <button onClick={handleOpenGoogleMaps} title="Abrir no Google Maps"
            className="flex items-center gap-1.5 px-3 py-2 text-sm border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition-colors flex-shrink-0">
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
            <span className="hidden sm:inline">Google Maps</span>
          </button>

          <div className="h-5 w-px bg-slate-200 hidden sm:block flex-shrink-0" />

          <button
            onClick={() => { setMode(m => m === 'move' ? 'view' : 'move'); setActiveField(null) }}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-xl font-medium transition-all flex-shrink-0 ${
              mode === 'move' ? 'bg-[#16a34a] text-white shadow-sm' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="sm:hidden">{mode === 'move' ? 'Ativo' : 'Marcar'}</span>
            <span className="hidden sm:inline">{mode === 'move' ? 'Clique no mapa...' : 'Marcar fazenda'}</span>
          </button>

          {saveError && (
            <span className="ml-auto text-xs text-red-600 font-medium flex-shrink-0">Erro ao salvar</span>
          )}
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className={`${saveError ? '' : 'ml-auto'} flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm flex-shrink-0 ${
              saveError ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-[#16a34a] text-white hover:bg-[#15803d]'
            }`}
          >
            {saved ? (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span className="hidden sm:inline">Salvo!</span>
              </>
            ) : saving ? (
              <span className="hidden sm:inline">Salvando...</span>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                <span className="hidden sm:inline">Salvar</span>
              </>
            )}
          </button>
        </div>
      </div>

      {mode !== 'view' && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs text-amber-800 font-medium flex items-center gap-2 flex-shrink-0">
          <svg className="w-4 h-4 text-amber-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {mode === 'move' && 'Toque em qualquer ponto do mapa para posicionar o marcador da fazenda'}
          {mode === 'field' && activeField && `Toque no mapa para posicionar "${data.fields.find(f => f.id === activeField)?.name}"`}
          <button onClick={() => { setMode('view'); setActiveField(null) }} className="ml-auto text-amber-700 underline hover:no-underline">
            Cancelar
          </button>
        </div>
      )}

      <div className="flex flex-1 min-h-0 relative">
        {/* Map area */}
        <div className="flex-1 relative min-w-0">
          <div ref={mapRef} className="absolute inset-0" style={{ cursor: mode !== 'view' ? 'crosshair' : undefined }} />

          {/* Layer switcher — floating glass panel */}
          <div className="absolute bottom-8 left-3 z-[1000]" style={{ pointerEvents: 'auto' }}>
            {layerPanelOpen && (
              <>
                <div className="fixed inset-0 z-[-1]" onClick={() => setLayerPanelOpen(false)} />
                <div
                  className="mb-2 rounded-2xl overflow-hidden shadow-2xl border border-white/20"
                  style={{
                    background: 'rgba(15,23,42,0.88)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    minWidth: '200px',
                  }}
                >
                  <div className="px-3 py-2.5 border-b border-white/10">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Camada base</span>
                  </div>
                  <div className="p-2 space-y-1">
                    {(Object.entries(TILE_LAYERS) as [LayerId, TileConfig][]).map(([id, cfg]) => (
                      <button
                        key={id}
                        onClick={() => switchLayer(id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left ${
                          activeLayer === id
                            ? 'bg-white/15 ring-1 ring-white/30'
                            : 'hover:bg-white/8'
                        }`}
                      >
                        <div
                          className="w-8 h-8 rounded-lg flex-shrink-0 border border-white/20"
                          style={{ background: cfg.swatch }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className={`text-sm font-semibold leading-tight ${activeLayer === id ? 'text-white' : 'text-slate-300'}`}>
                            {cfg.label}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5 leading-tight">{cfg.sublabel}</div>
                        </div>
                        {activeLayer === id && (
                          <svg className="w-4 h-4 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <button
              onClick={() => setLayerPanelOpen(o => !o)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl shadow-lg transition-all hover:scale-105 active:scale-95"
              style={{
                background: layerPanelOpen ? 'rgba(22,163,74,0.95)' : 'rgba(15,23,42,0.85)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.15)',
              }}
            >
              <div className="w-5 h-5 rounded-md flex-shrink-0" style={{ background: currentLayerCfg.swatch }} />
              <span className="text-xs font-semibold text-white">{currentLayerCfg.label}</span>
              <svg
                className={`w-3.5 h-3.5 text-white/70 transition-transform ${layerPanelOpen ? 'rotate-180' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
              </svg>
            </button>
          </div>

          {/* Mobile: talhões toggle button — above zoom controls */}
          <button
            onClick={() => setMobileFieldsOpen(o => !o)}
            className="md:hidden absolute bottom-28 right-3 z-[1000] flex items-center gap-1.5 px-3 py-2 rounded-xl shadow-lg text-xs font-semibold text-white transition-all hover:scale-105 active:scale-95"
            style={{
              background: mobileFieldsOpen ? 'rgba(22,163,74,0.95)' : 'rgba(15,23,42,0.85)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.15)',
            }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            Talhões{data.fields.length > 0 ? ` (${data.fields.length})` : ''}
          </button>
        </div>

        {/* Fields panel — desktop sidebar */}
        <div className="w-60 bg-white border-l border-slate-200 hidden md:flex flex-col flex-shrink-0">
          <div className="px-4 py-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-800">Talhões</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {data.fields.length} cadastrado{data.fields.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex-1 overflow-y-auto">
            <FieldsList />
          </div>
          <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/60">
            <p className="text-[10px] text-slate-400 leading-relaxed">
              Clique no 📍 ao lado do talhão, depois clique no mapa para posicioná-lo.
            </p>
          </div>
        </div>

        {/* Mobile: talhões bottom sheet */}
        {mobileFieldsOpen && (
          <div className="md:hidden absolute inset-x-0 bottom-0 z-[1001] bg-white rounded-t-2xl shadow-2xl flex flex-col" style={{ maxHeight: '55%' }}>
            {/* Handle + header */}
            <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Talhões</h3>
                <p className="text-xs text-slate-400 mt-0.5">{data.fields.length} cadastrado{data.fields.length !== 1 ? 's' : ''}</p>
              </div>
              <button
                onClick={() => setMobileFieldsOpen(false)}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <FieldsList onMarkField={() => setMobileFieldsOpen(false)} />
            </div>
            <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/60">
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Toque em 📍 ao lado do talhão, depois toque no mapa para posicioná-lo.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

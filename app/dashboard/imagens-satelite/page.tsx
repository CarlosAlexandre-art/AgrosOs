'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import HowToUse from '../../../components/HowToUse'
import ProPaywall from '../../../components/ProPaywall'
import { usePlan } from '../../../lib/hooks/usePlan'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type L = any

interface EsriService {
  id: string
  label: string
  sublabel: string
  url: string
  color: string
  attribution: string
}

const ESRI_SERVICES: EsriService[] = [
  {
    id: 'world_imagery',
    label: 'Satélite (True Color)',
    sublabel: 'Esri World Imagery — resolução sub-métrica',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    color: '#22c55e',
    attribution: '&copy; Esri, Maxar, Earthstar Geographics',
  },
  {
    id: 'world_topo',
    label: 'Topográfico',
    sublabel: 'Esri World Topo Map',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    color: '#7cb9a8',
    attribution: '&copy; Esri, HERE, DeLorme',
  },
  {
    id: 'terrain_base',
    label: 'Relevo Sombreado',
    sublabel: 'Esri World Shaded Relief',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Shaded_Relief/MapServer/tile/{z}/{y}/{x}',
    color: '#a78bfa',
    attribution: '&copy; Esri, USGS, NOAA',
  },
  {
    id: 'nat_geo',
    label: 'National Geographic',
    sublabel: 'Esri NatGeo World Map',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}',
    color: '#fbbf24',
    attribution: '&copy; Esri, National Geographic',
  },
  {
    id: 'ocean_base',
    label: 'Oceano / Hidrologia',
    sublabel: 'Esri Ocean Basemap',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}',
    color: '#38bdf8',
    attribution: '&copy; Esri, GEBCO',
  },
  {
    id: 'world_gray',
    label: 'Canvas Cinza',
    sublabel: 'Esri Light Gray Canvas',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    color: '#94a3b8',
    attribution: '&copy; Esri, HERE, DeLorme',
  },
]

function ImagensSateliteContent() {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<L>(null)
  const tileLayerRef = useRef<L>(null)

  const [activeId, setActiveId] = useState('world_imagery')
  const [zoom, setZoom] = useState(5)
  const [center, setCenter] = useState({ lat: -14.235, lng: -51.925 })
  const [showInfo, setShowInfo] = useState(false)

  const activeService = ESRI_SERVICES.find(s => s.id === activeId)!

  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current || mapInstance.current) return
    const cssId = 'lf6'
    if (!document.getElementById(cssId)) {
      const l = document.createElement('link'); l.id = cssId; l.rel = 'stylesheet'
      l.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'; document.head.appendChild(l)
    }
    const init = () => {
      if (!mapRef.current || mapInstance.current) return
      const Lx: L = (window as L).L; delete Lx.Icon.Default.prototype._getIconUrl
      const map = Lx.map(mapRef.current, { center: [-14.235, -51.925], zoom: 5 })
      mapInstance.current = map
      tileLayerRef.current = Lx.tileLayer(ESRI_SERVICES[0].url, { attribution: ESRI_SERVICES[0].attribution, maxZoom: 20 }).addTo(map)

      map.on('zoomend moveend', () => {
        setZoom(map.getZoom())
        const c = map.getCenter()
        setCenter({ lat: parseFloat(c.lat.toFixed(5)), lng: parseFloat(c.lng.toFixed(5)) })
      })
    }
    if ((window as L).L) init()
    else { const s = document.createElement('script'); s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'; s.onload = init; document.body.appendChild(s) }
    return () => { mapInstance.current?.remove(); mapInstance.current = null }
  }, [])

  const switchService = useCallback((id: string) => {
    const map = mapInstance.current; if (!map || !(window as L).L) return
    const Lx: L = (window as L).L
    const svc = ESRI_SERVICES.find(s => s.id === id)!
    if (tileLayerRef.current) { map.removeLayer(tileLayerRef.current) }
    tileLayerRef.current = Lx.tileLayer(svc.url, { attribution: svc.attribution, maxZoom: 20 }).addTo(map)
    setActiveId(id)
  }, [])

  const handleDownload = useCallback(() => {
    const map = mapInstance.current; if (!map) return
    const bounds = map.getBounds()
    const svc = activeService
    // Build ESRI REST export URL
    const bbox = `${bounds.getWest()},${bounds.getSouth()},${bounds.getEast()},${bounds.getNorth()}`
    const url = `https://server.arcgisonline.com/ArcGIS/rest/services/${svc.id.includes('world') ? svc.url.split('/services/')[1].split('/MapServer')[0] : 'World_Imagery/MapServer'}/export?bbox=${bbox}&bboxSR=4326&size=2048,2048&imageSR=4326&format=png&transparent=false&f=image`
    window.open(url, '_blank')
  }, [activeService])

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: '#0a0e1a' }}>
      {/* Header */}
      <div className="flex-shrink-0 border-b" style={{ background: 'rgba(10,14,26,0.97)', borderColor: 'rgba(255,255,255,0.07)' }}>
        <div className="px-5 py-3 flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(56,189,248,0.15)', border: '1px solid rgba(56,189,248,0.3)' }}>
              <svg className="w-4 h-4 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-sm font-bold text-white">Imagens de Satélite</h1>
              <p className="text-[10px] text-slate-500">ArcGIS ImageServer · 6 camadas Esri</p>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono text-[10px] text-slate-400" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <span>{center.lat}°, {center.lng}°</span>
              <span className="text-slate-600">·</span>
              <span>z{zoom}</span>
            </div>
            <button onClick={() => setShowInfo(o => !o)} className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all" style={{ background: showInfo ? 'rgba(56,189,248,0.2)' : 'rgba(255,255,255,0.06)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.3)' }}>
              Serviços
            </button>
            <button onClick={handleDownload} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-sky-400 transition-all" style={{ background: 'rgba(56,189,248,0.12)', border: '1px solid rgba(56,189,248,0.3)' }}>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
              Exportar
            </button>
          </div>
        </div>

        {/* Service selector */}
        {showInfo && (
          <div className="px-5 pb-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
            {ESRI_SERVICES.map(svc => (
              <button key={svc.id} onClick={() => switchService(svc.id)}
                className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all"
                style={activeId === svc.id
                  ? { background: `${svc.color}20`, border: `1px solid ${svc.color}50` }
                  : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }
                }>
                <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1" style={{ background: svc.color }} />
                <div>
                  <div className="text-xs font-semibold" style={{ color: activeId === svc.id ? svc.color : '#e2e8f0' }}>{svc.label}</div>
                  <div className="text-[9px] text-slate-500 mt-0.5 leading-tight line-clamp-2">{svc.sublabel}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Educational guide */}
      <div className="flex-shrink-0 border-b px-4 py-2" style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(10,14,26,0.97)' }}>
        <HowToUse
          storageKey="imagens-satelite"
          title="Imagens de Satélite Esri"
          subtitle="Acesso a 6 camadas de imageamento via ArcGIS ImageServer"
          theme="dark"
          accentColor="#38bdf8"
          steps={[
            { icon: '🗺️', title: 'Mapa automático', description: 'O mapa carrega com a imagem de satélite True Color da Esri (World Imagery) com resolução sub-métrica em áreas urbanas e agrícolas.' },
            { icon: '🔘', title: 'Troque a camada', description: 'Clique no botão "Serviços" para ver as 6 camadas disponíveis: satélite, topográfico, relevo sombreado, National Geographic, oceano e canvas cinza.' },
            { icon: '📡', title: 'Escolha a camada', description: 'Selecione a camada ideal para sua análise. Satélite é melhor para identificar culturas; topográfico é ideal para análise de relevo e drenagem.' },
            { icon: '💾', title: 'Exporte a área', description: 'Clique em "Exportar" para baixar a área visível no mapa como imagem PNG 2048×2048 pixels via API REST da Esri.' },
          ]}
          tip="A camada 'Relevo Sombreado' (Esri World Shaded Relief) é excelente para identificar padrões de drenagem e declividade do terreno sem dados LiDAR."
        />
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <div ref={mapRef} className="absolute inset-0" />
        {/* Active layer badge */}
        <div className="absolute top-3 right-3 z-[1000] pointer-events-none">
          <div className="px-3 py-1.5 rounded-xl text-xs font-semibold" style={{ background: 'rgba(10,14,26,0.85)', backdropFilter: 'blur(8px)', border: `1px solid ${activeService.color}40`, color: activeService.color }}>
            {activeService.label}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ImagensSatelitePage() {
  const { loading, isPro } = usePlan()
  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-slate-200 border-t-[#16a34a] rounded-full animate-spin" /></div>
  if (!isPro) return <ProPaywall icon="🌍" feature="Imagens de Satélite" desc="Acesse 6 camadas de imagens Esri (satélite, topográfico, relevo, NatGeo, oceano) para análise visual do território." />
  return <ImagensSateliteContent />
}

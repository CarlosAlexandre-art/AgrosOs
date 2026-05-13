'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import HowToUse from '../../../components/HowToUse'
import ProPaywall from '../../../components/ProPaywall'
import { usePlan } from '../../../lib/hooks/usePlan'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type L = any

interface GpxPoint {
  lat: number
  lng: number
  ele: number
  time: Date | null
  speedKmh: number
}

interface GpxStats {
  totalPoints: number
  distanceKm: number
  durationMin: number
  avgSpeedKmh: number
  maxSpeedKmh: number
  minSpeedKmh: number
  areaHa: number
  trackName: string
}

function parseGpx(xmlText: string): { points: GpxPoint[]; stats: GpxStats } {
  const parser = new DOMParser()
  const doc = parser.parseFromString(xmlText, 'application/xml')

  const trackName = doc.querySelector('name')?.textContent ?? 'Trajeto sem nome'
  const trkpts = Array.from(doc.querySelectorAll('trkpt'))

  const points: GpxPoint[] = trkpts.map(pt => ({
    lat: parseFloat(pt.getAttribute('lat') ?? '0'),
    lng: parseFloat(pt.getAttribute('lon') ?? '0'),
    ele: parseFloat(pt.querySelector('ele')?.textContent ?? '0'),
    time: pt.querySelector('time')?.textContent ? new Date(pt.querySelector('time')!.textContent!) : null,
    speedKmh: 0,
  }))

  // Calculate speed between consecutive points
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]
    const curr = points[i]
    const R = 6371 // Earth radius km
    const dLat = (curr.lat - prev.lat) * Math.PI / 180
    const dLng = (curr.lng - prev.lng) * Math.PI / 180
    const a = Math.sin(dLat/2)**2 + Math.cos(prev.lat * Math.PI/180) * Math.cos(curr.lat * Math.PI/180) * Math.sin(dLng/2)**2
    const distKm = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))

    let speedKmh = 0
    if (prev.time && curr.time) {
      const dtHours = (curr.time.getTime() - prev.time.getTime()) / 3_600_000
      if (dtHours > 0) speedKmh = Math.min(120, distKm / dtHours)
    } else {
      speedKmh = 5 // default walking pace estimate
    }
    curr.speedKmh = parseFloat(speedKmh.toFixed(2))
  }
  if (points.length > 0) points[0].speedKmh = points[1]?.speedKmh ?? 0

  // Stats
  let totalDist = 0
  for (let i = 1; i < points.length; i++) {
    const prev = points[i-1]; const curr = points[i]
    const R = 6371
    const dLat = (curr.lat - prev.lat) * Math.PI / 180
    const dLng = (curr.lng - prev.lng) * Math.PI / 180
    const a = Math.sin(dLat/2)**2 + Math.cos(prev.lat * Math.PI/180) * Math.cos(curr.lat * Math.PI/180) * Math.sin(dLng/2)**2
    totalDist += R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  }

  const speeds = points.map(p => p.speedKmh).filter(s => s > 0)
  const avgSpeed = speeds.length > 0 ? speeds.reduce((a,b) => a+b, 0) / speeds.length : 0
  const maxSpeed = speeds.length > 0 ? Math.max(...speeds) : 0
  const minSpeed = speeds.length > 0 ? Math.min(...speeds) : 0

  const first = points[0]?.time; const last = points[points.length-1]?.time
  const durationMin = first && last ? (last.getTime() - first.getTime()) / 60_000 : 0

  // Rough area estimate using bounding box
  const lats = points.map(p => p.lat); const lngs = points.map(p => p.lng)
  const dLatDeg = Math.max(...lats) - Math.min(...lats)
  const dLngDeg = Math.max(...lngs) - Math.min(...lngs)
  const latKm = dLatDeg * 111; const lngKm = dLngDeg * 111 * Math.cos(points[0]?.lat * Math.PI/180 || 0)
  const areaHa = latKm * lngKm * 100

  return {
    points,
    stats: {
      totalPoints: points.length,
      distanceKm: parseFloat(totalDist.toFixed(2)),
      durationMin: parseFloat(durationMin.toFixed(1)),
      avgSpeedKmh: parseFloat(avgSpeed.toFixed(1)),
      maxSpeedKmh: parseFloat(maxSpeed.toFixed(1)),
      minSpeedKmh: parseFloat(minSpeed.toFixed(1)),
      areaHa: parseFloat(areaHa.toFixed(1)),
      trackName,
    },
  }
}

function speedColor(speed: number, max: number): string {
  const ratio = max > 0 ? speed / max : 0
  if (ratio > 0.8) return '#ef4444'
  if (ratio > 0.6) return '#f97316'
  if (ratio > 0.4) return '#f59e0b'
  if (ratio > 0.2) return '#22c55e'
  return '#3b82f6'
}

function SpeedometerGauge({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? value / max : 0
  const cx = 80; const cy = 80; const r = 62
  const startAngle = 225; const endAngle = 315
  const range = 270
  const angle = startAngle + range * Math.min(pct, 1)
  const toRad = (a: number) => (a - 90) * Math.PI / 180
  const px = (a: number) => cx + r * Math.cos(toRad(a))
  const py = (a: number) => cy + r * Math.sin(toRad(a))
  const largeArc = range * Math.min(pct, 1) > 180 ? 1 : 0
  const col = speedColor(value, max || 1)

  const ticks = [0, 0.25, 0.5, 0.75, 1]

  return (
    <svg viewBox="0 0 160 120" className="w-full max-w-[180px]">
      {/* Track */}
      <path d={`M${px(startAngle)} ${py(startAngle)} A${r} ${r} 0 1 1 ${px(endAngle)} ${py(endAngle)}`}
        fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12" strokeLinecap="round" />
      {/* Speed arc */}
      {pct > 0.01 && (
        <path d={`M${px(startAngle)} ${py(startAngle)} A${r} ${r} 0 ${largeArc} 1 ${px(angle)} ${py(angle)}`}
          fill="none" stroke={col} strokeWidth="12" strokeLinecap="round" />
      )}
      {/* Tick marks */}
      {ticks.map(t => {
        const a = startAngle + 270 * t
        const ir = r - 10; const or = r + 2
        return (
          <line key={t}
            x1={cx + ir * Math.cos(toRad(a))} y1={cy + ir * Math.sin(toRad(a))}
            x2={cx + or * Math.cos(toRad(a))} y2={cy + or * Math.sin(toRad(a))}
            stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
        )
      })}
      {/* Value */}
      <text x={cx} y={cy - 6} textAnchor="middle" fill="white" fontSize="22" fontWeight="800"
        fontFamily="system-ui, sans-serif">{value.toFixed(1)}</text>
      <text x={cx} y={cy + 10} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="9">km/h</text>
      <text x={cx} y={cy + 22} textAnchor="middle" fill={col} fontSize="8" fontWeight="600">MAX {max} km/h</text>
    </svg>
  )
}

function GpxVelocidadeContent() {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<L>(null)
  const trackLayer = useRef<L>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [gpxData, setGpxData] = useState<{ points: GpxPoint[]; stats: GpxStats } | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [fileName, setFileName] = useState('')
  const [panelOpen, setPanelOpen] = useState(false)

  // Init map
  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current || mapInstance.current) return
    const cssId = 'leaflet-css3'
    if (!document.getElementById(cssId)) {
      const link = document.createElement('link'); link.id = cssId; link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
    }
    const init = () => {
      if (!mapRef.current || mapInstance.current) return
      const Lx: L = (window as L).L
      delete Lx.Icon.Default.prototype._getIconUrl
      const map = Lx.map(mapRef.current, { center: [-14.235, -51.925], zoom: 5, zoomControl: true })
      mapInstance.current = map
      Lx.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { attribution: '&copy; Esri', maxZoom: 20 }).addTo(map)
    }
    if ((window as L).L) init()
    else {
      const s = document.createElement('script'); s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
      s.onload = init; document.body.appendChild(s)
    }
    return () => { mapInstance.current?.remove(); mapInstance.current = null }
  }, [])

  const renderTrack = useCallback((points: GpxPoint[]) => {
    const map = mapInstance.current
    if (!map || !(window as L).L || points.length < 2) return
    const Lx: L = (window as L).L

    if (trackLayer.current) { map.removeLayer(trackLayer.current); trackLayer.current = null }

    const maxSpeed = Math.max(...points.map(p => p.speedKmh))
    const group = Lx.layerGroup()

    // Draw polyline segments colored by speed
    for (let i = 1; i < points.length; i++) {
      const prev = points[i-1]; const curr = points[i]
      const avgSpeed = (prev.speedKmh + curr.speedKmh) / 2
      const color = speedColor(avgSpeed, maxSpeed)
      Lx.polyline([[prev.lat, prev.lng], [curr.lat, curr.lng]], {
        color, weight: 4, opacity: 0.9
      }).addTo(group)
    }

    // Start/end markers
    const startIcon = Lx.divIcon({ className: '', html: '<div style="background:#22c55e;width:12px;height:12px;border-radius:50%;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.5)"></div>', iconSize:[12,12], iconAnchor:[6,6] })
    const endIcon = Lx.divIcon({ className: '', html: '<div style="background:#ef4444;width:12px;height:12px;border-radius:50%;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.5)"></div>', iconSize:[12,12], iconAnchor:[6,6] })
    Lx.marker([points[0].lat, points[0].lng], { icon: startIcon }).bindPopup('Início').addTo(group)
    Lx.marker([points[points.length-1].lat, points[points.length-1].lng], { icon: endIcon }).bindPopup('Fim').addTo(group)

    group.addTo(map)
    trackLayer.current = group

    // Fit map to track
    const bounds = Lx.latLngBounds(points.map(p => [p.lat, p.lng]))
    map.fitBounds(bounds, { padding: [30, 30] })
  }, [])

  function handleFile(file: File) {
    if (!file.name.toLowerCase().endsWith('.gpx')) return
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = e => {
      const text = e.target?.result as string
      const parsed = parseGpx(text)
      setGpxData(parsed)
      setTimeout(() => renderTrack(parsed.points), 300)
    }
    reader.readAsText(file)
  }

  const stats = gpxData?.stats

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: '#0d0d14' }}>
      {/* Header */}
      <div className="flex-shrink-0 px-5 py-3 flex items-center gap-4 border-b" style={{ background: 'rgba(13,13,20,0.95)', borderColor: 'rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.3)' }}>
            <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-bold text-white">GPX Velocidade</h1>
            <p className="text-[10px] text-slate-500">GPXVelocityCalculation · Rastreamento de máquinas</p>
          </div>
        </div>

        {stats && (
          <div className="ml-auto hidden sm:flex items-center gap-4">
            <div className="text-center">
              <div className="text-sm font-bold text-amber-400">{stats.distanceKm} km</div>
              <div className="text-[9px] text-slate-500">Distância</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-bold text-emerald-400">{stats.durationMin.toFixed(0)} min</div>
              <div className="text-[9px] text-slate-500">Duração</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-bold text-red-400">{stats.maxSpeedKmh} km/h</div>
              <div className="text-[9px] text-slate-500">Máx velocidade</div>
            </div>
          </div>
        )}

        {/* Upload trigger */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-400 transition-all"
          style={{ background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.3)' }}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
          {fileName ? fileName.replace('.gpx','') : 'Carregar GPX'}
        </button>
        <input ref={fileInputRef} type="file" accept=".gpx" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
      </div>

      {/* Educational guide */}
      <div className="flex-shrink-0 border-b px-4 py-2" style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(13,13,20,0.97)' }}>
        <HowToUse
          storageKey="gpx-velocidade"
          title="Análise de Velocidade GPS"
          subtitle="Visualize o trajeto de máquinas agrícolas colorido por velocidade · GPXVelocityCalculation"
          theme="dark"
          accentColor="#fbbf24"
          steps={[
            { icon: '📤', title: 'Carregue um .GPX', description: 'Arraste ou clique para carregar um arquivo GPX exportado de GPS agrícola (Garmin, Trimble), aplicativo (OsmAnd, Strava) ou equipamento de campo.' },
            { icon: '🗺️', title: 'Veja o trajeto', description: 'O trajeto aparece no mapa com cada segmento colorido pela velocidade: azul (lento) → verde → âmbar → laranja → vermelho (rápido).' },
            { icon: '🏎️', title: 'Analise as estatísticas', description: 'O painel esquerdo exibe o velocímetro, distância total, duração, velocidade média, máxima e área aproximada cobrida pelo percurso.' },
            { icon: '🔎', title: 'Identifique padrões', description: 'Segmentos lentos (azul) podem indicar manobras ou falhas mecânicas. Segmentos rápidos (vermelho) indicam deslocamento sem operação.' },
          ]}
          tip="Sem dados de tempo no GPX, o sistema usa 5 km/h como estimativa padrão. Para velocidades reais, certifique-se de que o GPS grava timestamps."
        />
      </div>

      <div className="flex flex-1 min-h-0 relative">
        {/* Stats panel — sidebar on desktop, bottom sheet on mobile */}
        <div
          className={[
            'flex-col overflow-y-auto border-r flex-shrink-0',
            panelOpen
              ? 'flex absolute inset-x-0 bottom-0 max-h-[65%] z-[1001] rounded-t-2xl shadow-2xl'
              : 'hidden',
            'md:flex md:relative md:inset-auto md:bottom-auto md:z-auto md:max-h-none md:rounded-none md:w-56 md:shadow-none',
          ].join(' ')}
          style={{ background: 'rgba(13,13,20,0.97)', borderColor: 'rgba(255,255,255,0.07)' }}
        >
          {/* Mobile close button */}
          <div className="md:hidden flex items-center justify-between px-4 py-2.5 border-b flex-shrink-0" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
            <span className="text-xs font-bold text-white">Estatísticas</span>
            <button onClick={() => setPanelOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {!gpxData ? (
            <div
              className={`m-3 flex-1 border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-4 text-center cursor-pointer transition-all ${dragOver ? 'border-amber-400 bg-amber-400/10' : 'border-white/10 hover:border-white/20'}`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
            >
              <svg className="w-8 h-8 text-amber-400/50 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
              </svg>
              <p className="text-xs font-semibold text-slate-300">Arraste um arquivo .GPX</p>
              <p className="text-[10px] text-slate-500 mt-1">Exportado de GPS, Garmin, Trimble, etc.</p>
            </div>
          ) : (
            <>
              {/* Speedometer */}
              <div className="p-4 flex flex-col items-center border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                <SpeedometerGauge value={stats!.avgSpeedKmh} max={stats!.maxSpeedKmh} />
                <div className="text-[10px] text-slate-500 mt-1">Velocidade média</div>
              </div>

              {/* Stats grid */}
              <div className="p-4 space-y-3">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Estatísticas</div>
                {[
                  { label: 'Trajeto', value: stats!.trackName, mono: false, color: '#f1f5f9' },
                  { label: 'Pontos GPS', value: stats!.totalPoints.toLocaleString(), mono: true, color: '#94a3b8' },
                  { label: 'Distância', value: `${stats!.distanceKm} km`, mono: true, color: '#fbbf24' },
                  { label: 'Duração', value: `${stats!.durationMin.toFixed(0)} min`, mono: true, color: '#34d399' },
                  { label: 'Velocidade média', value: `${stats!.avgSpeedKmh} km/h`, mono: true, color: '#60a5fa' },
                  { label: 'Velocidade máx', value: `${stats!.maxSpeedKmh} km/h`, mono: true, color: '#f87171' },
                  { label: 'Área (bbox)', value: `${stats!.areaHa} ha`, mono: true, color: '#a78bfa' },
                ].map(item => (
                  <div key={item.label} className="flex justify-between items-start gap-2">
                    <span className="text-[10px] text-slate-500 flex-shrink-0">{item.label}</span>
                    <span className={`text-xs font-semibold text-right truncate max-w-[100px] ${item.mono ? 'font-mono' : ''}`} style={{ color: item.color }}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Speed legend */}
              <div className="px-4 pb-4">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Escala de velocidade</div>
                <div className="space-y-1.5">
                  {[
                    { label: 'Muito rápido (>80%)', color: '#ef4444' },
                    { label: 'Rápido (60-80%)', color: '#f97316' },
                    { label: 'Moderado (40-60%)', color: '#f59e0b' },
                    { label: 'Lento (20-40%)', color: '#22c55e' },
                    { label: 'Muito lento (<20%)', color: '#3b82f6' },
                  ].map(item => (
                    <div key={item.label} className="flex items-center gap-2">
                      <div className="w-3 h-1.5 rounded-full flex-shrink-0" style={{ background: item.color }} />
                      <span className="text-[9px] text-slate-500">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Map */}
        <div className="flex-1 relative">
          <div ref={mapRef} className="absolute inset-0" />
          {/* Mobile panel toggle */}
          <button
            onClick={() => setPanelOpen(o => !o)}
            className="md:hidden absolute bottom-20 right-3 z-[1000] flex items-center gap-1.5 px-3 py-2 rounded-xl shadow-lg text-xs font-semibold text-white transition-all hover:scale-105 active:scale-95"
            style={{
              background: panelOpen ? 'rgba(251,191,36,0.95)' : 'rgba(13,13,20,0.85)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.15)',
            }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Velocidade
          </button>
          {!gpxData && (
            <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none" style={{ background: 'rgba(13,13,20,0.6)' }}>
              <div className="text-center px-6">
                <div className="text-5xl mb-4 opacity-30">🚜</div>
                <p className="text-base font-bold text-white/60">Carregue um arquivo GPX</p>
                <p className="text-xs text-slate-600 mt-1">para visualizar o trajeto colorido por velocidade</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function GpxVelocidadePage() {
  const { loading, isPro } = usePlan()
  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-slate-200 border-t-[#16a34a] rounded-full animate-spin" /></div>
  if (!isPro) return <ProPaywall icon="⚡" feature="GPX Velocidade" desc="Faça upload de arquivos GPX e visualize velocidade por trecho em mapa interativo com análise de desempenho de máquinas." />
  return <GpxVelocidadeContent />
}

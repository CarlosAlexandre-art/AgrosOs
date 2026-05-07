'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type L = any

interface GpxPoint {
  lat: number; lng: number; time: Date | null
  speed: number; idx: number
}

function parseGpx(xml: string): GpxPoint[] {
  const doc = new DOMParser().parseFromString(xml, 'application/xml')
  const trkpts = Array.from(doc.querySelectorAll('trkpt'))
  const pts: GpxPoint[] = trkpts.map((pt, i) => ({
    lat: parseFloat(pt.getAttribute('lat') ?? '0'),
    lng: parseFloat(pt.getAttribute('lon') ?? '0'),
    time: pt.querySelector('time')?.textContent ? new Date(pt.querySelector('time')!.textContent!) : null,
    speed: 0, idx: i,
  }))
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i-1]; const c = pts[i]
    const R = 6371
    const dLat = (c.lat-p.lat)*Math.PI/180; const dLng = (c.lng-p.lng)*Math.PI/180
    const a = Math.sin(dLat/2)**2 + Math.cos(p.lat*Math.PI/180)*Math.cos(c.lat*Math.PI/180)*Math.sin(dLng/2)**2
    const dist = R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a))
    if (p.time && c.time) {
      const dtH = (c.time.getTime()-p.time.getTime())/3600000
      if (dtH > 0) c.speed = Math.min(120, dist/dtH)
    }
  }
  if (pts.length) pts[0].speed = pts[1]?.speed ?? 0
  return pts
}

function timeColor(idx: number, total: number): string {
  const t = total > 1 ? idx/(total-1) : 0
  // Cool→warm: blue→cyan→green→yellow→orange→red
  if (t < 0.2) return '#3b82f6'
  if (t < 0.4) return '#06b6d4'
  if (t < 0.6) return '#22c55e'
  if (t < 0.8) return '#f59e0b'
  return '#ef4444'
}

export default function GpxTrajetoriaPage() {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<L>(null)
  const trackGroupRef = useRef<L>(null)
  const playMarkerRef = useRef<L>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const [points, setPoints] = useState<GpxPoint[]>([])
  const [playPos, setPlayPos] = useState(0)
  const [playing, setPlaying] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [fileName, setFileName] = useState('')
  const [dragOver, setDragOver] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current || mapInstance.current) return
    const cssId = 'lf5'
    if (!document.getElementById(cssId)) {
      const l = document.createElement('link'); l.id = cssId; l.rel = 'stylesheet'
      l.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'; document.head.appendChild(l)
    }
    const init = () => {
      if (!mapRef.current || mapInstance.current) return
      const Lx: L = (window as L).L; delete Lx.Icon.Default.prototype._getIconUrl
      const map = Lx.map(mapRef.current, { center: [-14.235, -51.925], zoom: 5, zoomControl: true })
      mapInstance.current = map
      Lx.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { attribution: '&copy; Esri', maxZoom: 20 }).addTo(map)
    }
    if ((window as L).L) init()
    else { const s = document.createElement('script'); s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'; s.onload = init; document.body.appendChild(s) }
    return () => { mapInstance.current?.remove(); mapInstance.current = null }
  }, [])

  const drawTrack = useCallback((pts: GpxPoint[]) => {
    const map = mapInstance.current; if (!map || !(window as L).L || pts.length < 2) return
    const Lx: L = (window as L).L
    if (trackGroupRef.current) map.removeLayer(trackGroupRef.current)
    const grp = Lx.layerGroup()
    for (let i = 1; i < pts.length; i++) {
      Lx.polyline([[pts[i-1].lat, pts[i-1].lng],[pts[i].lat, pts[i].lng]], {
        color: timeColor(i, pts.length), weight: 3.5, opacity: 0.85
      }).addTo(grp)
    }
    grp.addTo(map); trackGroupRef.current = grp
    map.fitBounds(Lx.latLngBounds(pts.map(p => [p.lat, p.lng])), { padding: [30,30] })
  }, [])

  // Playback
  useEffect(() => {
    if (!playing || points.length === 0) return
    intervalRef.current = setInterval(() => {
      setPlayPos(p => {
        if (p >= points.length - 1) { setPlaying(false); return p }
        return p + 1
      })
    }, 40)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [playing, points.length])

  // Update play marker
  useEffect(() => {
    const map = mapInstance.current; if (!map || !(window as L).L || points.length === 0) return
    const Lx: L = (window as L).L
    const pt = points[playPos]
    if (!pt) return
    const icon = Lx.divIcon({ className: '', html: `<div style="background:${timeColor(playPos, points.length)};width:10px;height:10px;border-radius:50%;border:2px solid white;box-shadow:0 0 6px rgba(0,0,0,.5)"></div>`, iconSize:[10,10], iconAnchor:[5,5] })
    if (playMarkerRef.current) { playMarkerRef.current.setLatLng([pt.lat, pt.lng]); playMarkerRef.current.setIcon(icon) }
    else { playMarkerRef.current = Lx.marker([pt.lat, pt.lng], { icon, zIndexOffset: 1000 }).addTo(map) }
  }, [playPos, points])

  function handleFile(file: File) {
    if (!file.name.toLowerCase().endsWith('.gpx')) return
    setFileName(file.name); setPlayPos(0); setPlaying(false)
    const r = new FileReader(); r.onload = e => {
      const pts = parseGpx(e.target?.result as string)
      setPoints(pts); setTimeout(() => drawTrack(pts), 300)
    }; r.readAsText(file)
  }

  const first = points[0]; const last = points[points.length-1]
  const durationMin = first?.time && last?.time ? ((last.time.getTime()-first.time.getTime())/60000).toFixed(0) : '—'
  const currentPt = points[playPos]

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: '#080c14' }}>
      <div className="flex-shrink-0 px-5 py-3 flex items-center gap-4 border-b" style={{ background: 'rgba(8,12,20,0.97)', borderColor: 'rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.3)' }}>
            <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8.689c0-.864.933-1.406 1.683-.977l7.108 4.061a1.125 1.125 0 010 1.954l-7.108 4.061A1.125 1.125 0 013 16.811V8.69zM12.75 8.689c0-.864.933-1.406 1.683-.977l7.108 4.061a1.125 1.125 0 010 1.954l-7.108 4.061a1.125 1.125 0 01-1.683-.977V8.69z" />
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-bold text-white">GPX Trajetória Temporal</h1>
            <p className="text-[10px] text-slate-500">GPX Space-Time Cube · Análise de percurso</p>
          </div>
        </div>
        <button onClick={() => fileRef.current?.click()} className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-cyan-400 transition-all" style={{ background: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.3)' }}>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
          {fileName ? fileName.replace('.gpx','') : 'Carregar GPX'}
        </button>
        <input ref={fileRef} type="file" accept=".gpx" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Side panel */}
        <div className="w-48 flex-shrink-0 border-r flex flex-col overflow-y-auto" style={{ background: 'rgba(8,12,20,0.97)', borderColor: 'rgba(255,255,255,0.07)' }}>
          {points.length === 0 ? (
            <div className={`m-3 flex-1 border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-4 text-center cursor-pointer ${dragOver ? 'border-cyan-400 bg-cyan-400/10' : 'border-white/10'}`}
              onClick={() => fileRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}>
              <p className="text-[10px] font-semibold text-slate-400">Arraste um .GPX</p>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {/* Playback */}
              <div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Reprodução</div>
                <button onClick={() => setPlaying(p => !p)} className="w-full py-2 rounded-lg text-xs font-semibold transition-all" style={{ background: playing ? 'rgba(239,68,68,0.15)' : 'rgba(6,182,212,0.15)', color: playing ? '#f87171' : '#22d3ee', border: `1px solid ${playing ? 'rgba(239,68,68,0.3)' : 'rgba(6,182,212,0.3)'}` }}>
                  {playing ? '⏸ Pausar' : '▶ Reproduzir'}
                </button>
                <input type="range" min="0" max={Math.max(points.length-1,1)} value={playPos} onChange={e => { setPlaying(false); setPlayPos(Number(e.target.value)) }} className="w-full mt-2" style={{ accentColor: '#22d3ee' }} />
                <div className="flex justify-between text-[9px] text-slate-500 mt-1">
                  <span>{playPos + 1}</span><span>{points.length}</span>
                </div>
              </div>

              {/* Current point */}
              {currentPt && (
                <div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Ponto atual</div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between"><span className="text-[10px] text-slate-500">Lat</span><span className="text-[10px] font-mono" style={{ color: timeColor(playPos, points.length) }}>{currentPt.lat.toFixed(5)}</span></div>
                    <div className="flex justify-between"><span className="text-[10px] text-slate-500">Lng</span><span className="text-[10px] font-mono" style={{ color: timeColor(playPos, points.length) }}>{currentPt.lng.toFixed(5)}</span></div>
                    {currentPt.time && <div className="flex justify-between"><span className="text-[10px] text-slate-500">Hora</span><span className="text-[10px] font-mono text-slate-300">{currentPt.time.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}</span></div>}
                    <div className="flex justify-between"><span className="text-[10px] text-slate-500">Velocidade</span><span className="text-[10px] font-mono text-amber-400">{currentPt.speed.toFixed(1)} km/h</span></div>
                  </div>
                </div>
              )}

              {/* Stats */}
              <div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Trajeto</div>
                <div className="space-y-1.5">
                  <div className="flex justify-between"><span className="text-[10px] text-slate-500">Pontos</span><span className="text-[10px] font-mono text-white">{points.length}</span></div>
                  <div className="flex justify-between"><span className="text-[10px] text-slate-500">Duração</span><span className="text-[10px] font-mono text-cyan-400">{durationMin} min</span></div>
                </div>
              </div>

              {/* Time color legend */}
              <div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Tempo → Cor</div>
                <div className="h-3 rounded-full w-full" style={{ background: 'linear-gradient(90deg, #3b82f6, #06b6d4, #22c55e, #f59e0b, #ef4444)' }} />
                <div className="flex justify-between text-[8px] text-slate-500 mt-1"><span>Início</span><span>Fim</span></div>
              </div>
            </div>
          )}
        </div>

        {/* Map */}
        <div className="flex-1 relative">
          <div ref={mapRef} className="absolute inset-0" />
          {points.length === 0 && (
            <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none" style={{ background: 'rgba(8,12,20,0.7)' }}>
              <div className="text-center"><div className="text-4xl mb-3 opacity-30">📡</div><p className="text-sm font-bold text-white/50">Carregue um arquivo GPX</p></div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

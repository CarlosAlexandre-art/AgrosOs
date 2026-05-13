'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import HowToUse from '../../../components/HowToUse'
import ProPaywall from '../../../components/ProPaywall'
import { usePlan } from '../../../lib/hooks/usePlan'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type L = any

interface ProfilePoint { distKm: number; elevation: number }
interface ProfileResult {
  profile: ProfilePoint[]
  distanceKm: number
  stats: {
    minElev: number; maxElev: number; avgElev: number
    totalRise: number; totalDescent: number; maxSlopeDeg: number
  }
}

function elevColor(elev: number, min: number, max: number): string {
  const t = max > min ? (elev - min) / (max - min) : 0.5
  if (t < 0.25) return '#3b82f6'
  if (t < 0.5) return '#22c55e'
  if (t < 0.75) return '#f59e0b'
  return '#ef4444'
}

function PerfilElevacaoContent() {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<L>(null)
  const markersRef = useRef<L[]>([])
  const lineRef = useRef<L>(null)
  const hoverLineRef = useRef<L>(null)

  const [step, setStep] = useState<'pick-start' | 'pick-end' | 'done'>('pick-start')
  const [startPt, setStartPt] = useState<[number, number] | null>(null)
  const [endPt, setEndPt] = useState<[number, number] | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ProfileResult | null>(null)
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current || mapInstance.current) return
    const cssId = 'leaflet-css4'
    if (!document.getElementById(cssId)) {
      const lnk = document.createElement('link'); lnk.id = cssId; lnk.rel = 'stylesheet'
      lnk.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'; document.head.appendChild(lnk)
    }
    const init = () => {
      if (!mapRef.current || mapInstance.current) return
      const Lx: L = (window as L).L
      delete Lx.Icon.Default.prototype._getIconUrl
      const map = Lx.map(mapRef.current, { center: [-14.235, -51.925], zoom: 5, zoomControl: true })
      mapInstance.current = map
      Lx.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
        { attribution: '&copy; Esri', maxZoom: 20 }).addTo(map)
    }
    if ((window as L).L) init()
    else {
      const s = document.createElement('script'); s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
      s.onload = init; document.body.appendChild(s)
    }
    return () => { mapInstance.current?.remove(); mapInstance.current = null }
  }, [])

  const clearMap = useCallback(() => {
    const map = mapInstance.current; if (!map) return
    markersRef.current.forEach(m => map.removeLayer(m)); markersRef.current = []
    if (lineRef.current) { map.removeLayer(lineRef.current); lineRef.current = null }
    if (hoverLineRef.current) { map.removeLayer(hoverLineRef.current); hoverLineRef.current = null }
  }, [])

  const handleReset = useCallback(() => {
    clearMap(); setStep('pick-start'); setStartPt(null); setEndPt(null); setResult(null)
  }, [clearMap])

  // Map click handler
  useEffect(() => {
    const map = mapInstance.current
    if (!map || !(window as L).L) return
    const Lx: L = (window as L).L

    const onClick = (e: L) => {
      const { lat, lng } = e.latlng

      if (step === 'pick-start') {
        clearMap()
        setStartPt([lat, lng]); setEndPt(null); setResult(null)

        const icon = Lx.divIcon({ className: '', html: '<div style="background:#22c55e;width:12px;height:12px;border-radius:50%;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,.4)"></div>', iconSize:[12,12], iconAnchor:[6,6] })
        const m = Lx.marker([lat, lng], { icon }).addTo(map)
        markersRef.current.push(m)
        setStep('pick-end')

      } else if (step === 'pick-end') {
        setEndPt([lat, lng])
        setStep('done')

        const start = startPt!
        const icon = Lx.divIcon({ className: '', html: '<div style="background:#ef4444;width:12px;height:12px;border-radius:50%;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,.4)"></div>', iconSize:[12,12], iconAnchor:[6,6] })
        const m = Lx.marker([lat, lng], { icon }).addTo(map)
        markersRef.current.push(m)

        if (lineRef.current) map.removeLayer(lineRef.current)
        lineRef.current = Lx.polyline([[start[0], start[1]], [lat, lng]], {
          color: '#f59e0b', weight: 2, dashArray: '6 4',
        }).addTo(map)

        // Auto-run
        setLoading(true)
        fetch('/api/perfil-elevacao', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ startLat: start[0], startLng: start[1], endLat: lat, endLng: lng }),
        }).then(r => r.json()).then(d => setResult(d)).finally(() => setLoading(false))
      }
    }

    map.on('click', onClick)
    return () => { map.off('click', onClick) }
  }, [step, startPt, clearMap])

  // Draw hover marker on map
  useEffect(() => {
    const map = mapInstance.current
    if (!map || !(window as L).L || !result || hoveredIdx === null) {
      if (hoverLineRef.current && mapInstance.current) {
        mapInstance.current.removeLayer(hoverLineRef.current)
        hoverLineRef.current = null
      }
      return
    }
    const Lx: L = (window as L).L
    const t = hoveredIdx / (result.profile.length - 1)
    const lat = startPt![0] + (endPt![0] - startPt![0]) * t
    const lng = startPt![1] + (endPt![1] - startPt![1]) * t
    const elev = result.profile[hoveredIdx].elevation
    const col = elevColor(elev, result.stats.minElev, result.stats.maxElev)

    if (hoverLineRef.current) map.removeLayer(hoverLineRef.current)
    hoverLineRef.current = Lx.circleMarker([lat, lng], {
      radius: 6, color: col, fillColor: col, fillOpacity: 1, weight: 2,
      pane: 'markerPane',
    }).addTo(map)
  }, [hoveredIdx, result, startPt, endPt])

  const profile = result?.profile ?? []
  const stats = result?.stats
  const svgH = 140; const svgW = 600
  const padL = 36; const padR = 8; const padT = 12; const padB = 28
  const chartW = svgW - padL - padR
  const chartH = svgH - padT - padB

  const xScale = (i: number) => padL + (i / Math.max(profile.length - 1, 1)) * chartW
  const yScale = (e: number) => {
    if (!stats) return padT + chartH / 2
    const range = stats.maxElev - stats.minElev || 1
    return padT + chartH - ((e - stats.minElev) / range) * chartH
  }

  const polyPath = profile.length > 1
    ? profile.map((p, i) => `${i === 0 ? 'M' : 'L'}${xScale(i).toFixed(1)} ${yScale(p.elevation).toFixed(1)}`).join(' ')
    : ''
  const fillPath = profile.length > 1
    ? `${polyPath} L${xScale(profile.length-1).toFixed(1)} ${(padT+chartH).toFixed(1)} L${padL} ${(padT+chartH).toFixed(1)} Z`
    : ''

  return (
    <div className="flex flex-col" style={{ background: '#0d1117' }}>
      {/* Header */}
      <div className="flex-shrink-0 px-5 py-3 flex items-center gap-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(13,17,23,0.97)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)' }}>
            <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-bold text-white">Perfil de Elevação</h1>
            <p className="text-[10px] text-slate-500">ProfileTool · Transecto de terreno</p>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-3">
          {stats && (
            <div className="hidden sm:flex items-center gap-4 text-center">
              <div><div className="text-xs font-bold text-amber-400">{result!.distanceKm} km</div><div className="text-[9px] text-slate-500">Distância</div></div>
              <div><div className="text-xs font-bold text-blue-400">{stats.minElev} m</div><div className="text-[9px] text-slate-500">Mín. elev.</div></div>
              <div><div className="text-xs font-bold text-red-400">{stats.maxElev} m</div><div className="text-[9px] text-slate-500">Máx. elev.</div></div>
              <div><div className="text-xs font-bold text-purple-400">{stats.maxSlopeDeg}°</div><div className="text-[9px] text-slate-500">Inclinação máx</div></div>
            </div>
          )}
          <button onClick={handleReset} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white transition-colors" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
            Novo transecto
          </button>
        </div>
      </div>

      {/* Instruction banner */}
      <div className="flex-shrink-0 px-5 py-2 flex items-center gap-2 text-xs border-b"
        style={{ background: step === 'done' ? 'rgba(22,163,74,0.1)' : 'rgba(245,158,11,0.1)', borderColor: step === 'done' ? 'rgba(22,163,74,0.2)' : 'rgba(245,158,11,0.2)', color: step === 'done' ? '#4ade80' : '#fbbf24' }}>
        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d={step === 'pick-start' ? 'M15 10.5a3 3 0 11-6 0 3 3 0 016 0z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z' : step === 'pick-end' ? 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z' : 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z'} />
        </svg>
        {step === 'pick-start' && 'Clique no mapa para definir o ponto inicial do transecto'}
        {step === 'pick-end' && 'Agora clique no ponto final do transecto'}
        {step === 'done' && (loading ? 'Consultando elevações via Open-Elevation API...' : 'Perfil calculado — passe o mouse sobre o gráfico para ver detalhes')}
      </div>

      {/* Educational guide */}
      <div className="flex-shrink-0 border-b px-4 py-2" style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(13,17,23,0.97)' }}>
        <HowToUse
          storageKey="perfil-elevacao"
          title="Perfil de Elevação do Terreno"
          subtitle="Transecto topográfico entre dois pontos via Open-Elevation API"
          theme="dark"
          accentColor="#f59e0b"
          steps={[
            { icon: '🖱️', title: 'Clique no ponto inicial', description: 'Clique em qualquer lugar do mapa para definir o início do transecto. Um marcador verde indicará a posição escolhida.' },
            { icon: '🖱️', title: 'Clique no ponto final', description: 'Clique no ponto final desejado. Uma linha tracejada âmbar conecta os dois pontos e a consulta de elevação é disparada automaticamente.' },
            { icon: '⏳', title: 'Aguarde o perfil', description: 'A API Open-Elevation calcula até 60 amostras ao longo da linha reta entre os pontos. Se indisponível, um terreno sintético é gerado como fallback.' },
            { icon: '📈', title: 'Explore o gráfico', description: 'Passe o mouse sobre o gráfico para ver a elevação e distância em cada ponto. O marcador no mapa se move sincronizado com o cursor.' },
          ]}
          tip="Clique em 'Novo transecto' no cabeçalho para reiniciar a medição. Use a camada topográfica do mapa para escolher transectos em áreas de maior variação de relevo."
        />
      </div>

      {/* Map */}
      <div className="relative" style={{ height: result ? '45vh' : '65vh' }}>
        <div ref={mapRef} className="absolute inset-0" style={{ cursor: step !== 'done' ? 'crosshair' : 'default' }} />
      </div>

      {/* Profile chart */}
      {result && (
        <div className="flex-1 overflow-y-auto px-5 py-4" style={{ background: '#0d1117' }}>
          <div className="rounded-2xl border p-5" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">Perfil longitudinal do terreno</h3>
              {hoveredIdx !== null && profile[hoveredIdx] && (
                <div className="text-xs font-mono px-3 py-1 rounded-lg" style={{ background: `${elevColor(profile[hoveredIdx].elevation, stats!.minElev, stats!.maxElev)}20`, color: elevColor(profile[hoveredIdx].elevation, stats!.minElev, stats!.maxElev) }}>
                  {profile[hoveredIdx].distKm} km · {profile[hoveredIdx].elevation} m
                </div>
              )}
            </div>

            <div className="relative w-full overflow-x-auto">
              <svg
                viewBox={`0 0 ${svgW} ${svgH}`}
                className="w-full"
                style={{ minWidth: '300px' }}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                {/* Grid lines */}
                {[0, 0.25, 0.5, 0.75, 1].map(t => {
                  const y = padT + chartH * (1 - t)
                  const elev = stats ? Math.round(stats.minElev + (stats.maxElev - stats.minElev) * t) : 0
                  return (
                    <g key={t}>
                      <line x1={padL} x2={svgW - padR} y1={y} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
                      <text x={padL - 4} y={y + 3} textAnchor="end" fill="rgba(255,255,255,0.3)" fontSize="8">{elev}m</text>
                    </g>
                  )
                })}

                {/* Fill */}
                {fillPath && (
                  <defs>
                    <linearGradient id="elevGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.05" />
                    </linearGradient>
                  </defs>
                )}
                {fillPath && <path d={fillPath} fill="url(#elevGrad)" />}
                {polyPath && <path d={polyPath} fill="none" stroke="#f59e0b" strokeWidth="1.5" />}

                {/* Hover interaction */}
                {profile.map((p, i) => (
                  <rect
                    key={i}
                    x={xScale(i) - (chartW / profile.length / 2)}
                    y={padT}
                    width={chartW / profile.length}
                    height={chartH}
                    fill="transparent"
                    onMouseEnter={() => setHoveredIdx(i)}
                  />
                ))}

                {/* Hover dot */}
                {hoveredIdx !== null && profile[hoveredIdx] && (
                  <circle
                    cx={xScale(hoveredIdx)}
                    cy={yScale(profile[hoveredIdx].elevation)}
                    r="4"
                    fill={elevColor(profile[hoveredIdx].elevation, stats!.minElev, stats!.maxElev)}
                    stroke="white"
                    strokeWidth="1.5"
                  />
                )}

                {/* X-axis labels */}
                {[0, 0.25, 0.5, 0.75, 1].map(t => {
                  const i = Math.round(t * (profile.length - 1))
                  const x = xScale(i)
                  const km = profile[i]?.distKm ?? 0
                  return (
                    <text key={t} x={x} y={padT + chartH + 14} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="8">
                      {km.toFixed(1)}km
                    </text>
                  )
                })}
              </svg>
            </div>

            {/* Stats row */}
            <div className="mt-4 grid grid-cols-3 sm:grid-cols-6 gap-3">
              {[
                { label: 'Distância', value: `${result.distanceKm} km`, color: '#fbbf24' },
                { label: 'Elev. mín.', value: `${stats!.minElev} m`, color: '#3b82f6' },
                { label: 'Elev. máx.', value: `${stats!.maxElev} m`, color: '#ef4444' },
                { label: 'Elev. média', value: `${stats!.avgElev} m`, color: '#94a3b8' },
                { label: 'Subida total', value: `+${stats!.totalRise} m`, color: '#22c55e' },
                { label: 'Inclin. máx.', value: `${stats!.maxSlopeDeg}°`, color: '#a78bfa' },
              ].map(item => (
                <div key={item.label} className="rounded-xl px-3 py-2.5 text-center border" style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.07)' }}>
                  <div className="text-sm font-bold font-mono" style={{ color: item.color }}>{item.value}</div>
                  <div className="text-[9px] text-slate-500 mt-0.5">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-400">Consultando elevações...</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default function PerfilElevacaoPage() {
  const { loading, isPro } = usePlan()
  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-slate-200 border-t-[#16a34a] rounded-full animate-spin" /></div>
  if (!isPro) return <ProPaywall icon="⛰️" feature="Perfil de Elevação" desc="Trace seções topográficas com dois cliques e veja o perfil de elevação calculado via Open-Elevation API." />
  return <PerfilElevacaoContent />
}

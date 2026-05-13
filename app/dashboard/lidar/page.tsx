'use client'

import { useState, useRef, useCallback } from 'react'
import HowToUse from '../../../components/HowToUse'
import ProPaywall from '../../../components/ProPaywall'
import { usePlan } from '../../../lib/hooks/usePlan'

interface LidarPoint { lat: number; lng: number; elevation: number }

interface LidarStats {
  count: number
  minElev: number; maxElev: number; avgElev: number; stdDev: number
  elevRange: number
}

function parseCSV(text: string): LidarPoint[] {
  const lines = text.trim().split('\n').slice(1) // skip header
  return lines.slice(0, 50000).map(line => {
    const parts = line.split(/[,;\t]/)
    return {
      lat: parseFloat(parts[0] ?? parts[1] ?? '0'),
      lng: parseFloat(parts[1] ?? parts[2] ?? '0'),
      elevation: parseFloat(parts[2] ?? parts[3] ?? '0'),
    }
  }).filter(p => !isNaN(p.lat) && !isNaN(p.lng) && !isNaN(p.elevation))
}

function elevColor(val: number, min: number, max: number): string {
  const t = max > min ? (val - min) / (max - min) : 0.5
  if (t < 0.2) return '#1e40af'
  if (t < 0.4) return '#0891b2'
  if (t < 0.6) return '#22c55e'
  if (t < 0.8) return '#f59e0b'
  return '#ef4444'
}

function computeStats(points: LidarPoint[]): LidarStats {
  const elevs = points.map(p => p.elevation)
  const min = Math.min(...elevs); const max = Math.max(...elevs)
  const avg = elevs.reduce((a,b) => a+b,0) / elevs.length
  const std = Math.sqrt(elevs.reduce((a,b) => a + (b-avg)**2,0) / elevs.length)
  return { count: points.length, minElev: Math.round(min), maxElev: Math.round(max), avgElev: Math.round(avg), stdDev: parseFloat(std.toFixed(1)), elevRange: Math.round(max-min) }
}

function LidarContent() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [points, setPoints] = useState<LidarPoint[]>([])
  const [stats, setStats] = useState<LidarStats | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [fileName, setFileName] = useState('')
  const [renderMode, setRenderMode] = useState<'elevation' | 'density'>('elevation')

  const renderCanvas = useCallback((pts: LidarPoint[], mode: 'elevation'|'density') => {
    const canvas = canvasRef.current; if (!canvas || pts.length === 0) return
    const ctx = canvas.getContext('2d'); if (!ctx) return
    const W = canvas.width; const H = canvas.height

    const lats = pts.map(p => p.lat); const lngs = pts.map(p => p.lng)
    const elevs = pts.map(p => p.elevation)
    const minLat = Math.min(...lats); const maxLat = Math.max(...lats)
    const minLng = Math.min(...lngs); const maxLng = Math.max(...lngs)
    const minElev = Math.min(...elevs); const maxElev = Math.max(...elevs)
    const pad = 20

    ctx.fillStyle = '#0a0e1a'; ctx.fillRect(0,0,W,H)

    if (mode === 'density') {
      // Simple density heatmap
      const grid: number[][] = Array.from({ length: 80 }, () => Array(80).fill(0))
      pts.forEach(p => {
        const gx = Math.floor(((p.lng - minLng) / (maxLng - minLng + 1e-9)) * 79)
        const gy = Math.floor(((p.lat - minLat) / (maxLat - minLat + 1e-9)) * 79)
        if (gx >= 0 && gx < 80 && gy >= 0 && gy < 80) grid[gy][gx]++
      })
      const maxDensity = Math.max(...grid.flat())
      const cellW = (W - pad*2) / 80; const cellH = (H - pad*2) / 80
      grid.forEach((row, gy) => row.forEach((count, gx) => {
        if (count === 0) return
        const t = count / maxDensity
        const x = pad + gx * cellW; const y = H - pad - (gy+1)*cellH
        const alpha = Math.min(1, t * 1.5)
        const color = t > 0.7 ? '#ef4444' : t > 0.4 ? '#f59e0b' : t > 0.2 ? '#22c55e' : '#3b82f6'
        ctx.globalAlpha = alpha
        ctx.fillStyle = color
        ctx.fillRect(x, y, cellW + 0.5, cellH + 0.5)
      }))
      ctx.globalAlpha = 1
    } else {
      pts.forEach(p => {
        const x = pad + ((p.lng - minLng) / (maxLng - minLng + 1e-9)) * (W - pad*2)
        const y = (H - pad) - ((p.lat - minLat) / (maxLat - minLat + 1e-9)) * (H - pad*2)
        ctx.fillStyle = elevColor(p.elevation, minElev, maxElev)
        ctx.fillRect(x - 1, y - 1, 2, 2)
      })
    }

    // Legend
    const gradH = 120; const gradX = W - 20; const gradY = (H-gradH)/2
    const grad = ctx.createLinearGradient(0, gradY, 0, gradY + gradH)
    grad.addColorStop(0, '#ef4444')
    grad.addColorStop(0.25, '#f59e0b')
    grad.addColorStop(0.5, '#22c55e')
    grad.addColorStop(0.75, '#0891b2')
    grad.addColorStop(1, '#1e40af')
    ctx.fillStyle = grad; ctx.fillRect(gradX - 8, gradY, 8, gradH)
    ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.font = '9px monospace'
    ctx.fillText(`${maxElev}m`, gradX - 40, gradY + 4)
    ctx.fillText(`${minElev}m`, gradX - 40, gradY + gradH + 4)
  }, [])

  function handleFile(file: File) {
    if (!file.name.toLowerCase().match(/\.(csv|txt|xyz|las)$/)) return
    setFileName(file.name)
    if (file.name.toLowerCase().endsWith('.las')) {
      // LAS binary — inform user, can't parse in browser
      setPoints([])
      setStats({ count: 0, minElev: 0, maxElev: 0, avgElev: 0, stdDev: 0, elevRange: 0 })
      return
    }
    const r = new FileReader()
    r.onload = e => {
      const pts = parseCSV(e.target?.result as string)
      setPoints(pts)
      const s = computeStats(pts)
      setStats(s)
      setTimeout(() => renderCanvas(pts, renderMode), 100)
    }
    r.readAsText(file)
  }

  const isLasFile = fileName.toLowerCase().endsWith('.las')

  return (
    <div className="min-h-screen" style={{ background: '#0a0e1a' }}>
      {/* Header */}
      <div className="border-b px-5 py-3 flex items-center gap-4" style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(10,14,26,0.97)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.3)' }}>
            <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
            </svg>
          </div>
          <div><h1 className="text-sm font-bold text-white">Nuvem de Pontos LiDAR</h1><p className="text-[10px] text-slate-500">LAS to ENVImet · Análise de elevação</p></div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {points.length > 0 && (
            <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
              {(['elevation','density'] as const).map(m => (
                <button key={m} onClick={() => { setRenderMode(m); setTimeout(() => renderCanvas(points, m), 50) }}
                  className="px-3 py-1.5 text-xs font-semibold transition-all"
                  style={renderMode === m ? { background: 'rgba(167,139,250,0.2)', color: '#a78bfa' } : { background: 'rgba(255,255,255,0.04)', color: '#64748b' }}>
                  {m === 'elevation' ? 'Elevação' : 'Densidade'}
                </button>
              ))}
            </div>
          )}
          <button onClick={() => fileRef.current?.click()} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-purple-400" style={{ background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.3)' }}>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
            Carregar CSV/LAS
          </button>
          <input ref={fileRef} type="file" accept=".csv,.txt,.xyz,.las" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-5 py-5 space-y-5">
        <HowToUse
          storageKey="lidar"
          title="Nuvem de Pontos LiDAR"
          subtitle="Visualização e análise de arquivos LAS/CSV de elevação"
          theme="dark"
          accentColor="#a78bfa"
          steps={[
            { icon: '📤', title: 'Carregue o arquivo', description: 'Arraste um arquivo .CSV ou .XYZ com colunas lat, lng, elevation (ou x, y, z). Suporta separadores vírgula, ponto-e-vírgula e tab.' },
            { icon: '📊', title: 'Veja as estatísticas', description: 'Elevação mínima, máxima, média, desvio padrão e amplitude são calculados automaticamente para todos os pontos.' },
            { icon: '🎨', title: 'Visualize a nuvem', description: 'No modo Elevação, cada ponto é colorido por altitude (azul = baixo, vermelho = alto). No modo Densidade, veja onde os pontos se concentram.' },
            { icon: '📦', title: 'Arquivos LAS binários', description: 'Arquivos .LAS não podem ser lidos diretamente no navegador. Use LAStools ou PDAL para converter para CSV antes de carregar.' },
          ]}
          tip="O limite é de 50.000 pontos por arquivo para manter boa performance. Para arquivos maiores, recorte a área de interesse antes de exportar o CSV."
        />

        {/* Upload area or LAS notice */}
        {points.length === 0 && !isLasFile && (
          <div
            className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${dragOver ? 'border-purple-400 bg-purple-400/10' : 'border-white/10 hover:border-white/20'}`}
            onClick={() => fileRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
          >
            <svg className="w-12 h-12 text-purple-400/40 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
            </svg>
            <p className="text-sm font-semibold text-white/60 mb-2">Arraste um arquivo de nuvem de pontos</p>
            <div className="flex items-center justify-center gap-3 text-xs text-slate-500">
              <span className="px-2 py-1 rounded bg-white/5 font-mono">.csv</span>
              <span className="px-2 py-1 rounded bg-white/5 font-mono">.xyz</span>
              <span className="px-2 py-1 rounded bg-white/5 font-mono">.las</span>
            </div>
            <p className="text-[10px] text-slate-600 mt-3">CSV: colunas lat, lng, elevation (ou x, y, z)</p>
          </div>
        )}

        {isLasFile && (
          <div className="rounded-2xl p-6 border text-center" style={{ background: 'rgba(167,139,250,0.08)', borderColor: 'rgba(167,139,250,0.2)' }}>
            <div className="text-3xl mb-3">📦</div>
            <p className="text-sm font-semibold text-white mb-1">Arquivo LAS detectado: {fileName}</p>
            <p className="text-xs text-slate-400 mb-4">LAS binário não pode ser processado no navegador. Converta para CSV usando CloudCompare, LAStools ou PDAL:</p>
            <div className="rounded-xl p-3 font-mono text-[10px] text-left text-purple-300 overflow-x-auto" style={{ background: 'rgba(0,0,0,0.4)' }}>
              <div className="text-slate-500"># LAStools (Windows/Linux)</div>
              <div>las2txt -i arquivo.las -ocsv -o pontos.csv -parse xyze</div>
              <br />
              <div className="text-slate-500"># PDAL (multiplataforma)</div>
              <div>pdal translate arquivo.las pontos.csv writers.text.order="X,Y,Z"</div>
            </div>
          </div>
        )}

        {points.length > 0 && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {[
                { label: 'Pontos', value: points.length.toLocaleString(), color: '#a78bfa' },
                { label: 'Elev. mín.', value: `${stats!.minElev} m`, color: '#3b82f6' },
                { label: 'Elev. máx.', value: `${stats!.maxElev} m`, color: '#ef4444' },
                { label: 'Elev. média', value: `${stats!.avgElev} m`, color: '#22c55e' },
                { label: 'Desvio padrão', value: `${stats!.stdDev} m`, color: '#f59e0b' },
                { label: 'Amplitude', value: `${stats!.elevRange} m`, color: '#e879f9' },
              ].map(item => (
                <div key={item.label} className="rounded-xl p-3 text-center border" style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.07)' }}>
                  <div className="text-lg font-bold font-mono" style={{ color: item.color }}>{item.value}</div>
                  <div className="text-[9px] text-slate-500 mt-0.5">{item.label}</div>
                </div>
              ))}
            </div>

            {/* Canvas visualization */}
            <div className="rounded-2xl overflow-hidden border" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
              <canvas ref={canvasRef} width={800} height={400} className="w-full" style={{ background: '#0a0e1a', display: 'block' }} />
            </div>
          </>
        )}

        {/* Format guide */}
        <div className="rounded-2xl p-5 border text-sm" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Formato CSV esperado</h3>
          <pre className="text-[10px] font-mono text-purple-300 p-3 rounded-xl overflow-x-auto" style={{ background: 'rgba(0,0,0,0.4)' }}>{`lat,lng,elevation
-15.7801,-47.9292,1172
-15.7802,-47.9291,1175
-15.7803,-47.9290,1168
...`}</pre>
          <p className="text-[10px] text-slate-500 mt-2">Também aceita separadores por ; ou tab. Colunas x,y,z equivalem a lng,lat,elevation.</p>
        </div>
      </div>
    </div>
  )
}

export default function LidarPage() {
  const { loading, isPro } = usePlan()
  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-slate-200 border-t-[#16a34a] rounded-full animate-spin" /></div>
  if (!isPro) return <ProPaywall icon="🛰️" feature="LiDAR / Nuvem de Pontos" desc="Processe arquivos CSV de varredura LiDAR com renderização 3D por elevação e densidade, ideal para modelagem de terreno." />
  return <LidarContent />
}

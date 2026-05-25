'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import AgroNav3D from './AgroNav3D'

// ─── Types ───────────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type L = any

interface FieldData {
  id: string
  name: string
  sizeHectares: number
  lat: number | null
  lng: number | null
  geoJson: string | null
}

interface PropertyData {
  id: string
  name: string
  location: string | null
  lat: number | null
  lng: number | null
  sizeHectares: number
  fields: FieldData[]
}

interface Config {
  tipo: string
  largura: number
  angulo: number
  velocidade: number
}

interface Relatorio {
  areaHa: number
  passadas: number
  comprimentoKm: number
  tempoHoras: number
}

// ─── Constantes ──────────────────────────────────────────────────────────────
const ATIVIDADES = [
  { value: 'Pulverização', largura: 18, icon: '🌿' },
  { value: 'Plantio',      largura: 12, icon: '🌱' },
  { value: 'Colheita',     largura: 9,  icon: '🌾' },
  { value: 'Adubação',     largura: 18, icon: '🧪' },
  { value: 'Irrigação',    largura: 24, icon: '💧' },
  { value: 'Capina',       largura: 6,  icon: '🔧' },
  { value: 'Análise de solo', largura: 3, icon: '🔬' },
]

// ─── Geometria pura (sem dependências externas) ───────────────────────────────
function calcAreaHa(coords: [number, number][]): number {
  const n = coords.length
  if (n < 3) return 0
  const avgLat = coords.reduce((s, c) => s + c[1], 0) / n
  const mLat = 111320
  const mLng = 111320 * Math.cos((avgLat * Math.PI) / 180)
  let area = 0
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    area += coords[i][0] * mLng * coords[j][1] * mLat
    area -= coords[j][0] * mLng * coords[i][1] * mLat
  }
  return Math.abs(area / 2) / 10000
}

function rotatePoint(p: [number, number], center: [number, number], angle: number): [number, number] {
  const cos = Math.cos(angle), sin = Math.sin(angle)
  const dx = p[0] - center[0], dy = p[1] - center[1]
  return [center[0] + dx * cos - dy * sin, center[1] + dx * sin + dy * cos]
}

function gerarLinhas(coords: [number, number][], larguraM: number, anguloGraus: number): [number, number][][] {
  if (coords.length < 3) return []
  const rad = (anguloGraus * Math.PI) / 180
  const cx = coords.reduce((s, p) => s + p[0], 0) / coords.length
  const cy = coords.reduce((s, p) => s + p[1], 0) / coords.length
  const center: [number, number] = [cx, cy]
  const rot = coords.map(p => rotatePoint(p, center, -rad))
  const minY = Math.min(...rot.map(p => p[1]))
  const maxY = Math.max(...rot.map(p => p[1]))
  const step = larguraM / 111320
  const n = rot.length
  const result: [number, number][][] = []
  let y = minY + step / 2
  while (y <= maxY) {
    const xs: number[] = []
    for (let i = 0; i < n; i++) {
      const a = rot[i], b = rot[(i + 1) % n]
      if ((a[1] <= y && y < b[1]) || (b[1] <= y && y < a[1])) {
        xs.push(a[0] + ((y - a[1]) / (b[1] - a[1])) * (b[0] - a[0]))
      }
    }
    xs.sort((a, b) => a - b)
    for (let i = 0; i + 1 < xs.length; i += 2) {
      result.push([rotatePoint([xs[i], y], center, rad), rotatePoint([xs[i + 1], y], center, rad)])
    }
    y += step
  }
  return result
}

function calcRelatorio(coords: [number, number][], linhas: [number, number][][], vel: number): Relatorio {
  const areaHa = calcAreaHa(coords)
  let dist = 0
  for (const [p1, p2] of linhas) {
    const avgLat = (p1[1] + p2[1]) / 2
    const dx = (p2[0] - p1[0]) * 111320 * Math.cos((avgLat * Math.PI) / 180)
    const dy = (p2[1] - p1[1]) * 111320
    dist += Math.sqrt(dx * dx + dy * dy)
  }
  return { areaHa, passadas: linhas.length, comprimentoKm: dist / 1000, tempoHoras: dist / 1000 / vel }
}

// ─── Componente principal ────────────────────────────────────────────────────
export default function AgroNavClient() {
  const mapRef    = useRef<HTMLDivElement>(null)
  const mapInst   = useRef<L>(null)
  const polyRef   = useRef<L>(null)
  const linesRef  = useRef<L>(null)
  const drawItems = useRef<L>(null)
  const drawCtrl  = useRef<L>(null)

  const [properties, setProperties] = useState<PropertyData[]>([])
  const [propId,     setPropId]     = useState('')
  const [field,      setField]      = useState<FieldData | null>(null)
  const [tab,        setTab]        = useState<'talhao' | 'operacao' | 'resultado'>('talhao')
  const [coords,     setCoords]     = useState<[number, number][] | null>(null)
  const [localGeoJson, setLocalGeoJson] = useState<string | null>(null)
  const [config,     setConfig]     = useState<Config>({ tipo: 'Pulverização', largura: 18, angulo: 0, velocidade: 8 })
  const [linhas,     setLinhas]     = useState<[number, number][][] | null>(null)
  const [relatorio,  setRelatorio]  = useState<Relatorio | null>(null)
  const [loading,    setLoading]    = useState(true)
  const [salvando,   setSalvando]   = useState(false)
  const [gerando,    setGerando]    = useState(false)
  const [desenhando, setDesenhando] = useState(false)
  const [msg,        setMsg]        = useState('')
  const [show3D,     setShow3D]     = useState(false)

  // ── Carrega propriedades
  useEffect(() => {
    fetch('/api/agronav/propriedades')
      .then(r => r.json())
      .then(d => {
        setProperties(d.properties ?? [])
        if (d.properties?.length) setPropId(d.properties[0].id)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // ── Inicializa mapa Leaflet + Leaflet.draw via CDN
  useEffect(() => {
    if (typeof window === 'undefined' || mapInst.current) return

    const addCss = (id: string, href: string) => {
      if (document.getElementById(id)) return
      const link = document.createElement('link')
      link.id = id; link.rel = 'stylesheet'; link.href = href
      document.head.appendChild(link)
    }
    addCss('leaflet-css', 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css')
    addCss('leaflet-draw-css', 'https://unpkg.com/leaflet-draw@1.0.4/dist/leaflet.draw.css')

    const initMap = () => {
      if (!mapRef.current || mapInst.current) return
      const Lx: L = (window as L).L
      delete Lx.Icon.Default.prototype._getIconUrl
      Lx.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })
      const map = Lx.map(mapRef.current, { center: [-14.235, -51.925], zoom: 5, zoomControl: false })
      Lx.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { attribution: '&copy; Esri, Maxar', maxZoom: 19 }
      ).addTo(map)
      Lx.control.zoom({ position: 'bottomright' }).addTo(map)
      mapInst.current = map
      const di = new Lx.FeatureGroup()
      map.addLayer(di)
      drawItems.current = di
    }

    const loadDraw = () => {
      if ((window as L).L?.Draw) { initMap(); return }
      const s = document.createElement('script')
      s.src = 'https://unpkg.com/leaflet-draw@1.0.4/dist/leaflet.draw.js'
      s.onload = initMap
      document.body.appendChild(s)
    }

    if ((window as L).L) { loadDraw() } else {
      const s = document.createElement('script')
      s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
      s.onload = loadDraw
      document.body.appendChild(s)
    }

    return () => { mapInst.current?.remove(); mapInst.current = null }
  }, [])

  // ── Voa para a propriedade selecionada
  useEffect(() => {
    const prop = properties.find(p => p.id === propId)
    if (!prop || !mapInst.current) return
    if (prop.lat && prop.lng) mapInst.current.flyTo([prop.lat, prop.lng], 14, { duration: 1.5 })
    setField(null); setCoords(null); setLocalGeoJson(null); setLinhas(null); setRelatorio(null)
  }, [propId, properties])

  // ── Mostra polígono do talhão selecionado
  useEffect(() => {
    if (!mapInst.current || !field) return
    const Lx: L = (window as L).L
    if (!Lx) return
    if (polyRef.current) { mapInst.current.removeLayer(polyRef.current); polyRef.current = null }
    if (linesRef.current) { mapInst.current.removeLayer(linesRef.current); linesRef.current = null }
    setLinhas(null); setRelatorio(null)

    if (field.geoJson) {
      try {
        const gj = JSON.parse(field.geoJson)
        setLocalGeoJson(field.geoJson)
        const layer = Lx.geoJSON(gj, {
          style: { color: '#22c55e', weight: 2.5, fillOpacity: 0.15, fillColor: '#22c55e' }
        }).addTo(mapInst.current)
        polyRef.current = layer
        mapInst.current.fitBounds(layer.getBounds(), { padding: [40, 40] })
        const raw = gj.coordinates?.[0] ?? gj.geometry?.coordinates?.[0]
        if (raw) setCoords(raw.map((c: number[]) => [c[0], c[1]] as [number, number]))
      } catch {}
    } else if (field.lat && field.lng) {
      mapInst.current.flyTo([field.lat, field.lng], 16)
    }
  }, [field])

  // ── Renderiza linhas de guiamento no mapa
  useEffect(() => {
    if (!mapInst.current || !linhas) return
    const Lx: L = (window as L).L
    if (!Lx) return
    if (linesRef.current) { mapInst.current.removeLayer(linesRef.current) }
    const group = Lx.layerGroup()
    linhas.forEach(([p1, p2], i) => {
      Lx.polyline([[p1[1], p1[0]], [p2[1], p2[0]]], {
        color: i % 2 === 0 ? '#fde047' : '#93c5fd',
        weight: 1.8,
        opacity: 0.9,
      }).addTo(group)
    })
    group.addTo(mapInst.current)
    linesRef.current = group
  }, [linhas])

  // ── Ativa modo de desenho (Leaflet.draw)
  const ativarDesenho = useCallback(() => {
    const Lx: L = (window as L).L
    if (!Lx || !mapInst.current || !drawItems.current) return
    if (drawCtrl.current) { mapInst.current.removeControl(drawCtrl.current); drawCtrl.current = null }
    drawItems.current.clearLayers()

    const dc = new Lx.Control.Draw({
      draw: {
        polygon: { allowIntersection: false, showArea: true, shapeOptions: { color: '#22c55e', weight: 2, fillOpacity: 0.2 } },
        polyline: false, rectangle: false, circle: false, marker: false, circlemarker: false,
      },
      edit: { featureGroup: drawItems.current },
    })
    mapInst.current.addControl(dc)
    drawCtrl.current = dc
    setDesenhando(true)

    mapInst.current.on(Lx.Draw.Event.CREATED, (e: L) => {
      drawItems.current.clearLayers()
      drawItems.current.addLayer(e.layer)
      const gj = e.layer.toGeoJSON()
      const rawCoords = gj.geometry.coordinates[0].map((c: number[]) => [c[0], c[1]] as [number, number])
      setCoords(rawCoords)
      setLocalGeoJson(JSON.stringify(gj))
      setDesenhando(false)
      // Redesenha no layer permanente
      if (polyRef.current) mapInst.current.removeLayer(polyRef.current)
      const layer = (window as L).L.geoJSON(gj, {
        style: { color: '#22c55e', weight: 2.5, fillOpacity: 0.15, fillColor: '#22c55e' }
      }).addTo(mapInst.current)
      polyRef.current = layer
    })
  }, [])

  // ── Salva polígono no Field
  const salvarTalhao = useCallback(async () => {
    if (!field || !localGeoJson) return
    setSalvando(true); setMsg('')
    try {
      const area = coords ? calcAreaHa(coords) : undefined
      const res = await fetch('/api/agronav/salvar-talhao', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fieldId: field.id, geoJson: localGeoJson, sizeHectares: area }),
      })
      if (res.ok) {
        setMsg('✅ Talhão salvo com sucesso!')
        setProperties(prev => prev.map(p => ({
          ...p,
          fields: p.fields.map(f => f.id === field.id ? { ...f, geoJson: localGeoJson } : f),
        })))
        setField(f => f ? { ...f, geoJson: localGeoJson } : f)
      } else {
        const d = await res.json()
        setMsg(d.error || 'Erro ao salvar')
      }
    } catch { setMsg('Erro de rede ao salvar') }
    setSalvando(false)
  }, [field, localGeoJson, coords])

  // ── Gera linhas de guiamento
  const gerarLinhasOp = useCallback(() => {
    if (!coords || coords.length < 3) return
    setGerando(true)
    // setTimeout para não bloquear a UI
    setTimeout(() => {
      const ls = gerarLinhas(coords, config.largura, config.angulo)
      setLinhas(ls)
      setRelatorio(calcRelatorio(coords, ls, config.velocidade))
      setTab('resultado')
      setGerando(false)
    }, 30)
  }, [coords, config])

  function handleTipoChange(tipo: string) {
    const a = ATIVIDADES.find(x => x.value === tipo)
    setConfig(c => ({ ...c, tipo, largura: a?.largura ?? c.largura }))
  }

  const prop = properties.find(p => p.id === propId)
  const temPoligono = !!(field?.geoJson || localGeoJson)

  return (
    <div className="flex bg-slate-100" style={{ height: 'calc(100vh - 64px)' }}>

      {/* ── Painel esquerdo ─────────────────────────────────────────────── */}
      <div className="w-80 flex-shrink-0 bg-white border-r border-slate-200 flex flex-col overflow-hidden shadow-sm">

        {/* Header */}
        <div className="px-4 py-3 bg-gradient-to-r from-green-800 to-green-600 flex items-center gap-3">
          <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center text-xl flex-shrink-0">🗺️</div>
          <div>
            <div className="text-white font-bold text-sm leading-tight">AgroNav</div>
            <div className="text-green-200 text-[11px]">Planejamento de Campo</div>
          </div>
        </div>

        {/* Seletor de propriedade */}
        <div className="px-4 py-3 border-b border-slate-100">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Propriedade</label>
          {loading ? (
            <div className="h-9 bg-slate-100 rounded-xl animate-pulse" />
          ) : properties.length === 0 ? (
            <p className="text-xs text-slate-400 py-1">Nenhuma propriedade cadastrada.</p>
          ) : (
            <select
              value={propId}
              onChange={e => setPropId(e.target.value)}
              className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          )}
        </div>

        {/* Lista de talhões */}
        <div className="px-4 py-3 border-b border-slate-100 flex-shrink-0">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Talhões</div>
          {!prop?.fields.length ? (
            <p className="text-xs text-slate-400">Nenhum talhão nesta propriedade.</p>
          ) : (
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-0.5">
              {prop.fields.map(f => (
                <button
                  key={f.id}
                  onClick={() => { setField(f); setTab('talhao'); setMsg('') }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all border ${
                    field?.id === f.id
                      ? 'bg-green-50 border-green-300 text-green-800 shadow-sm'
                      : 'border-slate-100 hover:bg-slate-50 text-slate-700 hover:border-slate-200'
                  }`}
                >
                  <div className="font-semibold flex items-center gap-1.5 leading-tight">
                    <span>{f.geoJson ? '🟢' : '⚪'}</span>
                    <span className="truncate">{f.name}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {Number(f.sizeHectares).toFixed(1)} ha · {f.geoJson ? 'mapeado' : 'sem mapa'}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Conteúdo com abas — só quando talhão está selecionado */}
        {field ? (
          <>
            {/* Abas */}
            <div className="flex border-b border-slate-100 flex-shrink-0">
              {(['talhao', 'operacao', 'resultado'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`flex-1 py-2.5 text-[11px] font-bold transition-colors ${
                    tab === t
                      ? 'text-green-700 border-b-2 border-green-600 bg-green-50/60'
                      : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {t === 'talhao' ? 'Talhão' : t === 'operacao' ? 'Operação' : 'Resultado'}
                  {t === 'resultado' && relatorio && <span className="ml-1 text-green-600">✓</span>}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">

              {/* ── Aba Talhão */}
              {tab === 'talhao' && (
                <div className="space-y-3">
                  <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100">
                    <div className="font-bold text-slate-800 text-sm">{field.name}</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {coords ? `${calcAreaHa(coords).toFixed(2)} ha calculado` : `${Number(field.sizeHectares).toFixed(1)} ha registrado`}
                    </div>
                    <div className={`text-[11px] mt-1.5 font-semibold ${temPoligono ? 'text-green-600' : 'text-amber-500'}`}>
                      {temPoligono ? '✓ Polígono mapeado' : '⚠ Sem polígono — desenhe no mapa'}
                    </div>
                  </div>

                  <button
                    onClick={ativarDesenho}
                    className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                      desenhando
                        ? 'bg-amber-50 text-amber-700 border-2 border-amber-300 animate-pulse'
                        : 'bg-green-700 text-white hover:bg-green-800'
                    }`}
                  >
                    {desenhando ? '✏️ Desenhando no mapa...' : temPoligono ? '✏️ Redesenhar polígono' : '✏️ Desenhar polígono'}
                  </button>

                  {localGeoJson && !field.geoJson && (
                    <button
                      onClick={salvarTalhao}
                      disabled={salvando}
                      className="w-full py-2.5 rounded-xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {salvando ? 'Salvando...' : '💾 Salvar talhão'}
                    </button>
                  )}

                  {temPoligono && (
                    <button
                      onClick={() => setTab('operacao')}
                      className="w-full py-2.5 rounded-xl text-sm font-semibold bg-slate-900 text-white hover:bg-slate-700 transition-colors"
                    >
                      Configurar operação →
                    </button>
                  )}

                  {msg && (
                    <p className={`text-xs text-center p-2.5 rounded-xl ${msg.startsWith('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                      {msg}
                    </p>
                  )}
                </div>
              )}

              {/* ── Aba Operação */}
              {tab === 'operacao' && (
                <div className="space-y-4">
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Tipo de operação</div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {ATIVIDADES.map(a => (
                        <button
                          key={a.value}
                          onClick={() => handleTipoChange(a.value)}
                          className={`text-[11px] px-2 py-2.5 rounded-xl font-semibold transition-colors text-left leading-tight ${
                            config.tipo === a.value
                              ? 'bg-green-700 text-white shadow-sm'
                              : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                          }`}
                        >
                          <span className="mr-1">{a.icon}</span>{a.value}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Largura do implemento</span>
                      <span className="text-xs font-bold text-green-700">{config.largura} m</span>
                    </div>
                    <input type="range" min={1} max={40} step={0.5} value={config.largura}
                      onChange={e => setConfig(c => ({ ...c, largura: Number(e.target.value) }))}
                      className="w-full accent-green-600 cursor-pointer" />
                    <div className="flex justify-between text-[10px] text-slate-400 mt-0.5"><span>1m</span><span>40m</span></div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ângulo das linhas</span>
                      <span className="text-xs font-bold text-green-700">{config.angulo}°</span>
                    </div>
                    <input type="range" min={0} max={179} step={1} value={config.angulo}
                      onChange={e => setConfig(c => ({ ...c, angulo: Number(e.target.value) }))}
                      className="w-full accent-green-600 cursor-pointer" />
                    <div className="flex justify-between text-[10px] text-slate-400 mt-0.5"><span>0° (N-S)</span><span>90° (L-O)</span><span>179°</span></div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Velocidade operacional</span>
                      <span className="text-xs font-bold text-green-700">{config.velocidade} km/h</span>
                    </div>
                    <input type="range" min={2} max={20} step={0.5} value={config.velocidade}
                      onChange={e => setConfig(c => ({ ...c, velocidade: Number(e.target.value) }))}
                      className="w-full accent-green-600 cursor-pointer" />
                    <div className="flex justify-between text-[10px] text-slate-400 mt-0.5"><span>2 km/h</span><span>20 km/h</span></div>
                  </div>

                  <button
                    onClick={gerarLinhasOp}
                    disabled={gerando || !coords}
                    className="w-full py-3 rounded-xl text-sm font-bold bg-green-700 text-white hover:bg-green-800 disabled:opacity-50 transition-colors shadow-sm"
                  >
                    {gerando ? '⚙️ Calculando linhas...' : '⚡ Gerar linhas de guiamento'}
                  </button>

                  {!coords && (
                    <p className="text-xs text-center text-amber-600 bg-amber-50 p-2 rounded-xl">
                      Desenhe o polígono do talhão primeiro
                    </p>
                  )}
                </div>
              )}

              {/* ── Aba Resultado */}
              {tab === 'resultado' && (
                <div className="space-y-3">
                  {!relatorio ? (
                    <div className="text-center py-10 text-slate-400">
                      <div className="text-4xl mb-3">📐</div>
                      <p className="text-sm">Configure a operação e gere as linhas para ver o relatório.</p>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { label: 'Área', value: `${relatorio.areaHa.toFixed(2)}`, unit: 'hectares', color: 'green' },
                          { label: 'Passadas', value: `${relatorio.passadas}`, unit: 'linhas', color: 'blue' },
                          { label: 'Distância', value: `${relatorio.comprimentoKm.toFixed(1)}`, unit: 'km total', color: 'amber' },
                          {
                            label: 'Tempo est.',
                            value: relatorio.tempoHoras < 1
                              ? `${Math.round(relatorio.tempoHoras * 60)} min`
                              : `${relatorio.tempoHoras.toFixed(1)} h`,
                            unit: `a ${config.velocidade} km/h`,
                            color: 'purple',
                          },
                        ].map(item => (
                          <div key={item.label} className={`bg-${item.color}-50 rounded-xl p-3 border border-${item.color}-100`}>
                            <div className={`text-[11px] text-${item.color}-600 font-bold`}>{item.label}</div>
                            <div className={`text-xl font-black text-${item.color}-700 leading-tight`}>{item.value}</div>
                            <div className={`text-[10px] text-${item.color}-500 mt-0.5`}>{item.unit}</div>
                          </div>
                        ))}
                      </div>

                      <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100 text-xs space-y-2">
                        <div className="font-bold text-slate-600 mb-1">Configuração</div>
                        <div className="flex justify-between text-slate-500"><span>Operação</span><span className="font-semibold text-slate-700">{config.tipo}</span></div>
                        <div className="flex justify-between text-slate-500"><span>Implemento</span><span className="font-semibold text-slate-700">{config.largura} m</span></div>
                        <div className="flex justify-between text-slate-500"><span>Ângulo</span><span className="font-semibold text-slate-700">{config.angulo}°</span></div>
                        <div className="flex justify-between text-slate-500"><span>Velocidade</span><span className="font-semibold text-slate-700">{config.velocidade} km/h</span></div>
                      </div>

                      <button
                        onClick={() => setShow3D(true)}
                        className="w-full py-3 rounded-xl text-sm font-bold bg-slate-900 text-white hover:bg-slate-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
                      >
                        🚜 Abrir visão 3D
                      </button>

                      <button
                        onClick={() => setTab('operacao')}
                        className="w-full py-2 rounded-xl text-xs font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors"
                      >
                        ↩ Recalcular com outra configuração
                      </button>
                    </>
                  )}
                </div>
              )}

            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-6 text-center">
            <div>
              <div className="text-5xl mb-3">🌾</div>
              <p className="text-sm font-medium text-slate-600">Selecione um talhão</p>
              <p className="text-xs text-slate-400 mt-1">para iniciar o planejamento da operação</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Mapa ────────────────────────────────────────────────────────── */}
      <div className="flex-1 relative">
        <div ref={mapRef} className="w-full h-full" />

        {/* Aviso de modo de desenho */}
        {desenhando && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-green-800 text-white text-sm font-semibold px-5 py-2.5 rounded-full shadow-xl pointer-events-none animate-bounce">
            ✏️ Clique para adicionar vértices · Duplo-clique para concluir
          </div>
        )}

        {/* Overlay inicial */}
        {!field && !loading && (
          <div className="absolute inset-0 flex items-end justify-center pb-12 pointer-events-none">
            <div className="bg-white/90 backdrop-blur-md rounded-2xl p-5 text-center shadow-xl max-w-xs border border-white">
              <div className="text-5xl mb-2">🗺️</div>
              <div className="font-bold text-slate-800">AgroNav</div>
              <p className="text-sm text-slate-500 mt-1 leading-snug">
                Selecione uma propriedade e talhão para planejar sua operação de campo.
              </p>
            </div>
          </div>
        )}

        {/* Legenda de linhas */}
        {linhas && linhas.length > 0 && (
          <div className="absolute bottom-8 right-4 z-[900] bg-white/95 backdrop-blur rounded-xl px-3 py-2.5 shadow-lg border border-slate-100 text-xs space-y-1.5">
            <div className="font-bold text-slate-600 text-[11px] mb-1">Linhas de guiamento</div>
            <div className="flex items-center gap-2"><div className="w-5 h-1 bg-yellow-300 rounded" /><span className="text-slate-500">Passadas ímpares</span></div>
            <div className="flex items-center gap-2"><div className="w-5 h-1 bg-blue-300 rounded" /><span className="text-slate-500">Passadas pares</span></div>
            <div className="flex items-center gap-2"><div className="w-5 h-2 bg-green-400/30 border border-green-500 rounded" /><span className="text-slate-500">Talhão</span></div>
          </div>
        )}
      </div>

      {/* ── Vista 3D (overlay full-screen) */}
      {show3D && linhas && coords && (
        <AgroNav3D
          lines={linhas}
          polygonCoords={coords}
          fieldName={field?.name ?? ''}
          config={config}
          onClose={() => setShow3D(false)}
        />
      )}
    </div>
  )
}

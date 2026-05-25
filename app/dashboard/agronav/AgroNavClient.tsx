'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
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

interface SavedOperation {
  id: string
  tipo: string
  larguraM: number
  anguloGraus: number
  velocidadeKmh: number
  areaHa: number
  passadas: number
  comprimentoKm: number
  tempoEstHoras: number
  tempoRealMin: number | null
  combustivelL: number | null
  modoGps: boolean
  completedAt: string | null
  createdAt: string
  field?: { name: string }
}

// ─── Tutorial ────────────────────────────────────────────────────────────────
const TUTORIAL_STEPS = [
  {
    icon: '🏡',
    title: 'Bem-vindo ao AgroNav',
    desc: 'Planeje cada operação de campo com precisão. Selecione a propriedade e o talhão onde o serviço será realizado.',
  },
  {
    icon: '✏️',
    title: 'Mapeie o Polígono',
    desc: 'Desenhe o contorno exato da área no mapa satélite. Quanto mais preciso o polígono, mais eficiente o planejamento das passadas.',
  },
  {
    icon: '⚙️',
    title: 'Configure a Operação',
    desc: 'Escolha o tipo de serviço (pulverização, plantio, colheita...), a largura do implemento e o ângulo das linhas de guiamento.',
  },
  {
    icon: '🚜',
    title: 'Visão 3D do Terreno',
    desc: 'Visualize o trajeto do maquinário em 3D sobre o terreno real da fazenda. Use a câmera livre para explorar laterais e arredores.',
  },
  {
    icon: '📋',
    title: 'Histórico e Relatórios',
    desc: 'Cada operação concluída é salva automaticamente. Exporte relatórios em CSV ou PDF para controle e documentação da propriedade.',
  },
]

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

// ─── Geometria pura ───────────────────────────────────────────────────────────
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

function calcCentroid(coords: [number, number][]): [number, number] {
  const lng = coords.reduce((s, p) => s + p[0], 0) / coords.length
  const lat = coords.reduce((s, p) => s + p[1], 0) / coords.length
  return [lng, lat]
}

// ─── Componente principal ────────────────────────────────────────────────────
export default function AgroNavClient({
  initialFieldId,
  initialServiceId,
}: {
  initialFieldId?: string
  initialServiceId?: string
} = {}) {
  const mapRef    = useRef<HTMLDivElement>(null)
  const mapInst   = useRef<L>(null)
  const polyRef   = useRef<L>(null)
  const linesRef  = useRef<L>(null)
  const drawItems = useRef<L>(null)
  const drawCtrl  = useRef<L>(null)
  const gpsMarkerMapRef = useRef<L>(null)

  // ── Estado principal
  const [properties, setProperties] = useState<PropertyData[]>([])
  const [propId,     setPropId]     = useState('')
  const [field,      setField]      = useState<FieldData | null>(null)
  const [tab,        setTab]        = useState<'talhao' | 'operacao' | 'resultado' | 'historico' | 'fila'>('talhao')
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
  const [mobileView, setMobileView] = useState<'painel' | 'mapa'>('painel')

  function irParaMapa() {
    setMobileView('mapa')
    setTimeout(() => mapInst.current?.invalidateSize?.(), 80)
  }

  // ── Tutorial primeira visita (aparece só uma vez, só ao abrir AgroNav)
  const [tutorialStep, setTutorialStep] = useState<number | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem('agronav-tutorial-v1')) {
      setTutorialStep(0)
    }
  }, [])

  function avancarTutorial() {
    if (tutorialStep === null) return
    if (tutorialStep < TUTORIAL_STEPS.length - 1) {
      setTutorialStep(tutorialStep + 1)
    } else {
      fecharTutorial()
    }
  }

  function fecharTutorial() {
    if (typeof window !== 'undefined') localStorage.setItem('agronav-tutorial-v1', '1')
    setTutorialStep(null)
  }

  // ── Opção A: Histórico
  const [historico,        setHistorico]        = useState<SavedOperation[]>([])
  const [loadingHistorico, setLoadingHistorico] = useState(false)
  const [salvandoOp,       setSalvandoOp]       = useState(false)

  // ── Opção B: GPS ao vivo
  const [gpsActive, setGpsActive]   = useState(false)
  const [gpsPos,    setGpsPos]      = useState<{ lat: number; lng: number } | null>(null)
  const gpsWatchRef = useRef<number | null>(null)

  // ── Opção D: Fila multi-talhão
  const [fieldQueue,      setFieldQueue]      = useState<FieldData[]>([])
  const [journeyActive,   setJourneyActive]   = useState(false)
  const [journeyIdx,      setJourneyIdx]      = useState(0)
  const [journeyResults,  setJourneyResults]  = useState<{ name: string; areaHa: number; tempoRealMin: number }[]>([])
  const [journeyDone,     setJourneyDone]     = useState(false)

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

  // ── Auto-seleciona talhão se veio via URL (Opção C)
  useEffect(() => {
    if (!initialFieldId || !properties.length) return
    for (const prop of properties) {
      const f = prop.fields.find(f => f.id === initialFieldId)
      if (f) { setPropId(prop.id); setField(f); setTab('talhao'); break }
    }
  }, [initialFieldId, properties])

  // ── Inicializa Leaflet
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

      // Botões da toolbar de desenho maiores (mais fácil em campo / mobile)
      if (!document.getElementById('agronav-draw-override')) {
        const s = document.createElement('style')
        s.id = 'agronav-draw-override'
        s.textContent = `
          .leaflet-draw-toolbar a {
            width: 40px !important; height: 40px !important;
            line-height: 40px !important; font-size: 16px !important;
          }
          .leaflet-draw-toolbar { background-size: 40px !important; }
          .leaflet-draw-toolbar .sr-only { display: none; }
          .leaflet-draw-actions li a { height: 36px !important; line-height: 36px !important; padding: 0 12px !important; font-size: 13px !important; }
          .leaflet-draw-actions { top: 0 !important; }
        `
        document.head.appendChild(s)
      }
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

  // ── Voa para propriedade
  useEffect(() => {
    const prop = properties.find(p => p.id === propId)
    if (!prop || !mapInst.current) return
    if (prop.lat && prop.lng) mapInst.current.flyTo([prop.lat, prop.lng], 14, { duration: 1.5 })
    setField(null); setCoords(null); setLocalGeoJson(null); setLinhas(null); setRelatorio(null)
  }, [propId, properties])

  // ── Mostra polígono do talhão
  useEffect(() => {
    if (!mapInst.current || !field) return
    const Lx: L = (window as L).L
    if (!Lx) return
    if (polyRef.current) { mapInst.current.removeLayer(polyRef.current); polyRef.current = null }
    if (linesRef.current) { mapInst.current.removeLayer(linesRef.current); linesRef.current = null }
    setLinhas(null); setRelatorio(null)
    carregarHistorico(field.id)

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

  // ── Renderiza linhas no mapa
  useEffect(() => {
    if (!mapInst.current || !linhas) return
    const Lx: L = (window as L).L
    if (!Lx) return
    if (linesRef.current) { mapInst.current.removeLayer(linesRef.current) }
    const group = Lx.layerGroup()
    linhas.forEach(([p1, p2], i) => {
      Lx.polyline([[p1[1], p1[0]], [p2[1], p2[0]]], {
        color: i % 2 === 0 ? '#fde047' : '#93c5fd', weight: 1.8, opacity: 0.9,
      }).addTo(group)
    })
    group.addTo(mapInst.current)
    linesRef.current = group
  }, [linhas])

  // ── Opção B: GPS ao vivo — marcador no mapa
  useEffect(() => {
    if (!mapInst.current || !gpsPos) return
    const Lx: L = (window as L).L
    if (!Lx) return
    if (gpsMarkerMapRef.current) {
      gpsMarkerMapRef.current.setLatLng([gpsPos.lat, gpsPos.lng])
    } else {
      const icon = Lx.divIcon({
        className: '',
        html: '<div style="width:16px;height:16px;background:#2196f3;border:2px solid white;border-radius:50%;box-shadow:0 0 8px #2196f3;"></div>',
        iconSize: [16, 16], iconAnchor: [8, 8],
      })
      gpsMarkerMapRef.current = Lx.marker([gpsPos.lat, gpsPos.lng], { icon }).addTo(mapInst.current)
        .bindPopup('📡 Sua posição GPS')
    }
  }, [gpsPos])

  // ── GPS toggle
  const toggleGps = useCallback(() => {
    if (!navigator.geolocation) { alert('GPS não disponível neste dispositivo'); return }
    if (gpsActive) {
      if (gpsWatchRef.current != null) navigator.geolocation.clearWatch(gpsWatchRef.current)
      gpsWatchRef.current = null
      if (gpsMarkerMapRef.current && mapInst.current) {
        mapInst.current.removeLayer(gpsMarkerMapRef.current)
        gpsMarkerMapRef.current = null
      }
      setGpsPos(null)
      setGpsActive(false)
    } else {
      setGpsActive(true)
      gpsWatchRef.current = navigator.geolocation.watchPosition(
        pos => setGpsPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setGpsActive(false),
        { enableHighAccuracy: true, maximumAge: 2000 }
      )
    }
  }, [gpsActive])

  // ── Histórico (Opção A)
  const carregarHistorico = useCallback(async (fieldId: string) => {
    setLoadingHistorico(true)
    try {
      const res = await fetch(`/api/agronav/operacoes?fieldId=${fieldId}`)
      const d = await res.json()
      setHistorico(d.operacoes ?? [])
    } catch {}
    setLoadingHistorico(false)
  }, [])

  // ── Salvar operação concluída (Opção A)
  const salvarOperacao = useCallback(async (
    tempoRealMin: number,
    fieldAlvo: FieldData,
    coordsAlvo: [number, number][],
    linhasAlvo: [number, number][][],
    configAlvo: Config,
    isModoGps: boolean,
    serviceIdAlvo?: string
  ) => {
    setSalvandoOp(true)
    try {
      const relat = calcRelatorio(coordsAlvo, linhasAlvo, configAlvo.velocidade)
      await fetch('/api/agronav/operacoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fieldId: fieldAlvo.id,
          tipo: configAlvo.tipo,
          larguraM: configAlvo.largura,
          anguloGraus: configAlvo.angulo,
          velocidadeKmh: configAlvo.velocidade,
          areaHa: relat.areaHa,
          passadas: relat.passadas,
          comprimentoKm: relat.comprimentoKm,
          tempoEstHoras: relat.tempoHoras,
          tempoRealMin,
          modoGps: isModoGps,
          serviceId: serviceIdAlvo ?? null,
        }),
      })
      if (fieldAlvo.id === field?.id) carregarHistorico(fieldAlvo.id)
    } catch {}
    setSalvandoOp(false)
  }, [field, carregarHistorico])

  // ── Handler: operação concluída no 3D (campo único)
  const handleOperationComplete = useCallback((tempoRealMin: number) => {
    if (!field || !coords || !linhas) return
    salvarOperacao(tempoRealMin, field, coords, linhas, config, gpsActive, initialServiceId)
  }, [field, coords, linhas, config, gpsActive, initialServiceId, salvarOperacao])

  // ── Handler: operação concluída em jornada (Opção D)
  const handleJourneyFieldComplete = useCallback((tempoRealMin: number) => {
    if (!fieldQueue.length) return
    const currentField = fieldQueue[journeyIdx]
    if (!currentField) return

    // Coordenadas do talhão atual da fila
    let qCoords: [number, number][] | null = null
    try {
      if (currentField.geoJson) {
        const gj = JSON.parse(currentField.geoJson)
        const raw = gj.coordinates?.[0] ?? gj.geometry?.coordinates?.[0]
        if (raw) qCoords = raw.map((c: number[]) => [c[0], c[1]] as [number, number])
      }
    } catch {}

    if (qCoords) {
      const qLinhas = gerarLinhas(qCoords, config.largura, config.angulo)
      salvarOperacao(tempoRealMin, currentField, qCoords, qLinhas, config, gpsActive, initialServiceId)
      setJourneyResults(prev => [...prev, { name: currentField.name, areaHa: calcAreaHa(qCoords!), tempoRealMin }])
    }

    const nextIdx = journeyIdx + 1
    if (nextIdx < fieldQueue.length) {
      setJourneyIdx(nextIdx)
      const nextField = fieldQueue[nextIdx]
      setField(nextField)
      // Pequeno delay para o mapa atualizar antes de abrir o 3D
      setTimeout(() => setShow3D(true), 800)
    } else {
      setJourneyDone(true)
      setJourneyActive(false)
      setShow3D(false)
    }
  }, [fieldQueue, journeyIdx, config, gpsActive, initialServiceId, salvarOperacao])

  // ── Modo jornada: prepara e lança (Opção D)
  const iniciarJornada = useCallback(() => {
    if (!fieldQueue.length) return
    setJourneyActive(true)
    setJourneyIdx(0)
    setJourneyResults([])
    setJourneyDone(false)
    const firstField = fieldQueue[0]
    setField(firstField)
    setPropId(properties.find(p => p.fields.some(f => f.id === firstField.id))?.id ?? propId)
    setTimeout(() => {
      const qCoords = (() => {
        try {
          if (!firstField.geoJson) return null
          const gj = JSON.parse(firstField.geoJson)
          const raw = gj.coordinates?.[0] ?? gj.geometry?.coordinates?.[0]
          return raw ? raw.map((c: number[]) => [c[0], c[1]] as [number, number]) : null
        } catch { return null }
      })()
      if (qCoords) {
        setCoords(qCoords)
        const ls = gerarLinhas(qCoords, config.largura, config.angulo)
        setLinhas(ls)
        setRelatorio(calcRelatorio(qCoords, ls, config.velocidade))
      }
      setShow3D(true)
    }, 600)
  }, [fieldQueue, properties, propId, config])

  // ── Ativa desenho Leaflet
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
      if (polyRef.current) mapInst.current.removeLayer(polyRef.current)
      const layer = (window as L).L.geoJSON(gj, {
        style: { color: '#22c55e', weight: 2.5, fillOpacity: 0.15, fillColor: '#22c55e' }
      }).addTo(mapInst.current)
      polyRef.current = layer
    })
  }, [])

  // ── Salva polígono
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
          ...p, fields: p.fields.map(f => f.id === field.id ? { ...f, geoJson: localGeoJson } : f),
        })))
        setField(f => f ? { ...f, geoJson: localGeoJson } : f)
      } else {
        const d = await res.json()
        setMsg(d.error || 'Erro ao salvar')
      }
    } catch { setMsg('Erro de rede ao salvar') }
    setSalvando(false)
  }, [field, localGeoJson, coords])

  // ── Gera linhas
  const gerarLinhasOp = useCallback(() => {
    if (!coords || coords.length < 3) return
    setGerando(true)
    setTimeout(() => {
      const ls = gerarLinhas(coords, config.largura, config.angulo)
      setLinhas(ls)
      setRelatorio(calcRelatorio(coords, ls, config.velocidade))
      setTab('resultado')
      setGerando(false)
    }, 30)
  }, [coords, config])

  // ── Export CSV de uma operação
  const exportarCSV = useCallback((opId: string) => {
    window.open(`/api/agronav/operacoes/${opId}/exportar?format=csv`, '_blank')
  }, [])

  // ── Export PDF client-side via jsPDF
  const exportarPDF = useCallback(async (op: SavedOperation) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const jsPDF = ((await import('jspdf')) as any).default ?? (await import('jspdf'))
      const doc = new jsPDF()
      doc.setFontSize(18)
      doc.text('AgroNav — Relatório de Operação', 14, 20)
      doc.setFontSize(11)
      const lines = [
        `Talhão: ${op.field?.name ?? field?.name ?? '—'}`,
        `Tipo: ${op.tipo}`,
        `Data: ${op.completedAt ? new Date(op.completedAt).toLocaleString('pt-BR') : '—'}`,
        '',
        `Área: ${Number(op.areaHa).toFixed(2)} ha`,
        `Passadas: ${op.passadas}`,
        `Distância total: ${Number(op.comprimentoKm).toFixed(1)} km`,
        `Tempo estimado: ${Number(op.tempoEstHoras).toFixed(2)} h`,
        op.tempoRealMin != null ? `Tempo real: ${Number(op.tempoRealMin).toFixed(0)} min` : '',
        op.combustivelL != null ? `Combustível est.: ${Number(op.combustivelL).toFixed(1)} L` : '',
        '',
        `Configuração`,
        `  Largura: ${op.larguraM} m`,
        `  Ângulo: ${op.anguloGraus}°`,
        `  Velocidade: ${op.velocidadeKmh} km/h`,
        `  GPS: ${op.modoGps ? 'Sim' : 'Não'}`,
      ].filter(Boolean)
      doc.text(lines, 14, 35)
      doc.save(`operacao-${op.id.slice(0, 8)}.pdf`)
    } catch (e) {
      console.error('PDF export error', e)
    }
  }, [field])

  function handleTipoChange(tipo: string) {
    const a = ATIVIDADES.find(x => x.value === tipo)
    setConfig(c => ({ ...c, tipo, largura: a?.largura ?? c.largura }))
  }

  const prop = properties.find(p => p.id === propId)
  const temPoligono = !!(field?.geoJson || localGeoJson)

  // GPS origin para AgroNav3D (centroide das coords)
  const gpsOrigin = coords?.length ? calcCentroid(coords) : null
  const gpsCoordsFor3D = gpsActive && gpsPos && gpsOrigin
    ? { lat: gpsPos.lat, lng: gpsPos.lng, originLng: gpsOrigin[0], originLat: gpsOrigin[1] }
    : null

  // Talhão e linhas para o 3D (fila ou campo único)
  const activeFieldFor3D = journeyActive ? (fieldQueue[journeyIdx] ?? field) : field
  const activeLinesFor3D = linhas
  const activeCoordsFor3D = coords

  return (
    <div className="flex bg-slate-100 relative" style={{ height: 'calc(100vh - 64px)' }}>

      {/* ── Tutorial primeira visita ──────────────────────────────────────── */}
      {tutorialStep !== null && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,10,0,0.75)', backdropFilter: 'blur(8px)' }}>
          <div style={{
            background: 'linear-gradient(160deg, #0a1a0a 0%, #0f2010 100%)',
            border: '1px solid rgba(34,197,94,0.3)',
            borderRadius: 24,
            padding: '36px 40px',
            maxWidth: 420,
            width: '100%',
            boxShadow: '0 0 80px rgba(34,197,94,0.12), 0 24px 64px rgba(0,0,0,0.6)',
            position: 'relative',
          }}>
            {/* Fechar */}
            <button onClick={fecharTutorial} style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.07)', border: 'none', borderRadius: 8, width: 30, height: 30, color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>

            {/* Indicadores de passo */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 28, justifyContent: 'center' }}>
              {TUTORIAL_STEPS.map((_, i) => (
                <div key={i} style={{
                  height: 4, borderRadius: 999,
                  width: i === tutorialStep ? 24 : 8,
                  background: i <= tutorialStep ? '#22c55e' : 'rgba(255,255,255,0.15)',
                  transition: 'all 0.3s',
                }} />
              ))}
            </div>

            {/* Ícone */}
            <div style={{ fontSize: 52, textAlign: 'center', marginBottom: 16 }}>
              {TUTORIAL_STEPS[tutorialStep].icon}
            </div>

            {/* Conteúdo */}
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div style={{ color: '#fff', fontSize: 20, fontWeight: 800, marginBottom: 10 }}>
                {TUTORIAL_STEPS[tutorialStep].title}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.62)', fontSize: 14, lineHeight: 1.65 }}>
                {TUTORIAL_STEPS[tutorialStep].desc}
              </div>
            </div>

            {/* Botões */}
            <div style={{ display: 'flex', gap: 10 }}>
              {tutorialStep > 0 && (
                <button onClick={() => setTutorialStep(t => (t ?? 1) - 1)} style={{ flex: 1, padding: '12px 0', borderRadius: 14, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.55)', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                  ← Anterior
                </button>
              )}
              <button onClick={avancarTutorial} style={{ flex: 2, padding: '12px 0', borderRadius: 14, background: tutorialStep === TUTORIAL_STEPS.length - 1 ? '#15803d' : '#22c55e', border: 'none', color: '#fff', fontWeight: 800, fontSize: 14, cursor: 'pointer', boxShadow: '0 4px 20px rgba(34,197,94,0.3)' }}>
                {tutorialStep === TUTORIAL_STEPS.length - 1 ? '🚀 Começar' : 'Próximo →'}
              </button>
            </div>

            {/* Pular */}
            {tutorialStep < TUTORIAL_STEPS.length - 1 && (
              <button onClick={fecharTutorial} style={{ display: 'block', margin: '14px auto 0', background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: 12, cursor: 'pointer' }}>
                Pular tutorial
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Painel esquerdo ─────────────────────────────────────────────── */}
      <div className={`flex-shrink-0 bg-white border-r border-slate-200 flex-col overflow-hidden shadow-sm pb-14 md:pb-0 md:w-80 ${mobileView === 'painel' ? 'flex w-full' : 'hidden md:flex'}`}>

        {/* Header */}
        <div className="px-4 py-3 bg-gradient-to-r from-green-800 to-green-600 flex items-center gap-3">
          <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center text-xl flex-shrink-0">🗺️</div>
          <div className="flex-1 min-w-0">
            <div className="text-white font-bold text-sm leading-tight">AgroNav</div>
            <div className="text-green-200 text-[11px]">Planejamento de Campo</div>
          </div>
          {/* GPS badge */}
          <button
            onClick={toggleGps}
            title={gpsActive ? 'Desativar GPS' : 'Ativar GPS ao vivo'}
            className={`w-8 h-8 rounded-lg flex items-center justify-center text-base transition-all ${
              gpsActive ? 'bg-blue-500 animate-pulse' : 'bg-white/15 hover:bg-white/25'
            }`}
          >
            📡
          </button>
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
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Talhões</span>
            {fieldQueue.length > 0 && (
              <span className="text-[10px] bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full">
                {fieldQueue.length} na fila
              </span>
            )}
          </div>
          {!prop?.fields.length ? (
            <p className="text-xs text-slate-400">Nenhum talhão nesta propriedade.</p>
          ) : (
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-0.5">
              {prop.fields.map(f => (
                <div key={f.id} className="flex gap-1">
                  <button
                    onClick={() => { setField(f); setTab('talhao'); setMsg('') }}
                    className={`flex-1 text-left px-3 py-2 rounded-xl text-sm transition-all border ${
                      field?.id === f.id
                        ? 'bg-green-50 border-green-300 text-green-800 shadow-sm'
                        : 'border-slate-100 hover:bg-slate-50 text-slate-700 hover:border-slate-200'
                    }`}
                  >
                    <div className="font-semibold flex items-center gap-1 leading-tight text-xs">
                      <span>{f.geoJson ? '🟢' : '⚪'}</span>
                      <span className="truncate">{f.name}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {Number(f.sizeHectares).toFixed(1)} ha
                    </div>
                  </button>
                  {/* Botão adicionar à fila (Opção D) */}
                  <button
                    onClick={() => {
                      if (!f.geoJson) return
                      setFieldQueue(q => q.find(x => x.id === f.id) ? q.filter(x => x.id !== f.id) : [...q, f])
                    }}
                    title={fieldQueue.find(x => x.id === f.id) ? 'Remover da fila' : 'Adicionar à fila'}
                    className={`w-8 rounded-xl text-xs font-bold transition-colors flex-shrink-0 ${
                      fieldQueue.find(x => x.id === f.id)
                        ? 'bg-green-600 text-white'
                        : f.geoJson ? 'bg-slate-100 text-slate-500 hover:bg-slate-200' : 'bg-slate-50 text-slate-300 cursor-not-allowed'
                    }`}
                  >
                    {fieldQueue.find(x => x.id === f.id) ? '✓' : '+'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Conteúdo com abas */}
        {field ? (
          <>
            <div className="flex border-b border-slate-100 flex-shrink-0 overflow-x-auto">
              {(['talhao', 'operacao', 'resultado', 'historico', 'fila'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`flex-shrink-0 px-3 py-2.5 text-[10px] font-bold transition-colors ${
                    tab === t
                      ? 'text-green-700 border-b-2 border-green-600 bg-green-50/60'
                      : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {t === 'talhao' ? 'Talhão'
                    : t === 'operacao' ? 'Operação'
                    : t === 'resultado' ? <>Resultado{relatorio && <span className="ml-0.5 text-green-600">✓</span>}</>
                    : t === 'historico' ? <>Histórico{historico.length > 0 && <span className="ml-1 bg-blue-100 text-blue-700 text-[9px] px-1 rounded-full">{historico.length}</span>}</>
                    : <>Fila{fieldQueue.length > 0 && <span className="ml-1 bg-amber-100 text-amber-700 text-[9px] px-1 rounded-full">{fieldQueue.length}</span>}</>
                  }
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">

              {/* ── Talhão */}
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

                  <button onClick={ativarDesenho}
                    className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                      desenhando ? 'bg-amber-50 text-amber-700 border-2 border-amber-300 animate-pulse'
                        : 'bg-green-700 text-white hover:bg-green-800'}`}
                  >
                    {desenhando ? '✏️ Desenhando...' : temPoligono ? '✏️ Redesenhar polígono' : '✏️ Desenhar polígono'}
                  </button>

                  {localGeoJson && !field.geoJson && (
                    <button onClick={salvarTalhao} disabled={salvando}
                      className="w-full py-2.5 rounded-xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {salvando ? 'Salvando...' : '💾 Salvar talhão'}
                    </button>
                  )}

                  {temPoligono && (
                    <button onClick={() => setTab('operacao')}
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

              {/* ── Operação */}
              {tab === 'operacao' && (
                <div className="space-y-4">
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Tipo de operação</div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {ATIVIDADES.map(a => (
                        <button key={a.value} onClick={() => handleTipoChange(a.value)}
                          className={`text-[11px] px-2 py-2.5 rounded-xl font-semibold transition-colors text-left leading-tight ${
                            config.tipo === a.value ? 'bg-green-700 text-white shadow-sm' : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                          }`}
                        >
                          <span className="mr-1">{a.icon}</span>{a.value}
                        </button>
                      ))}
                    </div>
                  </div>

                  {[
                    { label: 'Largura do implemento', key: 'largura' as const, min: 1, max: 40, step: 0.5, unit: 'm' },
                    { label: 'Ângulo das linhas', key: 'angulo' as const, min: 0, max: 179, step: 1, unit: '°' },
                    { label: 'Velocidade operacional', key: 'velocidade' as const, min: 2, max: 20, step: 0.5, unit: 'km/h' },
                  ].map(({ label, key, min, max, step, unit }) => (
                    <div key={key}>
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
                        <span className="text-xs font-bold text-green-700">{config[key]} {unit}</span>
                      </div>
                      <input type="range" min={min} max={max} step={step} value={config[key]}
                        onChange={e => setConfig(c => ({ ...c, [key]: Number(e.target.value) }))}
                        className="w-full accent-green-600 cursor-pointer"
                      />
                    </div>
                  ))}

                  <button onClick={gerarLinhasOp} disabled={gerando || !coords}
                    className="w-full py-3 rounded-xl text-sm font-bold bg-green-700 text-white hover:bg-green-800 disabled:opacity-50 transition-colors shadow-sm"
                  >
                    {gerando ? '⚙️ Calculando...' : '⚡ Gerar linhas de guiamento'}
                  </button>

                  {!coords && (
                    <p className="text-xs text-center text-amber-600 bg-amber-50 p-2 rounded-xl">
                      Desenhe o polígono do talhão primeiro
                    </p>
                  )}
                </div>
              )}

              {/* ── Resultado */}
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
                          { label: 'Área', value: relatorio.areaHa.toFixed(2), unit: 'ha', color: 'green' },
                          { label: 'Passadas', value: relatorio.passadas, unit: 'linhas', color: 'blue' },
                          { label: 'Distância', value: relatorio.comprimentoKm.toFixed(1), unit: 'km', color: 'amber' },
                          { label: 'Tempo est.', value: relatorio.tempoHoras < 1 ? `${Math.round(relatorio.tempoHoras * 60)} min` : `${relatorio.tempoHoras.toFixed(1)} h`, unit: `a ${config.velocidade} km/h`, color: 'purple' },
                        ].map(item => (
                          <div key={item.label} className={`bg-${item.color}-50 rounded-xl p-3 border border-${item.color}-100`}>
                            <div className={`text-[11px] text-${item.color}-600 font-bold`}>{item.label}</div>
                            <div className={`text-xl font-black text-${item.color}-700 leading-tight`}>{item.value}</div>
                            <div className={`text-[10px] text-${item.color}-500 mt-0.5`}>{item.unit}</div>
                          </div>
                        ))}
                      </div>

                      <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100 text-xs space-y-2">
                        <div className="font-bold text-slate-600 mb-1">Combustível estimado</div>
                        <div className="flex justify-between text-slate-500">
                          <span>Consumo (18 L/h)</span>
                          <span className="font-semibold text-slate-700">{(relatorio.tempoHoras * 18).toFixed(1)} L</span>
                        </div>
                      </div>

                      <button onClick={() => setShow3D(true)}
                        className="w-full py-3 rounded-xl text-sm font-bold bg-slate-900 text-white hover:bg-slate-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
                      >
                        🚜 Abrir visão 3D
                      </button>

                      <button onClick={() => setTab('operacao')}
                        className="w-full py-2 rounded-xl text-xs font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors"
                      >
                        ↩ Recalcular
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* ── Histórico (Opção A) */}
              {tab === 'historico' && (
                <div className="space-y-3">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Operações — {field.name}
                  </div>

                  {loadingHistorico ? (
                    <div className="space-y-2">
                      {[1, 2].map(i => <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />)}
                    </div>
                  ) : historico.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                      <div className="text-3xl mb-2">📋</div>
                      <p className="text-xs">Nenhuma operação registrada ainda.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {historico.map(op => (
                        <div key={op.id} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-bold text-slate-700">{op.tipo}</span>
                            <span className="text-[10px] text-slate-400">
                              {op.completedAt ? new Date(op.completedAt).toLocaleDateString('pt-BR') : '—'}
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-1 text-[10px] text-slate-500 mb-2">
                            <span>📐 {Number(op.areaHa).toFixed(1)} ha</span>
                            <span>↔ {op.passadas} pass.</span>
                            <span>⛽ {op.combustivelL ? `${Number(op.combustivelL).toFixed(0)} L` : '—'}</span>
                          </div>
                          {op.tempoRealMin != null && (
                            <div className="text-[10px] text-green-600 mb-2">
                              ⏱ Real: {Number(op.tempoRealMin).toFixed(0)} min
                              {op.modoGps && <span className="ml-1 text-blue-500">📡 GPS</span>}
                            </div>
                          )}
                          <div className="flex gap-1.5">
                            <button onClick={() => exportarCSV(op.id)}
                              className="flex-1 py-1.5 text-[10px] font-bold rounded-lg bg-slate-200 text-slate-600 hover:bg-slate-300 transition-colors"
                            >
                              ↓ CSV
                            </button>
                            <button onClick={() => exportarPDF(op)}
                              className="flex-1 py-1.5 text-[10px] font-bold rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                            >
                              ↓ PDF
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {salvandoOp && (
                    <div className="text-xs text-center text-green-600 bg-green-50 p-2 rounded-xl animate-pulse">
                      Salvando operação...
                    </div>
                  )}
                </div>
              )}

              {/* ── Fila multi-talhão (Opção D) */}
              {tab === 'fila' && (
                <div className="space-y-3">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Jornada de trabalho
                  </div>

                  {journeyDone && journeyResults.length > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-3 space-y-2">
                      <div className="text-xs font-bold text-green-700">✅ Jornada concluída!</div>
                      {journeyResults.map((r, i) => (
                        <div key={i} className="flex justify-between text-[10px] text-slate-600">
                          <span>{r.name}</span>
                          <span>{r.areaHa.toFixed(1)} ha · {r.tempoRealMin.toFixed(0)} min</span>
                        </div>
                      ))}
                      <div className="text-[10px] font-bold text-green-700 pt-1 border-t border-green-200">
                        Total: {journeyResults.reduce((s, r) => s + r.areaHa, 0).toFixed(1)} ha ·&nbsp;
                        {journeyResults.reduce((s, r) => s + r.tempoRealMin, 0).toFixed(0)} min
                      </div>
                    </div>
                  )}

                  {fieldQueue.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                      <div className="text-3xl mb-2">📋</div>
                      <p className="text-xs">Clique em + ao lado dos talhões para montar a fila da jornada.</p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-1.5">
                        {fieldQueue.map((f, i) => (
                          <div key={f.id} className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-100">
                            <span className="text-[10px] font-black text-slate-400 w-4">{i + 1}</span>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-semibold text-slate-700 truncate">{f.name}</div>
                              <div className="text-[10px] text-slate-400">{Number(f.sizeHectares).toFixed(1)} ha</div>
                            </div>
                            <button onClick={() => setFieldQueue(q => q.filter(x => x.id !== f.id))}
                              className="text-red-400 hover:text-red-600 text-xs font-bold"
                            >✕</button>
                          </div>
                        ))}
                      </div>

                      {/* Resumo da jornada */}
                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-xs space-y-1">
                        <div className="font-bold text-slate-600 mb-1">Estimativa da jornada</div>
                        <div className="flex justify-between text-slate-500">
                          <span>Talhões</span><span className="font-semibold">{fieldQueue.length}</span>
                        </div>
                        <div className="flex justify-between text-slate-500">
                          <span>Área total</span>
                          <span className="font-semibold">
                            {fieldQueue.reduce((s, f) => {
                              try {
                                if (!f.geoJson) return s + Number(f.sizeHectares)
                                const gj = JSON.parse(f.geoJson)
                                const raw = gj.coordinates?.[0] ?? gj.geometry?.coordinates?.[0]
                                return raw ? s + calcAreaHa(raw.map((c: number[]) => [c[0], c[1]] as [number, number])) : s + Number(f.sizeHectares)
                              } catch { return s + Number(f.sizeHectares) }
                            }, 0).toFixed(1)} ha
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={iniciarJornada}
                        disabled={!fieldQueue.every(f => f.geoJson)}
                        className="w-full py-3 rounded-xl text-sm font-bold bg-green-700 text-white hover:bg-green-800 disabled:opacity-50 transition-colors"
                      >
                        🚜 Iniciar Jornada ({fieldQueue.length} talhões)
                      </button>

                      {!fieldQueue.every(f => f.geoJson) && (
                        <p className="text-[10px] text-amber-600 text-center">
                          Alguns talhões não têm polígono mapeado
                        </p>
                      )}
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
              <p className="text-xs text-slate-400 mt-1">para iniciar o planejamento</p>
              {fieldQueue.length > 0 && (
                <button onClick={() => setTab('fila')}
                  className="mt-3 px-4 py-2 rounded-xl text-xs font-bold bg-green-600 text-white hover:bg-green-700"
                >
                  Ver fila ({fieldQueue.length})
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Mapa ────────────────────────────────────────────────────────── */}
      <div className={`flex-1 relative pb-14 md:pb-0 ${mobileView === 'mapa' ? 'block' : 'hidden md:block'}`}>
        <div ref={mapRef} className="w-full h-full" />

        {desenhando && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-green-800 text-white text-sm font-semibold px-5 py-2.5 rounded-full shadow-xl pointer-events-none animate-bounce">
            ✏️ Clique para vértices · Duplo-clique para concluir
          </div>
        )}

        {gpsActive && (
          <div className="absolute top-4 right-4 z-[1000] bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2 animate-pulse">
            <span className="w-2 h-2 bg-white rounded-full" />
            GPS ao vivo
            {gpsPos && <span className="font-normal opacity-80">{gpsPos.lat.toFixed(4)}, {gpsPos.lng.toFixed(4)}</span>}
          </div>
        )}

        {journeyActive && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-amber-600 text-white text-sm font-bold px-4 py-2 rounded-full shadow-lg">
            Jornada: talhão {journeyIdx + 1}/{fieldQueue.length} — {fieldQueue[journeyIdx]?.name}
          </div>
        )}

        {!field && !loading && (
          <div className="absolute inset-0 flex items-end justify-center pb-12 pointer-events-none">
            <div className="bg-white/90 backdrop-blur-md rounded-2xl p-5 text-center shadow-xl max-w-xs border border-white">
              <div className="text-5xl mb-2">🗺️</div>
              <div className="font-bold text-slate-800">AgroNav</div>
              <p className="text-sm text-slate-500 mt-1 leading-snug">
                Selecione uma propriedade e talhão para planejar sua operação.
              </p>
            </div>
          </div>
        )}

        {linhas && linhas.length > 0 && (
          <div className="absolute bottom-8 right-4 z-[900] bg-white/95 backdrop-blur rounded-xl px-3 py-2.5 shadow-lg border border-slate-100 text-xs space-y-1.5">
            <div className="font-bold text-slate-600 text-[11px] mb-1">Linhas de guiamento</div>
            <div className="flex items-center gap-2"><div className="w-5 h-1 bg-yellow-300 rounded" /><span className="text-slate-500">Passadas ímpares</span></div>
            <div className="flex items-center gap-2"><div className="w-5 h-1 bg-blue-300 rounded" /><span className="text-slate-500">Passadas pares</span></div>
            <div className="flex items-center gap-2"><div className="w-5 h-2 bg-green-400/30 border border-green-500 rounded" /><span className="text-slate-500">Talhão</span></div>
          </div>
        )}
      </div>

      {/* ── Tabs mobile ─────────────────────────────────────────────────── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-[1001] bg-white border-t border-slate-200 flex">
        <button
          onClick={() => setMobileView('painel')}
          className={`flex-1 py-3.5 text-sm font-bold flex items-center justify-center gap-1.5 transition-colors ${
            mobileView === 'painel' ? 'text-green-700 bg-green-50 border-t-2 border-green-600' : 'text-slate-500'
          }`}
        >
          📋 Planejamento
        </button>
        <button
          onClick={irParaMapa}
          className={`flex-1 py-3.5 text-sm font-bold flex items-center justify-center gap-1.5 transition-colors ${
            mobileView === 'mapa' ? 'text-green-700 bg-green-50 border-t-2 border-green-600' : 'text-slate-500'
          }`}
        >
          🗺️ Mapa
        </button>
      </div>

      {/* ── Vista 3D (portal no body) */}
      {show3D && activeLinesFor3D && activeCoordsFor3D && typeof document !== 'undefined' && createPortal(
        <AgroNav3D
          lines={activeLinesFor3D}
          polygonCoords={activeCoordsFor3D}
          fieldName={activeFieldFor3D?.name ?? ''}
          config={config}
          gpsCoords={gpsCoordsFor3D}
          onClose={() => { setShow3D(false); if (journeyActive) { setJourneyActive(false) } }}
          onComplete={journeyActive ? handleJourneyFieldComplete : handleOperationComplete}
        />,
        document.body
      )}
    </div>
  )
}

'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

// ─── Types ───────────────────────────────────────────────────────────────────
interface Props {
  lines: [number, number][][]
  polygonCoords: [number, number][]
  fieldName: string
  config: { tipo: string; largura: number; angulo: number; velocidade: number }
  onClose: () => void
  onComplete?: (tempoRealMin: number) => void
  gpsCoords?: { lat: number; lng: number; originLng: number; originLat: number } | null
}

// ─── Geo utils ────────────────────────────────────────────────────────────────
function toXZ(lng: number, lat: number, oLng: number, oLat: number): [number, number] {
  const mLng = 111320 * Math.cos((oLat * Math.PI) / 180)
  return [(lng - oLng) * mLng, (lat - oLat) * 111320]
}

// ─── Tile math ────────────────────────────────────────────────────────────────
function latLngToTileXY(lat: number, lng: number, zoom: number) {
  const n = Math.pow(2, zoom)
  const x = Math.floor(((lng + 180) / 360) * n)
  const lr = (lat * Math.PI) / 180
  const y = Math.floor(((1 - Math.log(Math.tan(lr) + 1 / Math.cos(lr)) / Math.PI) / 2) * n)
  return { x, y }
}

function tileCornerLatLng(tx: number, ty: number, zoom: number) {
  const n = Math.pow(2, zoom)
  const lng = (tx / n) * 360 - 180
  const lat = (Math.atan(Math.sinh(Math.PI * (1 - (2 * ty) / n))) * 180) / Math.PI
  return { lat, lng }
}

// ─── Multi-octave noise ───────────────────────────────────────────────────────
function noise2D(x: number, z: number): number {
  let v = 0, amp = 1, freq = 1
  for (let i = 0; i < 4; i++) {
    v += Math.sin(x * freq + i * 1.73) * Math.cos(z * freq + i * 2.31) * amp
    amp *= 0.5; freq *= 2.13
  }
  return v
}

// ─── Tractor model ────────────────────────────────────────────────────────────
function buildTractor(larguraBoom: number): THREE.Group {
  const g = new THREE.Group()
  const gDark  = new THREE.MeshPhongMaterial({ color: 0x1b5e20 })
  const gMid   = new THREE.MeshPhongMaterial({ color: 0x2e7d32 })
  const black  = new THREE.MeshPhongMaterial({ color: 0x111111 })
  const silver = new THREE.MeshPhongMaterial({ color: 0x9e9e9e })
  const glass  = new THREE.MeshPhongMaterial({ color: 0x90caf9, transparent: true, opacity: 0.55, side: THREE.DoubleSide })
  const orange = new THREE.MeshPhongMaterial({ color: 0xf57c00 })

  const body = new THREE.Mesh(new THREE.BoxGeometry(2.5, 1.8, 5), gMid)
  body.position.y = 1.5; g.add(body)

  const hood = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.2, 2), gDark)
  hood.position.set(0, 1.1, 3); g.add(hood)

  const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.1, 1.6, 2.3), gDark)
  cabin.position.set(0, 3.15, 0); g.add(cabin)

  ;([
    [0, 3.15, 1.16, false], [0, 3.15, -1.16, false],
    [1.06, 3.15, 0, true],  [-1.06, 3.15, 0, true],
  ] as [number, number, number, boolean][]).forEach(([px, py, pz, side]) => {
    const win = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.2), glass)
    win.position.set(px, py, pz)
    if (side) win.rotation.y = Math.PI / 2
    g.add(win)
  })

  const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 2.2, 8), black)
  exhaust.position.set(0.8, 3.8, 1.5); g.add(exhaust)

  ;([-1.5, 1.5] as number[]).forEach(x => {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 0.8, 20), black)
    w.position.set(x, 1.2, -1.5); w.rotation.z = Math.PI / 2; g.add(w)
    const r = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.85, 10), silver)
    r.position.set(x, 1.2, -1.5); r.rotation.z = Math.PI / 2; g.add(r)
  })
  ;([-1.2, 1.2] as number[]).forEach(x => {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.5, 20), black)
    w.position.set(x, 0.75, 2.5); w.rotation.z = Math.PI / 2; g.add(w)
    const r = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.55, 10), silver)
    r.position.set(x, 0.75, 2.5); r.rotation.z = Math.PI / 2; g.add(r)
  })

  const halfBoom = larguraBoom / 2
  const boom = new THREE.Mesh(new THREE.BoxGeometry(larguraBoom, 0.15, 0.35), orange)
  boom.position.set(0, 1.8, 4.2); g.add(boom)
  ;([-halfBoom / 2, halfBoom / 2]).forEach(x => {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.8), orange)
    arm.position.set(x, 1.8, 3.8); g.add(arm)
  })
  const nc = Math.floor(larguraBoom / 0.5)
  for (let i = 0; i <= nc; i++) {
    const nx = -halfBoom + i * (larguraBoom / nc)
    const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.25, 6), black)
    nozzle.position.set(nx, 1.65, 4.2); g.add(nozzle)
  }
  return g
}

// ─── Componente principal ────────────────────────────────────────────────────
export default function AgroNav3D({ lines, polygonCoords, fieldName, config, onClose, onComplete, gpsCoords }: Props) {
  const containerRef    = useRef<HTMLDivElement>(null)
  const rendererRef     = useRef<THREE.WebGLRenderer | null>(null)
  const cameraRef       = useRef<THREE.PerspectiveCamera | null>(null)
  const tractorRef      = useRef<THREE.Group | null>(null)
  const crossRef        = useRef<THREE.Group | null>(null)
  const gpsMarkerRef    = useRef<THREE.Mesh | null>(null)
  const frameRef        = useRef(0)
  const startTimeRef    = useRef(Date.now())
  const stateRef        = useRef({ pass: 0, progress: 0, paused: false, speed: 1, completed: false })
  const controlsRef     = useRef<InstanceType<typeof OrbitControls> | null>(null)
  const coverageRef     = useRef<THREE.Mesh[]>([])
  const guidanceGrpRef  = useRef<THREE.Group | null>(null)
  const lines3DRef      = useRef<{ x1: number; z1: number; x2: number; z2: number }[]>([])
  const freeCamRef      = useRef(false)
  const updateGuidRef   = useRef<((p: number) => void) | null>(null)

  const [uiState, setUiState] = useState({ pass: 0, progress: 0, paused: false, speed: 1, completed: false })
  const [freeCam, setFreeCam] = useState(false)

  const toggleFreeCam = useCallback(() => {
    freeCamRef.current = !freeCamRef.current
    setFreeCam(f => !f)
    if (controlsRef.current) controlsRef.current.enabled = freeCamRef.current
  }, [])

  const build3DData = useCallback(() => {
    if (!lines.length || !polygonCoords.length) return null
    const mid = lines[0]
    const oLng = (mid[0][0] + mid[1][0]) / 2
    const oLat = (mid[0][1] + mid[1][1]) / 2
    const lines3D = lines.map(([p1, p2]) => ({
      x1: toXZ(p1[0], p1[1], oLng, oLat)[0], z1: toXZ(p1[0], p1[1], oLng, oLat)[1],
      x2: toXZ(p2[0], p2[1], oLng, oLat)[0], z2: toXZ(p2[0], p2[1], oLng, oLat)[1],
    }))
    const poly3D = polygonCoords.map(([lng, lat]) => {
      const [x, z] = toXZ(lng, lat, oLng, oLat)
      return new THREE.Vector3(x, 0.1, z)
    })
    return { lines3D, poly3D, oLng, oLat }
  }, [lines, polygonCoords])

  useEffect(() => {
    if (!containerRef.current || rendererRef.current) return
    const el = containerRef.current
    const W = el.clientWidth || window.innerWidth
    const H = el.clientHeight || window.innerHeight

    // ── Renderer ──────────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(W, H)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.1
    el.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // ── Scene ─────────────────────────────────────────────────────────────────
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x7fb8d8)
    scene.fog = new THREE.Fog(0x9ecce6, 250, 800)

    // ── Camera ────────────────────────────────────────────────────────────────
    const camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 2000)
    camera.position.set(0, 20, -30)
    camera.lookAt(0, 0, 30)
    cameraRef.current = camera

    // ── Orbit Controls ────────────────────────────────────────────────────────
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.07
    controls.minDistance = 8
    controls.maxDistance = 600
    controls.maxPolarAngle = Math.PI / 2.05
    controls.enabled = false
    controlsRef.current = controls

    // ── Lights ────────────────────────────────────────────────────────────────
    scene.add(new THREE.HemisphereLight(0x9bc8f0, 0x3a6b1f, 0.85))
    scene.add(new THREE.AmbientLight(0x7090a0, 0.25))
    const sun = new THREE.DirectionalLight(0xfff0cc, 1.7)
    sun.position.set(200, 400, 150)
    sun.castShadow = true
    sun.shadow.mapSize.set(2048, 2048)
    sun.shadow.camera.far = 800
    sun.shadow.camera.left = sun.shadow.camera.bottom = -300
    sun.shadow.camera.right = sun.shadow.camera.top = 300
    sun.shadow.bias = -0.0008
    scene.add(sun)

    // ── Sky dome (gradient) ───────────────────────────────────────────────────
    const skyGeo = new THREE.SphereGeometry(900, 32, 16)
    const skyPos = skyGeo.attributes.position
    const skyCols = new Float32Array(skyPos.count * 3)
    for (let i = 0; i < skyPos.count; i++) {
      const t = Math.max(0, Math.min(1, skyPos.getY(i) / 900))
      skyCols[i * 3]     = 0x9e / 255 + (0x2a / 255 - 0x9e / 255) * t
      skyCols[i * 3 + 1] = 0xcc / 255 + (0x68 / 255 - 0xcc / 255) * t
      skyCols[i * 3 + 2] = 0xe6 / 255 + (0xb8 / 255 - 0xe6 / 255) * t
    }
    skyGeo.setAttribute('color', new THREE.BufferAttribute(skyCols, 3))
    scene.add(new THREE.Mesh(skyGeo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, depthWrite: false })))

    // ── Build field data ──────────────────────────────────────────────────────
    const data = build3DData()
    if (!data) { renderer.dispose(); el.removeChild(renderer.domElement); return }
    const { lines3D, poly3D, oLng, oLat } = data
    lines3DRef.current = lines3D

    const allX = lines3D.flatMap(l => [l.x1, l.x2])
    const allZ = lines3D.flatMap(l => [l.z1, l.z2])
    const minX = Math.min(...allX), maxX = Math.max(...allX)
    const minZ = Math.min(...allZ), maxZ = Math.max(...allZ)
    const fieldW = maxX - minX, fieldD = maxZ - minZ
    const fieldCX = (minX + maxX) / 2, fieldCZ = (minZ + maxZ) / 2

    // ── Terrain ───────────────────────────────────────────────────────────────
    const TERRAIN_SIZE = Math.max(fieldW, fieldD) * 4 + 200
    const TERRAIN_SEGS = 110
    const tGeo = new THREE.PlaneGeometry(TERRAIN_SIZE, TERRAIN_SIZE, TERRAIN_SEGS, TERRAIN_SEGS)
    tGeo.rotateX(-Math.PI / 2)
    const tPos = tGeo.attributes.position
    const tCols = new Float32Array(tPos.count * 3)

    for (let i = 0; i < tPos.count; i++) {
      // Coords relative to field center
      const rx = tPos.getX(i) + fieldCX
      const rz = tPos.getZ(i) + fieldCZ
      // Distance from field bounding box edge
      const distField = Math.max(
        0,
        Math.max(minX - rx, rx - maxX),
        Math.max(minZ - rz, rz - maxZ)
      )
      const inField = distField < 4

      if (inField) {
        // Dark plowed soil — very flat inside field
        const y = noise2D(rx * 0.004, rz * 0.004) * 0.35
        tPos.setY(i, y)
        tCols[i * 3]     = 0x3c / 255
        tCols[i * 3 + 1] = 0x28 / 255
        tCols[i * 3 + 2] = 0x12 / 255
      } else {
        // Green undulating terrain outside
        const blend = Math.min(1, distField / 50)
        const y = noise2D(rx * 0.007, rz * 0.007) * 3.5 * blend
        tPos.setY(i, y)
        const g = 0.32 + y * 0.03
        tCols[i * 3]     = Math.min(0.4, 0.14 + y * 0.01)
        tCols[i * 3 + 1] = Math.min(0.62, Math.max(0.22, g))
        tCols[i * 3 + 2] = 0.08
      }
    }
    tGeo.computeVertexNormals()
    tGeo.setAttribute('color', new THREE.BufferAttribute(tCols, 3))

    const terrain = new THREE.Mesh(tGeo, new THREE.MeshLambertMaterial({ vertexColors: true }))
    terrain.receiveShadow = true
    terrain.position.set(fieldCX, 0, fieldCZ)
    scene.add(terrain)

    // ── Satellite imagery overlay (Esri — mesma fonte do mapa 2D) ─────────────
    if (polygonCoords.length > 3) {
      const latArr = polygonCoords.map(c => c[1])
      const lngArr = polygonCoords.map(c => c[0])
      const cLat = (Math.min(...latArr) + Math.max(...latArr)) / 2
      const cLng = (Math.min(...lngArr) + Math.max(...lngArr)) / 2
      const zoom = 17
      const ct = latLngToTileXY(cLat, cLng, zoom)
      const tileUrl = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${zoom}/${ct.y}/${ct.x}`

      const loader = new THREE.TextureLoader()
      loader.crossOrigin = 'anonymous'
      loader.load(tileUrl, (tex) => {
        tex.minFilter = THREE.LinearFilter
        tex.magFilter = THREE.LinearFilter

        const nw = tileCornerLatLng(ct.x, ct.y, zoom)
        const se = tileCornerLatLng(ct.x + 1, ct.y + 1, zoom)
        const [x1, z1] = toXZ(nw.lng, nw.lat, oLng, oLat)
        const [x2, z2] = toXZ(se.lng, se.lat, oLng, oLat)
        const pw = Math.abs(x2 - x1), ph = Math.abs(z2 - z1)
        const pcx = (x1 + x2) / 2, pcz = (z1 + z2) / 2

        const satMesh = new THREE.Mesh(
          new THREE.PlaneGeometry(pw, ph),
          new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.9, depthWrite: false })
        )
        satMesh.rotation.x = -Math.PI / 2
        satMesh.position.set(pcx, 0.08, pcz)
        scene.add(satMesh)
      })
    }

    // ── Trees decorativos nas bordas ──────────────────────────────────────────
    const treeMat  = new THREE.MeshLambertMaterial({ color: 0x2a5c24 })
    const trunkMat = new THREE.MeshLambertMaterial({ color: 0x5c3d1e })
    const radius   = Math.max(fieldW, fieldD) * 0.65
    for (let i = 0; i < 28; i++) {
      const a = (i / 28) * Math.PI * 2 + Math.random() * 0.4
      const r = radius * (1.3 + Math.random() * 1.0)
      const tx = fieldCX + Math.cos(a) * r
      const tz = fieldCZ + Math.sin(a) * r
      const h  = 6 + Math.random() * 5

      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 1.5, 5), trunkMat)
      trunk.position.set(tx, 0.75, tz); trunk.castShadow = true; scene.add(trunk)
      const canopy = new THREE.Mesh(new THREE.ConeGeometry(1.7 + Math.random(), h, 6), treeMat)
      canopy.position.set(tx, 1.5 + h / 2, tz); canopy.castShadow = true; scene.add(canopy)
    }

    // ── Polígono do talhão ────────────────────────────────────────────────────
    if (poly3D.length > 2) {
      const pts = [...poly3D.map(p => new THREE.Vector3(p.x, 0.22, p.z)), poly3D[0].clone().setY(0.22)]
      scene.add(new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(pts),
        new THREE.LineBasicMaterial({ color: 0x00ff88 })
      ))
      // Pulse glow (inner white)
      scene.add(new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(pts.map(p => p.clone().setY(0.19))),
        new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.18 })
      ))
    }

    // ── Coverage strips (novo sistema — substitui coloração de linhas) ─────────
    const strips: THREE.Mesh[] = []
    lines3D.forEach(l => {
      const dx = l.x2 - l.x1, dz = l.z2 - l.z1
      const len = Math.sqrt(dx * dx + dz * dz) || 1
      const angle = Math.atan2(dx, dz)
      const geo = new THREE.PlaneGeometry(config.largura, len)
      geo.applyMatrix4(new THREE.Matrix4().makeRotationX(-Math.PI / 2))
      geo.applyMatrix4(new THREE.Matrix4().makeRotationY(angle))
      const mat = new THREE.MeshBasicMaterial({
        color: 0x22c55e, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false,
      })
      const strip = new THREE.Mesh(geo, mat)
      strip.position.set((l.x1 + l.x2) / 2, 0.28, (l.z1 + l.z2) / 2)
      scene.add(strip)
      strips.push(strip)
    })
    coverageRef.current = strips

    // ── Guidance lines (só exibe linha atual + próximas 5) ────────────────────
    const guidanceGrp = new THREE.Group()
    scene.add(guidanceGrp)
    guidanceGrpRef.current = guidanceGrp

    const buildGuidanceLines = (currentPass: number) => {
      guidanceGrp.clear()
      lines3D.forEach((l, i) => {
        if (i < currentPass) return
        const dist = i - currentPass
        if (dist > 5) return
        const alpha = dist === 0 ? 1 : Math.max(0.12, 1 - dist * 0.18)
        const color = dist === 0 ? 0xffffff : dist <= 2 ? 0xffd700 : 0x88aaee
        guidanceGrp.add(new THREE.Line(
          new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(l.x1, 0.3, l.z1),
            new THREE.Vector3(l.x2, 0.3, l.z2),
          ]),
          new THREE.LineBasicMaterial({ color, transparent: alpha < 1, opacity: alpha })
        ))
      })
    }
    buildGuidanceLines(0)
    updateGuidRef.current = buildGuidanceLines

    // ── Nuvens ────────────────────────────────────────────────────────────────
    const cloudMat = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 })
    ;([[-260, 200, -360], [200, 240, -460], [-110, 215, -550], [330, 185, -410]] as number[][]).forEach(([cx, cy, cz]) => {
      ;([[0,0,0],[22,5,0],[-22,5,0],[0,5,18],[0,5,-18]] as number[][]).forEach(([ox, oy, oz]) => {
        const c = new THREE.Mesh(new THREE.SphereGeometry(15 + Math.random() * 8, 8, 6), cloudMat)
        c.position.set(cx + ox, cy + oy, cz + oz); c.scale.y = 0.45
        scene.add(c)
      })
    })

    // ── Trator ────────────────────────────────────────────────────────────────
    const tractor = buildTractor(config.largura)
    tractor.traverse(c => { if ((c as THREE.Mesh).isMesh) c.castShadow = true })
    scene.add(tractor)
    tractorRef.current = tractor
    if (lines3D.length > 0) tractor.position.set(lines3D[0].x1, 0, lines3D[0].z1)

    // ── Cruz de guiamento ─────────────────────────────────────────────────────
    const crossMat = new THREE.LineBasicMaterial({ color: 0x00ff44 })
    const cross = new THREE.Group()
    cross.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-5, 0.32, 0), new THREE.Vector3(5, 0.32, 0)]), crossMat))
    cross.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0.32, -5), new THREE.Vector3(0, 0.32, 5)]), crossMat))
    scene.add(cross)
    crossRef.current = cross

    // ── Marcador GPS ──────────────────────────────────────────────────────────
    const gpsMesh = new THREE.Mesh(
      new THREE.SphereGeometry(1.2, 16, 8),
      new THREE.MeshPhongMaterial({ color: 0x2196f3, emissive: 0x1565c0, emissiveIntensity: 0.5, transparent: true, opacity: 0.85 })
    )
    gpsMesh.visible = false
    scene.add(gpsMesh)
    gpsMarkerRef.current = gpsMesh

    // ── Loop de animação ──────────────────────────────────────────────────────
    const MACHINE_SPEED = config.velocidade / 3.6

    const animate = () => {
      frameRef.current = requestAnimationFrame(animate)
      const st = stateRef.current
      const now = Date.now()

      if (controlsRef.current?.enabled) controlsRef.current.update()

      if (!st.paused && !st.completed && lines3D.length > 0) {
        const pass = st.pass
        const l = lines3D[pass]
        const reversed = pass % 2 === 1
        const sx = reversed ? l.x2 : l.x1, sz = reversed ? l.z2 : l.z1
        const ex = reversed ? l.x1 : l.x2, ez = reversed ? l.z1 : l.z2
        const dx = ex - sx, dz = ez - sz
        const len = Math.sqrt(dx * dx + dz * dz) || 1

        st.progress += (MACHINE_SPEED * st.speed) / 60

        if (st.progress >= len) {
          // Marca strip concluída
          const sm = coverageRef.current[pass]?.material as THREE.MeshBasicMaterial
          if (sm) { sm.color.setHex(0x16a34a); sm.opacity = 0.48 }

          if (pass + 1 >= lines3D.length) {
            st.completed = true; st.paused = true
            const min = (now - startTimeRef.current) / 60000
            onComplete?.(parseFloat(min.toFixed(1)))
            setUiState(s => ({ ...s, completed: true, paused: true }))
          } else {
            st.progress = 0; st.pass = pass + 1
            buildGuidanceLines(st.pass)
            setUiState(s => ({ ...s, pass: st.pass, progress: 0 }))
          }
        } else {
          setUiState(s => ({ ...s, progress: st.progress / len }))
        }

        const t = Math.min(st.progress / len, 1)
        const px = sx + dx * t, pz = sz + dz * t

        // Pulsa strip ativa (amarelo)
        const am = coverageRef.current[pass]?.material as THREE.MeshBasicMaterial
        if (am) { am.color.setHex(0xfbbf24); am.opacity = 0.44 + 0.13 * Math.sin(now / 200) }

        if (tractorRef.current) {
          tractorRef.current.position.set(px, 0, pz)
          tractorRef.current.rotation.y = Math.atan2(dx, dz)
        }
        if (crossRef.current) crossRef.current.position.set(px, 0, pz)

        if (gpsCoords && gpsMarkerRef.current) {
          const [gx, gz] = toXZ(gpsCoords.lng, gpsCoords.lat, gpsCoords.originLng, gpsCoords.originLat)
          gpsMarkerRef.current.visible = true
          gpsMarkerRef.current.position.set(gx, 2, gz)
          gpsMarkerRef.current.scale.setScalar(0.9 + 0.1 * Math.sin(now / 300))
        } else if (gpsMarkerRef.current) {
          gpsMarkerRef.current.visible = false
        }

        // Câmera follow (quando não está em modo livre)
        if (!freeCamRef.current) {
          const dl = Math.sqrt(dx * dx + dz * dz) || 1
          const ndx = dx / dl, ndz = dz / dl
          camera.position.lerp(new THREE.Vector3(px - ndx * 22, 16, pz - ndz * 22), 0.06)
          camera.lookAt(px + ndx * 40, 1.2, pz + ndz * 40)
        }
      }

      renderer.render(scene, camera)
    }

    animate()

    const onResize = () => {
      const w = el.clientWidth, h = el.clientHeight
      camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.setSize(w, h)
    }
    window.addEventListener('resize', onResize)

    return () => {
      window.removeEventListener('resize', onResize)
      cancelAnimationFrame(frameRef.current)
      controls.dispose()
      renderer.dispose()
      el.removeChild(renderer.domElement)
      rendererRef.current = null; cameraRef.current = null; tractorRef.current = null
      crossRef.current = null; gpsMarkerRef.current = null; controlsRef.current = null
      coverageRef.current = []; guidanceGrpRef.current = null; updateGuidRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Controles de UI ───────────────────────────────────────────────────────
  function togglePause() {
    if (stateRef.current.completed) return
    stateRef.current.paused = !stateRef.current.paused
    setUiState(s => ({ ...s, paused: !s.paused }))
  }

  function setSpeed(v: number) {
    stateRef.current.speed = v
    setUiState(s => ({ ...s, speed: v }))
  }

  function jumpToPass(i: number) {
    coverageRef.current.forEach((strip, idx) => {
      const mat = strip.material as THREE.MeshBasicMaterial
      if (idx < i) { mat.color.setHex(0x16a34a); mat.opacity = 0.48 }
      else { mat.opacity = 0 }
    })
    updateGuidRef.current?.(i)
    stateRef.current = { pass: i, progress: 0, paused: false, speed: stateRef.current.speed, completed: false }
    setUiState(s => ({ ...s, pass: i, progress: 0, completed: false, paused: false }))
  }

  const speedKmh   = (config.velocidade * uiState.speed).toFixed(0)
  const progressPct = Math.round(uiState.progress * 100)
  const totalPasses = lines.length
  const overallPct  = totalPasses > 0 ? ((uiState.pass + uiState.progress) / totalPasses) * 100 : 0

  // ── JSX ───────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0" style={{ zIndex: 9999 }}>
      <div ref={containerRef} className="w-full h-full" />

      {/* Overlay de conclusão */}
      {uiState.completed && (
        <div className="absolute inset-0 z-20 flex items-center justify-center"
          style={{ background: 'rgba(0,5,0,0.6)', backdropFilter: 'blur(14px)' }}>
          <div style={{
            background: 'rgba(5,15,5,0.96)',
            border: '1px solid rgba(34,197,94,0.45)',
            borderRadius: 22,
            padding: '40px 48px',
            textAlign: 'center',
            maxWidth: 380,
            boxShadow: '0 0 80px rgba(34,197,94,0.15), inset 0 1px 0 rgba(255,255,255,0.06)',
          }}>
            <div style={{ fontSize: 52, marginBottom: 14 }}>✅</div>
            <div style={{ color: '#fff', fontSize: 24, fontWeight: 900, marginBottom: 4 }}>Operação Concluída!</div>
            <div style={{ color: '#4ade80', fontSize: 13, marginBottom: 4 }}>{fieldName}</div>
            <div style={{ color: '#6b7280', fontSize: 11, marginBottom: 28 }}>
              {totalPasses} passadas · {config.tipo} · {config.largura} m
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button onClick={() => jumpToPass(0)} style={{ padding: '10px 22px', borderRadius: 12, background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.12)', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
                ↺ Repetir
              </button>
              <button onClick={onClose} style={{ padding: '10px 22px', borderRadius: 12, background: '#15803d', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
                ← Voltar ao 2D
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top-left: brand */}
      <div style={{ position: 'absolute', top: 16, left: 16, zIndex: 10 }}>
        <div style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(16px)', borderRadius: 14, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, border: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ width: 34, height: 34, background: '#15803d', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🗺️</div>
          <div>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: 13, lineHeight: 1.2 }}>AgroNav 3D</div>
            <div style={{ color: '#4ade80', fontSize: 11, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fieldName}</div>
          </div>
        </div>
      </div>

      {/* Top-center: velocidade */}
      <div style={{ position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 10 }}>
        <div style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '8px 22px', textAlign: 'center' }}>
          <div style={{ color: '#fff', fontSize: 32, fontWeight: 900, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{speedKmh}</div>
          <div style={{ color: '#4ade80', fontSize: 10, fontWeight: 700, marginTop: 2 }}>km/h</div>
        </div>
      </div>

      {/* Top-right: info + câmera toggle */}
      <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 10, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
        <div style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '10px 14px', textAlign: 'right' }}>
          <div style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>{config.tipo}</div>
          <div style={{ color: '#86efac', fontSize: 11 }}>Barra {config.largura} m · {config.angulo}°</div>
          <div style={{ color: '#6b7280', fontSize: 11, marginTop: 4 }}>
            Passada <span style={{ color: '#fbbf24' }}>{uiState.pass + 1}</span>/{totalPasses} · <span style={{ color: '#4ade80' }}>{Math.round(overallPct)}%</span>
          </div>
        </div>
        <button onClick={toggleFreeCam} style={{
          background: freeCam ? 'rgba(251,191,36,0.18)' : 'rgba(0,0,0,0.72)',
          backdropFilter: 'blur(16px)',
          border: `1px solid ${freeCam ? 'rgba(251,191,36,0.45)' : 'rgba(255,255,255,0.07)'}`,
          borderRadius: 12, padding: '8px 14px',
          color: freeCam ? '#fbbf24' : '#9ca3af',
          fontSize: 11, fontWeight: 700, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          {freeCam ? '🎥 Câmera Livre' : '🚜 Seguir Trator'}
        </button>
      </div>

      {/* Bottom HUD */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10, padding: '16px 20px 28px', background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.6) 65%, transparent 100%)' }}>
        {/* Passada info */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>
            Passada <span style={{ color: '#fbbf24' }}>{uiState.pass + 1}</span>
            <span style={{ color: 'rgba(255,255,255,0.35)' }}> / {totalPasses}</span>
          </div>
          <div style={{ color: '#4ade80', fontSize: 12 }}>{progressPct}% desta passada</div>
        </div>

        {/* Barra de progresso geral */}
        <div style={{ height: 5, background: 'rgba(255,255,255,0.12)', borderRadius: 999, marginBottom: 10, overflow: 'hidden' }}>
          <div style={{ height: '100%', background: 'linear-gradient(90deg, #15803d, #4ade80)', borderRadius: 999, width: `${Math.min(100, overallPct)}%`, transition: 'width 0.15s' }} />
        </div>

        {/* Mini timeline */}
        <div style={{ display: 'flex', gap: 3, marginBottom: 14, overflowX: 'auto', paddingBottom: 2 }}>
          {lines.map((_, i) => (
            <button key={i} onClick={() => jumpToPass(i)} style={{
              height: 6, flexShrink: 0, borderRadius: 999, border: 'none', cursor: 'pointer', transition: 'all 0.15s',
              width: i === uiState.pass ? 20 : 7,
              background: i === uiState.pass ? '#fbbf24' : i < uiState.pass ? '#22c55e' : 'rgba(255,255,255,0.18)',
              padding: 0,
            }} />
          ))}
        </div>

        {/* Controles */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={onClose} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 14, padding: '10px 18px', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            ← 2D
          </button>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {([1, 2, 4, 8] as const).map(v => (
              <button key={v} onClick={() => setSpeed(v)} style={{
                width: 42, height: 42, borderRadius: 12, border: 'none', cursor: 'pointer',
                background: uiState.speed === v ? '#fbbf24' : 'rgba(255,255,255,0.1)',
                color: uiState.speed === v ? '#000' : '#fff',
                fontSize: 12, fontWeight: 800,
              }}>{v}×</button>
            ))}
            <button onClick={togglePause} disabled={uiState.completed} style={{
              width: 50, height: 42, borderRadius: 12, border: 'none', cursor: uiState.completed ? 'not-allowed' : 'pointer',
              background: uiState.completed ? 'rgba(255,255,255,0.05)' : '#15803d',
              color: uiState.completed ? '#555' : '#fff',
              fontSize: 18, fontWeight: 700,
            }}>
              {uiState.paused ? '▶' : '⏸'}
            </button>
          </div>
        </div>
      </div>

      {/* Legenda */}
      <div style={{ position: 'absolute', bottom: 148, right: 16, zIndex: 10, background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '10px 13px', fontSize: 11 }}>
        <div style={{ color: 'rgba(255,255,255,0.45)', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 7 }}>Cobertura</div>
        {[
          { color: '#fbbf24', label: 'Em execução' },
          { color: '#22c55e', label: 'Concluída' },
          { color: 'rgba(255,255,255,0.2)', label: 'Pendente' },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
            <div style={{ width: 16, height: 6, borderRadius: 3, background: color }} />
            <span style={{ color: 'rgba(255,255,255,0.6)' }}>{label}</span>
          </div>
        ))}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', marginTop: 6, paddingTop: 6, color: 'rgba(255,255,255,0.35)', fontSize: 10 }}>
          Linhas: ⚪ Ativa · 🟡 Próximas
        </div>
      </div>
    </div>
  )
}

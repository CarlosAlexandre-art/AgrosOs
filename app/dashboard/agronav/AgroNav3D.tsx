'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'

// ─── Types ───────────────────────────────────────────────────────────────────
interface Props {
  lines: [number, number][][]
  polygonCoords: [number, number][]
  fieldName: string
  config: { tipo: string; largura: number; angulo: number; velocidade: number }
  onClose: () => void
}

// ─── Coordenadas geográficas → 3D (metros) ───────────────────────────────────
function toXZ(
  lng: number, lat: number,
  originLng: number, originLat: number
): [number, number] {
  const mLng = 111320 * Math.cos((originLat * Math.PI) / 180)
  const mLat = 111320
  return [(lng - originLng) * mLng, (lat - originLat) * mLat]
}

// ─── Modelo 3D do trator ─────────────────────────────────────────────────────
function buildTractor(larguraBoom: number): THREE.Group {
  const g = new THREE.Group()

  const greenDark  = new THREE.MeshPhongMaterial({ color: 0x1b5e20 })
  const greenMid   = new THREE.MeshPhongMaterial({ color: 0x2e7d32 })
  const black      = new THREE.MeshPhongMaterial({ color: 0x111111 })
  const silver     = new THREE.MeshPhongMaterial({ color: 0x9e9e9e })
  const glass      = new THREE.MeshPhongMaterial({ color: 0x90caf9, transparent: true, opacity: 0.55, side: THREE.DoubleSide })
  const orange     = new THREE.MeshPhongMaterial({ color: 0xf57c00 })

  // Carroceria principal
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.5, 1.8, 5), greenMid)
  body.position.y = 1.5
  g.add(body)

  // Capô dianteiro
  const hood = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.2, 2), greenDark)
  hood.position.set(0, 1.1, 3)
  g.add(hood)

  // Cabine
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.1, 1.6, 2.3), greenDark)
  cabin.position.set(0, 3.15, 0)
  g.add(cabin)

  // Vidros da cabine
  ;[
    [0, 3.15, 1.16, 1.9, 1.4, 0],
    [0, 3.15, -1.16, 1.9, 1.4, 0],
    [1.06, 3.15, 0, 0, 1.4, 2.1],
    [-1.06, 3.15, 0, 0, 1.4, 2.1],
  ].forEach(([px, py, pz, ry]) => {
    const win = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.2), glass)
    win.position.set(px, py, pz)
    if (ry) win.rotation.y = Math.PI / 2
    g.add(win)
  })

  // Escapamento
  const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 2.2, 8), black)
  exhaust.position.set(0.8, 3.8, 1.5)
  g.add(exhaust)

  // Rodas traseiras (grandes)
  ;[[-1.5, 0, -1.5], [1.5, 0, -1.5]].forEach(([x, , z]) => {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 0.8, 20), black)
    wheel.position.set(x, 1.2, z)
    wheel.rotation.z = Math.PI / 2
    g.add(wheel)
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.85, 10), silver)
    rim.position.set(x, 1.2, z)
    rim.rotation.z = Math.PI / 2
    g.add(rim)
  })

  // Rodas dianteiras (pequenas)
  ;[[-1.2, 0, 2.5], [1.2, 0, 2.5]].forEach(([x, , z]) => {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.5, 20), black)
    wheel.position.set(x, 0.75, z)
    wheel.rotation.z = Math.PI / 2
    g.add(wheel)
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.55, 10), silver)
    rim.position.set(x, 0.75, z)
    rim.rotation.z = Math.PI / 2
    g.add(rim)
  })

  // Barra de implemento (spray bar / barra de plantio)
  const halfBoom = larguraBoom / 2
  const boom = new THREE.Mesh(new THREE.BoxGeometry(larguraBoom, 0.15, 0.35), orange)
  boom.position.set(0, 1.8, 4.2)
  g.add(boom)

  // Hastes laterais do boom
  ;[[-halfBoom / 2, 1.8, 3.8], [halfBoom / 2, 1.8, 3.8]].forEach(([x, y, z]) => {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.8), orange)
    arm.position.set(x, y, z)
    g.add(arm)
  })

  // Nozzles (bicos pulverizadores)
  const nozzleCount = Math.floor(larguraBoom / 0.5)
  for (let i = 0; i <= nozzleCount; i++) {
    const nx = -halfBoom + i * (larguraBoom / nozzleCount)
    const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.25, 6), black)
    nozzle.position.set(nx, 1.65, 4.2)
    g.add(nozzle)
  }

  return g
}

// ─── Componente principal ────────────────────────────────────────────────────
export default function AgroNav3D({ lines, polygonCoords, fieldName, config, onClose }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const rendererRef  = useRef<THREE.WebGLRenderer | null>(null)
  const sceneRef     = useRef<THREE.Scene | null>(null)
  const cameraRef    = useRef<THREE.PerspectiveCamera | null>(null)
  const tractorRef   = useRef<THREE.Group | null>(null)
  const frameRef     = useRef<number>(0)
  const stateRef     = useRef({ pass: 0, progress: 0, paused: false, speed: 1 })

  const [uiState, setUiState] = useState({ pass: 0, progress: 0, paused: false, speed: 1 })

  // ── Calcula coordenadas 3D a partir das linhas geográficas
  const build3DLines = useCallback(() => {
    if (!lines.length || !polygonCoords.length) return { lines3D: [], poly3D: [], origin: [0, 0] as [number, number] }
    const mid = lines[0]
    const oLng = (mid[0][0] + mid[1][0]) / 2
    const oLat = (mid[0][1] + mid[1][1]) / 2
    const lines3D = lines.map(([p1, p2]) => ({
      x1: toXZ(p1[0], p1[1], oLng, oLat)[0],
      z1: toXZ(p1[0], p1[1], oLng, oLat)[1],
      x2: toXZ(p2[0], p2[1], oLng, oLat)[0],
      z2: toXZ(p2[0], p2[1], oLng, oLat)[1],
    }))
    const poly3D = polygonCoords.map(([lng, lat]) => {
      const [x, z] = toXZ(lng, lat, oLng, oLat)
      return new THREE.Vector3(x, 0.12, z)
    })
    return { lines3D, poly3D, origin: [oLng, oLat] as [number, number] }
  }, [lines, polygonCoords])

  // ── Inicializa cena Three.js
  useEffect(() => {
    if (!containerRef.current || rendererRef.current) return
    const el = containerRef.current
    const W = el.clientWidth || window.innerWidth
    const H = el.clientHeight || window.innerHeight

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(W, H)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    el.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // Scene
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x87ceeb)
    scene.fog = new THREE.FogExp2(0x87ceeb, 0.004)
    sceneRef.current = scene

    // Camera
    const camera = new THREE.PerspectiveCamera(65, W / H, 0.1, 2000)
    camera.position.set(0, 8, -15)
    cameraRef.current = camera

    // Luzes
    const ambient = new THREE.AmbientLight(0xfff8e0, 0.7)
    scene.add(ambient)
    const sun = new THREE.DirectionalLight(0xfff5d0, 1.4)
    sun.position.set(200, 400, 100)
    sun.castShadow = true
    sun.shadow.mapSize.set(2048, 2048)
    sun.shadow.camera.far = 1000
    sun.shadow.camera.left = sun.shadow.camera.bottom = -300
    sun.shadow.camera.right = sun.shadow.camera.top = 300
    scene.add(sun)
    const hemi = new THREE.HemisphereLight(0x87ceeb, 0x2d5a27, 0.4)
    scene.add(hemi)

    // Solo / chão
    const groundGeo = new THREE.PlaneGeometry(2000, 2000, 60, 60)
    const groundMat = new THREE.MeshLambertMaterial({ color: 0x3a7d44 })
    const ground = new THREE.Mesh(groundGeo, groundMat)
    ground.rotation.x = -Math.PI / 2
    ground.receiveShadow = true
    scene.add(ground)

    // Grade (linhas de sulco)
    const grid = new THREE.GridHelper(2000, 200, 0x2d5a1b, 0x2d5a1b)
    grid.position.y = 0.02
    scene.add(grid)

    // Nuvens simples (esferas achatadas)
    const cloudMat = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 })
    ;[[-200, 180, -300], [150, 220, -400], [-80, 200, -500], [300, 160, -350]].forEach(([x, y, z]) => {
      ;[[0, 0, 0], [20, 5, 0], [-20, 5, 0], [0, 5, 15], [0, 5, -15]].forEach(([ox, oy, oz]) => {
        const cloud = new THREE.Mesh(new THREE.SphereGeometry(18 + Math.random() * 10, 8, 6), cloudMat)
        cloud.position.set(x + ox, y + oy, z + oz)
        cloud.scale.y = 0.45
        scene.add(cloud)
      })
    })

    const { lines3D, poly3D } = build3DLines()

    // Polígono do talhão (fronteira verde brilhante)
    if (poly3D.length > 2) {
      const pts = [...poly3D, poly3D[0]]
      const polyGeo = new THREE.BufferGeometry().setFromPoints(pts)
      const polyLine = new THREE.Line(polyGeo, new THREE.LineBasicMaterial({ color: 0x00e676, linewidth: 3 }))
      scene.add(polyLine)
    }

    // Linhas de guiamento (todas as passadas)
    lines3D.forEach((l, i) => {
      const isActive = i === 0
      const dist = Math.abs(i - stateRef.current.pass)
      const color = dist === 0 ? 0xffffff : dist <= 2 ? 0xfde047 : dist <= 5 ? 0x90caf9 : 0x546e7a
      const opacity = dist === 0 ? 1 : Math.max(0.25, 1 - dist * 0.12)
      const mat = new THREE.LineBasicMaterial({ color, transparent: opacity < 1, opacity })
      const geo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(l.x1, 0.08, l.z1),
        new THREE.Vector3(l.x2, 0.08, l.z2),
      ])
      const line = new THREE.Line(geo, mat)
      line.userData.lineIndex = i
      line.userData.isGuidanceLine = true
      scene.add(line)
    })

    // Trator
    const tractor = buildTractor(config.largura)
    tractor.castShadow = true
    tractor.traverse(child => { if ((child as THREE.Mesh).isMesh) child.castShadow = true })
    scene.add(tractor)
    tractorRef.current = tractor

    // Posiciona trator no início da primeira linha
    if (lines3D.length > 0) {
      tractor.position.set(lines3D[0].x1, 0, lines3D[0].z1)
    }

    // ── Loop de animação ────────────────────────────────────────────────────
    const MACHINE_SPEED = config.velocidade / 3.6 // km/h → m/s

    const animate = () => {
      frameRef.current = requestAnimationFrame(animate)
      const st = stateRef.current
      if (!st.paused && lines3D.length > 0) {
        const pass = st.pass % lines3D.length
        const l = lines3D[pass]
        const reversed = pass % 2 === 1

        const sx = reversed ? l.x2 : l.x1
        const sz = reversed ? l.z2 : l.z1
        const ex = reversed ? l.x1 : l.x2
        const ez = reversed ? l.z1 : l.z2

        const dx = ex - sx, dz = ez - sz
        const len = Math.sqrt(dx * dx + dz * dz)

        st.progress += MACHINE_SPEED * st.speed * (1 / 60)

        if (st.progress >= len) {
          st.progress = 0
          st.pass = (st.pass + 1) % lines3D.length

          // Atualiza cores das linhas
          scene.children.forEach(child => {
            if (!child.userData.isGuidanceLine) return
            const idx = child.userData.lineIndex
            const d = Math.abs(idx - st.pass)
            const c = d === 0 ? 0xffffff : d <= 2 ? 0xfde047 : d <= 5 ? 0x90caf9 : 0x546e7a
            const op = d === 0 ? 1 : Math.max(0.25, 1 - d * 0.12)
            const mat = (child as THREE.Line).material as THREE.LineBasicMaterial
            mat.color.setHex(c)
            mat.opacity = op
            mat.transparent = op < 1
          })

          setUiState(s => ({ ...s, pass: st.pass, progress: 0 }))
        } else {
          setUiState(s => ({ ...s, progress: st.progress / len }))
        }

        const t = Math.min(st.progress / len, 1)
        const tx = sx + dx * t, tz = sz + dz * t
        if (tractorRef.current) {
          tractorRef.current.position.set(tx, 0, tz)
          tractorRef.current.rotation.y = Math.atan2(dx, dz)
        }

        // Câmera segue o trator
        const dirLen = Math.sqrt(dx * dx + dz * dz) || 1
        const ndx = dx / dirLen, ndz = dz / dirLen
        const targetCamX = tx - ndx * 18
        const targetCamZ = tz - ndz * 18
        const targetCamY = 9
        camera.position.lerp(new THREE.Vector3(targetCamX, targetCamY, targetCamZ), 0.06)
        camera.lookAt(tx + ndx * 25, 1.5, tz + ndz * 25)
      }

      renderer.render(scene, camera)
    }

    animate()

    // Resize
    const onResize = () => {
      const w = el.clientWidth, h = el.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', onResize)

    return () => {
      window.removeEventListener('resize', onResize)
      cancelAnimationFrame(frameRef.current)
      renderer.dispose()
      el.removeChild(renderer.domElement)
      rendererRef.current = null
      sceneRef.current = null
      cameraRef.current = null
      tractorRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Controles
  function togglePause() {
    stateRef.current.paused = !stateRef.current.paused
    setUiState(s => ({ ...s, paused: !s.paused }))
  }

  function setSpeed(v: number) {
    stateRef.current.speed = v
    setUiState(s => ({ ...s, speed: v }))
  }

  function jumpToPass(i: number) {
    stateRef.current.pass = i
    stateRef.current.progress = 0
    setUiState(s => ({ ...s, pass: i, progress: 0 }))
  }

  const speedKmh = (config.velocidade * uiState.speed).toFixed(0)
  const progressPct = Math.round(uiState.progress * 100)
  const currentPass = (uiState.pass % lines.length) + 1

  return (
    <div className="fixed inset-0 bg-black" style={{ zIndex: 9999 }}>
      {/* Canvas 3D */}
      <div ref={containerRef} className="w-full h-full" />

      {/* ── HUD overlay ──────────────────────────────────────────────────── */}

      {/* Top-left: logo + campo */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-3">
        <div className="bg-black/60 backdrop-blur-sm rounded-xl px-3 py-2 flex items-center gap-2.5">
          <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center text-lg">🗺️</div>
          <div>
            <div className="text-white font-bold text-sm leading-tight">AgroNav 3D</div>
            <div className="text-green-300 text-[11px] truncate max-w-[140px]">{fieldName}</div>
          </div>
        </div>
      </div>

      {/* Top-center: velocidade */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
        <div className="bg-black/60 backdrop-blur-sm rounded-xl px-5 py-2 text-center">
          <div className="text-white text-3xl font-black tabular-nums leading-none">{speedKmh}</div>
          <div className="text-green-300 text-[10px] font-semibold mt-0.5">km/h</div>
        </div>
      </div>

      {/* Top-right: operação */}
      <div className="absolute top-4 right-4 z-10">
        <div className="bg-black/60 backdrop-blur-sm rounded-xl px-3 py-2 text-right">
          <div className="text-white text-xs font-semibold">{config.tipo}</div>
          <div className="text-green-300 text-[11px]">Barra {config.largura} m · {config.angulo}°</div>
        </div>
      </div>

      {/* Bottom: barra de progresso + controles */}
      <div className="absolute bottom-0 left-0 right-0 z-10 px-4 pb-5 pt-3 bg-gradient-to-t from-black/80 to-transparent">

        {/* Passada atual */}
        <div className="flex items-center justify-between mb-2">
          <div className="text-white text-sm font-bold">
            Passada <span className="text-yellow-300">{currentPass}</span>
            <span className="text-white/50"> / {lines.length}</span>
          </div>
          <div className="text-green-300 text-xs">{progressPct}% completo</div>
        </div>

        {/* Barra de progresso */}
        <div className="relative h-2 bg-white/20 rounded-full mb-3 overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-yellow-400 rounded-full transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Mini-timeline das passadas */}
        <div className="flex gap-0.5 mb-4 overflow-x-auto pb-1">
          {lines.map((_, i) => (
            <button
              key={i}
              onClick={() => jumpToPass(i)}
              className={`h-1.5 flex-shrink-0 rounded-full transition-all ${
                i === uiState.pass % lines.length
                  ? 'w-5 bg-yellow-300'
                  : i < uiState.pass % lines.length
                    ? 'w-2 bg-green-500'
                    : 'w-2 bg-white/30'
              }`}
            />
          ))}
        </div>

        {/* Controles */}
        <div className="flex items-center justify-between">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors backdrop-blur-sm"
          >
            ← Voltar ao 2D
          </button>

          <div className="flex items-center gap-2">
            {/* Velocidade de simulação */}
            {[1, 2, 4, 8].map(v => (
              <button
                key={v}
                onClick={() => setSpeed(v)}
                className={`w-10 h-10 rounded-xl text-xs font-bold transition-colors ${
                  uiState.speed === v
                    ? 'bg-yellow-400 text-black'
                    : 'bg-white/15 text-white hover:bg-white/25'
                }`}
              >
                {v}×
              </button>
            ))}

            {/* Pause / Play */}
            <button
              onClick={togglePause}
              className="w-12 h-10 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold transition-colors text-lg"
            >
              {uiState.paused ? '▶' : '⏸'}
            </button>
          </div>
        </div>
      </div>

      {/* Legenda de cores das linhas */}
      <div className="absolute bottom-36 right-4 z-10 bg-black/60 backdrop-blur-sm rounded-xl px-3 py-2.5 text-[11px] space-y-1.5">
        <div className="text-white/60 font-bold mb-1 text-[10px] uppercase tracking-wider">Linhas</div>
        {[
          { color: 'bg-white', label: 'Ativa' },
          { color: 'bg-yellow-300', label: 'Próximas' },
          { color: 'bg-blue-300', label: 'Distantes' },
          { color: 'bg-green-400', label: 'Fronteira' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-2">
            <div className={`w-4 h-0.5 ${color} rounded`} />
            <span className="text-white/70">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

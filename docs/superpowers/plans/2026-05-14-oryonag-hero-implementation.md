# OryonAG Hero Section Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a cinematographic Hero section with split layout (video + 3D interactive map), bandeira animations, and mouse-follow interactivity.

**Architecture:** 
- Left 60%: Video background with fade transitions (3 agricultural scenes)
- Right 40%: Three.js 3D scene with Brazil map, 6 flag orbits, pulsing farm nodes
- Center: Text overlay (title, subtitle, CTAs)
- Timeline-based animations using Framer Motion + custom RAF loop for 3D
- Responsive fallbacks for mobile (video only, small 3D corner)

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind 4, Three.js, Framer Motion, Canvas API

---

## File Structure

**New files to create:**
```
components/
  ├─ Hero/
  │  ├─ HeroSection.tsx          (main container, layout)
  │  ├─ HeroVideo.tsx             (video player with transitions)
  │  ├─ Hero3DMap.tsx             (Three.js scene & render loop)
  │  ├─ HeroFlagOrbiter.tsx        (flag positioning & animations)
  │  ├─ HeroConstellationOverlay.tsx (particle background)
  │  └─ HeroAnimationController.tsx  (GSAP timeline orchestration)
  
lib/
  ├─ 3d/
  │  ├─ map-geometry.ts           (Brazil mesh generation)
  │  ├─ three-utils.ts            (camera, lighting, shaders)
  │  └─ interactions.ts           (mouse follow, lerp helpers)

public/
  ├─ videos/
  │  ├─ hero-amanhecer.mp4        (4s, golden hour)
  │  ├─ hero-amanhecer.webm       (fallback)
  │  ├─ hero-drone.mp4            (4s, aerial)
  │  ├─ hero-drone.webm           (fallback)
  │  ├─ hero-colheita.mp4         (4s, harvest)
  │  └─ hero-colheita.webm        (fallback)
  
  └─ flags/
     ├─ br.svg
     ├─ il.svg
     ├─ in.svg
     ├─ cn.svg
     ├─ us.svg
     └─ eu.svg

Modified files:
  ├─ app/ecosistema/page.tsx      (replace Hero with new component)
  ├─ package.json                 (add three.js dep)
  └─ next.config.ts               (video optimization)
```

---

## Phase 1: Setup & Dependencies

### Task 1: Install Three.js and Dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Check current package.json**

Run: `cat package.json | grep -E "(three|gsap)"`

Expected: No three.js or gsap currently installed

- [ ] **Step 2: Install three.js**

```bash
npm install three@r128
npm install --save-dev @types/three
```

- [ ] **Step 3: Verify installation**

```bash
npm list three
```

Expected: Output shows `three@r128`

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "deps: add three.js r128 for 3D scenes"
```

---

### Task 2: Create Hero Component Directory Structure

**Files:**
- Create: `components/Hero/HeroSection.tsx`
- Create: `components/Hero/HeroVideo.tsx`
- Create: `components/Hero/Hero3DMap.tsx`
- Create: `components/Hero/HeroFlagOrbiter.tsx`
- Create: `components/Hero/HeroConstellationOverlay.tsx`
- Create: `components/Hero/HeroAnimationController.tsx`
- Create: `lib/3d/map-geometry.ts`
- Create: `lib/3d/three-utils.ts`
- Create: `lib/3d/interactions.ts`

- [ ] **Step 1: Create directories**

```bash
mkdir -p components/Hero
mkdir -p lib/3d
mkdir -p public/videos
mkdir -p public/flags
```

- [ ] **Step 2: Create placeholder files (empty)**

```bash
touch components/Hero/HeroSection.tsx
touch components/Hero/HeroVideo.tsx
touch components/Hero/Hero3DMap.tsx
touch components/Hero/HeroFlagOrbiter.tsx
touch components/Hero/HeroConstellationOverlay.tsx
touch components/Hero/HeroAnimationController.tsx
touch lib/3d/map-geometry.ts
touch lib/3d/three-utils.ts
touch lib/3d/interactions.ts
```

- [ ] **Step 3: Commit**

```bash
git add components/Hero lib/3d public/videos public/flags
git commit -m "chore: create hero component scaffold"
```

---

## Phase 2: Video Setup & Processing

**GARGALO:** Gravar/obter vídeos. Necessário ANTES de integrar no Hero.

### Task 3: Prepare Video Assets

**Files:**
- Create: `public/videos/hero-amanhecer.mp4`
- Create: `public/videos/hero-amanhecer.webm`
- Create: `public/videos/hero-drone.mp4`
- Create: `public/videos/hero-drone.webm`
- Create: `public/videos/hero-colheita.mp4`
- Create: `public/videos/hero-colheita.webm`

**Requirements:**
- 3 cenas, 4s cada, 1920x1080, 30fps
- Arquivo MP4 < 3MB cada (H.264, baseline profile)
- WebM fallback < 2.5MB (VP9, 2-pass)

- [ ] **Step 1: Source videos**

Options:
1. Use stock footage (Pexels, Pixabay — agrícola)
2. Record próprio (DJI drone, GoPro no campo)
3. Comissionado (videógrafo local)

For this plan, assume 3 source .mp4 files at 1080p (may be 30-60s cada):
- `hero-amanhecer-source.mp4`
- `hero-drone-source.mp4`
- `hero-colheita-source.mp4`

- [ ] **Step 2: Extract/trim to 4s each using FFmpeg**

```bash
# Amanhecer (trim first 4 seconds, start from 2s in if intro is slow)
ffmpeg -i hero-amanhecer-source.mp4 -ss 2 -t 4 -c:v copy -c:a aac temp-amanhecer.mp4

# Drone
ffmpeg -i hero-drone-source.mp4 -ss 0 -t 4 -c:v copy -c:a aac temp-drone.mp4

# Colheita
ffmpeg -i hero-colheita-source.mp4 -ss 1 -t 4 -c:v copy -c:a aac temp-colheita.mp4
```

- [ ] **Step 3: Encode to H.264 MP4 (optimized)**

```bash
ffmpeg -i temp-amanhecer.mp4 -c:v libx264 -preset slow -crf 23 -c:a aac -b:a 128k \
  -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2" \
  public/videos/hero-amanhecer.mp4

ffmpeg -i temp-drone.mp4 -c:v libx264 -preset slow -crf 23 -c:a aac -b:a 128k \
  -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2" \
  public/videos/hero-drone.mp4

ffmpeg -i temp-colheita.mp4 -c:v libx264 -preset slow -crf 23 -c:a aac -b:a 128k \
  -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2" \
  public/videos/hero-colheita.mp4
```

Expected: Each file ~2-3MB

- [ ] **Step 4: Encode to VP9 WebM (fallback)**

```bash
ffmpeg -i public/videos/hero-amanhecer.mp4 -c:v libvpx-vp9 -b:v 0 -crf 30 -c:a libopus -b:a 128k \
  -pass 1 -f null /dev/null

ffmpeg -i public/videos/hero-amanhecer.mp4 -c:v libvpx-vp9 -b:v 0 -crf 30 -c:a libopus -b:a 128k \
  -pass 2 public/videos/hero-amanhecer.webm

# (repeat for drone & colheita)
```

Expected: Each WebM ~2MB

- [ ] **Step 5: Verify file sizes & duration**

```bash
ls -lh public/videos/
ffprobe -show_format public/videos/hero-amanhecer.mp4 | grep duration
```

Expected: 
- All MP4 < 3MB
- All WebM < 2.5MB
- All duration ≈ 4.0s

- [ ] **Step 6: Clean temp files**

```bash
rm -f temp-*.mp4
```

- [ ] **Step 7: Commit videos**

```bash
git add public/videos/
git commit -m "assets: add hero video scenes (amanhecer, drone, colheita)"
```

---

## Phase 3: Flag SVGs & Assets

### Task 4: Create Flag SVGs

**Files:**
- Create: `public/flags/br.svg`
- Create: `public/flags/il.svg`
- Create: `public/flags/in.svg`
- Create: `public/flags/cn.svg`
- Create: `public/flags/us.svg`
- Create: `public/flags/eu.svg`

- [ ] **Step 1: Download flag SVGs from Flagicons or create**

Option A: Use https://flagicons.css.in (CC0 license)
```bash
curl -o public/flags/br.svg https://flagicons.css.in/flags/4x3/br.svg
curl -o public/flags/il.svg https://flagicons.css.in/flags/4x3/il.svg
curl -o public/flags/in.svg https://flagicons.css.in/flags/4x3/in.svg
curl -o public/flags/cn.svg https://flagicons.css.in/flags/4x3/cn.svg
curl -o public/flags/us.svg https://flagicons.css.in/flags/4x3/us.svg
curl -o public/flags/eu.svg https://flagicons.css.in/flags/4x3/eu.svg
```

Option B: Use local SVG (if preferred):
Create minimal SVG flags with country colors (3-5 stripes each, 100x67px)

- [ ] **Step 2: Verify SVGs are valid**

```bash
file public/flags/*.svg
# Should all show: SVG Scalable Vector Graphics image
```

- [ ] **Step 3: Optimize SVGs (remove metadata, compress)**

```bash
npm install -D svgo
npx svgo public/flags/ --recursive --multipass
```

- [ ] **Step 4: Verify file sizes**

```bash
ls -lh public/flags/
```

Expected: Each flag < 5KB

- [ ] **Step 5: Commit**

```bash
git add public/flags/
git commit -m "assets: add country flag SVGs for orbiter"
```

---

## Phase 4: Three.js Foundation & 3D Map

### Task 5: Setup Three.js Utils & Helpers

**Files:**
- Create: `lib/3d/three-utils.ts`

- [ ] **Step 1: Write Three.js utility functions**

```typescript
// lib/3d/three-utils.ts
import * as THREE from 'three'

export interface SceneSetupOptions {
  width: number
  height: number
  pixelRatio?: number
}

export function createScene(): THREE.Scene {
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x020c05) // Dark green bg
  scene.fog = new THREE.Fog(0x020c05, 1000, 2000)
  return scene
}

export function createCamera(options: SceneSetupOptions): THREE.PerspectiveCamera {
  const camera = new THREE.PerspectiveCamera(
    75,
    options.width / options.height,
    0.1,
    1000
  )
  camera.position.set(0, 1.5, 3.5)
  camera.lookAt(0, 0.5, 0)
  return camera
}

export function createRenderer(
  canvas: HTMLCanvasElement,
  options: SceneSetupOptions
): THREE.WebGLRenderer {
  const renderer = new THREE.WebGLRenderer({ 
    canvas, 
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  })
  renderer.setSize(options.width, options.height)
  renderer.setPixelRatio(options.pixelRatio ?? window.devicePixelRatio)
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFShadowShadowMap
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  return renderer
}

export function createLights(scene: THREE.Scene): void {
  // Ambient light
  const ambient = new THREE.AmbientLight(0xffffff, 0.6)
  scene.add(ambient)

  // Directional light (sun)
  const dir = new THREE.DirectionalLight(0xffffff, 0.8)
  dir.position.set(5, 8, 3)
  dir.castShadow = true
  dir.shadow.mapSize.width = 2048
  dir.shadow.mapSize.height = 2048
  scene.add(dir)

  // Spotlight for map glow
  const spot = new THREE.PointLight(0x4ade80, 0.5)
  spot.position.set(0, 2, 0)
  scene.add(spot)
}

export function createShaderMaterial(options: {
  color: number
  emissive: number
  emissiveIntensity: number
}): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: options.color,
    emissive: options.emissive,
    emissiveIntensity: options.emissiveIntensity,
    metalness: 0.3,
    roughness: 0.7,
  })
}

export function handleWindowResize(
  camera: THREE.PerspectiveCamera,
  renderer: THREE.WebGLRenderer,
  width: number,
  height: number
): void {
  camera.aspect = width / height
  camera.updateProjectionMatrix()
  renderer.setSize(width, height)
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc lib/3d/three-utils.ts --noEmit
```

Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add lib/3d/three-utils.ts
git commit -m "feat: add three.js utility functions (scene, camera, renderer, lights)"
```

---

### Task 6: Create Brazil Map Geometry

**Files:**
- Create: `lib/3d/map-geometry.ts`

- [ ] **Step 1: Create Brazil mesh generator**

```typescript
// lib/3d/map-geometry.ts
import * as THREE from 'three'

/**
 * Generate a simplified 3D mesh of Brazil
 * Uses latitude/longitude bounds and generates a heightmap
 */
export function createBrazilGeometry(): THREE.BufferGeometry {
  // Brazil bounding box (approximate)
  const minLat = -33.7
  const maxLat = 5.3
  const minLon = -73.9
  const maxLon = -34.8

  const latSegments = 32
  const lonSegments = 32
  const vertices: number[] = []
  const indices: number[] = []

  // Generate vertices
  for (let i = 0; i <= latSegments; i++) {
    const lat = minLat + (maxLat - minLat) * (i / latSegments)
    for (let j = 0; j <= lonSegments; j++) {
      const lon = minLon + (maxLon - minLon) * (j / lonSegments)

      // Convert lat/lon to 3D coordinates on sphere-like surface
      const phi = (90 - lat) * (Math.PI / 180)
      const theta = (lon + 180) * (Math.PI / 180)
      const radius = 2.0

      const x = radius * Math.sin(phi) * Math.cos(theta)
      const y = radius * Math.cos(phi)
      const z = radius * Math.sin(phi) * Math.sin(theta)

      // Add height variation (subtle)
      const height = Math.sin(lon * 0.05) * Math.cos(lat * 0.05) * 0.2
      vertices.push(x, y + height, z)
    }
  }

  // Generate indices
  for (let i = 0; i < latSegments; i++) {
    for (let j = 0; j < lonSegments; j++) {
      const a = i * (lonSegments + 1) + j
      const b = a + lonSegments + 1
      const c = a + 1
      const d = b + 1

      indices.push(a, b, c)
      indices.push(b, d, c)
    }
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3))
  geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(indices), 1))
  geometry.computeVertexNormals()

  return geometry
}

/**
 * Farm node positions (latitude, longitude pairs for major regions)
 */
export const FARM_NODE_POSITIONS = [
  { lat: -10.1, lon: -61.4, name: 'Mato Grosso' },      // Center-west
  { lat: -19.9, lon: -43.9, name: 'Minas Gerais' },     // Southeast
  { lat: -23.5, lon: -46.6, name: 'São Paulo' },        // Southeast
  { lat: -15.7, lon: -47.8, name: 'Brasília' },         // Center
  { lat: -8.8, lon: -63.9, name: 'Amazonas' },          // North
  { lat: -5.5, lon: -55.5, name: 'Pará' },              // North
  { lat: 2.0, lon: -59.5, name: 'Roraima' },            // North
  { lat: -3.1, lon: -60.0, name: 'Amazonas (2)' },      // North
  { lat: -12.9, lon: -38.5, name: 'Bahia' },            // Northeast
  { lat: -9.5, lon: -40.8, name: 'Pernambuco' },        // Northeast
  { lat: -7.2, lon: -35.9, name: 'Paraíba' },           // Northeast
  { lat: -15.8, lon: -48.0, name: 'Goiás' },            // Center-west
  { lat: -19.2, lon: -51.4, name: 'Mato Grosso do Sul' },// Center-west
  { lat: -30.1, lon: -51.4, name: 'Rio Grande do Sul' },// South
  { lat: -26.9, lon: -48.6, name: 'Santa Catarina' },   // South
]

/**
 * Convert lat/lon to 3D coordinates on Brazil mesh
 */
export function latLonTo3D(lat: number, lon: number, radius: number = 2.0): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lon + 180) * (Math.PI / 180)

  const x = radius * Math.sin(phi) * Math.cos(theta)
  const y = radius * Math.cos(phi)
  const z = radius * Math.sin(phi) * Math.sin(theta)

  return new THREE.Vector3(x, y, z)
}
```

- [ ] **Step 2: Test geometry generation**

```bash
# Create test file
cat > lib/3d/map-geometry.test.ts << 'EOF'
import { createBrazilGeometry, latLonTo3D, FARM_NODE_POSITIONS } from './map-geometry'

describe('map-geometry', () => {
  test('creates valid geometry', () => {
    const geom = createBrazilGeometry()
    expect(geom.attributes.position).toBeDefined()
    expect(geom.index).toBeDefined()
  })

  test('converts lat/lon to 3D', () => {
    const v = latLonTo3D(0, 0)
    expect(v.length()).toBeCloseTo(2.0, 1)
  })

  test('has farm positions', () => {
    expect(FARM_NODE_POSITIONS.length).toBeGreaterThan(10)
  })
})
EOF

npx jest lib/3d/map-geometry.test.ts
```

Expected: All tests pass

- [ ] **Step 3: Commit**

```bash
git add lib/3d/map-geometry.ts lib/3d/map-geometry.test.ts
git commit -m "feat: add Brazil 3D mesh geometry & farm node positions"
```

---

### Task 7: Create Interaction Utilities

**Files:**
- Create: `lib/3d/interactions.ts`

- [ ] **Step 1: Write mouse tracking & lerp helpers**

```typescript
// lib/3d/interactions.ts
import * as THREE from 'three'

export interface MouseState {
  x: number // -1 to 1
  y: number // -1 to 1
  targetX: number
  targetY: number
}

export function createMouseState(): MouseState {
  return { x: 0, y: 0, targetX: 0, targetY: 0 }
}

export function updateMouseFromEvent(
  event: MouseEvent,
  canvas: HTMLCanvasElement,
  state: MouseState
): void {
  const rect = canvas.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top

  state.targetX = (x / rect.width) * 2 - 1
  state.targetY = -(y / rect.height) * 2 + 1
}

export function lerpMouse(state: MouseState, speed: number = 0.1): void {
  state.x += (state.targetX - state.x) * speed
  state.y += (state.targetY - state.y) * speed
}

export function applyMouseToCamera(
  camera: THREE.PerspectiveCamera,
  mouse: MouseState,
  intensity: number = 0.3
): void {
  camera.position.x += mouse.x * intensity
  camera.position.z += mouse.y * intensity
}

export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t
}

export function lerpVector3(
  start: THREE.Vector3,
  end: THREE.Vector3,
  t: number,
  out: THREE.Vector3 = new THREE.Vector3()
): THREE.Vector3 {
  out.x = lerp(start.x, end.x, t)
  out.y = lerp(start.y, end.y, t)
  out.z = lerp(start.z, end.z, t)
  return out
}

export function easeOutQuad(t: number): number {
  return 1 - (1 - t) * (1 - t)
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/3d/interactions.ts
git commit -m "feat: add mouse tracking and lerp utilities for 3D"
```

---

### Task 8: Implement Hero3DMap Component

**Files:**
- Create: `components/Hero/Hero3DMap.tsx`

- [ ] **Step 1: Create Hero3DMap component with Three.js scene**

```typescript
// components/Hero/Hero3DMap.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { createScene, createCamera, createRenderer, createLights, createShaderMaterial } from '@/lib/3d/three-utils'
import { createBrazilGeometry, FARM_NODE_POSITIONS, latLonTo3D } from '@/lib/3d/map-geometry'
import { createMouseState, updateMouseFromEvent, lerpMouse, applyMouseToCamera } from '@/lib/3d/interactions'

interface Hero3DMapProps {
  isVisible?: boolean // Start animation only when visible
}

export default function Hero3DMap({ isVisible = true }: Hero3DMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const mapGroupRef = useRef<THREE.Group | null>(null)
  const farmNodesRef = useRef<THREE.Mesh[]>([])
  const mouseStateRef = useRef(createMouseState())
  const rafRef = useRef<number>(0)
  const rotationSpeedRef = useRef(0.0004) // 45s/volta

  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return

    // Setup scene
    const width = containerRef.current.clientWidth
    const height = containerRef.current.clientHeight

    const scene = createScene()
    const camera = createCamera({ width, height })
    const renderer = createRenderer(canvasRef.current, { width, height })

    createLights(scene)

    // Create Brazil map
    const mapGeometry = createBrazilGeometry()
    const mapMaterial = createShaderMaterial({
      color: 0x022c14,
      emissive: 0x4ade80,
      emissiveIntensity: 0.2,
    })
    const mapMesh = new THREE.Mesh(mapGeometry, mapMaterial)
    mapMesh.castShadow = true
    mapMesh.receiveShadow = true

    const mapGroup = new THREE.Group()
    mapGroup.add(mapMesh)
    scene.add(mapGroup)

    // Create farm nodes
    const nodeGeometry = new THREE.SphereGeometry(0.08, 16, 16)
    const nodeMaterial = new THREE.MeshStandardMaterial({
      color: 0x22c55e,
      emissive: 0x4ade80,
      emissiveIntensity: 0.8,
    })

    FARM_NODE_POSITIONS.forEach((pos) => {
      const nodeMesh = new THREE.Mesh(nodeGeometry, nodeMaterial)
      const worldPos = latLonTo3D(pos.lat, pos.lon, 2.0)
      nodeMesh.position.copy(worldPos)
      nodeMesh.userData.pulsePhase = Math.random() * Math.PI * 2
      nodeMesh.userData.name = pos.name
      mapGroup.add(nodeMesh)
      farmNodesRef.current.push(nodeMesh)
    })

    sceneRef.current = scene
    cameraRef.current = camera
    rendererRef.current = renderer
    mapGroupRef.current = mapGroup

    // Animation loop
    let frameCount = 0
    const animate = () => {
      if (!isVisible) {
        rafRef.current = requestAnimationFrame(animate)
        return
      }

      frameCount++

      // Rotate map
      mapGroup.rotation.y += rotationSpeedRef.current

      // Update mouse lerp
      lerpMouse(mouseStateRef.current, 0.1)
      applyMouseToCamera(camera, mouseStateRef.current, 0.3)

      // Pulse farm nodes
      farmNodesRef.current.forEach((node) => {
        const phase = node.userData.pulsePhase + frameCount * 0.02
        const scale = 1 + Math.sin(phase) * 0.3
        node.scale.set(scale, scale, scale)

        const intensity = 0.5 + Math.sin(phase) * 0.4
        if (node.material instanceof THREE.MeshStandardMaterial) {
          node.material.emissiveIntensity = intensity
        }
      })

      renderer.render(scene, camera)
      rafRef.current = requestAnimationFrame(animate)
    }

    animate()

    // Mouse tracking
    const handleMouseMove = (e: MouseEvent) => {
      if (canvasRef.current) {
        updateMouseFromEvent(e, canvasRef.current, mouseStateRef.current)
      }
    }

    canvasRef.current.addEventListener('mousemove', handleMouseMove)

    // Window resize
    const handleResize = () => {
      if (!containerRef.current) return
      const newWidth = containerRef.current.clientWidth
      const newHeight = containerRef.current.clientHeight

      camera.aspect = newWidth / newHeight
      camera.updateProjectionMatrix()
      renderer.setSize(newWidth, newHeight)
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      canvasRef.current?.removeEventListener('mousemove', handleMouseMove)
      cancelAnimationFrame(rafRef.current)
      renderer.dispose()
      mapGeometry.dispose()
      mapMaterial.dispose()
      nodeGeometry.dispose()
      nodeMaterial.dispose()
    }
  }, [isVisible])

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden rounded-lg"
      style={{ background: '#020c05' }}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full"
      />
    </div>
  )
}
```

- [ ] **Step 2: Test component renders without errors**

```bash
npm run build 2>&1 | grep -E "(error|warning)" || echo "Build OK"
```

Expected: No errors, may have warnings

- [ ] **Step 3: Commit**

```bash
git add components/Hero/Hero3DMap.tsx
git commit -m "feat: implement Hero3DMap with Three.js scene, map, and pulsing farm nodes"
```

---

## Phase 5: Hero Layout, Animations & Integration

### Task 9: Create HeroVideo Component

**Files:**
- Create: `components/Hero/HeroVideo.tsx`

- [ ] **Step 1: Implement video player with transitions**

```typescript
// components/Hero/HeroVideo.tsx
'use client'

import { useEffect, useRef, useState } from 'react'

const VIDEOS = [
  { src: '/videos/hero-amanhecer', duration: 4 },
  { src: '/videos/hero-drone', duration: 4 },
  { src: '/videos/hero-colheita', duration: 4 },
]

export default function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const timeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    // Set first video source
    const current = VIDEOS[currentIndex]
    video.src = `${current.src}.mp4`

    const handleEnded = () => {
      const nextIndex = (currentIndex + 1) % VIDEOS.length
      setCurrentIndex(nextIndex)
    }

    // For demo, switch after duration + fade
    const switchVideo = () => {
      const nextIndex = (currentIndex + 1) % VIDEOS.length
      const nextVideo = VIDEOS[nextIndex]
      
      // Fade transition
      video.style.opacity = '0'
      timeoutRef.current = setTimeout(() => {
        video.src = `${nextVideo.src}.mp4`
        video.style.opacity = '1'
        video.play()
        setCurrentIndex(nextIndex)
      }, 500)
    }

    video.addEventListener('ended', handleEnded)

    // Also switch based on duration for safety
    const durationTimeout = setTimeout(switchVideo, (current.duration + 0.5) * 1000)

    return () => {
      video.removeEventListener('ended', handleEnded)
      clearTimeout(durationTimeout)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [currentIndex])

  return (
    <video
      ref={videoRef}
      autoPlay
      muted
      loop={false}
      playsInline
      className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
      style={{ opacity: 1 }}
    >
      Your browser does not support the video tag.
    </video>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/Hero/HeroVideo.tsx
git commit -m "feat: implement HeroVideo with multi-scene transitions"
```

---

### Task 10: Create Main HeroSection Component

**Files:**
- Create: `components/Hero/HeroSection.tsx` (replaces skeleton)
- Modify: `app/ecosistema/page.tsx` (import new HeroSection)

- [ ] **Step 1: Write HeroSection layout component**

```typescript
// components/Hero/HeroSection.tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import HeroVideo from './HeroVideo'
import Hero3DMap from './Hero3DMap'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: 'easeOut' } },
}

export default function HeroSection() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <section className="relative w-full min-h-screen flex items-center justify-center overflow-hidden bg-[#020c05]">
      {/* Background Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#020c0588]" />

      {/* Left: Video (60%) */}
      <div className="absolute left-0 top-0 w-3/5 h-full hidden lg:block">
        <HeroVideo />
        <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-[#020c05aa]" />
      </div>

      {/* Right: 3D Map (40%) */}
      <div className="absolute right-0 top-0 w-2/5 h-full hidden lg:block">
        {mounted && <Hero3DMap isVisible={true} />}
      </div>

      {/* Mobile: Video Full + 3D Corner */}
      <div className="absolute inset-0 lg:hidden">
        <HeroVideo />
        {mounted && (
          <div className="absolute bottom-8 right-8 w-32 h-32">
            <Hero3DMap isVisible={true} />
          </div>
        )}
      </div>

      {/* Center Content */}
      <motion.div
        className="relative z-10 max-w-4xl mx-auto px-6 text-center"
        variants={containerVariants}
        initial="hidden"
        animate={mounted ? 'visible' : 'hidden'}
      >
        {/* Status */}
        <motion.div
          className="flex items-center justify-center gap-3 mb-6"
          variants={itemVariants}
        >
          <div className="w-2 h-2 rounded-full bg-[#4ade80] animate-pulse" />
          <span className="text-xs tracking-widest font-medium text-[#4ade80] uppercase font-mono">
            ORYON AG — Agtech Brasileiro
          </span>
        </motion.div>

        {/* Title */}
        <motion.h1
          className="text-5xl sm:text-6xl lg:text-7xl font-black font-fraunces leading-tight mb-6 text-[#f0fdf4]"
          variants={itemVariants}
        >
          Inteligência que
          <br />
          <span className="bg-gradient-to-r from-[#22c55e] via-[#4ade80] to-[#86efac] bg-clip-text text-transparent italic">
            conecta o agro
          </span>
          <br />
          ao futuro.
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          className="text-lg lg:text-xl font-light text-[#4a7c5c] max-w-2xl mx-auto mb-8 leading-relaxed"
          variants={itemVariants}
        >
          Marketplace agrícola, sistema operacional de fazenda e crédito rural
          inteligente — três plataformas integradas em um único ecossistema.
        </motion.p>

        {/* CTAs */}
        <motion.div
          className="flex flex-col sm:flex-row gap-3 justify-center"
          variants={itemVariants}
        >
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#22c55e] text-[#020c05] rounded-xl font-semibold hover:bg-[#16a34a] transition-all hover:shadow-lg hover:-translate-y-0.5"
          >
            Criar conta grátis
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
          <Link
            href="/demo"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-[#4ade8044] text-[#4a7c5c] rounded-xl font-medium hover:border-[#4ade80] hover:text-[#4ade80] transition-all"
          >
            Ver demonstração
          </Link>
        </motion.div>
      </motion.div>

      {/* Scroll Indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[#4ade80] opacity-30"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </motion.div>
    </section>
  )
}
```

- [ ] **Step 2: Update ecosistema/page.tsx to use new HeroSection**

```typescript
// app/ecosistema/page.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import Nav from '@/components/Nav'
import HeroSection from '@/components/Hero/HeroSection'

// ... (keep existing CSS and other sections)

export default function EcossistemaPublicPage() {
  // ... keep existing code ...

  return (
    <div className="ory-pub" style={{ background: 'linear-gradient(170deg, #020c05 0%, #030f07 50%, #020c05 100%)', minHeight: '100vh', color: '#e2faea' }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <Nav />

      {/* NEW HERO */}
      <HeroSection />

      {/* ... rest of existing sections ... */}
    </div>
  )
}
```

- [ ] **Step 3: Verify build**

```bash
npm run build
```

Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add components/Hero/HeroSection.tsx app/ecosistema/page.tsx
git commit -m "feat: implement main HeroSection with split layout and 3D integration"
```

---

### Task 11: Add Flag Orbiter Component

**Files:**
- Create: `components/Hero/HeroFlagOrbiter.tsx`

- [ ] **Step 1: Create flag orbiter with SVG**

```typescript
// components/Hero/HeroFlagOrbiter.tsx
'use client'

import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

const COUNTRIES = [
  { name: 'Brasil', flag: '/flags/br.svg', angle: 0 },
  { name: 'Israel', flag: '/flags/il.svg', angle: 60 },
  { name: 'Índia', flag: '/flags/in.svg', angle: 120 },
  { name: 'China', flag: '/flags/cn.svg', angle: 180 },
  { name: 'EUA', flag: '/flags/us.svg', angle: 240 },
  { name: 'Europa', flag: '/flags/eu.svg', angle: 300 },
]

export default function HeroFlagOrbiter() {
  const containerRef = useRef<HTMLDivElement>(null)

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full flex items-center justify-center"
    >
      {/* Orbiting flags */}
      <motion.div
        className="absolute"
        animate={{ rotate: 360 }}
        transition={{
          duration: 60,
          repeat: Infinity,
          ease: 'linear',
        }}
        style={{ width: '280px', height: '280px' }}
      >
        {COUNTRIES.map((country, idx) => (
          <motion.div
            key={country.name}
            className="absolute"
            style={{
              width: '50px',
              height: '50px',
              left: '50%',
              top: '50%',
              marginLeft: '-25px',
              marginTop: '-25px',
            }}
            animate={{
              rotate: -360, // Counter-rotate to keep upright
            }}
            transition={{
              duration: 60,
              repeat: Infinity,
              ease: 'linear',
            }}
            initial={{
              opacity: 0,
              scale: 0,
            }}
            whileInView={{
              opacity: 1,
              scale: 1,
              transition: {
                delay: idx * 0.1,
                duration: 0.5,
              },
            }}
          >
            <motion.div
              className="absolute rounded-lg overflow-hidden border-2 border-[#4ade80] bg-white shadow-lg"
              style={{
                transform: `rotate(${country.angle}deg) translateY(-140px)`,
                width: '100%',
                height: '100%',
              }}
              whileHover={{
                scale: 1.3,
                boxShadow: '0 0 20px rgba(74,222,128,0.6)',
              }}
              transition={{ duration: 0.2 }}
            >
              <img
                src={country.flag}
                alt={country.name}
                className="w-full h-full object-cover"
              />
            </motion.div>
          </motion.div>
        ))}
      </motion.div>

      {/* Brasil destaque (topo) */}
      <motion.div
        className="absolute top-0 flex flex-col items-center"
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 2.5, repeat: Infinity }}
      >
        <motion.div
          className="w-16 h-16 rounded-lg overflow-hidden border-4 border-[#22c55e] bg-white shadow-2xl"
          whileHover={{ scale: 1.2 }}
        >
          <img src="/flags/br.svg" alt="Brasil" className="w-full h-full object-cover" />
        </motion.div>
        <span className="mt-2 text-xs font-bold text-[#22c55e] uppercase tracking-wide">
          Brasil
        </span>
      </motion.div>
    </div>
  )
}
```

- [ ] **Step 2: Integrate HeroFlagOrbiter into Hero3DMap**

Modify `components/Hero/Hero3DMap.tsx`:

```typescript
// Add after the canvas div:
import HeroFlagOrbiter from './HeroFlagOrbiter'

// In the return statement, wrap canvas with flag orbiter:
export default function Hero3DMap({ isVisible = true }: Hero3DMapProps) {
  // ... existing code ...

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden rounded-lg">
      <canvas ref={canvasRef} className="w-full h-full" />
      {/* Overlay flag orbiter */}
      <div className="absolute inset-0 pointer-events-none">
        <HeroFlagOrbiter />
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add components/Hero/HeroFlagOrbiter.tsx components/Hero/Hero3DMap.tsx
git commit -m "feat: add flag orbiter with rotation and hover effects"
```

---

### Task 12: Performance Optimization & Testing

**Files:**
- Modify: `next.config.ts` (video optimization)
- Create: `__tests__/hero.test.tsx`

- [ ] **Step 1: Update next.config for video optimization**

```typescript
// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // ... existing config ...
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  experimental: {
    optimizePackageImports: ['three'],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.optimization.splitChunks.cacheGroups = {
        ...config.optimization.splitChunks.cacheGroups,
        three: {
          test: /[\\/]node_modules[\\/]three[\\/]/,
          name: 'vendor-three',
          priority: 10,
          reuseExistingChunk: true,
        },
      }
    }
    return config
  },
}

export default nextConfig
```

- [ ] **Step 2: Verify Lighthouse metrics**

```bash
npm run build
npm run start &
npx lighthouse http://localhost:3000/ecosistema --output-path=lighthouse.json
cat lighthouse.json | jq '.categories'
```

Expected:
- LCP: 2.0-2.5s
- FID: < 100ms
- CLS: < 0.1

- [ ] **Step 3: Commit**

```bash
git add next.config.ts
git commit -m "chore: optimize webpack for three.js tree-shaking and bundle splitting"
```

---

### Task 13: Responsive Design Testing

**Files:**
- Already covered in HeroSection.tsx with Tailwind breakpoints

- [ ] **Step 1: Test mobile layout (< 768px)**

```bash
npm run dev &
# Open DevTools, set viewport to 375x812 (iPhone SE)
# Verify: Video full screen, 3D map in corner (120px), text centered, CTAs stack
```

- [ ] **Step 2: Test tablet layout (768px-1023px)**

```bash
# Set viewport to 768x1024 (iPad)
# Verify: Video left, 3D right, equal distribution, responsive text
```

- [ ] **Step 3: Test desktop layout (>1024px)**

```bash
# Set viewport to 1440x900 (desktop)
# Verify: Split 60/40, centered text, mouse follow works
```

- [ ] **Step 4: Commit**

```bash
git add . # (no new files, but CSS changes)
git commit -m "test: verify responsive layout across mobile, tablet, desktop"
```

---

## Summary Checklist

- [ ] **Phase 1: Dependencies installed** (Three.js, folder structure)
- [ ] **Phase 2: Videos encoded** (3 MP4 + WebM, < 3MB each)
- [ ] **Phase 3: Flags created** (6 SVG flags optimized)
- [ ] **Phase 4: Three.js foundation** (scene, camera, lights, geometry)
- [ ] **Phase 5: Hero implemented** (layout, animations, responsiveness)
- [ ] **Phase 6: Performance optimized** (LCP < 2.5s, bundle < 150KB)
- [ ] **Integration tested** (desktop, tablet, mobile)
- [ ] **All commits pushed** (ready for review)

---

## Known Gargalos & Mitigations

| Gargalo | Impacto | Mitigação |
|---------|---------|-----------|
| Gravar 3 vídeos agrícolas | ⏱️ 2-4h | Use stock footage ou comissionado |
| Three.js learning curve | 🔴 High | Scaffold com helpers prontos (já feito) |
| Performance 3D em mobile | ⚠️ Medium | Fallback 2D, disable on low-end devices |
| Font loading (Fraunces) | 📦 10KB | Async load, system fallback |

---

## Next: Execution

Save plan: ✅ `docs/superpowers/plans/2026-05-14-oryonag-hero-implementation.md`

**Ready for execution. Two options:**

**Option 1: Subagent-Driven (recommended)**
- Fresh subagent per task/phase
- Fast iteration, isolated focus
- Review between phases

**Option 2: Inline Execution**
- This session, using executing-plans
- Batch implementation with checkpoints
- Direct feedback loop

Which approach you prefer?

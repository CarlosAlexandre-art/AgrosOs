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
  renderer.shadowMap.type = THREE.PCFShadowMap
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

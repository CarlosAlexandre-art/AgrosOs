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

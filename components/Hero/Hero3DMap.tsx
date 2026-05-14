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

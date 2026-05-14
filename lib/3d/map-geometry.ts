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

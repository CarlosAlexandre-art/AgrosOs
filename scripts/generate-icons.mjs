// Script para gerar ícones PNG do AgroOS
// Executar com: node scripts/generate-icons.mjs
import { createCanvas } from 'canvas'
import { writeFileSync } from 'fs'

function drawIcon(size) {
  const canvas = createCanvas(size, size)
  const ctx = canvas.getContext('2d')

  const r = size * 0.13 // border radius proporcional

  // Fundo arredondado verde escuro
  ctx.fillStyle = '#16a34a'
  ctx.beginPath()
  ctx.roundRect(0, 0, size, size, r)
  ctx.fill()

  // Planta centralizada
  const cx = size / 2
  const cy = size / 2
  const s = size / 34 // escala baseada em 34px original

  ctx.strokeStyle = 'rgba(255,255,255,0.95)'
  ctx.lineCap = 'round'
  ctx.lineWidth = 1.6 * s

  // Caule central
  ctx.beginPath()
  ctx.moveTo(cx, cy - 9 * s)
  ctx.lineTo(cx, cy + 9 * s)
  ctx.stroke()

  // Folha esquerda superior
  ctx.beginPath()
  ctx.moveTo(cx, cy - 3 * s)
  ctx.lineTo(cx - 4 * s, cy - 5.5 * s)
  ctx.stroke()

  // Folha direita superior
  ctx.beginPath()
  ctx.moveTo(cx, cy - 3 * s)
  ctx.lineTo(cx + 4 * s, cy - 5.5 * s)
  ctx.stroke()

  // Folha esquerda inferior
  ctx.strokeStyle = 'rgba(255,255,255,0.85)'
  ctx.lineWidth = 1.1 * s
  ctx.beginPath()
  ctx.moveTo(cx, cy + 1.5 * s)
  ctx.lineTo(cx - 4.5 * s, cy - 0.5 * s)
  ctx.stroke()

  // Folha direita inferior
  ctx.beginPath()
  ctx.moveTo(cx, cy + 1.5 * s)
  ctx.lineTo(cx + 4.5 * s, cy - 0.5 * s)
  ctx.stroke()

  return canvas.toBuffer('image/png')
}

writeFileSync('./public/icon-192.png', drawIcon(192))
writeFileSync('./public/icon-512.png', drawIcon(512))
console.log('✅ Ícones gerados: icon-192.png e icon-512.png')

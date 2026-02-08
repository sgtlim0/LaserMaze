import { useCallback, useEffect, useRef, useState } from 'react'
import type { Cell, FloatingText, GamePhase, GameState, Particle } from '../game/types.ts'
import { traceLaser, checkLevelComplete } from '../game/laser.ts'
import { LEVELS } from '../game/levels.ts'
import {
  CELL_SIZE, GRID_PADDING, HEADER_HEIGHT,
  GRID_LINE_COLOR, GRID_DOT_COLOR,
  MIRROR_COLOR, MIRROR_FIXED_COLOR, WALL_COLOR,
  TARGET_COLOR, TARGET_HIT_COLOR, EMITTER_COLOR,
  COMPLETED_LEVELS_KEY,
} from '../game/constants.ts'
import {
  playMirrorRotate, playLaserFire, playTargetHit,
  playLevelComplete, playReflect, playWallHit,
  playAllComplete,
} from '../utils/sound.ts'

// ---- Pure functions outside hook ----

function deepCopyGrid(grid: Cell[][]): Cell[][] {
  return grid.map(row => row.map(cell => ({ ...cell })))
}

function addSparkParticles(particles: Particle[], x: number, y: number, color: string, count: number): void {
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.3
    const speed = 1.5 + Math.random() * 3
    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1, maxLife: 1,
      color,
      size: 2 + Math.random() * 3,
      type: 'spark',
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.3,
    })
  }
}

function addGlowParticle(particles: Particle[], x: number, y: number, color: string): void {
  particles.push({
    x, y,
    vx: (Math.random() - 0.5) * 0.5,
    vy: -0.5 - Math.random() * 1,
    life: 1, maxLife: 1,
    color,
    size: 4 + Math.random() * 4,
    type: 'glow',
    rotation: 0,
    rotSpeed: 0,
  })
}

function addRingParticle(particles: Particle[], x: number, y: number, color: string): void {
  particles.push({
    x, y,
    vx: 0, vy: 0,
    life: 1, maxLife: 1,
    color,
    size: 5,
    type: 'ring',
    rotation: 0,
    rotSpeed: 0,
  })
}

function addStarParticles(particles: Particle[], x: number, y: number, count: number): void {
  const colors = ['#ffcc00', '#ff9933', '#ffff66', '#ffffff']
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count
    const speed = 2 + Math.random() * 4
    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1, maxLife: 1,
      color: colors[i % colors.length],
      size: 3 + Math.random() * 3,
      type: 'star',
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.4,
    })
  }
}

function addFloatingText(
  texts: FloatingText[], x: number, y: number,
  text: string, color: string, size: number,
): void {
  texts.push({ x, y, text, life: 1, maxLife: 1, color, size })
}

function tickParticles(particles: Particle[], dt: number): Particle[] {
  return particles
    .map(p => ({
      ...p,
      x: p.x + p.vx * dt * 60,
      y: p.y + p.vy * dt * 60,
      life: p.life - dt * 2,
      rotation: p.rotation + p.rotSpeed * dt * 60,
      vy: p.vy + 0.02 * dt * 60,
    }))
    .filter(p => p.life > 0)
}

function tickFloatingTexts(texts: FloatingText[], dt: number): FloatingText[] {
  return texts
    .map(t => ({ ...t, y: t.y - 0.5 * dt * 60, life: t.life - dt * 1.5 }))
    .filter(t => t.life > 0)
}

function cellCenter(row: number, col: number, offsetX: number, offsetY: number): { cx: number; cy: number } {
  return {
    cx: offsetX + col * CELL_SIZE + CELL_SIZE / 2,
    cy: offsetY + row * CELL_SIZE + CELL_SIZE / 2,
  }
}

// ---- Drawing functions ----

function drawBackground(ctx: CanvasRenderingContext2D, w: number, h: number, frameCount: number): void {
  // Rich gradient background
  const grad = ctx.createLinearGradient(0, 0, 0, h)
  grad.addColorStop(0, '#050520')
  grad.addColorStop(0.3, '#0a0a35')
  grad.addColorStop(0.6, '#0d0840')
  grad.addColorStop(1, '#060525')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, w, h)

  // Subtle nebula swirls
  ctx.save()
  for (let i = 0; i < 3; i++) {
    const nx = w * (0.2 + i * 0.3) + Math.sin(frameCount * 0.005 + i * 2) * 30
    const ny = h * (0.3 + i * 0.2) + Math.cos(frameCount * 0.004 + i) * 20
    const nGrad = ctx.createRadialGradient(nx, ny, 0, nx, ny, 120)
    const hue = (frameCount * 0.1 + i * 120) % 360
    nGrad.addColorStop(0, `hsla(${hue}, 60%, 30%, 0.06)`)
    nGrad.addColorStop(0.5, `hsla(${hue}, 50%, 20%, 0.03)`)
    nGrad.addColorStop(1, 'transparent')
    ctx.fillStyle = nGrad
    ctx.fillRect(0, 0, w, h)
  }
  ctx.restore()

  // Animated star field - 3 depth layers
  ctx.save()
  // Far stars (tiny, slow)
  for (let i = 0; i < 50; i++) {
    const sx = ((i * 137.5 + frameCount * 0.008) % w)
    const sy = ((i * 89.3 + frameCount * 0.004) % h)
    const twinkle = Math.sin(frameCount * 0.03 + i * 1.7) * 0.4 + 0.6
    ctx.globalAlpha = 0.12 * twinkle
    ctx.fillStyle = '#8899cc'
    ctx.beginPath()
    ctx.arc(sx, sy, 0.8, 0, Math.PI * 2)
    ctx.fill()
  }
  // Mid stars
  for (let i = 0; i < 30; i++) {
    const sx = ((i * 173.7 + frameCount * 0.015) % w)
    const sy = ((i * 113.1 + frameCount * 0.008) % h)
    const twinkle = Math.sin(frameCount * 0.05 + i * 2.3) * 0.3 + 0.7
    ctx.globalAlpha = 0.2 * twinkle
    ctx.fillStyle = '#aabbee'
    ctx.beginPath()
    ctx.arc(sx, sy, 1.2, 0, Math.PI * 2)
    ctx.fill()
  }
  // Near stars (brighter, larger, cross shape)
  for (let i = 0; i < 12; i++) {
    const sx = ((i * 211.3 + frameCount * 0.025) % w)
    const sy = ((i * 151.7 + frameCount * 0.012) % h)
    const twinkle = Math.sin(frameCount * 0.07 + i * 3.1) * 0.35 + 0.65
    ctx.globalAlpha = 0.3 * twinkle
    ctx.fillStyle = '#ddeeff'
    ctx.shadowColor = '#aaccff'
    ctx.shadowBlur = 4
    const sz = 1.5 + (i % 3) * 0.5
    ctx.fillRect(sx - sz, sy - 0.5, sz * 2, 1)
    ctx.fillRect(sx - 0.5, sy - sz, 1, sz * 2)
  }
  ctx.restore()
}

function drawGrid(
  ctx: CanvasRenderingContext2D,
  rows: number, cols: number,
  offsetX: number, offsetY: number,
): void {
  // Grid lines
  ctx.strokeStyle = GRID_LINE_COLOR
  ctx.lineWidth = 1
  for (let r = 0; r <= rows; r++) {
    ctx.beginPath()
    ctx.moveTo(offsetX, offsetY + r * CELL_SIZE)
    ctx.lineTo(offsetX + cols * CELL_SIZE, offsetY + r * CELL_SIZE)
    ctx.stroke()
  }
  for (let c = 0; c <= cols; c++) {
    ctx.beginPath()
    ctx.moveTo(offsetX + c * CELL_SIZE, offsetY)
    ctx.lineTo(offsetX + c * CELL_SIZE, offsetY + rows * CELL_SIZE)
    ctx.stroke()
  }
  // Corner dots
  ctx.fillStyle = GRID_DOT_COLOR
  for (let r = 0; r <= rows; r++) {
    for (let c = 0; c <= cols; c++) {
      ctx.beginPath()
      ctx.arc(offsetX + c * CELL_SIZE, offsetY + r * CELL_SIZE, 2, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}

function drawCell(
  ctx: CanvasRenderingContext2D,
  cell: Cell, row: number, col: number,
  offsetX: number, offsetY: number,
  frameCount: number, selected: boolean,
): void {
  const { cx, cy } = cellCenter(row, col, offsetX, offsetY)
  const half = CELL_SIZE / 2 - 4

  if (cell.type === 'wall') {
    // 3D-ish wall block
    const wGrad = ctx.createLinearGradient(cx - half, cy - half, cx + half, cy + half)
    wGrad.addColorStop(0, '#445577')
    wGrad.addColorStop(0.5, WALL_COLOR)
    wGrad.addColorStop(1, '#1a2233')
    ctx.fillStyle = wGrad
    ctx.fillRect(cx - half, cy - half, half * 2, half * 2)

    // Subtle inset border
    ctx.strokeStyle = 'rgba(80, 110, 160, 0.4)'
    ctx.lineWidth = 1
    ctx.strokeRect(cx - half + 1, cy - half + 1, half * 2 - 2, half * 2 - 2)

    // Diagonal hash pattern
    ctx.save()
    ctx.beginPath()
    ctx.rect(cx - half, cy - half, half * 2, half * 2)
    ctx.clip()
    ctx.strokeStyle = 'rgba(80, 110, 160, 0.15)'
    ctx.lineWidth = 1
    for (let i = -half * 2; i < half * 2; i += 7) {
      ctx.beginPath()
      ctx.moveTo(cx + i, cy - half)
      ctx.lineTo(cx + i + half * 2, cy + half)
      ctx.stroke()
    }
    ctx.restore()
    return
  }

  if (cell.type === 'emitter') {
    const pulse = Math.sin(frameCount * 0.08) * 0.2 + 0.8

    // Outer ambient glow
    ctx.save()
    ctx.globalAlpha = 0.3 * pulse
    const emGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 24)
    emGrad.addColorStop(0, '#ff6699')
    emGrad.addColorStop(0.5, 'rgba(255, 51, 102, 0.3)')
    emGrad.addColorStop(1, 'rgba(255, 51, 102, 0)')
    ctx.fillStyle = emGrad
    ctx.beginPath()
    ctx.arc(cx, cy, 24, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()

    // Main emitter body
    ctx.save()
    ctx.shadowColor = '#ff3366'
    ctx.shadowBlur = 20 * pulse
    const bodyGrad = ctx.createRadialGradient(cx - 2, cy - 2, 0, cx, cy, 12)
    bodyGrad.addColorStop(0, '#ff99bb')
    bodyGrad.addColorStop(0.5, EMITTER_COLOR)
    bodyGrad.addColorStop(1, '#cc1144')
    ctx.fillStyle = bodyGrad
    ctx.beginPath()
    ctx.arc(cx, cy, 12, 0, Math.PI * 2)
    ctx.fill()
    // Inner bright core
    ctx.fillStyle = 'rgba(255, 200, 220, 0.6)'
    ctx.beginPath()
    ctx.arc(cx - 2, cy - 2, 4, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()

    // Direction arrow with glow
    ctx.save()
    ctx.translate(cx, cy)
    const angle = cell.direction === 'right' ? 0
      : cell.direction === 'down' ? Math.PI / 2
      : cell.direction === 'left' ? Math.PI
      : -Math.PI / 2
    ctx.rotate(angle)
    ctx.shadowColor = '#ffffff'
    ctx.shadowBlur = 8
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.moveTo(18, 0)
    ctx.lineTo(10, -6)
    ctx.lineTo(10, 6)
    ctx.closePath()
    ctx.fill()
    ctx.restore()
    return
  }

  if (cell.type === 'target') {
    const isHit = cell.hit
    const color = isHit ? TARGET_HIT_COLOR : TARGET_COLOR
    const pulse = Math.sin(frameCount * 0.06) * 0.15 + 0.85

    // Ambient glow ring
    ctx.save()
    ctx.globalAlpha = isHit ? 0.4 : 0.15
    const tGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 22)
    tGrad.addColorStop(0, color)
    tGrad.addColorStop(0.4, isHit ? 'rgba(255, 204, 0, 0.3)' : 'rgba(51, 255, 153, 0.15)')
    tGrad.addColorStop(1, 'transparent')
    ctx.fillStyle = tGrad
    ctx.beginPath()
    ctx.arc(cx, cy, 22, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()

    ctx.save()
    ctx.shadowColor = color
    ctx.shadowBlur = isHit ? 25 : 12 * pulse

    // Outer ring
    ctx.strokeStyle = color
    ctx.lineWidth = 2.5
    ctx.globalAlpha = isHit ? 1 : 0.7
    ctx.beginPath()
    ctx.arc(cx, cy, 14, 0, Math.PI * 2)
    ctx.stroke()

    // Second ring (rotating dashed)
    if (!isHit) {
      ctx.setLineDash([4, 4])
      ctx.lineDashOffset = frameCount * 0.5
      ctx.lineWidth = 1
      ctx.globalAlpha = 0.4
      ctx.beginPath()
      ctx.arc(cx, cy, 18, 0, Math.PI * 2)
      ctx.stroke()
      ctx.setLineDash([])
    }

    // Inner dot with gradient
    const dotGrad = ctx.createRadialGradient(cx - 1, cy - 1, 0, cx, cy, 6)
    dotGrad.addColorStop(0, '#ffffff')
    dotGrad.addColorStop(0.5, color)
    dotGrad.addColorStop(1, isHit ? '#cc8800' : '#009944')
    ctx.fillStyle = dotGrad
    ctx.globalAlpha = isHit ? 1 : 0.6
    ctx.beginPath()
    ctx.arc(cx, cy, 6, 0, Math.PI * 2)
    ctx.fill()

    ctx.restore()

    // Cross-hair lines when not hit
    if (!isHit) {
      ctx.save()
      ctx.globalAlpha = 0.25 * pulse
      ctx.strokeStyle = color
      ctx.lineWidth = 0.5
      ctx.beginPath()
      ctx.moveTo(cx - 20, cy)
      ctx.lineTo(cx - 8, cy)
      ctx.moveTo(cx + 8, cy)
      ctx.lineTo(cx + 20, cy)
      ctx.moveTo(cx, cy - 20)
      ctx.lineTo(cx, cy - 8)
      ctx.moveTo(cx, cy + 8)
      ctx.lineTo(cx, cy + 20)
      ctx.stroke()
      ctx.restore()
    }
    return
  }

  if (cell.type === 'mirror') {
    const isFixed = cell.fixed
    const baseColor = isFixed ? MIRROR_FIXED_COLOR : MIRROR_COLOR
    const glowColor = isFixed ? 'rgba(136, 153, 187, 0.2)' : 'rgba(200, 220, 255, 0.15)'

    // Subtle cell background glow
    ctx.save()
    ctx.globalAlpha = 0.08
    ctx.fillStyle = baseColor
    ctx.fillRect(cx - half, cy - half, half * 2, half * 2)
    ctx.restore()

    // Selection highlight with animated border
    if (selected && !isFixed) {
      ctx.save()
      ctx.strokeStyle = '#33ccff'
      ctx.lineWidth = 2
      ctx.shadowColor = '#33ccff'
      ctx.shadowBlur = 16
      ctx.setLineDash([6, 3])
      ctx.lineDashOffset = -frameCount * 0.5
      const r = 4
      const x1 = cx - half - 2, y1 = cy - half - 2, sz = (half + 2) * 2
      ctx.beginPath()
      ctx.moveTo(x1 + r, y1)
      ctx.lineTo(x1 + sz - r, y1)
      ctx.arcTo(x1 + sz, y1, x1 + sz, y1 + r, r)
      ctx.lineTo(x1 + sz, y1 + sz - r)
      ctx.arcTo(x1 + sz, y1 + sz, x1 + sz - r, y1 + sz, r)
      ctx.lineTo(x1 + r, y1 + sz)
      ctx.arcTo(x1, y1 + sz, x1, y1 + sz - r, r)
      ctx.lineTo(x1, y1 + r)
      ctx.arcTo(x1, y1, x1 + r, y1, r)
      ctx.stroke()
      ctx.setLineDash([])
      ctx.restore()
    }

    // Mirror surface with gradient
    ctx.save()
    ctx.translate(cx, cy)
    ctx.shadowColor = baseColor
    ctx.shadowBlur = 10

    // Draw mirror as a thicker metallic line with gradient
    const mLen = half - 4
    if (cell.orientation === '/') {
      const mGrad = ctx.createLinearGradient(-mLen, mLen, mLen, -mLen)
      mGrad.addColorStop(0, glowColor)
      mGrad.addColorStop(0.3, baseColor)
      mGrad.addColorStop(0.5, '#ffffff')
      mGrad.addColorStop(0.7, baseColor)
      mGrad.addColorStop(1, glowColor)
      ctx.strokeStyle = mGrad
      ctx.lineWidth = 4
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(-mLen, mLen)
      ctx.lineTo(mLen, -mLen)
      ctx.stroke()

      // Bright center glint
      const glint = Math.sin(frameCount * 0.06 + row * 2 + col * 3) * 0.4 + 0.5
      ctx.globalAlpha = glint
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(-5, 5)
      ctx.lineTo(5, -5)
      ctx.stroke()

      // Edge caps
      ctx.globalAlpha = 0.6
      ctx.fillStyle = baseColor
      ctx.beginPath()
      ctx.arc(-mLen, mLen, 3, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(mLen, -mLen, 3, 0, Math.PI * 2)
      ctx.fill()
    } else {
      const mGrad = ctx.createLinearGradient(-mLen, -mLen, mLen, mLen)
      mGrad.addColorStop(0, glowColor)
      mGrad.addColorStop(0.3, baseColor)
      mGrad.addColorStop(0.5, '#ffffff')
      mGrad.addColorStop(0.7, baseColor)
      mGrad.addColorStop(1, glowColor)
      ctx.strokeStyle = mGrad
      ctx.lineWidth = 4
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(-mLen, -mLen)
      ctx.lineTo(mLen, mLen)
      ctx.stroke()

      // Bright center glint
      const glint = Math.sin(frameCount * 0.06 + row * 2 + col * 3) * 0.4 + 0.5
      ctx.globalAlpha = glint
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(-5, -5)
      ctx.lineTo(5, 5)
      ctx.stroke()

      // Edge caps
      ctx.globalAlpha = 0.6
      ctx.fillStyle = baseColor
      ctx.beginPath()
      ctx.arc(-mLen, -mLen, 3, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(mLen, mLen, 3, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()

    // Fixed indicator - small lock icon
    if (isFixed) {
      ctx.save()
      ctx.globalAlpha = 0.5
      ctx.fillStyle = '#667799'
      ctx.font = '9px monospace'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('⊘', cx, cy + half + 6)
      ctx.restore()
    }

    // Tap hint for non-fixed mirrors (subtle pulse)
    if (!isFixed && !selected) {
      const tapPulse = Math.sin(frameCount * 0.04 + row + col) * 0.1 + 0.1
      ctx.save()
      ctx.globalAlpha = tapPulse
      ctx.strokeStyle = '#33ccff'
      ctx.lineWidth = 1
      ctx.strokeRect(cx - half + 1, cy - half + 1, (half - 1) * 2, (half - 1) * 2)
      ctx.restore()
    }
  }
}

function segEndpoints(
  seg: { from: { row: number; col: number }; to: { row: number; col: number } },
  rows: number, cols: number,
  offsetX: number, offsetY: number,
): { fx: number; fy: number; tx: number; ty: number } {
  const fromIn = seg.from.row >= 0 && seg.from.row < rows && seg.from.col >= 0 && seg.from.col < cols
  const toIn = seg.to.row >= 0 && seg.to.row < rows && seg.to.col >= 0 && seg.to.col < cols
  const fc = fromIn
    ? cellCenter(seg.from.row, seg.from.col, offsetX, offsetY)
    : cellCenter(Math.max(0, Math.min(seg.from.row, rows - 1)), Math.max(0, Math.min(seg.from.col, cols - 1)), offsetX, offsetY)
  const tc = toIn
    ? cellCenter(seg.to.row, seg.to.col, offsetX, offsetY)
    : { cx: offsetX + seg.to.col * CELL_SIZE + CELL_SIZE / 2, cy: offsetY + seg.to.row * CELL_SIZE + CELL_SIZE / 2 }
  return { fx: fc.cx, fy: fc.cy, tx: tc.cx, ty: tc.cy }
}

function drawLaser(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  offsetX: number, offsetY: number,
  frameCount: number,
): void {
  const { laserPath } = state
  if (laserPath.segments.length === 0) return

  const rows = state.grid.length
  const cols = state.grid[0].length
  const pulse = Math.sin(frameCount * 0.06) * 0.15 + 0.85

  // Layer 1: Ultra-wide ambient glow
  ctx.save()
  ctx.strokeStyle = 'rgba(255, 30, 80, 0.12)'
  ctx.lineWidth = 28 * pulse
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  for (const seg of laserPath.segments) {
    const { fx, fy, tx, ty } = segEndpoints(seg, rows, cols, offsetX, offsetY)
    ctx.beginPath()
    ctx.moveTo(fx, fy)
    ctx.lineTo(tx, ty)
    ctx.stroke()
  }
  ctx.restore()

  // Layer 2: Wide soft glow
  ctx.save()
  ctx.strokeStyle = 'rgba(255, 51, 102, 0.25)'
  ctx.lineWidth = 16 * pulse
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.shadowColor = '#ff3366'
  ctx.shadowBlur = 20
  for (const seg of laserPath.segments) {
    const { fx, fy, tx, ty } = segEndpoints(seg, rows, cols, offsetX, offsetY)
    ctx.beginPath()
    ctx.moveTo(fx, fy)
    ctx.lineTo(tx, ty)
    ctx.stroke()
  }
  ctx.restore()

  // Layer 3: Medium glow (pinkish-red)
  ctx.save()
  ctx.strokeStyle = 'rgba(255, 80, 130, 0.5)'
  ctx.lineWidth = 8
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.shadowColor = '#ff6699'
  ctx.shadowBlur = 12
  for (const seg of laserPath.segments) {
    const { fx, fy, tx, ty } = segEndpoints(seg, rows, cols, offsetX, offsetY)
    ctx.beginPath()
    ctx.moveTo(fx, fy)
    ctx.lineTo(tx, ty)
    ctx.stroke()
  }
  ctx.restore()

  // Layer 4: Bright core beam (solid)
  ctx.save()
  ctx.strokeStyle = '#ff4477'
  ctx.lineWidth = 3.5
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.shadowColor = '#ff3366'
  ctx.shadowBlur = 8
  for (const seg of laserPath.segments) {
    const { fx, fy, tx, ty } = segEndpoints(seg, rows, cols, offsetX, offsetY)
    ctx.beginPath()
    ctx.moveTo(fx, fy)
    ctx.lineTo(tx, ty)
    ctx.stroke()
  }
  ctx.restore()

  // Layer 5: White-hot center
  ctx.save()
  ctx.strokeStyle = 'rgba(255, 220, 230, 0.8)'
  ctx.lineWidth = 1.5
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  for (const seg of laserPath.segments) {
    const { fx, fy, tx, ty } = segEndpoints(seg, rows, cols, offsetX, offsetY)
    ctx.beginPath()
    ctx.moveTo(fx, fy)
    ctx.lineTo(tx, ty)
    ctx.stroke()
  }
  ctx.restore()

  // Animated energy pulses traveling along the beam
  ctx.save()
  const pulseSpeed = frameCount * 0.04
  for (let pi = 0; pi < 5; pi++) {
    const t = ((pulseSpeed + pi * 0.2) % 1)
    // Find which segment this pulse is on
    const totalSegs = laserPath.segments.length
    const segIdx = Math.floor(t * totalSegs)
    const segT = (t * totalSegs) - segIdx
    if (segIdx >= totalSegs) continue
    const seg = laserPath.segments[segIdx]
    const { fx, fy, tx, ty } = segEndpoints(seg, rows, cols, offsetX, offsetY)
    const px = fx + (tx - fx) * segT
    const py = fy + (ty - fy) * segT

    const grad = ctx.createRadialGradient(px, py, 0, px, py, 10)
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.9)')
    grad.addColorStop(0.3, 'rgba(255, 100, 150, 0.6)')
    grad.addColorStop(1, 'rgba(255, 51, 102, 0)')
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.arc(px, py, 10, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()

  // Reflection bursts at mirror points
  const hitSet = new Set<string>()
  for (const seg of laserPath.segments) {
    const { to } = seg
    if (to.row >= 0 && to.row < rows && to.col >= 0 && to.col < cols) {
      const toCell = state.grid[to.row][to.col]
      const key = `${to.row},${to.col}`
      if (toCell.type === 'mirror' && !hitSet.has(key)) {
        hitSet.add(key)
        const { cx, cy } = cellCenter(to.row, to.col, offsetX, offsetY)

        // Pulsing radial glow
        const rPulse = Math.sin(frameCount * 0.1 + to.row * 3 + to.col * 5) * 0.3 + 0.7
        ctx.save()
        ctx.globalAlpha = 0.6 * rPulse
        const rGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 18)
        rGrad.addColorStop(0, '#ffffff')
        rGrad.addColorStop(0.3, 'rgba(255, 100, 200, 0.8)')
        rGrad.addColorStop(1, 'rgba(255, 51, 102, 0)')
        ctx.fillStyle = rGrad
        ctx.beginPath()
        ctx.arc(cx, cy, 18, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()

        // Rotating cross sparkle
        ctx.save()
        ctx.translate(cx, cy)
        ctx.rotate(frameCount * 0.03 + to.row + to.col)
        ctx.globalAlpha = rPulse
        ctx.fillStyle = '#ffffff'
        ctx.shadowColor = '#ffffff'
        ctx.shadowBlur = 6
        const arm = 8
        ctx.fillRect(-1, -arm, 2, arm * 2)
        ctx.fillRect(-arm, -1, arm * 2, 2)
        // Diagonal cross
        ctx.rotate(Math.PI / 4)
        ctx.globalAlpha = rPulse * 0.5
        ctx.fillRect(-0.5, -arm * 0.6, 1, arm * 1.2)
        ctx.fillRect(-arm * 0.6, -0.5, arm * 1.2, 1)
        ctx.restore()
      }

      // Target glow ring when hit
      if (toCell.type === 'target' && toCell.hit) {
        const { cx, cy } = cellCenter(to.row, to.col, offsetX, offsetY)
        const tPulse = Math.sin(frameCount * 0.08 + to.row) * 0.3 + 0.7
        ctx.save()
        ctx.globalAlpha = 0.4 * tPulse
        const tGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 22)
        tGrad.addColorStop(0, TARGET_HIT_COLOR)
        tGrad.addColorStop(0.5, 'rgba(255, 204, 0, 0.4)')
        tGrad.addColorStop(1, 'rgba(255, 204, 0, 0)')
        ctx.fillStyle = tGrad
        ctx.beginPath()
        ctx.arc(cx, cy, 22, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()

        // Orbiting dots
        for (let oi = 0; oi < 3; oi++) {
          const oAngle = frameCount * 0.06 + (oi * Math.PI * 2 / 3)
          const oR = 16
          const ox = cx + Math.cos(oAngle) * oR
          const oy = cy + Math.sin(oAngle) * oR
          ctx.save()
          ctx.fillStyle = '#ffff66'
          ctx.shadowColor = '#ffcc00'
          ctx.shadowBlur = 6
          ctx.beginPath()
          ctx.arc(ox, oy, 2, 0, Math.PI * 2)
          ctx.fill()
          ctx.restore()
        }
      }
    }
  }

  // Emitter energy rings
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (state.grid[r][c].type === 'emitter') {
        const { cx, cy } = cellCenter(r, c, offsetX, offsetY)
        for (let ri = 0; ri < 3; ri++) {
          const ringT = ((frameCount * 0.02 + ri * 0.33) % 1)
          const ringR = 10 + ringT * 20
          ctx.save()
          ctx.globalAlpha = (1 - ringT) * 0.4
          ctx.strokeStyle = '#ff6699'
          ctx.lineWidth = 1.5
          ctx.beginPath()
          ctx.arc(cx, cy, ringR, 0, Math.PI * 2)
          ctx.stroke()
          ctx.restore()
        }
      }
    }
  }
}

function drawParticle(ctx: CanvasRenderingContext2D, p: Particle): void {
  const alpha = Math.max(0, p.life / p.maxLife)
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.translate(p.x, p.y)
  ctx.rotate(p.rotation)

  switch (p.type) {
    case 'spark': {
      ctx.fillStyle = p.color
      ctx.fillRect(-p.size / 2, -1, p.size, 2)
      break
    }
    case 'glow': {
      const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, p.size)
      grad.addColorStop(0, p.color)
      grad.addColorStop(1, 'transparent')
      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.arc(0, 0, p.size, 0, Math.PI * 2)
      ctx.fill()
      break
    }
    case 'ring': {
      const expansion = (1 - alpha) * 20 + p.size
      ctx.strokeStyle = p.color
      ctx.lineWidth = 2 * alpha
      ctx.beginPath()
      ctx.arc(0, 0, expansion, 0, Math.PI * 2)
      ctx.stroke()
      break
    }
    case 'star': {
      ctx.fillStyle = p.color
      const s = p.size * alpha
      // 4-point star
      ctx.beginPath()
      ctx.moveTo(0, -s)
      ctx.lineTo(s * 0.3, -s * 0.3)
      ctx.lineTo(s, 0)
      ctx.lineTo(s * 0.3, s * 0.3)
      ctx.lineTo(0, s)
      ctx.lineTo(-s * 0.3, s * 0.3)
      ctx.lineTo(-s, 0)
      ctx.lineTo(-s * 0.3, -s * 0.3)
      ctx.closePath()
      ctx.fill()
      break
    }
  }

  ctx.restore()
}

function drawHeader(
  ctx: CanvasRenderingContext2D,
  canvasW: number,
  level: number,
  moves: number,
  levelName: string,
): void {
  // Level name
  ctx.fillStyle = '#e0e8ff'
  ctx.font = 'bold 16px monospace'
  ctx.textAlign = 'left'
  ctx.fillText(`Level ${level + 1}`, GRID_PADDING, 28)

  ctx.font = '12px monospace'
  ctx.fillStyle = 'rgba(200, 210, 255, 0.6)'
  ctx.fillText(levelName, GRID_PADDING, 46)

  // Moves counter
  ctx.font = 'bold 16px monospace'
  ctx.fillStyle = '#ffcc00'
  ctx.textAlign = 'right'
  ctx.fillText(`Moves: ${moves}`, canvasW - GRID_PADDING, 28)

  // Par
  const par = LEVELS[level].par
  ctx.font = '12px monospace'
  ctx.fillStyle = 'rgba(200, 210, 255, 0.5)'
  ctx.fillText(`Par: ${par}`, canvasW - GRID_PADDING, 46)
}

function drawHint(
  ctx: CanvasRenderingContext2D,
  canvasW: number, canvasH: number,
  hint: string | undefined,
  frameCount: number,
): void {
  if (!hint) return
  const alpha = Math.sin(frameCount * 0.03) * 0.2 + 0.5
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.fillStyle = 'rgba(200, 210, 255, 0.6)'
  ctx.font = '11px monospace'
  ctx.textAlign = 'center'
  ctx.fillText(hint, canvasW / 2, canvasH - 15)
  ctx.restore()
}

function renderGame(
  ctx: CanvasRenderingContext2D,
  canvasW: number, canvasH: number,
  state: GameState,
): void {
  const { grid, frameCount, level } = state
  const rows = grid.length
  const cols = grid[0].length
  const gridW = cols * CELL_SIZE
  const gridH = rows * CELL_SIZE
  const offsetX = (canvasW - gridW) / 2
  const offsetY = HEADER_HEIGHT + (canvasH - HEADER_HEIGHT - gridH) / 2

  ctx.save()

  // Screen shake
  if (state.shakeX !== 0 || state.shakeY !== 0) {
    ctx.translate(state.shakeX, state.shakeY)
  }

  drawBackground(ctx, canvasW, canvasH, frameCount)
  drawHeader(ctx, canvasW, level, state.moves, LEVELS[level].name)
  drawGrid(ctx, rows, cols, offsetX, offsetY)

  // Draw cells
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = grid[r][c]
      if (cell.type === 'empty') continue
      const selected = state.selectedCell?.row === r && state.selectedCell?.col === c
      drawCell(ctx, cell, r, c, offsetX, offsetY, frameCount, selected)
    }
  }

  // Draw laser
  drawLaser(ctx, state, offsetX, offsetY, frameCount)

  // Draw particles
  for (const p of state.particles) {
    drawParticle(ctx, p)
  }

  // Draw floating texts
  for (const ft of state.floatingTexts) {
    const alpha = Math.max(0, ft.life / ft.maxLife)
    ctx.save()
    ctx.globalAlpha = alpha
    ctx.fillStyle = ft.color
    ctx.font = `bold ${ft.size}px monospace`
    ctx.textAlign = 'center'
    ctx.shadowColor = ft.color
    ctx.shadowBlur = 10
    ctx.fillText(ft.text, ft.x, ft.y)
    ctx.restore()
  }

  // Screen flash
  if (state.screenFlash > 0) {
    ctx.save()
    ctx.globalAlpha = state.screenFlash * 0.3
    ctx.fillStyle = state.screenFlashColor
    ctx.fillRect(0, 0, canvasW, canvasH)
    ctx.restore()
  }

  // Hint
  drawHint(ctx, canvasW, canvasH, LEVELS[level].hint, frameCount)

  ctx.restore()
}

// ---- Hook ----

function loadCompleted(): number[] {
  try {
    const raw = localStorage.getItem(COMPLETED_LEVELS_KEY)
    if (raw) return JSON.parse(raw) as number[]
  } catch { /* ignore */ }
  return []
}

function saveCompleted(levels: number[]): void {
  try {
    localStorage.setItem(COMPLETED_LEVELS_KEY, JSON.stringify(levels))
  } catch { /* ignore */ }
}

function initGameState(level: number, completedLevels: number[]): GameState {
  const levelDef = LEVELS[level]
  const grid = deepCopyGrid(levelDef.grid)
  const laserPath = traceLaser(grid)

  // Mark hit targets
  for (const ht of laserPath.hitTargets) {
    grid[ht.row][ht.col] = { ...grid[ht.row][ht.col], hit: true }
  }

  return {
    level,
    grid,
    laserPath,
    moves: 0,
    particles: [],
    floatingTexts: [],
    selectedCell: null,
    shakeX: 0,
    shakeY: 0,
    screenFlash: 0,
    screenFlashColor: '#ffffff',
    frameCount: 0,
    completedLevels,
  }
}

export function useLaserMaze(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const [phase, setPhase] = useState<GamePhase>('menu')
  const [completedLevels, setCompletedLevels] = useState<number[]>(loadCompleted)
  const [currentLevel, setCurrentLevel] = useState(0)

  const stateRef = useRef<GameState>(initGameState(0, completedLevels))
  const phaseRef = useRef(phase)
  const processRef = useRef<(() => void) | null>(null)
  const lastTimeRef = useRef(0)

  useEffect(() => { phaseRef.current = phase }, [phase])

  const startLevel = useCallback((level: number) => {
    const completed = loadCompleted()
    setCompletedLevels(completed)
    setCurrentLevel(level)
    stateRef.current = initGameState(level, completed)
    setPhase('playing')
    playLaserFire()
  }, [])

  const goToMenu = useCallback(() => {
    setPhase('menu')
  }, [])

  const nextLevel = useCallback(() => {
    const next = currentLevel + 1
    if (next < LEVELS.length) {
      startLevel(next)
    } else {
      setPhase('menu')
    }
  }, [currentLevel, startLevel])

  // Handle mirror click
  const handleCellClick = useCallback((canvasX: number, canvasY: number) => {
    if (phaseRef.current !== 'playing') return

    const s = stateRef.current
    const rows = s.grid.length
    const cols = s.grid[0].length
    const gridW = cols * CELL_SIZE
    const gridH = rows * CELL_SIZE
    const canvas = canvasRef.current
    if (!canvas) return
    const canvasW = canvas.width
    const canvasH = canvas.height
    const offsetX = (canvasW - gridW) / 2
    const offsetY = HEADER_HEIGHT + (canvasH - HEADER_HEIGHT - gridH) / 2

    const col = Math.floor((canvasX - offsetX) / CELL_SIZE)
    const row = Math.floor((canvasY - offsetY) / CELL_SIZE)

    if (row < 0 || row >= rows || col < 0 || col >= cols) return

    const cell = s.grid[row][col]

    if (cell.type === 'mirror' && !cell.fixed) {
      // Toggle orientation
      const newOrientation = cell.orientation === '/' ? '\\' as const : '/' as const
      const newGrid = deepCopyGrid(s.grid)
      newGrid[row][col] = { ...newGrid[row][col], orientation: newOrientation }

      // Reset target hits
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (newGrid[r][c].type === 'target') {
            newGrid[r][c] = { ...newGrid[r][c], hit: false }
          }
        }
      }

      // Re-trace laser
      const newPath = traceLaser(newGrid)

      // Mark hit targets
      for (const ht of newPath.hitTargets) {
        newGrid[ht.row][ht.col] = { ...newGrid[ht.row][ht.col], hit: true }
      }

      // Grid offset for particle positions
      const { cx, cy } = cellCenter(row, col, offsetX, offsetY)

      // Play sound
      playMirrorRotate()

      // Add mirror rotation particles
      addSparkParticles(s.particles, cx, cy, '#33ccff', 6)

      // Check for newly hit targets
      const prevHitSet = new Set(s.laserPath.hitTargets.map(t => `${t.row},${t.col}`))
      for (const ht of newPath.hitTargets) {
        const key = `${ht.row},${ht.col}`
        if (!prevHitSet.has(key)) {
          const tc = cellCenter(ht.row, ht.col, offsetX, offsetY)
          addStarParticles(s.particles, tc.cx, tc.cy, 12)
          addRingParticle(s.particles, tc.cx, tc.cy, TARGET_HIT_COLOR)
          addFloatingText(s.floatingTexts, tc.cx, tc.cy - 20, 'HIT!', TARGET_HIT_COLOR, 16)
          playTargetHit()
        }
      }

      // Reflection sparkles along new path
      for (const seg of newPath.segments) {
        const { to } = seg
        if (to.row >= 0 && to.row < rows && to.col >= 0 && to.col < cols) {
          if (newGrid[to.row][to.col].type === 'mirror') {
            const mc = cellCenter(to.row, to.col, offsetX, offsetY)
            addGlowParticle(s.particles, mc.cx, mc.cy, '#ff6699')
            playReflect()
          }
        }
      }

      // Check wall hits for sound
      const lastSeg = newPath.segments[newPath.segments.length - 1]
      if (lastSeg) {
        const { to } = lastSeg
        if (to.row >= 0 && to.row < rows && to.col >= 0 && to.col < cols) {
          if (newGrid[to.row][to.col].type === 'wall') {
            playWallHit()
          }
        }
      }

      stateRef.current = {
        ...s,
        grid: newGrid,
        laserPath: newPath,
        moves: s.moves + 1,
        selectedCell: { row, col },
        screenFlash: 0.3,
        screenFlashColor: '#33ccff',
      }

      // Check level complete
      if (checkLevelComplete(newGrid, newPath.hitTargets)) {
        const newCompleted = [...new Set([...s.completedLevels, s.level])]
        setCompletedLevels(newCompleted)
        saveCompleted(newCompleted)
        stateRef.current = {
          ...stateRef.current,
          completedLevels: newCompleted,
          screenFlash: 1,
          screenFlashColor: '#33ff99',
        }

        // Victory particles
        for (let i = 0; i < 30; i++) {
          addStarParticles(s.particles, canvasW / 2 + (Math.random() - 0.5) * 200, canvasH / 2 + (Math.random() - 0.5) * 200, 3)
        }
        addFloatingText(s.floatingTexts, canvasW / 2, canvasH / 2 - 40, 'COMPLETE!', '#33ff99', 24)

        const isAllComplete = newCompleted.length >= LEVELS.length
        if (isAllComplete) {
          playAllComplete()
          setTimeout(() => setPhase('allComplete'), 1200)
        } else {
          playLevelComplete()
          setTimeout(() => setPhase('levelComplete'), 800)
        }
      }
    }
  }, [canvasRef])

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId = 0

    processRef.current = () => {
      const now = performance.now()
      const dt = Math.min((now - lastTimeRef.current) / 1000, 0.05)
      lastTimeRef.current = now

      const s = stateRef.current
      s.frameCount++

      // Tick particles
      s.particles = tickParticles(s.particles, dt)
      s.floatingTexts = tickFloatingTexts(s.floatingTexts, dt)

      // Spawn ambient laser particles every few frames
      if (s.frameCount % 3 === 0 && s.laserPath.segments.length > 0 && s.particles.length < 120) {
        const rows = s.grid.length
        const cols = s.grid[0].length
        const gridW = cols * CELL_SIZE
        const gridH = rows * CELL_SIZE
        const ox = (canvas.width - gridW) / 2
        const oy = HEADER_HEIGHT + (canvas.height - HEADER_HEIGHT - gridH) / 2

        // Random point along a random segment
        const seg = s.laserPath.segments[Math.floor(Math.random() * s.laserPath.segments.length)]
        const ep = segEndpoints(seg, rows, cols, ox, oy)
        const t = Math.random()
        const px = ep.fx + (ep.tx - ep.fx) * t
        const py = ep.fy + (ep.ty - ep.fy) * t

        const colors = ['#ff6699', '#ff99bb', '#ffccdd', '#ffffff', '#ff3366']
        s.particles.push({
          x: px + (Math.random() - 0.5) * 6,
          y: py + (Math.random() - 0.5) * 6,
          vx: (Math.random() - 0.5) * 0.8,
          vy: -0.3 - Math.random() * 0.8,
          life: 1, maxLife: 1,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: 1.5 + Math.random() * 2.5,
          type: Math.random() > 0.7 ? 'star' : 'glow',
          rotation: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.1,
        })
      }

      // Decay effects
      if (s.shakeX !== 0 || s.shakeY !== 0) {
        s.shakeX *= 0.85
        s.shakeY *= 0.85
        if (Math.abs(s.shakeX) < 0.1) s.shakeX = 0
        if (Math.abs(s.shakeY) < 0.1) s.shakeY = 0
      }
      if (s.screenFlash > 0) {
        s.screenFlash = Math.max(0, s.screenFlash - dt * 3)
      }

      // Render
      renderGame(ctx, canvas.width, canvas.height, s)
    }

    function loop() {
      if (processRef.current) processRef.current()
      animId = requestAnimationFrame(loop)
    }

    lastTimeRef.current = performance.now()
    animId = requestAnimationFrame(loop)

    return () => cancelAnimationFrame(animId)
  }, [canvasRef, phase])

  // Click/touch handler
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    function getCanvasPos(clientX: number, clientY: number) {
      const rect = canvas!.getBoundingClientRect()
      const scaleX = canvas!.width / rect.width
      const scaleY = canvas!.height / rect.height
      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY,
      }
    }

    function onClick(e: MouseEvent) {
      const pos = getCanvasPos(e.clientX, e.clientY)
      handleCellClick(pos.x, pos.y)
    }

    function onTouch(e: TouchEvent) {
      e.preventDefault()
      if (e.touches.length > 0) {
        const touch = e.touches[0]
        const pos = getCanvasPos(touch.clientX, touch.clientY)
        handleCellClick(pos.x, pos.y)
      }
    }

    canvas.addEventListener('click', onClick)
    canvas.addEventListener('touchstart', onTouch, { passive: false })

    return () => {
      canvas.removeEventListener('click', onClick)
      canvas.removeEventListener('touchstart', onTouch)
    }
  }, [canvasRef, handleCellClick])

  // Resize canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    function resize() {
      const parent = canvas!.parentElement
      if (!parent) return
      const w = Math.min(parent.clientWidth, 500)
      const h = Math.min(parent.clientHeight, 750)
      canvas!.width = w
      canvas!.height = h
    }

    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [canvasRef, phase])

  return {
    phase,
    currentLevel,
    completedLevels,
    moves: stateRef.current.moves,
    startLevel,
    goToMenu,
    nextLevel,
  }
}

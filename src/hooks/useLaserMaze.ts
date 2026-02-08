import { useCallback, useEffect, useRef, useState } from 'react'
import type { Cell, FloatingText, GamePhase, GameState, Particle } from '../game/types.ts'
import { traceLaser, checkLevelComplete } from '../game/laser.ts'
import { LEVELS } from '../game/levels.ts'
import {
  CELL_SIZE, GRID_PADDING, HEADER_HEIGHT,
  BG_COLOR, GRID_LINE_COLOR, GRID_DOT_COLOR,
  MIRROR_COLOR, MIRROR_FIXED_COLOR, WALL_COLOR,
  TARGET_COLOR, TARGET_HIT_COLOR, EMITTER_COLOR,
  LASER_GLOW_COLOR, COMPLETED_LEVELS_KEY,
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
  // Gradient background
  const grad = ctx.createLinearGradient(0, 0, 0, h)
  grad.addColorStop(0, BG_COLOR)
  grad.addColorStop(0.5, '#0d0d3a')
  grad.addColorStop(1, '#0a0a2e')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, w, h)

  // Animated star field
  ctx.save()
  for (let i = 0; i < 40; i++) {
    const sx = ((i * 137.5 + frameCount * 0.02 * (i % 3 + 1)) % w)
    const sy = ((i * 89.3 + frameCount * 0.01 * (i % 2 + 1)) % h)
    const twinkle = Math.sin(frameCount * 0.05 + i) * 0.3 + 0.7
    ctx.globalAlpha = 0.15 * twinkle
    ctx.fillStyle = '#aabbff'
    ctx.beginPath()
    ctx.arc(sx, sy, 1 + (i % 3) * 0.5, 0, Math.PI * 2)
    ctx.fill()
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
    ctx.fillStyle = WALL_COLOR
    ctx.fillRect(cx - half, cy - half, half * 2, half * 2)
    // Subtle pattern
    ctx.strokeStyle = 'rgba(100, 130, 180, 0.2)'
    ctx.lineWidth = 1
    for (let i = -half; i < half; i += 8) {
      ctx.beginPath()
      ctx.moveTo(cx + i, cy - half)
      ctx.lineTo(cx + i + half, cy + half)
      ctx.stroke()
    }
    return
  }

  if (cell.type === 'emitter') {
    // Pulsing emitter
    const pulse = Math.sin(frameCount * 0.08) * 0.2 + 0.8
    ctx.save()
    ctx.shadowColor = EMITTER_COLOR
    ctx.shadowBlur = 15 * pulse
    ctx.fillStyle = EMITTER_COLOR
    ctx.beginPath()
    ctx.arc(cx, cy, 10, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()

    // Direction arrow
    ctx.save()
    ctx.translate(cx, cy)
    const angle = cell.direction === 'right' ? 0
      : cell.direction === 'down' ? Math.PI / 2
      : cell.direction === 'left' ? Math.PI
      : -Math.PI / 2
    ctx.rotate(angle)
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.moveTo(14, 0)
    ctx.lineTo(8, -5)
    ctx.lineTo(8, 5)
    ctx.closePath()
    ctx.fill()
    ctx.restore()
    return
  }

  if (cell.type === 'target') {
    const isHit = cell.hit
    const color = isHit ? TARGET_HIT_COLOR : TARGET_COLOR
    const pulse = Math.sin(frameCount * 0.06) * 0.15 + 0.85

    ctx.save()
    ctx.shadowColor = color
    ctx.shadowBlur = isHit ? 20 : 10 * pulse

    // Outer ring
    ctx.strokeStyle = color
    ctx.lineWidth = 2.5
    ctx.globalAlpha = isHit ? 1 : 0.7
    ctx.beginPath()
    ctx.arc(cx, cy, 12, 0, Math.PI * 2)
    ctx.stroke()

    // Inner dot
    ctx.fillStyle = color
    ctx.globalAlpha = isHit ? 1 : 0.5
    ctx.beginPath()
    ctx.arc(cx, cy, 5, 0, Math.PI * 2)
    ctx.fill()

    ctx.restore()
    return
  }

  if (cell.type === 'mirror') {
    const isFixed = cell.fixed
    const color = isFixed ? MIRROR_FIXED_COLOR : MIRROR_COLOR

    // Selection highlight
    if (selected && !isFixed) {
      ctx.save()
      ctx.strokeStyle = '#33ccff'
      ctx.lineWidth = 2
      ctx.shadowColor = '#33ccff'
      ctx.shadowBlur = 12
      ctx.strokeRect(cx - half - 2, cy - half - 2, (half + 2) * 2, (half + 2) * 2)
      ctx.restore()
    }

    ctx.save()
    ctx.translate(cx, cy)
    ctx.shadowColor = color
    ctx.shadowBlur = 8

    ctx.strokeStyle = color
    ctx.lineWidth = 3
    ctx.lineCap = 'round'

    if (cell.orientation === '/') {
      ctx.beginPath()
      ctx.moveTo(-half + 4, half - 4)
      ctx.lineTo(half - 4, -half + 4)
      ctx.stroke()
    } else {
      ctx.beginPath()
      ctx.moveTo(-half + 4, -half + 4)
      ctx.lineTo(half - 4, half - 4)
      ctx.stroke()
    }

    // Mirror surface reflection glint
    const glint = Math.sin(frameCount * 0.04 + row * 2 + col * 3) * 0.3 + 0.4
    ctx.globalAlpha = glint
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 1
    if (cell.orientation === '/') {
      ctx.beginPath()
      ctx.moveTo(-4, 4)
      ctx.lineTo(4, -4)
      ctx.stroke()
    } else {
      ctx.beginPath()
      ctx.moveTo(-4, -4)
      ctx.lineTo(4, 4)
      ctx.stroke()
    }

    ctx.restore()

    // Fixed indicator
    if (isFixed) {
      ctx.fillStyle = 'rgba(136, 153, 187, 0.5)'
      ctx.font = '8px monospace'
      ctx.textAlign = 'center'
      ctx.fillText('🔒', cx, cy + half + 2)
    }
  }
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

  // Draw laser glow (wider, semi-transparent)
  ctx.save()
  ctx.strokeStyle = LASER_GLOW_COLOR
  ctx.lineWidth = 8
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  for (const seg of laserPath.segments) {
    const { from, to } = seg
    const fromInBounds = from.row >= 0 && from.row < rows && from.col >= 0 && from.col < cols
    const toInBounds = to.row >= 0 && to.row < rows && to.col >= 0 && to.col < cols

    const fc = fromInBounds
      ? cellCenter(from.row, from.col, offsetX, offsetY)
      : cellCenter(
          Math.max(0, Math.min(from.row, rows - 1)),
          Math.max(0, Math.min(from.col, cols - 1)),
          offsetX, offsetY
        )
    const tc = toInBounds
      ? cellCenter(to.row, to.col, offsetX, offsetY)
      : {
          cx: offsetX + to.col * CELL_SIZE + CELL_SIZE / 2,
          cy: offsetY + to.row * CELL_SIZE + CELL_SIZE / 2,
        }

    ctx.beginPath()
    ctx.moveTo(fc.cx, fc.cy)
    ctx.lineTo(tc.cx, tc.cy)
    ctx.stroke()
  }
  ctx.restore()

  // Draw laser core (animated dash)
  ctx.save()
  ctx.strokeStyle = '#ff3366'
  ctx.lineWidth = 2.5
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.setLineDash([6, 4])
  ctx.lineDashOffset = -frameCount * 0.8

  for (const seg of laserPath.segments) {
    const { from, to } = seg
    const fromInBounds = from.row >= 0 && from.row < rows && from.col >= 0 && from.col < cols
    const toInBounds = to.row >= 0 && to.row < rows && to.col >= 0 && to.col < cols

    const fc = fromInBounds
      ? cellCenter(from.row, from.col, offsetX, offsetY)
      : cellCenter(
          Math.max(0, Math.min(from.row, rows - 1)),
          Math.max(0, Math.min(from.col, cols - 1)),
          offsetX, offsetY
        )
    const tc = toInBounds
      ? cellCenter(to.row, to.col, offsetX, offsetY)
      : {
          cx: offsetX + to.col * CELL_SIZE + CELL_SIZE / 2,
          cy: offsetY + to.row * CELL_SIZE + CELL_SIZE / 2,
        }

    ctx.beginPath()
    ctx.moveTo(fc.cx, fc.cy)
    ctx.lineTo(tc.cx, tc.cy)
    ctx.stroke()
  }
  ctx.restore()

  // Reflection sparkles at mirror points
  for (const seg of laserPath.segments) {
    const { to } = seg
    if (to.row >= 0 && to.row < rows && to.col >= 0 && to.col < cols) {
      const toCell = state.grid[to.row][to.col]
      if (toCell.type === 'mirror') {
        const { cx, cy } = cellCenter(to.row, to.col, offsetX, offsetY)
        const sparkle = Math.sin(frameCount * 0.12 + to.row + to.col) * 0.3 + 0.7
        ctx.save()
        ctx.globalAlpha = sparkle
        ctx.fillStyle = '#ffffff'
        // Cross sparkle
        const s = 4
        ctx.fillRect(cx - 1, cy - s, 2, s * 2)
        ctx.fillRect(cx - s, cy - 1, s * 2, 2)
        ctx.restore()
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

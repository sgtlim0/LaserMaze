import type { Cell, Direction, GridPos, LaserPath, LaserSegment, MirrorOrientation } from './types.ts'
import { MAX_LASER_STEPS, PRIMARY_LASER_COLOR } from './constants.ts'

function reflectDirection(dir: Direction, mirror: MirrorOrientation): Direction {
  // '/' mirror: up↔right, down↔left
  // '\' mirror: up↔left, down↔right
  if (mirror === '/') {
    switch (dir) {
      case 'up': return 'right'
      case 'right': return 'up'
      case 'down': return 'left'
      case 'left': return 'down'
    }
  } else {
    switch (dir) {
      case 'up': return 'left'
      case 'left': return 'up'
      case 'down': return 'right'
      case 'right': return 'down'
    }
  }
}

function moveInDirection(pos: GridPos, dir: Direction): GridPos {
  switch (dir) {
    case 'up': return { row: pos.row - 1, col: pos.col }
    case 'down': return { row: pos.row + 1, col: pos.col }
    case 'left': return { row: pos.row, col: pos.col - 1 }
    case 'right': return { row: pos.row, col: pos.col + 1 }
  }
}

export function traceLaser(grid: Cell[][]): LaserPath {
  const rows = grid.length
  const cols = grid[0].length
  const segments: LaserSegment[] = []
  const hitTargets: GridPos[] = []

  // Find emitter
  let emitterPos: GridPos | null = null
  let emitterDir: Direction = 'right'
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c].type === 'emitter') {
        emitterPos = { row: r, col: c }
        emitterDir = grid[r][c].direction ?? 'right'
      }
    }
  }

  if (!emitterPos) return { segments, hitTargets }

  let currentPos = { ...emitterPos }
  let currentDir = emitterDir
  let steps = 0

  // Track visited states to detect infinite loops
  const visited = new Set<string>()

  while (steps < MAX_LASER_STEPS) {
    const nextPos = moveInDirection(currentPos, currentDir)

    // Out of bounds
    if (nextPos.row < 0 || nextPos.row >= rows || nextPos.col < 0 || nextPos.col >= cols) {
      segments.push({
        from: { ...currentPos },
        to: { ...nextPos },
        color: PRIMARY_LASER_COLOR,
      })
      break
    }

    const nextCell = grid[nextPos.row][nextPos.col]

    // Wall blocks laser
    if (nextCell.type === 'wall') {
      segments.push({
        from: { ...currentPos },
        to: { ...nextPos },
        color: PRIMARY_LASER_COLOR,
      })
      break
    }

    // Detect loops
    const stateKey = `${nextPos.row},${nextPos.col},${currentDir}`
    if (visited.has(stateKey)) break
    visited.add(stateKey)

    segments.push({
      from: { ...currentPos },
      to: { ...nextPos },
      color: PRIMARY_LASER_COLOR,
    })

    // Target - register hit, laser passes through
    if (nextCell.type === 'target') {
      hitTargets.push({ ...nextPos })
    }

    // Mirror - reflect
    if (nextCell.type === 'mirror' && nextCell.orientation) {
      currentDir = reflectDirection(currentDir, nextCell.orientation)
    }

    // Splitter - for now just pass through (future feature)
    currentPos = nextPos
    steps++
  }

  return { segments, hitTargets }
}

export function checkLevelComplete(grid: Cell[][], hitTargets: GridPos[]): boolean {
  const hitSet = new Set(hitTargets.map(t => `${t.row},${t.col}`))

  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[0].length; c++) {
      if (grid[r][c].type === 'target') {
        if (!hitSet.has(`${r},${c}`)) return false
      }
    }
  }

  return true
}

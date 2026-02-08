export type Direction = 'up' | 'down' | 'left' | 'right'

export type MirrorOrientation = '/' | '\\'

export type CellType = 'empty' | 'emitter' | 'mirror' | 'target' | 'wall' | 'splitter'

export type Cell = {
  type: CellType
  direction?: Direction          // emitter direction
  orientation?: MirrorOrientation // mirror orientation
  fixed?: boolean                // immovable mirror
  hit?: boolean                  // target hit by laser
  active?: boolean               // emitter/target active state
}

export type GridPos = {
  row: number
  col: number
}

export type LaserSegment = {
  from: GridPos
  to: GridPos
  color: string
}

export type LaserPath = {
  segments: LaserSegment[]
  hitTargets: GridPos[]
}

export type LevelDef = {
  name: string
  cols: number
  rows: number
  grid: Cell[][]
  par: number   // minimum moves for star rating
  hint?: string
}

export type GamePhase = 'menu' | 'playing' | 'levelComplete' | 'allComplete'

export type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  color: string
  size: number
  type: 'spark' | 'glow' | 'ring' | 'star'
  rotation: number
  rotSpeed: number
}

export type FloatingText = {
  x: number
  y: number
  text: string
  life: number
  maxLife: number
  color: string
  size: number
}

export type GameState = {
  level: number
  grid: Cell[][]
  laserPath: LaserPath
  moves: number
  particles: Particle[]
  floatingTexts: FloatingText[]
  selectedCell: GridPos | null
  shakeX: number
  shakeY: number
  screenFlash: number
  screenFlashColor: string
  frameCount: number
  completedLevels: number[]
}

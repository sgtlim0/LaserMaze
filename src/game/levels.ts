import type { Cell, LevelDef } from './types.ts'

function e(): Cell { return { type: 'empty' } }
function w(): Cell { return { type: 'wall' } }
function em(dir: 'up' | 'down' | 'left' | 'right'): Cell { return { type: 'emitter', direction: dir } }
function m(orient: '/' | '\\'): Cell { return { type: 'mirror', orientation: orient } }
function mf(orient: '/' | '\\'): Cell { return { type: 'mirror', orientation: orient, fixed: true } }
function t(): Cell { return { type: 'target' } }

export const LEVELS: LevelDef[] = [
  // ===== ZONE 1: Tutorial (1-5) =====
  // Level 1
  {
    name: 'First Light',
    cols: 5, rows: 5, par: 1,
    hint: 'Tap a mirror to rotate it',
    grid: [
      [e(), e(), e(), e(), e()],
      [em('right'), e(), m('\\'), e(), e()],
      [e(), e(), e(), e(), e()],
      [e(), e(), t(), e(), e()],
      [e(), e(), e(), e(), e()],
    ],
  },
  // Level 2
  {
    name: 'Corner Shot',
    cols: 5, rows: 5, par: 1,
    hint: 'Laser reflects off mirrors',
    grid: [
      [e(), e(), e(), e(), t()],
      [em('right'), e(), e(), m('/'), e()],
      [e(), e(), e(), e(), e()],
      [e(), e(), e(), e(), e()],
      [e(), e(), e(), e(), e()],
    ],
  },
  // Level 3
  {
    name: 'Zigzag',
    cols: 6, rows: 6, par: 2,
    grid: [
      [em('right'), e(), e(), m('\\'), e(), e()],
      [e(), e(), e(), e(), e(), e()],
      [e(), e(), e(), m('/'), e(), e()],
      [e(), e(), e(), e(), e(), t()],
      [e(), e(), e(), e(), e(), e()],
      [e(), e(), e(), e(), e(), e()],
    ],
  },
  // Level 4
  {
    name: 'Wall Block',
    cols: 6, rows: 6, par: 2,
    grid: [
      [e(), e(), e(), e(), e(), e()],
      [em('right'), e(), m('\\'), w(), e(), e()],
      [e(), e(), e(), e(), e(), e()],
      [e(), w(), m('/'), e(), e(), e()],
      [e(), e(), e(), e(), t(), e()],
      [e(), e(), e(), e(), e(), e()],
    ],
  },
  // Level 5
  {
    name: 'Double Trouble',
    cols: 6, rows: 6, par: 2,
    grid: [
      [e(), e(), t(), e(), e(), e()],
      [em('right'), e(), m('\\'), e(), e(), e()],
      [e(), e(), e(), e(), e(), e()],
      [e(), e(), mf('\\'), e(), m('/'), e()],
      [e(), e(), e(), e(), e(), e()],
      [e(), e(), e(), e(), t(), e()],
    ],
  },

  // ===== ZONE 2: Walls & Corridors (6-10) =====
  // Level 6
  {
    name: 'Mirror Maze',
    cols: 7, rows: 7, par: 3,
    grid: [
      [e(), e(), e(), e(), e(), e(), e()],
      [em('down'), e(), w(), e(), w(), e(), e()],
      [e(), e(), w(), e(), w(), e(), e()],
      [m('\\'), e(), e(), m('/'), e(), e(), e()],
      [e(), e(), w(), e(), w(), e(), e()],
      [e(), e(), w(), e(), m('\\'), e(), e()],
      [e(), e(), e(), e(), e(), t(), e()],
    ],
  },
  // Level 7
  {
    name: 'Locked Path',
    cols: 7, rows: 7, par: 2,
    grid: [
      [e(), e(), e(), e(), e(), e(), e()],
      [e(), em('right'), e(), mf('/'), e(), e(), e()],
      [e(), e(), e(), e(), e(), e(), e()],
      [e(), e(), e(), m('\\'), e(), mf('\\'), e()],
      [e(), e(), e(), e(), e(), e(), e()],
      [e(), e(), e(), e(), e(), m('/'), e()],
      [e(), e(), e(), e(), e(), t(), e()],
    ],
  },
  // Level 8
  {
    name: 'U-Turn',
    cols: 7, rows: 7, par: 3,
    grid: [
      [e(), e(), e(), e(), e(), e(), e()],
      [e(), em('right'), e(), e(), m('\\'), e(), e()],
      [e(), e(), e(), e(), e(), e(), e()],
      [e(), e(), w(), w(), w(), e(), e()],
      [e(), e(), e(), e(), e(), e(), e()],
      [e(), t(), e(), e(), m('/'), e(), e()],
      [e(), e(), e(), e(), e(), e(), e()],
    ],
  },
  // Level 9
  {
    name: 'Narrow Pass',
    cols: 8, rows: 7, par: 3,
    grid: [
      [e(), e(), e(), w(), e(), e(), e(), e()],
      [em('right'), e(), m('\\'), w(), e(), e(), e(), e()],
      [e(), e(), e(), e(), e(), w(), e(), e()],
      [e(), e(), m('/'), e(), m('\\'), w(), e(), e()],
      [e(), e(), e(), e(), e(), e(), e(), e()],
      [e(), e(), e(), w(), e(), m('/'), e(), t()],
      [e(), e(), e(), w(), e(), e(), e(), e()],
    ],
  },
  // Level 10
  {
    name: 'Triple Strike',
    cols: 8, rows: 8, par: 4,
    grid: [
      [e(), t(), e(), e(), e(), e(), e(), e()],
      [e(), e(), e(), e(), e(), e(), e(), e()],
      [em('right'), e(), m('\\'), e(), w(), e(), m('\\'), e()],
      [e(), e(), e(), e(), w(), e(), e(), e()],
      [e(), mf('\\'), e(), m('/'), e(), e(), e(), t()],
      [e(), e(), e(), e(), e(), e(), e(), e()],
      [e(), m('/'), e(), e(), e(), e(), e(), e()],
      [e(), e(), e(), e(), t(), e(), e(), e()],
    ],
  },

  // ===== ZONE 3: Intermediate (11-15) =====
  // Level 11
  {
    name: 'Labyrinth',
    cols: 8, rows: 8, par: 4,
    grid: [
      [e(), e(), e(), e(), e(), e(), e(), e()],
      [em('down'), e(), w(), w(), e(), w(), e(), e()],
      [e(), e(), e(), e(), e(), w(), e(), e()],
      [m('\\'), e(), m('/'), e(), e(), e(), e(), e()],
      [e(), e(), e(), w(), m('\\'), e(), w(), e()],
      [e(), e(), e(), w(), e(), e(), w(), e()],
      [e(), e(), e(), e(), m('/'), e(), e(), t()],
      [e(), e(), e(), e(), e(), e(), e(), e()],
    ],
  },
  // Level 12
  {
    name: 'Spiral Path',
    cols: 7, rows: 7, par: 3,
    grid: [
      [em('right'), e(), e(), e(), m('\\'), e(), e()],
      [e(), e(), e(), e(), e(), e(), e()],
      [e(), e(), w(), w(), w(), e(), e()],
      [e(), e(), w(), t(), w(), e(), m('/')],
      [e(), e(), w(), w(), w(), e(), e()],
      [e(), e(), e(), e(), e(), e(), e()],
      [e(), e(), e(), m('\\'), e(), e(), mf('/')],
    ],
  },
  // Level 13
  {
    name: 'Cross Fire',
    cols: 7, rows: 7, par: 3,
    grid: [
      [e(), e(), e(), t(), e(), e(), e()],
      [e(), e(), e(), e(), e(), e(), e()],
      [e(), e(), mf('/'), e(), m('\\'), e(), e()],
      [em('right'), e(), e(), e(), e(), e(), t()],
      [e(), e(), m('\\'), e(), mf('/'), e(), e()],
      [e(), e(), e(), e(), e(), e(), e()],
      [e(), e(), e(), t(), e(), e(), e()],
    ],
  },
  // Level 14
  {
    name: 'Staircase',
    cols: 8, rows: 8, par: 4,
    grid: [
      [em('right'), e(), m('\\'), e(), e(), e(), e(), e()],
      [e(), e(), e(), e(), e(), e(), e(), e()],
      [e(), e(), m('/'), e(), m('\\'), e(), e(), e()],
      [e(), e(), e(), e(), e(), e(), e(), e()],
      [e(), e(), e(), e(), m('/'), e(), m('\\'), e()],
      [e(), e(), e(), e(), e(), e(), e(), e()],
      [e(), e(), e(), e(), e(), e(), m('/'), e()],
      [e(), e(), e(), e(), e(), e(), t(), e()],
    ],
  },
  // Level 15
  {
    name: 'The Gauntlet',
    cols: 8, rows: 7, par: 4,
    grid: [
      [e(), e(), e(), e(), e(), e(), e(), e()],
      [em('right'), e(), m('\\'), e(), w(), e(), m('\\'), e()],
      [e(), e(), e(), e(), w(), e(), e(), e()],
      [e(), w(), m('/'), e(), e(), e(), m('/'), w()],
      [e(), w(), e(), e(), w(), e(), e(), e()],
      [t(), e(), e(), e(), w(), e(), e(), t()],
      [e(), e(), e(), e(), e(), e(), e(), e()],
    ],
  },

  // ===== ZONE 4: Advanced (16-20) =====
  // Level 16
  {
    name: 'Diamond',
    cols: 9, rows: 9, par: 4,
    grid: [
      [e(), e(), e(), e(), e(), e(), e(), e(), e()],
      [e(), e(), e(), e(), w(), e(), e(), e(), e()],
      [e(), e(), e(), w(), e(), w(), e(), e(), e()],
      [e(), e(), w(), e(), m('/'), e(), w(), e(), e()],
      [em('right'), w(), e(), m('\\'), e(), m('/'), e(), w(), t()],
      [e(), e(), w(), e(), m('\\'), e(), w(), e(), e()],
      [e(), e(), e(), w(), e(), w(), e(), e(), e()],
      [e(), e(), e(), e(), w(), e(), e(), e(), e()],
      [e(), e(), e(), e(), e(), e(), e(), e(), e()],
    ],
  },
  // Level 17
  {
    name: 'Split Decision',
    cols: 8, rows: 8, par: 5,
    grid: [
      [t(), e(), e(), e(), e(), e(), e(), e()],
      [e(), e(), e(), e(), e(), e(), e(), e()],
      [e(), m('/'), e(), mf('\\'), e(), m('/'), e(), e()],
      [e(), e(), e(), e(), e(), e(), e(), e()],
      [em('right'), e(), m('\\'), e(), w(), e(), m('\\'), e()],
      [e(), e(), e(), e(), w(), e(), e(), e()],
      [e(), e(), e(), m('/'), e(), e(), m('/'), e()],
      [e(), e(), e(), e(), e(), e(), t(), e()],
    ],
  },
  // Level 18
  {
    name: 'Fortress',
    cols: 9, rows: 8, par: 5,
    grid: [
      [e(), e(), e(), e(), e(), e(), e(), e(), e()],
      [em('down'), e(), w(), w(), w(), w(), w(), e(), e()],
      [e(), e(), w(), e(), e(), e(), w(), e(), e()],
      [m('\\'), e(), w(), e(), t(), e(), w(), e(), e()],
      [e(), e(), w(), e(), e(), e(), w(), e(), m('/')],
      [e(), e(), w(), w(), m('\\'), w(), w(), e(), e()],
      [e(), e(), e(), e(), e(), e(), e(), e(), e()],
      [e(), e(), e(), e(), mf('/'), e(), e(), e(), t()],
    ],
  },
  // Level 19
  {
    name: 'Pinball',
    cols: 8, rows: 9, par: 5,
    grid: [
      [e(), e(), e(), e(), e(), e(), e(), e()],
      [em('right'), e(), m('\\'), e(), e(), m('/'), e(), e()],
      [e(), e(), e(), e(), e(), e(), e(), e()],
      [e(), w(), m('/'), e(), m('\\'), w(), e(), e()],
      [e(), e(), e(), e(), e(), e(), e(), e()],
      [e(), e(), m('\\'), w(), m('/'), e(), e(), e()],
      [e(), e(), e(), e(), e(), e(), e(), e()],
      [e(), e(), e(), m('/'), e(), m('\\'), e(), e()],
      [e(), e(), e(), t(), e(), e(), t(), e()],
    ],
  },
  // Level 20
  {
    name: 'The Vault',
    cols: 9, rows: 9, par: 5,
    grid: [
      [e(), e(), e(), e(), t(), e(), e(), e(), e()],
      [e(), w(), w(), e(), e(), e(), w(), w(), e()],
      [e(), w(), e(), e(), mf('/'), e(), e(), w(), e()],
      [e(), e(), e(), w(), e(), w(), e(), e(), e()],
      [em('right'), e(), m('\\'), e(), w(), e(), m('/'), e(), t()],
      [e(), e(), e(), w(), e(), w(), e(), e(), e()],
      [e(), w(), e(), e(), mf('\\'), e(), e(), w(), e()],
      [e(), w(), w(), e(), e(), e(), w(), w(), e()],
      [e(), e(), e(), e(), t(), e(), e(), e(), e()],
    ],
  },

  // ===== ZONE 5: Expert (21-25) =====
  // Level 21
  {
    name: 'Helix',
    cols: 9, rows: 9, par: 5,
    grid: [
      [em('right'), e(), e(), m('\\'), e(), e(), e(), e(), e()],
      [e(), e(), e(), e(), e(), e(), e(), e(), e()],
      [e(), e(), mf('/'), e(), e(), e(), m('\\'), e(), e()],
      [e(), e(), e(), e(), e(), e(), e(), e(), e()],
      [e(), e(), e(), e(), m('/'), e(), e(), e(), e()],
      [e(), e(), e(), e(), e(), e(), e(), e(), e()],
      [e(), e(), m('\\'), e(), e(), e(), mf('/'), e(), e()],
      [e(), e(), e(), e(), e(), e(), e(), e(), e()],
      [e(), e(), e(), m('/'), e(), e(), e(), t(), e()],
    ],
  },
  // Level 22
  {
    name: 'Four Corners',
    cols: 9, rows: 9, par: 6,
    grid: [
      [t(), e(), e(), e(), e(), e(), e(), e(), t()],
      [e(), m('/'), e(), e(), e(), e(), m('\\'), e(), e()],
      [e(), e(), e(), w(), e(), w(), e(), e(), e()],
      [e(), e(), w(), e(), e(), e(), w(), e(), e()],
      [e(), e(), e(), e(), em('right'), e(), e(), e(), e()],
      [e(), e(), w(), e(), e(), e(), w(), e(), e()],
      [e(), e(), e(), w(), e(), w(), e(), e(), e()],
      [e(), m('\\'), e(), e(), e(), e(), m('/'), e(), e()],
      [t(), e(), e(), e(), e(), e(), e(), e(), t()],
    ],
  },
  // Level 23
  {
    name: 'Winding River',
    cols: 10, rows: 8, par: 6,
    grid: [
      [em('right'), e(), m('\\'), e(), e(), e(), e(), e(), e(), e()],
      [e(), e(), e(), e(), e(), e(), e(), e(), e(), e()],
      [w(), w(), m('/'), e(), m('\\'), w(), w(), e(), e(), e()],
      [e(), e(), e(), e(), e(), e(), e(), e(), e(), e()],
      [e(), e(), e(), e(), w(), w(), m('/'), e(), m('\\'), e()],
      [e(), e(), e(), e(), e(), e(), e(), e(), e(), e()],
      [e(), e(), e(), e(), e(), w(), w(), m('/'), e(), t()],
      [e(), e(), e(), e(), e(), e(), e(), e(), e(), e()],
    ],
  },
  // Level 24
  {
    name: 'Checkmate',
    cols: 9, rows: 9, par: 6,
    grid: [
      [e(), e(), e(), e(), e(), e(), e(), e(), e()],
      [e(), m('\\'), e(), w(), e(), m('/'), e(), w(), e()],
      [e(), e(), e(), e(), e(), e(), e(), e(), e()],
      [e(), w(), e(), mf('/'), e(), w(), e(), m('\\'), e()],
      [em('right'), e(), e(), e(), e(), e(), e(), e(), t()],
      [e(), w(), e(), m('/'), e(), w(), e(), mf('\\'), e()],
      [e(), e(), e(), e(), e(), e(), e(), e(), e()],
      [e(), m('/'), e(), w(), e(), m('\\'), e(), w(), e()],
      [e(), t(), e(), e(), e(), e(), e(), t(), e()],
    ],
  },
  // Level 25
  {
    name: 'Serpentine',
    cols: 10, rows: 8, par: 7,
    grid: [
      [em('right'), e(), m('\\'), e(), e(), e(), e(), e(), e(), e()],
      [e(), e(), e(), e(), e(), e(), e(), e(), e(), e()],
      [e(), w(), m('/'), e(), m('\\'), w(), e(), e(), e(), e()],
      [e(), e(), e(), e(), e(), e(), e(), e(), e(), e()],
      [e(), e(), e(), w(), m('/'), e(), m('\\'), w(), e(), e()],
      [e(), e(), e(), e(), e(), e(), e(), e(), e(), e()],
      [e(), e(), e(), e(), w(), m('/'), e(), m('\\'), w(), t()],
      [e(), e(), e(), e(), e(), e(), e(), e(), e(), e()],
    ],
  },

  // ===== ZONE 6: Master (26-30) =====
  // Level 26
  {
    name: 'Hall of Mirrors',
    cols: 9, rows: 9, par: 6,
    grid: [
      [e(), e(), e(), e(), e(), e(), e(), e(), e()],
      [em('right'), e(), m('\\'), e(), mf('/'), e(), m('\\'), e(), e()],
      [e(), e(), e(), e(), e(), e(), e(), e(), e()],
      [e(), w(), mf('\\'), e(), w(), e(), m('/'), w(), e()],
      [e(), e(), e(), e(), e(), e(), e(), e(), e()],
      [e(), w(), m('\\'), e(), w(), e(), mf('\\'), w(), e()],
      [e(), e(), e(), e(), e(), e(), e(), e(), e()],
      [t(), e(), m('/'), e(), mf('\\'), e(), m('/'), e(), t()],
      [e(), e(), e(), e(), e(), e(), e(), e(), e()],
    ],
  },
  // Level 27
  {
    name: 'Symmetry',
    cols: 9, rows: 9, par: 6,
    grid: [
      [e(), e(), e(), e(), em('down'), e(), e(), e(), e()],
      [e(), e(), e(), e(), e(), e(), e(), e(), e()],
      [e(), e(), m('/'), e(), m('\\'), e(), m('/'), e(), e()],
      [e(), e(), e(), e(), e(), e(), e(), e(), e()],
      [t(), e(), mf('\\'), e(), w(), e(), mf('/'), e(), t()],
      [e(), e(), e(), e(), e(), e(), e(), e(), e()],
      [e(), e(), m('/'), e(), m('\\'), e(), m('/'), e(), e()],
      [e(), e(), e(), e(), e(), e(), e(), e(), e()],
      [e(), e(), e(), e(), t(), e(), e(), e(), e()],
    ],
  },
  // Level 28
  {
    name: 'Quantum Path',
    cols: 10, rows: 9, par: 7,
    grid: [
      [e(), t(), e(), e(), e(), e(), e(), e(), t(), e()],
      [e(), e(), e(), w(), e(), e(), w(), e(), e(), e()],
      [em('right'), e(), m('\\'), w(), e(), e(), w(), m('/'), e(), e()],
      [e(), e(), e(), e(), e(), e(), e(), e(), e(), e()],
      [e(), w(), m('/'), e(), mf('\\'), mf('/'), e(), m('\\'), w(), e()],
      [e(), e(), e(), e(), e(), e(), e(), e(), e(), e()],
      [e(), e(), m('\\'), w(), e(), e(), w(), m('/'), e(), e()],
      [e(), e(), e(), w(), e(), e(), w(), e(), e(), e()],
      [e(), e(), e(), e(), t(), t(), e(), e(), e(), e()],
    ],
  },
  // Level 29
  {
    name: 'Infinity Loop',
    cols: 10, rows: 10, par: 7,
    grid: [
      [e(), e(), e(), e(), e(), e(), e(), e(), e(), e()],
      [e(), em('right'), e(), m('\\'), e(), e(), e(), mf('\\'), e(), e()],
      [e(), e(), e(), e(), e(), e(), e(), e(), e(), e()],
      [e(), w(), w(), m('/'), e(), m('\\'), w(), w(), e(), e()],
      [e(), e(), e(), e(), e(), e(), e(), e(), e(), t()],
      [t(), e(), e(), e(), e(), e(), e(), e(), e(), e()],
      [e(), w(), w(), m('\\'), e(), m('/'), w(), w(), e(), e()],
      [e(), e(), e(), e(), e(), e(), e(), e(), e(), e()],
      [e(), e(), e(), mf('/'), e(), e(), e(), m('/'), e(), e()],
      [e(), e(), e(), e(), e(), t(), e(), e(), e(), e()],
    ],
  },
  // Level 30
  {
    name: 'Grand Reflection',
    cols: 10, rows: 10, par: 8,
    grid: [
      [e(), e(), e(), e(), e(), t(), e(), e(), e(), e()],
      [e(), w(), e(), e(), m('/'), e(), m('\\'), e(), w(), e()],
      [e(), e(), e(), w(), e(), e(), e(), w(), e(), e()],
      [e(), e(), w(), e(), mf('/'), e(), m('\\'), e(), w(), e()],
      [e(), m('\\'), e(), mf('\\'), e(), e(), e(), mf('/'), e(), m('/')],
      [em('right'), e(), e(), e(), e(), e(), e(), e(), e(), t()],
      [e(), m('/'), e(), mf('/'), e(), e(), e(), mf('\\'), e(), m('\\')],
      [e(), e(), w(), e(), m('/'), e(), mf('\\'), e(), w(), e()],
      [e(), e(), e(), w(), e(), e(), e(), w(), e(), e()],
      [e(), w(), e(), e(), m('\\'), e(), m('/'), e(), w(), t()],
    ],
  },
]

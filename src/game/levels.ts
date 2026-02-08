import type { Cell, LevelDef } from './types.ts'

function e(): Cell { return { type: 'empty' } }
function w(): Cell { return { type: 'wall' } }
function em(dir: 'up' | 'down' | 'left' | 'right'): Cell { return { type: 'emitter', direction: dir } }
function m(orient: '/' | '\\'): Cell { return { type: 'mirror', orientation: orient } }
function mf(orient: '/' | '\\'): Cell { return { type: 'mirror', orientation: orient, fixed: true } }
function t(): Cell { return { type: 'target' } }

export const LEVELS: LevelDef[] = [
  // Level 1: Simple introduction
  {
    name: 'First Light',
    cols: 5,
    rows: 5,
    par: 1,
    hint: 'Tap a mirror to rotate it',
    grid: [
      [e(), e(), e(), e(), e()],
      [em('right'), e(), m('\\'), e(), e()],
      [e(), e(), e(), e(), e()],
      [e(), e(), t(), e(), e()],
      [e(), e(), e(), e(), e()],
    ],
  },
  // Level 2: Two mirrors
  {
    name: 'Corner Shot',
    cols: 5,
    rows: 5,
    par: 1,
    grid: [
      [e(), e(), e(), e(), t()],
      [em('right'), e(), e(), m('/'), e()],
      [e(), e(), e(), e(), e()],
      [e(), e(), e(), e(), e()],
      [e(), e(), e(), e(), e()],
    ],
  },
  // Level 3: Chain reflections
  {
    name: 'Zigzag',
    cols: 6,
    rows: 6,
    par: 2,
    grid: [
      [em('right'), e(), e(), m('\\'), e(), e()],
      [e(), e(), e(), e(), e(), e()],
      [e(), e(), e(), m('/'), e(), e()],
      [e(), e(), e(), e(), e(), t()],
      [e(), e(), e(), e(), e(), e()],
      [e(), e(), e(), e(), e(), e()],
    ],
  },
  // Level 4: Walls introduced
  {
    name: 'Wall Block',
    cols: 6,
    rows: 6,
    par: 2,
    grid: [
      [e(), e(), e(), e(), e(), e()],
      [em('right'), e(), m('\\'), w(), e(), e()],
      [e(), e(), e(), e(), e(), e()],
      [e(), w(), m('/'), e(), e(), e()],
      [e(), e(), e(), e(), t(), e()],
      [e(), e(), e(), e(), e(), e()],
    ],
  },
  // Level 5: Two targets
  {
    name: 'Double Trouble',
    cols: 6,
    rows: 6,
    par: 2,
    grid: [
      [e(), e(), t(), e(), e(), e()],
      [em('right'), e(), m('\\'), e(), e(), e()],
      [e(), e(), e(), e(), e(), e()],
      [e(), e(), mf('\\'), e(), m('/'), e()],
      [e(), e(), e(), e(), e(), e()],
      [e(), e(), e(), e(), t(), e()],
    ],
  },
  // Level 6: Maze-like
  {
    name: 'Mirror Maze',
    cols: 7,
    rows: 7,
    par: 3,
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
  // Level 7: Fixed + movable
  {
    name: 'Locked Path',
    cols: 7,
    rows: 7,
    par: 2,
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
  // Level 8: U-turn
  {
    name: 'U-Turn',
    cols: 7,
    rows: 7,
    par: 3,
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
  // Level 9: Tight corridors
  {
    name: 'Narrow Pass',
    cols: 8,
    rows: 7,
    par: 3,
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
  // Level 10: Three targets
  {
    name: 'Triple Strike',
    cols: 8,
    rows: 8,
    par: 4,
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
  // Level 11: Complex maze
  {
    name: 'Labyrinth',
    cols: 8,
    rows: 8,
    par: 4,
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
  // Level 12: Grand finale
  {
    name: 'Grand Reflection',
    cols: 9,
    rows: 9,
    par: 5,
    grid: [
      [e(), e(), e(), e(), t(), e(), e(), e(), e()],
      [e(), w(), e(), e(), e(), e(), e(), w(), e()],
      [e(), w(), e(), mf('/'), e(), m('\\'), e(), w(), e()],
      [e(), e(), e(), e(), e(), e(), e(), e(), e()],
      [em('right'), e(), m('\\'), e(), w(), e(), m('/'), e(), t()],
      [e(), e(), e(), e(), e(), e(), e(), e(), e()],
      [e(), w(), e(), m('/'), e(), mf('\\'), e(), w(), e()],
      [e(), w(), e(), e(), e(), e(), e(), w(), e()],
      [e(), e(), e(), e(), t(), e(), e(), e(), e()],
    ],
  },
]

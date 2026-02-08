let ctx: AudioContext | null = null

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext()
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

function playNote(
  c: AudioContext,
  freq: number,
  startTime: number,
  dur: number,
  type: OscillatorType,
  vol: number,
): void {
  const o = c.createOscillator()
  const g = c.createGain()
  o.connect(g)
  g.connect(c.destination)
  o.type = type
  o.frequency.setValueAtTime(freq, startTime)
  g.gain.setValueAtTime(0.001, startTime)
  g.gain.linearRampToValueAtTime(vol, startTime + 0.008)
  g.gain.exponentialRampToValueAtTime(0.001, startTime + dur)
  o.start(startTime)
  o.stop(startTime + dur)
}

export function playMirrorRotate(): void {
  try {
    const c = getCtx()
    const now = c.currentTime
    playNote(c, 800, now, 0.06, 'sine', 0.08)
    playNote(c, 1200, now + 0.03, 0.04, 'sine', 0.05)
  } catch { /* ignore */ }
}

export function playLaserFire(): void {
  try {
    const c = getCtx()
    const now = c.currentTime
    playNote(c, 300, now, 0.1, 'sawtooth', 0.04)
    playNote(c, 600, now, 0.08, 'sine', 0.03)
    playNote(c, 150, now + 0.02, 0.12, 'triangle', 0.02)
  } catch { /* ignore */ }
}

export function playTargetHit(): void {
  try {
    const c = getCtx()
    const now = c.currentTime
    playNote(c, 880, now, 0.1, 'sine', 0.08)
    playNote(c, 1320, now + 0.05, 0.08, 'sine', 0.06)
    playNote(c, 1760, now + 0.1, 0.1, 'sine', 0.04)
  } catch { /* ignore */ }
}

export function playLevelComplete(): void {
  try {
    const c = getCtx()
    const now = c.currentTime
    const notes = [523, 659, 784, 1047, 1319]
    for (let i = 0; i < notes.length; i++) {
      playNote(c, notes[i], now + i * 0.1, 0.2, 'sine', 0.08)
      playNote(c, notes[i] * 1.5, now + i * 0.1 + 0.02, 0.12, 'triangle', 0.03)
    }
    // Final shimmer chord
    playNote(c, 1047, now + 0.55, 0.4, 'sine', 0.06)
    playNote(c, 1319, now + 0.55, 0.4, 'sine', 0.05)
    playNote(c, 1568, now + 0.55, 0.4, 'sine', 0.04)
  } catch { /* ignore */ }
}

export function playReflect(): void {
  try {
    const c = getCtx()
    const now = c.currentTime
    playNote(c, 1500, now, 0.03, 'sine', 0.04)
    playNote(c, 2000, now + 0.01, 0.02, 'sine', 0.02)
  } catch { /* ignore */ }
}

export function playWallHit(): void {
  try {
    const c = getCtx()
    const now = c.currentTime
    playNote(c, 120, now, 0.08, 'square', 0.05)
    playNote(c, 80, now + 0.03, 0.1, 'sawtooth', 0.03)
  } catch { /* ignore */ }
}

export function playMenuClick(): void {
  try {
    const c = getCtx()
    const now = c.currentTime
    playNote(c, 660, now, 0.04, 'sine', 0.06)
    playNote(c, 990, now + 0.02, 0.03, 'sine', 0.03)
  } catch { /* ignore */ }
}

export function playAllComplete(): void {
  try {
    const c = getCtx()
    const now = c.currentTime
    const notes = [523, 659, 784, 880, 1047, 1319, 1568, 2093]
    for (let i = 0; i < notes.length; i++) {
      playNote(c, notes[i], now + i * 0.12, 0.25, 'sine', 0.07)
      playNote(c, notes[i] * 2, now + i * 0.12 + 0.04, 0.1, 'sine', 0.02)
    }
    playNote(c, 2093, now + 1.0, 0.6, 'sine', 0.08)
    playNote(c, 1568, now + 1.0, 0.6, 'sine', 0.06)
    playNote(c, 1047, now + 1.0, 0.6, 'sine', 0.05)
  } catch { /* ignore */ }
}

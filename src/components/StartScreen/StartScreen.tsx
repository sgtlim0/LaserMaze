import type { FC } from 'react'
import { LEVELS } from '../../game/levels.ts'
import styles from './StartScreen.module.css'

type Props = {
  completedLevels: number[]
  onSelectLevel: (level: number) => void
}

const ZONES = [
  { name: 'Tutorial', start: 0, end: 5 },
  { name: 'Corridors', start: 5, end: 10 },
  { name: 'Intermediate', start: 10, end: 15 },
  { name: 'Advanced', start: 15, end: 20 },
  { name: 'Expert', start: 20, end: 25 },
  { name: 'Master', start: 25, end: 30 },
]

const StartScreen: FC<Props> = ({ completedLevels, onSelectLevel }) => {
  const totalDone = completedLevels.length

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>LASER MAZE</h1>
      <p className={styles.subtitle}>Rotate mirrors to guide the laser</p>
      <p className={styles.progress}>{totalDone} / {LEVELS.length} completed</p>

      <div className={styles.scrollArea}>
        {ZONES.map((zone) => (
          <div key={zone.name} className={styles.zoneSection}>
            <div className={styles.zoneName}>{zone.name}</div>
            <div className={styles.levelGrid}>
              {LEVELS.slice(zone.start, zone.end).map((level, idx) => {
                const i = zone.start + idx
                const done = completedLevels.includes(i)
                return (
                  <button
                    key={i}
                    className={`${styles.levelBtn} ${done ? styles.completed : ''}`}
                    onClick={() => onSelectLevel(i)}
                  >
                    <span className={styles.levelNum}>{i + 1}</span>
                    <span className={styles.levelName}>{level.name}</span>
                    {done && <span className={styles.star}>★</span>}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div className={styles.controls}>
        Tap mirrors to rotate · Guide laser to all targets
      </div>
    </div>
  )
}

export default StartScreen

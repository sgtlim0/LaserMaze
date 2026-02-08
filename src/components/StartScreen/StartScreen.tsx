import type { FC } from 'react'
import { LEVELS } from '../../game/levels.ts'
import styles from './StartScreen.module.css'

type Props = {
  completedLevels: number[]
  onSelectLevel: (level: number) => void
}

const StartScreen: FC<Props> = ({ completedLevels, onSelectLevel }) => {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>LASER MAZE</h1>
      <p className={styles.subtitle}>Rotate mirrors to guide the laser</p>

      <div className={styles.levelGrid}>
        {LEVELS.map((level, i) => {
          const done = completedLevels.includes(i)
          return (
            <button
              key={i}
              className={`${styles.levelBtn} ${done ? styles.completed : ''}`}
              onClick={() => onSelectLevel(i)}
            >
              <span>{i + 1}</span>
              <span className={styles.levelName}>{level.name}</span>
              {done && <span className={styles.star}>★</span>}
            </button>
          )
        })}
      </div>

      <div className={styles.controls}>
        Tap mirrors to rotate • Guide laser to all targets
      </div>
    </div>
  )
}

export default StartScreen

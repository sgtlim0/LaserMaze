import type { FC } from 'react'
import { LEVELS } from '../../game/levels.ts'
import styles from './LevelComplete.module.css'

type Props = {
  level: number
  moves: number
  isAllComplete: boolean
  onNextLevel: () => void
  onMenu: () => void
}

const LevelComplete: FC<Props> = ({ level, moves, isAllComplete, onNextLevel, onMenu }) => {
  const levelDef = LEVELS[level]
  const stars = moves <= levelDef.par ? 3 : moves <= levelDef.par + 2 ? 2 : 1

  return (
    <div className={styles.overlay}>
      <h2 className={styles.title}>
        {isAllComplete ? 'ALL LEVELS COMPLETE!' : 'LEVEL COMPLETE!'}
      </h2>
      <p className={styles.levelName}>{levelDef.name}</p>

      <div className={styles.stats}>
        <div className={styles.stat}>
          <div className={styles.statValue}>{moves}</div>
          <div className={styles.statLabel}>Moves</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statValue}>{'★'.repeat(stars)}{'☆'.repeat(3 - stars)}</div>
          <div className={styles.statLabel}>Rating</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statValue}>{levelDef.par}</div>
          <div className={styles.statLabel}>Par</div>
        </div>
      </div>

      <div className={styles.buttons}>
        <button className={`${styles.btn} ${styles.menuBtn}`} onClick={onMenu}>
          Menu
        </button>
        {!isAllComplete && (
          <button className={`${styles.btn} ${styles.nextBtn}`} onClick={onNextLevel}>
            Next Level
          </button>
        )}
      </div>
    </div>
  )
}

export default LevelComplete

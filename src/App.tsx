import { useRef } from 'react'
import { useLaserMaze } from './hooks/useLaserMaze.ts'
import { LEVELS } from './game/levels.ts'
import StartScreen from './components/StartScreen/StartScreen.tsx'
import LevelComplete from './components/LevelComplete/LevelComplete.tsx'
import styles from './App.module.css'

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const {
    phase, currentLevel, completedLevels, moves,
    startLevel, goToMenu, nextLevel,
  } = useLaserMaze(canvasRef)

  if (phase === 'menu') {
    return (
      <div className={styles.container}>
        <StartScreen
          completedLevels={completedLevels}
          onSelectLevel={startLevel}
        />
      </div>
    )
  }

  const isAllComplete = completedLevels.length >= LEVELS.length

  return (
    <div className={styles.container}>
      <div className={styles.canvasWrapper}>
        <button className={styles.backBtn} onClick={goToMenu}>
          ← Menu
        </button>
        <button className={styles.resetBtn} onClick={() => startLevel(currentLevel)}>
          Reset
        </button>
        <canvas ref={canvasRef} className={styles.canvas} />
        {(phase === 'levelComplete' || phase === 'allComplete') && (
          <LevelComplete
            level={currentLevel}
            moves={moves}
            isAllComplete={isAllComplete}
            onNextLevel={nextLevel}
            onMenu={goToMenu}
          />
        )}
      </div>
    </div>
  )
}

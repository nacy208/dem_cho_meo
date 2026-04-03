"use client";

import { GameMode, GAME_MODE_CONFIG } from "@/lib/game-types";
import styles from "../game.module.css";

interface GameOverScreenProps {
  mode: GameMode;
  scorePlayer: number;
  scoreAI: number;
  roundsPlayed: number;
  streak?: number;
  isNewHighScore: boolean;
  onPlayAgain: () => void;
  onBackToMenu: () => void;
}

export function GameOverScreen({
  mode,
  scorePlayer,
  scoreAI,
  roundsPlayed,
  streak = 0,
  isNewHighScore,
  onPlayAgain,
  onBackToMenu,
}: GameOverScreenProps) {
  const config = GAME_MODE_CONFIG[mode];
  const playerWon = scorePlayer > scoreAI;
  const isDraw = scorePlayer === scoreAI;

  return (
    <section className={styles.screen} role="region" aria-label="Kết thúc game">
      {isNewHighScore && (
        <div className={styles.newHighScore}>
          <span className={styles.highScoreIcon}>*</span>
          KỶ LỤC MỚI!
          <span className={styles.highScoreIcon}>*</span>
        </div>
      )}
      
      <h2 className={styles.gameOverTitle}>
        {isDraw ? "HÒA!" : playerWon ? "BẠN THẮNG!" : "AI THẮNG!"}
      </h2>
      
      <div className={styles.gameOverMode}>
        Chế độ: {config.name}
      </div>
      
      <div className={styles.finalScoreCard}>
        <div className={styles.finalScoreRow}>
          <div className={`${styles.finalScoreItem} ${playerWon ? styles.winner : ""}`}>
            <span className={styles.finalScoreLabel}>BẠN</span>
            <span className={styles.finalScoreValue}>{scorePlayer}</span>
          </div>
          <span className={styles.finalScoreDivider}>-</span>
          <div className={`${styles.finalScoreItem} ${!playerWon && !isDraw ? styles.winner : ""}`}>
            <span className={styles.finalScoreLabel}>AI</span>
            <span className={styles.finalScoreValue}>{scoreAI}</span>
          </div>
        </div>
        
        <div className={styles.statsRow}>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{roundsPlayed}</span>
            <span className={styles.statLabel}>Vòng đã chơi</span>
          </div>
          {mode === "endless" && streak > 0 && (
            <div className={styles.statItem}>
              <span className={styles.statValue}>{streak}</span>
              <span className={styles.statLabel}>Streak cao nhất</span>
            </div>
          )}
        </div>
      </div>
      
      <div className={styles.menuButtons}>
        <button
          onClick={onPlayAgain}
          className={`${styles.btn} ${styles.btnBlue}`}
          type="button"
        >
          CHƠI LẠI
        </button>
        <button
          onClick={onBackToMenu}
          className={`${styles.btn} ${styles.btnSecondary}`}
          type="button"
        >
          VỀ MENU
        </button>
      </div>
    </section>
  );
}

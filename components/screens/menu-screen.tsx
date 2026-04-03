"use client";

import styles from "../game.module.css";

interface MenuScreenProps {
  onStart: () => void;
  lastScore: { player: number; ai: number } | null;
}

export function MenuScreen({ onStart, lastScore }: MenuScreenProps) {
  return (
    <section className={styles.screen} role="region" aria-label="Menu chính">
      <h1 className={styles.title}>GAME ĐẾM THÚ CƯNG</h1>
      <p className={styles.subtitle}>Người vs Người Máy</p>
      
      <div className={styles.vsRow} aria-hidden="true">
        <div className={`${styles.avatar} ${styles.avatarBlue}`}>NGƯỜI</div>
        <span className={styles.vsText}>VS</span>
        <div className={`${styles.avatar} ${styles.avatarGreen}`}>AI</div>
      </div>
      
      {lastScore && (
        <div className={styles.scoreDisplay} role="status" aria-live="polite">
          Kết quả: Bạn {lastScore.player} - AI {lastScore.ai}
        </div>
      )}
      
      <button 
        onClick={onStart} 
        className={`${styles.btn} ${styles.btnBlue}`}
        type="button"
      >
        BẮT ĐẦU CHƠI
      </button>
      
      <p className={styles.hint}>Đếm số chó và mèo trong ảnh!</p>
    </section>
  );
}

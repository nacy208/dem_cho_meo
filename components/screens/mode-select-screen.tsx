"use client";

import { GameMode, GAME_MODE_CONFIG } from "@/lib/game-types";
import styles from "../game.module.css";

interface ModeSelectScreenProps {
  onSelectMode: (mode: GameMode) => void;
  onBack: () => void;
  onShowLeaderboard: () => void;
}

export function ModeSelectScreen({ onSelectMode, onBack, onShowLeaderboard }: ModeSelectScreenProps) {
  return (
    <section className={styles.screen} role="region" aria-label="Chọn chế độ chơi">
      <h2 className={styles.title}>CHỌN CHẾ ĐỘ CHƠI</h2>
      
      <div className={styles.modeGrid}>
        {(Object.keys(GAME_MODE_CONFIG) as GameMode[]).map((mode) => {
          const config = GAME_MODE_CONFIG[mode];
          return (
            <button
              key={mode}
              onClick={() => onSelectMode(mode)}
              className={`${styles.modeCard} ${styles[`modeCard${mode.charAt(0).toUpperCase() + mode.slice(1)}`]}`}
              type="button"
            >
              <div className={styles.modeIcon}>
                {config.icon === "trophy" && (
                  <svg viewBox="0 0 24 24" fill="currentColor" width="32" height="32">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                )}
                {config.icon === "clock" && (
                  <svg viewBox="0 0 24 24" fill="currentColor" width="32" height="32">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z"/>
                  </svg>
                )}
                {config.icon === "infinity" && (
                  <svg viewBox="0 0 24 24" fill="currentColor" width="32" height="32">
                    <path d="M18.6 6.62c-1.44 0-2.8.56-3.77 1.53L12 10.66 10.48 12h.01L7.8 14.39c-.64.64-1.49.99-2.4.99-1.87 0-3.39-1.51-3.39-3.38S3.53 8.62 5.4 8.62c.91 0 1.76.35 2.44 1.03l1.13 1 1.51-1.34L9.22 8.2C8.2 7.18 6.84 6.62 5.4 6.62 2.42 6.62 0 9.04 0 12s2.42 5.38 5.4 5.38c1.44 0 2.8-.56 3.77-1.53l2.83-2.5.01.01L13.52 12h-.01l2.69-2.39c.64-.64 1.49-.99 2.4-.99 1.87 0 3.39 1.51 3.39 3.38s-1.52 3.38-3.39 3.38c-.9 0-1.76-.35-2.44-1.03l-1.14-1.01-1.51 1.34 1.27 1.12c1.02 1.01 2.37 1.57 3.82 1.57 2.98 0 5.4-2.41 5.4-5.38s-2.42-5.37-5.4-5.37z"/>
                  </svg>
                )}
              </div>
              <span className={styles.modeName}>{config.name}</span>
              <span className={styles.modeDesc}>{config.description}</span>
            </button>
          );
        })}
      </div>
      
      <div className={styles.menuButtons}>
        <button
          onClick={onShowLeaderboard}
          className={`${styles.btn} ${styles.btnOutline}`}
          type="button"
        >
          BẢNG XẾP HẠNG
        </button>
        <button
          onClick={onBack}
          className={`${styles.btn} ${styles.btnSecondary}`}
          type="button"
        >
          QUAY LẠI
        </button>
      </div>
    </section>
  );
}

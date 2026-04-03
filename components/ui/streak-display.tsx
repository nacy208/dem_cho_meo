"use client";

import styles from "../game.module.css";

interface StreakDisplayProps {
  streak: number;
  showBonus?: boolean;
}

export function StreakDisplay({ streak, showBonus = false }: StreakDisplayProps) {
  if (streak === 0) return null;
  
  const bonusMultiplier = Math.min(1 + streak * 0.1, 2); // Max 2x bonus
  
  return (
    <div className={`${styles.streakDisplay} ${streak >= 5 ? styles.streakHot : ""}`}>
      <span className={styles.streakIcon}>
        {streak >= 5 ? "*" : streak >= 3 ? "+" : "-"}
      </span>
      <span className={styles.streakCount}>{streak} Streak</span>
      {showBonus && streak >= 2 && (
        <span className={styles.streakBonus}>x{bonusMultiplier.toFixed(1)}</span>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { GameMode, HighScore, GAME_MODE_CONFIG } from "@/lib/game-types";
import styles from "../game.module.css";

interface LeaderboardScreenProps {
  highScores: HighScore[];
  onBack: () => void;
}

export function LeaderboardScreen({ highScores, onBack }: LeaderboardScreenProps) {
  const [selectedMode, setSelectedMode] = useState<GameMode | "all">("all");
  
  const filteredScores = selectedMode === "all" 
    ? highScores 
    : highScores.filter(s => s.mode === selectedMode);
  
  const sortedScores = [...filteredScores].sort((a, b) => b.score - a.score).slice(0, 10);

  return (
    <section className={styles.screen} role="region" aria-label="Bảng xếp hạng">
      <h2 className={styles.title}>BẢNG XẾP HẠNG</h2>
      
      <div className={styles.modeFilter}>
        <button
          onClick={() => setSelectedMode("all")}
          className={`${styles.filterBtn} ${selectedMode === "all" ? styles.filterBtnActive : ""}`}
          type="button"
        >
          Tất cả
        </button>
        {(Object.keys(GAME_MODE_CONFIG) as GameMode[]).map((mode) => (
          <button
            key={mode}
            onClick={() => setSelectedMode(mode)}
            className={`${styles.filterBtn} ${selectedMode === mode ? styles.filterBtnActive : ""}`}
            type="button"
          >
            {GAME_MODE_CONFIG[mode].name}
          </button>
        ))}
      </div>
      
      {sortedScores.length === 0 ? (
        <div className={styles.emptyLeaderboard}>
          <p>Chưa có kỷ lục nào!</p>
          <p className={styles.hint}>Hãy chơi để ghi danh vào bảng xếp hạng</p>
        </div>
      ) : (
        <div className={styles.leaderboardList}>
          {sortedScores.map((score, index) => (
            <div 
              key={`${score.date}-${index}`} 
              className={`${styles.leaderboardItem} ${index < 3 ? styles[`rank${index + 1}`] : ""}`}
            >
              <span className={styles.rank}>
                {index === 0 ? "1st" : index === 1 ? "2nd" : index === 2 ? "3rd" : `#${index + 1}`}
              </span>
              <div className={styles.scoreInfo}>
                <span className={styles.scoreMode}>{GAME_MODE_CONFIG[score.mode].name}</span>
                <span className={styles.scoreDate}>
                  {new Date(score.date).toLocaleDateString("vi-VN")}
                </span>
              </div>
              <div className={styles.scoreDetails}>
                <span className={styles.scorePoints}>{score.score} điểm</span>
                <span className={styles.scoreRounds}>{score.rounds} vòng</span>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <button
        onClick={onBack}
        className={`${styles.btn} ${styles.btnBlue}`}
        type="button"
      >
        QUAY LẠI
      </button>
    </section>
  );
}

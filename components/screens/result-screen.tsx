"use client";

import Image from "next/image";
import { GameMode, RoundResult } from "@/lib/game-types";
import { StreakDisplay } from "../ui/streak-display";
import styles from "../game.module.css";

interface ResultScreenProps {
  roundNum: number;
  maxRounds?: number;
  result: RoundResult;
  scorePlayer: number;
  scoreAI: number;
  isLastRound: boolean;
  onNext: () => void;
  gameMode: GameMode;
  streak?: number;
}

function getScoreInfo(diff: number): { points: number; emoji: string } {
  if (diff === 0) return { points: 10, emoji: "Chính xác!" };
  if (diff <= 1) return { points: 5, emoji: "Gần đúng!" };
  return { points: 0, emoji: "Sai rồi!" };
}

function getCardClass(diff: number): string {
  if (diff === 0) return styles.resultCardCorrect;
  if (diff <= 1) return styles.resultCardClose;
  return styles.resultCardWrong;
}

export function ResultScreen({
  roundNum,
  maxRounds,
  result,
  scorePlayer,
  scoreAI,
  isLastRound,
  onNext,
  gameMode,
  streak,
}: ResultScreenProps) {
  const playerDiff = Math.abs(result.playerAnswer - result.correct);
  const aiDiff = Math.abs(result.aiGuess - result.correct);
  
  const playerInfo = getScoreInfo(playerDiff);
  const aiInfo = getScoreInfo(aiDiff);
  
  const isEndlessGameOver = gameMode === "endless" && playerDiff > 1;

  return (
    <section className={styles.screen} role="region" aria-label="Kết quả">
      <div className={styles.roundInfo} role="status">
        {maxRounds ? `Vòng ${roundNum}/${maxRounds}` : `Vòng ${roundNum}`}
      </div>
      
      {/* Streak display for Endless mode */}
      {gameMode === "endless" && streak !== undefined && !isEndlessGameOver && (
        <StreakDisplay streak={streak} />
      )}
      
      <figure className={styles.imageFrame}>
        <Image
          src={result.annotatedImage}
          alt="Ảnh kết quả với các con vật được đánh dấu"
          width={480}
          height={320}
          style={{ objectFit: "contain", maxHeight: "320px", width: "auto" }}
        />
      </figure>
      
      <p className={styles.correctAnswer} role="status">
        Đáp án đúng: {result.correct} con vật
      </p>
      <p className={styles.animalDetail}>
        Chi tiết: Chó {result.dog} | Mèo {result.cat}
      </p>
      
      <div className={styles.resultCards} role="group" aria-label="Kết quả người chơi và AI">
        <article className={`${styles.resultCard} ${getCardClass(playerDiff)}`}>
          <span className={styles.cardLabel}>BẠN</span>
          <span className={styles.cardAnswer}>
            Trả lời: {result.playerAnswer} (+{playerInfo.points})
          </span>
        </article>
        <article className={`${styles.resultCard} ${getCardClass(aiDiff)}`}>
          <span className={styles.cardLabel}>AI</span>
          <span className={styles.cardAnswer}>
            Trả lời: {result.aiGuess} (+{aiInfo.points})
          </span>
        </article>
      </div>
      
      <p className={styles.resultMessage} role="status" aria-live="polite">
        {isEndlessGameOver ? "Game Over!" : playerInfo.emoji}
      </p>
      <p className={styles.totalScore}>
        Tổng điểm: Bạn {scorePlayer} - AI {scoreAI}
      </p>
      
      <button
        onClick={onNext}
        className={`${styles.btn} ${styles.btnBlue}`}
        type="button"
      >
        {isLastRound || isEndlessGameOver ? "XEM KẾT QUẢ" : "VÒNG TIẾP THEO"}
      </button>
    </section>
  );
}

"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { GameMode } from "@/lib/game-types";
import { Timer } from "../ui/timer";
import { StreakDisplay } from "../ui/streak-display";
import styles from "../game.module.css";

interface PlayingScreenProps {
  roundNum: number;
  maxRounds?: number;
  scorePlayer: number;
  scoreAI: number;
  imageSrc: string;
  onSubmit: (answer: number) => void;
  gameMode: GameMode;
  timeLeft?: number;
  isTimerRunning?: boolean;
  onTimeUp?: () => void;
  streak?: number;
}

export function PlayingScreen({
  roundNum,
  maxRounds,
  scorePlayer,
  scoreAI,
  imageSrc,
  onSubmit,
  gameMode,
  timeLeft,
  isTimerRunning,
  onTimeUp,
  streak,
}: PlayingScreenProps) {
  const [value, setValue] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasError, setHasError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    setValue("");
    setIsProcessing(false);
  }, [imageSrc]);

  const handleSubmit = () => {
    if (isProcessing) return;
    
    const trimmed = value.trim();
    if (trimmed === "" || isNaN(Number(trimmed))) {
      setHasError(true);
      setTimeout(() => setHasError(false), 500);
      inputRef.current?.focus();
      return;
    }
    
    setIsProcessing(true);
    onSubmit(parseInt(trimmed, 10));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  const getRoundInfo = () => {
    if (gameMode === "classic" && maxRounds) {
      return `Vòng ${roundNum}/${maxRounds}`;
    }
    return `Vòng ${roundNum}`;
  };

  return (
    <section className={styles.screen} role="region" aria-label="Vòng chơi">
      {/* Timer for Time Attack mode */}
      {gameMode === "timeAttack" && timeLeft !== undefined && onTimeUp && (
        <Timer
          initialTime={60}
          isRunning={isTimerRunning || false}
          onTimeUp={onTimeUp}
        />
      )}
      
      {/* Streak display for Endless mode */}
      {gameMode === "endless" && streak !== undefined && (
        <StreakDisplay streak={streak} showBonus />
      )}
      
      <div className={styles.roundInfo} role="status">
        {getRoundInfo()} | Điểm: Bạn {scorePlayer} - AI {scoreAI}
      </div>
      
      <figure className={styles.imageFrame}>
        <Image
          src={imageSrc}
          alt="Ảnh chứa chó và mèo cần đếm"
          width={480}
          height={320}
          style={{ objectFit: "contain", maxHeight: "320px", width: "auto" }}
          priority
        />
      </figure>
      
      <p className={styles.question}>Có bao nhiêu con vật trong ảnh?</p>
      <p className={styles.hint}>
        {gameMode === "timeAttack" 
          ? "(Nhanh lên! Thời gian có hạn!)"
          : gameMode === "endless"
          ? "(Sai quá 1 con sẽ kết thúc game!)"
          : "(Nhấn ENTER hoặc bấm nút để xác nhận)"}
      </p>
      
      <div className={styles.inputRow}>
        <div className={`${styles.avatar} ${styles.avatarSmall} ${styles.avatarBlue}`} aria-hidden="true">
          BẠN
        </div>
        <label htmlFor="player-input" className="sr-only">Nhập số con vật</label>
        <input
          ref={inputRef}
          id="player-input"
          type="number"
          min="0"
          max="99"
          placeholder="?"
          inputMode="numeric"
          autoComplete="off"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className={`${styles.playerInput} ${hasError ? styles.inputError : ""}`}
          disabled={isProcessing}
        />
        <div className={`${styles.avatar} ${styles.avatarSmall} ${styles.avatarGreen}`} aria-hidden="true">
          AI<br /><span>?</span>
        </div>
      </div>
      
      <button
        onClick={handleSubmit}
        className={`${styles.btn} ${styles.btnBlue}`}
        type="button"
        disabled={isProcessing}
      >
        {isProcessing ? "ĐANG XỬ LÝ..." : "XÁC NHẬN"}
      </button>
    </section>
  );
}

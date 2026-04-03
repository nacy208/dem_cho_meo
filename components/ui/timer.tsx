"use client";

import { useEffect, useState } from "react";
import styles from "../game.module.css";

interface TimerProps {
  initialTime: number;
  isRunning: boolean;
  onTimeUp: () => void;
}

export function Timer({ initialTime, isRunning, onTimeUp }: TimerProps) {
  const [timeLeft, setTimeLeft] = useState(initialTime);
  
  useEffect(() => {
    setTimeLeft(initialTime);
  }, [initialTime]);
  
  useEffect(() => {
    if (!isRunning) return;
    
    if (timeLeft <= 0) {
      onTimeUp();
      return;
    }
    
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [isRunning, timeLeft, onTimeUp]);
  
  const percentage = (timeLeft / initialTime) * 100;
  const isLow = timeLeft <= 10;
  
  return (
    <div className={`${styles.timer} ${isLow ? styles.timerLow : ""}`}>
      <div className={styles.timerBar}>
        <div 
          className={styles.timerFill} 
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className={styles.timerText}>
        {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
      </span>
    </div>
  );
}

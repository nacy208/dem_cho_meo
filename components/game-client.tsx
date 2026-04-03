"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { MenuScreen } from "./screens/menu-screen";
import { ModeSelectScreen } from "./screens/mode-select-screen";
import { LoadingScreen } from "./screens/loading-screen";
import { PlayingScreen } from "./screens/playing-screen";
import { ResultScreen } from "./screens/result-screen";
import { GameOverScreen } from "./screens/game-over-screen";
import { LeaderboardScreen } from "./screens/leaderboard-screen";
import { GameMode, Screen, RoundResult, HighScore, GAME_MODE_CONFIG } from "@/lib/game-types";
import { LABELS } from "@/lib/game-data";
import styles from "./game.module.css";

const IMAGE_FILES = Object.keys(LABELS);
const STORAGE_KEY = "pet-counting-highscores";

export function GameClient() {
  const [screen, setScreen] = useState<Screen>("menu");
  const [gameMode, setGameMode] = useState<GameMode>("classic");
  const [scorePlayer, setScorePlayer] = useState(0);
  const [scoreAI, setScoreAI] = useState(0);
  const [roundNum, setRoundNum] = useState(0);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [loadingText, setLoadingText] = useState("Đang tải ảnh...");
  const [roundResult, setRoundResult] = useState<RoundResult | null>(null);
  const [highScores, setHighScores] = useState<HighScore[]>([]);
  const [isNewHighScore, setIsNewHighScore] = useState(false);
  
  // Time Attack specific
  const [timeLeft, setTimeLeft] = useState(60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  
  // Endless specific
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  
  const usedImagesRef = useRef<string[]>([]);

  // Load high scores from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setHighScores(JSON.parse(saved));
      } catch {
        setHighScores([]);
      }
    }
  }, []);

  const saveHighScore = useCallback((score: HighScore) => {
    setHighScores(prev => {
      const updated = [...prev, score].sort((a, b) => b.score - a.score).slice(0, 50);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const getRandomImage = useCallback(() => {
    const availableImages = IMAGE_FILES.filter(
      (img) => !usedImagesRef.current.includes(img)
    );
    if (availableImages.length === 0) {
      usedImagesRef.current = [];
      return IMAGE_FILES[Math.floor(Math.random() * IMAGE_FILES.length)];
    }
    return availableImages[Math.floor(Math.random() * availableImages.length)];
  }, []);

  const simulateAI = useCallback((correctAnswer: number) => {
    const rand = Math.random();
    if (rand < 0.7) return correctAnswer;
    if (rand < 0.9) return correctAnswer + (Math.random() < 0.5 ? 1 : -1);
    return Math.max(0, correctAnswer + (Math.floor(Math.random() * 3) - 1) * 2);
  }, []);

  const openModeSelect = useCallback(() => {
    setScreen("modeSelect");
  }, []);

  const startGame = useCallback((mode: GameMode) => {
    setGameMode(mode);
    setRoundNum(0);
    setScorePlayer(0);
    setScoreAI(0);
    setStreak(0);
    setMaxStreak(0);
    setIsNewHighScore(false);
    usedImagesRef.current = [];
    
    if (mode === "timeAttack") {
      setTimeLeft(GAME_MODE_CONFIG.timeAttack.timeLimit);
    }
    
    startRound(mode);
  }, []);

  const startRound = useCallback((mode?: GameMode) => {
    const currentMode = mode || gameMode;
    setScreen("loading");
    setLoadingText("Đang tải ảnh...");
    
    const imageName = getRandomImage();
    usedImagesRef.current.push(imageName);
    setCurrentImage(imageName);
    
    setTimeout(() => {
      setLoadingText("AI đang phân tích...");
      setTimeout(() => {
        setScreen("playing");
        if (currentMode === "timeAttack") {
          setIsTimerRunning(true);
        }
      }, 500);
    }, 300);
  }, [gameMode, getRandomImage]);

  const handleTimeUp = useCallback(() => {
    setIsTimerRunning(false);
    endGame();
  }, []);

  const endGame = useCallback(() => {
    setIsTimerRunning(false);
    
    // Check if new high score
    const currentScore = scorePlayer;
    const modeHighScores = highScores.filter(s => s.mode === gameMode);
    const isNew = modeHighScores.length === 0 || currentScore > Math.max(...modeHighScores.map(s => s.score));
    setIsNewHighScore(isNew);
    
    // Save score
    const newScore: HighScore = {
      mode: gameMode,
      score: scorePlayer,
      rounds: roundNum,
      date: new Date().toISOString(),
      streak: gameMode === "endless" ? maxStreak : undefined,
    };
    saveHighScore(newScore);
    
    setScreen("gameOver");
  }, [scorePlayer, highScores, gameMode, roundNum, maxStreak, saveHighScore]);

  const submitAnswer = useCallback((playerAnswer: number) => {
    if (!currentImage) return;
    
    const correct = LABELS[currentImage as keyof typeof LABELS];
    const aiGuess = simulateAI(correct);
    
    const playerDiff = Math.abs(playerAnswer - correct);
    const aiDiff = Math.abs(aiGuess - correct);
    
    let playerPoints = 0;
    let aiPoints = 0;
    
    // Base points
    if (playerDiff === 0) playerPoints = 10;
    else if (playerDiff <= 1) playerPoints = 5;
    
    if (aiDiff === 0) aiPoints = 10;
    else if (aiDiff <= 1) aiPoints = 5;
    
    // Streak bonus for Endless mode
    if (gameMode === "endless") {
      if (playerDiff === 0) {
        const newStreak = streak + 1;
        setStreak(newStreak);
        setMaxStreak(prev => Math.max(prev, newStreak));
        // Bonus points for streak
        const bonusMultiplier = Math.min(1 + newStreak * 0.1, 2);
        playerPoints = Math.round(playerPoints * bonusMultiplier);
      } else {
        // End game on wrong answer in Endless mode
        if (playerDiff > 1) {
          const dog = Math.floor(correct * 0.5);
          const cat = correct - dog;
          setRoundResult({
            correct,
            playerAnswer,
            aiGuess,
            dog,
            cat,
            annotatedImage: `/anh_test/${currentImage}`,
          });
          setRoundNum(prev => prev + 1);
          setTimeout(() => endGame(), 100);
          setScreen("result");
          return;
        }
        setStreak(0);
      }
    }
    
    setScorePlayer(prev => prev + playerPoints);
    setScoreAI(prev => prev + aiPoints);
    
    const dog = Math.floor(correct * 0.5);
    const cat = correct - dog;
    
    setRoundResult({
      correct,
      playerAnswer,
      aiGuess,
      dog,
      cat,
      annotatedImage: `/anh_test/${currentImage}`,
    });
    
    setRoundNum(prev => prev + 1);
    
    // For Time Attack, don't show result screen, go directly to next
    if (gameMode === "timeAttack") {
      setTimeout(() => {
        if (timeLeft > 0) {
          startRound();
        }
      }, 800);
    }
    
    setScreen("result");
  }, [currentImage, simulateAI, gameMode, streak, endGame, timeLeft, startRound]);

  const nextRound = useCallback(() => {
    const config = GAME_MODE_CONFIG[gameMode];
    const nextRoundNum = roundNum;
    
    if (gameMode === "classic" && nextRoundNum >= config.rounds) {
      endGame();
    } else {
      startRound();
    }
  }, [roundNum, gameMode, startRound, endGame]);

  const playAgain = useCallback(() => {
    startGame(gameMode);
  }, [gameMode, startGame]);

  const backToMenu = useCallback(() => {
    setScreen("menu");
  }, []);

  const showLeaderboard = useCallback(() => {
    setScreen("leaderboard");
  }, []);

  return (
    <div className={styles.gameContainer}>
      {screen === "menu" && (
        <MenuScreen 
          onStart={openModeSelect} 
          lastScore={null}
        />
      )}
      
      {screen === "modeSelect" && (
        <ModeSelectScreen
          onSelectMode={startGame}
          onBack={backToMenu}
          onShowLeaderboard={showLeaderboard}
        />
      )}
      
      {screen === "loading" && (
        <LoadingScreen loadingText={loadingText} />
      )}
      
      {screen === "playing" && currentImage && (
        <PlayingScreen
          roundNum={roundNum + 1}
          maxRounds={gameMode === "classic" ? GAME_MODE_CONFIG.classic.rounds : undefined}
          scorePlayer={scorePlayer}
          scoreAI={scoreAI}
          imageSrc={`/anh_test/${currentImage}`}
          onSubmit={submitAnswer}
          gameMode={gameMode}
          timeLeft={gameMode === "timeAttack" ? timeLeft : undefined}
          isTimerRunning={isTimerRunning}
          onTimeUp={handleTimeUp}
          streak={gameMode === "endless" ? streak : undefined}
        />
      )}
      
      {screen === "result" && roundResult && (
        <ResultScreen
          roundNum={roundNum}
          maxRounds={gameMode === "classic" ? GAME_MODE_CONFIG.classic.rounds : undefined}
          result={roundResult}
          scorePlayer={scorePlayer}
          scoreAI={scoreAI}
          isLastRound={gameMode === "classic" && roundNum >= GAME_MODE_CONFIG.classic.rounds}
          onNext={nextRound}
          gameMode={gameMode}
          streak={gameMode === "endless" ? streak : undefined}
        />
      )}
      
      {screen === "gameOver" && (
        <GameOverScreen
          mode={gameMode}
          scorePlayer={scorePlayer}
          scoreAI={scoreAI}
          roundsPlayed={roundNum}
          streak={maxStreak}
          isNewHighScore={isNewHighScore}
          onPlayAgain={playAgain}
          onBackToMenu={backToMenu}
        />
      )}
      
      {screen === "leaderboard" && (
        <LeaderboardScreen
          highScores={highScores}
          onBack={() => setScreen("modeSelect")}
        />
      )}
    </div>
  );
}
